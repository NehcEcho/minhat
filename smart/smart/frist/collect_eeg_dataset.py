import argparse
import json
import os
import threading
import time
from collections import deque
from datetime import datetime

import numpy as np
from pythonosc import dispatcher, osc_server


class EEGCollector:
    def __init__(self, channels=4, samples=500, stride=250, address="/eeg/filtered"):
        self.channels = channels
        self.samples = samples
        self.stride = stride
        self.address = address
        self.buffer = deque(maxlen=samples)
        self.windows = []
        self.new_data_count = 0
        self.first_packet = True
        self.lock = threading.Lock()

    def osc_handler(self, address, *args):
        if address != self.address or len(args) < self.channels:
            return
        values = np.asarray(args[:self.channels], dtype=np.float32)
        if not np.all(np.isfinite(values)):
            return

        with self.lock:
            self.buffer.append(values)
            self.new_data_count += 1
            if self.first_packet:
                print(f"收到 EEG: {address} {values.tolist()}")
                self.first_packet = False

            if len(self.buffer) == self.samples and self.new_data_count >= self.stride:
                self.windows.append(np.stack(self.buffer, axis=1).astype(np.float32))  # [C, T]
                self.new_data_count = 0

    def export(self):
        with self.lock:
            if not self.windows:
                return np.empty((0, self.channels, self.samples), dtype=np.float32)
            return np.stack(self.windows, axis=0)


def main():
    parser = argparse.ArgumentParser(description="采集 Neeuro OSC EEG 数据，保存为 EEGNet 训练集 .npz")
    parser.add_argument("--ip", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4545)
    parser.add_argument("--seconds", type=int, default=120)
    parser.add_argument("--channels", type=int, default=4)
    parser.add_argument("--samples", type=int, default=500)
    parser.add_argument("--stride", type=int, default=250)
    parser.add_argument("--subject", default="S01")
    parser.add_argument("--session", default=None)
    parser.add_argument("--task", default="unknown")
    parser.add_argument("--emotion", type=int, required=True, help="0=消极, 1=平静, 2=积极")
    parser.add_argument("--attention", type=int, required=True, help="0=不专注, 1=专注")
    parser.add_argument("--fatigue", type=int, required=True, help="0=不疲劳, 1=疲劳")
    parser.add_argument("--outdir", default="dataset")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    session = args.session or datetime.now().strftime("%Y%m%d_%H%M%S")

    collector = EEGCollector(args.channels, args.samples, args.stride)
    disp = dispatcher.Dispatcher()
    disp.map("/eeg/filtered", collector.osc_handler)
    server = osc_server.ThreadingOSCUDPServer((args.ip, args.port), disp)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    print(f"监听 OSC: {args.ip}:{args.port}")
    print("请确认 Neeuro: 已连接设备 → DC → Start，OSC Port 与这里一致。")
    print(f"采集 {args.seconds} 秒，标签 emotion={args.emotion}, attention={args.attention}, fatigue={args.fatigue}")

    start = time.time()
    try:
        while time.time() - start < args.seconds:
            remaining = args.seconds - int(time.time() - start)
            print(f"\r剩余 {remaining:>4} 秒，已切出窗口 {len(collector.windows):>4} 个", end="")
            time.sleep(1)
    finally:
        print("\n停止采集，保存数据...")
        server.shutdown()

    X = collector.export()
    if len(X) == 0:
        print("没有收到有效 EEG 窗口。请检查 C# OSC 地址 /eeg/filtered、端口、Neeuro 是否 Start。")
        return

    y_emotion = np.full((len(X),), args.emotion, dtype=np.int64)
    y_attention = np.full((len(X),), args.attention, dtype=np.float32)
    y_fatigue = np.full((len(X),), args.fatigue, dtype=np.float32)

    meta = {
        "subject": args.subject,
        "session": session,
        "task": args.task,
        "channels": args.channels,
        "samples": args.samples,
        "stride": args.stride,
        "address": "/eeg/filtered",
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    filename = f"{args.subject}_{session}_{args.task}_e{args.emotion}_a{args.attention}_f{args.fatigue}.npz"
    path = os.path.join(args.outdir, filename)
    np.savez_compressed(path, X=X, y_emotion=y_emotion, y_attention=y_attention, y_fatigue=y_fatigue, meta=json.dumps(meta, ensure_ascii=False))
    print(f"保存成功: {path}")
    print(f"X shape: {X.shape}  # [窗口数, 通道数, 时间点]")


if __name__ == "__main__":
    main()
