import argparse
import threading
import time

import numpy as np
from pythonosc import dispatcher, osc_server

try:
    import matplotlib
    import matplotlib.pyplot as plt
    from matplotlib.animation import FuncAnimation
    from scipy.signal import welch
except ImportError as e:
    print(f"缺少依赖: {e}\n请运行: pip install matplotlib scipy")
    raise SystemExit(1)

matplotlib.rcParams["font.sans-serif"] = [
    "Microsoft YaHei", "SimHei", "PingFang SC", "Arial Unicode MS", "DejaVu Sans"
]
matplotlib.rcParams["axes.unicode_minus"] = False


SAMPLE_RATE = 250
N_CH = 4
DISPLAY_SECONDS = 4
DISPLAY_SAMPLES = SAMPLE_RATE * DISPLAY_SECONDS
PSD_NPERSEG = 512
BANDS = {
    "δ\n1-4Hz":   (1, 4),
    "θ\n4-8":     (4, 8),
    "α\n8-13":    (8, 13),
    "β\n13-30":   (13, 30),
    "γ\n30-45":   (30, 45),
}


class EEGMonitor:
    def __init__(self, capacity_samples: int = DISPLAY_SAMPLES * 2):
        self.cap = capacity_samples
        self.buf = np.zeros((N_CH, self.cap), dtype=np.float32)
        self.write_idx = 0
        self.total = 0
        self.lock = threading.Lock()

        self._rate_window_t = time.time()
        self._rate_window_count = 0
        self.rate_hz = 0.0
        self._first_print = True

    def osc_handler(self, address, *args):
        if len(args) < N_CH:
            return
        sample = np.asarray(args[:N_CH], dtype=np.float32)
        if not np.all(np.isfinite(sample)):
            return

        with self.lock:
            self.buf[:, self.write_idx] = sample
            self.write_idx = (self.write_idx + 1) % self.cap
            self.total += 1

        if self._first_print:
            print(f"✓ 收到首个采样: {sample.tolist()}")
            self._first_print = False

        now = time.time()
        if now - self._rate_window_t >= 1.0:
            self.rate_hz = (self.total - self._rate_window_count) / (now - self._rate_window_t)
            self._rate_window_t = now
            self._rate_window_count = self.total

    def get_recent(self, n: int):
        with self.lock:
            if self.total < n:
                return None
            end = self.write_idx
            start = end - n
            if start >= 0:
                return self.buf[:, start:end].copy()
            return np.concatenate([self.buf[:, self.cap + start:], self.buf[:, :end]], axis=1)


