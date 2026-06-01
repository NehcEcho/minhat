import argparse
import glob
import json
import os

import numpy as np

try:
    import matplotlib
    import matplotlib.pyplot as plt
    from scipy.signal import welch

    matplotlib.rcParams["font.sans-serif"] = [
        "Microsoft YaHei", "SimHei", "PingFang SC", "Arial Unicode MS", "DejaVu Sans"
    ]
    matplotlib.rcParams["axes.unicode_minus"] = False
    HAS_PLOT = True
except ImportError:
    HAS_PLOT = False


SAMPLE_RATE = 250
EMOTION_LABELS = ["消极", "平静", "积极"]


def load_dataset(folder):
    files = sorted(glob.glob(os.path.join(folder, "*.npz")))
    if not files:
        raise FileNotFoundError(
            f"没有找到 .npz 文件: {folder}\n"
            f"先用 collect_eeg_dataset.py 采集几段数据再来。"
        )
    items = []
    for path in files:
        d = np.load(path, allow_pickle=False)
        meta = {}
        if "meta" in d.files:
            try:
                meta = json.loads(str(d["meta"]))
            except Exception:
                meta = {}
        items.append({
            "path": path,
            "X": d["X"].astype(np.float32),
            "y_emotion": d["y_emotion"].astype(np.int64),
            "y_attention": d["y_attention"].astype(np.float32),
            "y_fatigue": d["y_fatigue"].astype(np.float32),
            "meta": meta,
        })
    return items


def summarize(items):
    print(f"\n{'='*60}")
    print("数据集汇总")
    print(f"{'='*60}")
    print(f"文件数: {len(items)}")

    total = sum(len(it["X"]) for it in items)
    print(f"窗口总数: {total}")
    if total == 0:
        return

    shapes = {tuple(it["X"].shape[1:]) for it in items}
    if len(shapes) > 1:
        print(f"⚠ 窗口形状不一致: {shapes}  — 训练时会报错")
    else:
        C, T = next(iter(shapes))
        print(f"窗口形状: [{C} channels × {T} samples]  ({T/SAMPLE_RATE:.2f}s)")

    X_all = np.concatenate([it["X"] for it in items], axis=0)
    print(f"幅值: 均值={X_all.mean():+.2f}, std={X_all.std():.2f}, "
          f"min={X_all.min():.1f}, max={X_all.max():.1f}")

    print(f"\n--- 标签分布 ---")
    y_e = np.concatenate([it["y_emotion"] for it in items])
    y_a = np.concatenate([it["y_attention"] for it in items]).astype(int)
    y_f = np.concatenate([it["y_fatigue"] for it in items]).astype(int)

    print("Emotion (3 类):  " +
          "  ".join(f"{EMOTION_LABELS[i]}({i})={int((y_e == i).sum()):>4}" for i in range(3)))
    print(f"Attention:       不专注(0)={int((y_a == 0).sum()):>4}   专注(1)={int((y_a == 1).sum()):>4}")
    print(f"Fatigue:         不疲劳(0)={int((y_f == 0).sum()):>4}   疲劳(1)={int((y_f == 1).sum()):>4}")

    print(f"\n--- 训练前提醒 ---")
    advice = []
    for c in range(3):
        if (y_e == c).sum() == 0:
            advice.append(f"⚠ 情绪 '{EMOTION_LABELS[c]}' 一个样本都没有 — 模型学不会这一类")
    if (y_a == 0).sum() == 0 or (y_a == 1).sum() == 0:
        advice.append("⚠ 专注度只有一类 — 二分类无法训练")
    if (y_f == 0).sum() == 0 or (y_f == 1).sum() == 0:
        advice.append("⚠ 疲劳只有一类 — 二分类无法训练")
    if total < 60:
        advice.append(f"⚠ 总窗口数 {total} 偏少，建议每类至少 60 个 (≈ 60s × stride/sr)")

    for name, y, n_c in [("Emotion", y_e, 3), ("Attention", y_a, 2), ("Fatigue", y_f, 2)]:
        counts = np.array([(y == c).sum() for c in range(n_c)])
        if counts.min() > 0 and counts.max() / counts.min() > 5:
            advice.append(f"⚠ {name} 类别比例失衡 ({counts.tolist()}) — 训练时考虑 class weight")

    if advice:
        for a in advice:
            print(" ", a)
    else:
        print("  ✓ 数据规模和均衡性看起来 OK")