def main():
    parser = argparse.ArgumentParser(description="Neeuro EEG 实时监控")
    parser.add_argument("--ip", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4545)
    args = parser.parse_args()

    monitor = EEGMonitor()
    disp = dispatcher.Dispatcher()
    disp.map("/eeg/filtered", monitor.osc_handler)
    server = osc_server.ThreadingOSCUDPServer((args.ip, args.port), disp)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    print(f"监听 OSC: {args.ip}:{args.port}")
    print("等待 Neeuro 端发送 /eeg/filtered ... (Ctrl+C 或关闭窗口退出)")

    fig, axes = plt.subplots(2, 2, figsize=(13, 8))
    fig.canvas.manager.set_window_title("Neeuro EEG 实时监控")
    fig.suptitle("Neeuro EEG 实时监控", fontsize=13)
    ax_wave, ax_psd = axes[0]
    ax_band, ax_status = axes[1]

    colors = ["#e63946", "#2a9d8f", "#1d6fb8", "#f4a261"]

    t_axis = np.arange(DISPLAY_SAMPLES) / SAMPLE_RATE
    wave_lines = []
    for i in range(N_CH):
        (ln,) = ax_wave.plot(t_axis, np.zeros(DISPLAY_SAMPLES) + i * 200,
                             color=colors[i], lw=0.8)
        wave_lines.append(ln)
    ax_wave.set_xlim(0, DISPLAY_SECONDS)
    ax_wave.set_ylim(-200, 800)
    ax_wave.set_yticks([0, 200, 400, 600])
    ax_wave.set_yticklabels(["Ch1", "Ch2", "Ch3", "Ch4"])
    ax_wave.set_xlabel("时间 (秒)")
    ax_wave.set_title("时域波形 (减均值, 每通道偏移 200 显示)")
    ax_wave.grid(True, alpha=0.3)

    psd_lines = []
    for i in range(N_CH):
        (ln,) = ax_psd.semilogy([0, 60], [1, 1], color=colors[i], lw=1.0, label=f"Ch{i+1}")
        psd_lines.append(ln)
    ax_psd.set_xlim(0, 60)
    ax_psd.set_ylim(1e-2, 1e6)
    ax_psd.set_xlabel("频率 (Hz)")
    ax_psd.set_ylabel("PSD")
    ax_psd.set_title("功率谱 (Welch)")
    ax_psd.legend(loc="upper right", fontsize=8)
    ax_psd.grid(True, alpha=0.3, which="both")
    ax_psd.axvline(50, color="red", lw=0.5, ls="--", alpha=0.4)
    ax_psd.text(50.5, 1e5, "50Hz", color="red", fontsize=8, alpha=0.6)

    band_names = list(BANDS.keys())
    band_x = np.arange(len(band_names))
    band_bars = ax_band.bar(band_x, [0] * len(band_names),
                            color=["#3a86ff", "#8338ec", "#ff006e", "#fb5607", "#ffbe0b"])
    ax_band.set_xticks(band_x)
    ax_band.set_xticklabels(band_names, fontsize=9)
    ax_band.set_ylabel("平均能量 (4 通道)")
    ax_band.set_title("频段能量")
    ax_band.grid(True, alpha=0.3, axis="y")

    ax_status.axis("off")
    status_text = ax_status.text(0.02, 0.98, "等待数据...", fontsize=11,
                                 family="monospace", va="top", ha="left",
                                 transform=ax_status.transAxes)
    ax_status.set_title("信号质量诊断")

    def update(_frame):
        win = monitor.get_recent(DISPLAY_SAMPLES)
        if win is None:
            status_text.set_text(
                f"还没收到数据 (累计 {monitor.total} 个采样)\n"
                f"当前速率: {monitor.rate_hz:.1f} Hz\n\n"
                f"请检查:\n"
                f"  • Neeuro 程序是否完成 Connect → DC → Start ?\n"
                f"  • OSC Port 是否设为 {args.port} ?\n"
                f"  • C# 端 oscEnabled 是否为 true ?\n"
                f"  • 防火墙是否拦了 UDP {args.port} ?"
            )
            return [*wave_lines, *psd_lines, *band_bars, status_text]

        for i in range(N_CH):
            wave_lines[i].set_ydata(win[i] - win[i].mean() + i * 200)

        nperseg = min(PSD_NPERSEG, win.shape[1])
        freqs, psd = welch(win, fs=SAMPLE_RATE, nperseg=nperseg, axis=-1)
        for i in range(N_CH):
            psd_lines[i].set_data(freqs, np.clip(psd[i], 1e-2, None))

        band_vals = []
        for lo, hi in BANDS.values():
            mask = (freqs >= lo) & (freqs <= hi)
            band_vals.append(float(psd[:, mask].mean()) if mask.any() else 0.0)
        for bar, v in zip(band_bars, band_vals):
            bar.set_height(v)
        if max(band_vals) > 0:
            ax_band.set_ylim(0, max(band_vals) * 1.2)

        ch_std = win.std(axis=1)
        ch_p2p = win.max(axis=1) - win.min(axis=1)

        warnings = []
        if monitor.rate_hz > 0 and abs(monitor.rate_hz - SAMPLE_RATE) > 30:
            warnings.append(f"⚠ 采样速率 {monitor.rate_hz:.0f} Hz 偏离期望值 {SAMPLE_RATE}")
        for i in range(N_CH):
            if ch_std[i] < 1e-3:
                warnings.append(f"⚠ Ch{i+1} 几乎无波动 (std={ch_std[i]:.4f}) — 电极可能没接好")
            elif ch_p2p[i] > 5000:
                warnings.append(f"⚠ Ch{i+1} 峰峰值 {ch_p2p[i]:.0f} 异常大 — 可能饱和或运动伪迹")

        msg = (
            f"采样速率: {monitor.rate_hz:6.1f} Hz   (期望 {SAMPLE_RATE})\n"
            f"累计样本: {monitor.total}\n\n"
            f"通道统计 (最近 {DISPLAY_SECONDS}s):\n"
        )
        for i in range(N_CH):
            msg += f"  Ch{i+1}:  std={ch_std[i]:8.2f}   p2p={ch_p2p[i]:8.1f}\n"
        if warnings:
            msg += "\n" + "\n".join(warnings)
        else:
            msg += "\n✓ 信号正常"
        status_text.set_text(msg)

        return [*wave_lines, *psd_lines, *band_bars, status_text]

    ani = FuncAnimation(fig, update, interval=100, blit=False, cache_frame_data=False)
    plt.tight_layout()
    try:
        plt.show()
    finally:
        server.shutdown()
        print("已退出。")


if __name__ == "__main__":
    main()