def quality_check(items):
    print(f"\n{'='*60}")
    print("窗口级别质量检查")
    print(f"{'='*60}")

    bad_total = 0
    for it in items:
        X = it["X"]
        std_pc = X.std(axis=2)
        p2p_pc = X.max(axis=2) - X.min(axis=2)
        dead = (std_pc < 1e-3).any(axis=1)
        sat  = (p2p_pc > 5000).any(axis=1)
        nan  = ~np.isfinite(X).all(axis=(1, 2))
        bad  = dead | sat | nan
        n_bad = int(bad.sum())
        bad_total += n_bad

        flag = "⚠" if n_bad > 0 else "✓"
        print(f"  {flag} {os.path.basename(it['path']):<60} "
              f"  windows={len(X):>3}  bad={n_bad}"
              f"   (dead={int(dead.sum())}, sat={int(sat.sum())}, nan={int(nan.sum())})")

    print(f"\n汇总: 共 {bad_total} 个可疑窗口")
    if bad_total > 0:
        print("    建议: 在 train_eegnet.py 的 EEGDataset 里加一个过滤步骤丢掉这些窗口。")


def plot_examples(items, n_per_class=2, save_fig=None):
    if not HAS_PLOT:
        print("\n（跳过绘图：未安装 matplotlib / scipy）")
        return

    examples = {0: [], 1: [], 2: []}
    for it in items:
        for x, y in zip(it["X"], it["y_emotion"]):
            c = int(y)
            if len(examples[c]) < n_per_class:
                examples[c].append(x)

    classes = [c for c in [0, 1, 2] if examples[c]]
    if not classes:
        return

    n_rows = len(classes) * n_per_class
    fig, axes = plt.subplots(n_rows, 2, figsize=(13, 2.4 * n_rows))
    if n_rows == 1:
        axes = axes[None, :]

    colors = ["#e63946", "#2a9d8f", "#1d6fb8", "#f4a261"]
    row = 0
    for c in classes:
        for j, x in enumerate(examples[c]):
            ax_t, ax_f = axes[row, 0], axes[row, 1]
            t_axis = np.arange(x.shape[1]) / SAMPLE_RATE
            for ch in range(x.shape[0]):
                ax_t.plot(t_axis, x[ch] - x[ch].mean() + ch * 200,
                          lw=0.7, color=colors[ch % len(colors)])
            ax_t.set_yticks([0, 200, 400, 600])
            ax_t.set_yticklabels([f"Ch{i+1}" for i in range(x.shape[0])])
            ax_t.set_title(f"{EMOTION_LABELS[c]} 例 {j+1}  (时域)", fontsize=10)
            ax_t.set_xlabel("秒")
            ax_t.grid(True, alpha=0.3)

            freqs, psd = welch(x, fs=SAMPLE_RATE,
                               nperseg=min(256, x.shape[1]), axis=-1)
            for ch in range(x.shape[0]):
                ax_f.semilogy(freqs, psd[ch], lw=0.9, color=colors[ch % len(colors)])
            ax_f.set_xlim(0, 60)
            ax_f.axvline(50, color="red", lw=0.5, ls="--", alpha=0.4)
            ax_f.set_title(f"{EMOTION_LABELS[c]} 例 {j+1}  (频谱)", fontsize=10)
            ax_f.set_xlabel("Hz")
            ax_f.grid(True, alpha=0.3, which="both")
            row += 1

    fig.suptitle("数据集窗口示例 (按 emotion 分组)", fontsize=12)
    plt.tight_layout(rect=[0, 0, 1, 0.97])

    if save_fig:
        plt.savefig(save_fig, dpi=120, bbox_inches="tight")
        print(f"\n图已保存: {save_fig}")
    else:
        plt.show()


def main():
    parser = argparse.ArgumentParser(description="检查 dataset/*.npz 的内容和质量")
    parser.add_argument("--data", default="dataset", help="数据集目录")
    parser.add_argument("--no-plot", action="store_true", help="跳过绘图")
    parser.add_argument("--save-fig", default=None, help="保存图到此路径而不是 show")
    parser.add_argument("--examples-per-class", type=int, default=2)
    args = parser.parse_args()

    items = load_dataset(args.data)
    print(f"\n加载了 {len(items)} 个 .npz")
    for it in items:
        print(f"  • {os.path.basename(it['path'])}  N={len(it['X'])}")

    summarize(items)
    quality_check(items)
    if not args.no_plot:
        plot_examples(items, n_per_class=args.examples_per_class, save_fig=args.save_fig)


if __name__ == "__main__":
    main()
