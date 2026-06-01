import argparse
import glob
import os
import sys

import numpy as np
import torch
import torch.nn.functional as F

_HERE = os.path.dirname(os.path.abspath(__file__))
for p in (_HERE, os.getcwd()):
    if p not in sys.path:
        sys.path.insert(0, p)

from ShoujiShuJu import MultiTaskEEGNet, standardize_window, EMOTION_LABELS


def load_dataset(folder):
    files = sorted(glob.glob(os.path.join(folder, "*.npz")))
    if not files:
        raise FileNotFoundError(f"没找到 .npz: {folder}")

    Xs, ye_s, ya_s, yf_s = [], [], [], []
    for f in files:
        d = np.load(f, allow_pickle=False)
        Xs.append(d["X"].astype(np.float32))
        ye_s.append(d["y_emotion"].astype(np.int64))
        ya_s.append(d["y_attention"].astype(np.float32))
        yf_s.append(d["y_fatigue"].astype(np.float32))

    return (
        np.concatenate(Xs, 0),
        np.concatenate(ye_s, 0),
        np.concatenate(ya_s, 0),
        np.concatenate(yf_s, 0),
        files,
    )


def confusion_matrix(y_true, y_pred, n_classes):
    cm = np.zeros((n_classes, n_classes), dtype=np.int64)
    for t, p in zip(y_true.astype(int), y_pred.astype(int)):
        if 0 <= t < n_classes and 0 <= p < n_classes:
            cm[t, p] += 1
    return cm


def print_cm(title, cm, labels):
    print(f"\n— {title} —")
    n = len(labels)
    width = max(8, max(len(l) for l in labels) + 2)

    header = "真↓\\预→ " + "".join(f"{l:>{width}}" for l in labels) + f"{'  行汇总':>{width}}"
    print(header)
    print("-" * len(header))
    for i in range(n):
        row = f"{labels[i]:<8}" + "".join(f"{cm[i, j]:>{width}}" for j in range(n))
        row += f"{cm[i].sum():>{width}}"
        print(row)
    print(f"{'列汇总':<8}" +
          "".join(f"{cm[:, j].sum():>{width}}" for j in range(n)) +
          f"{cm.sum():>{width}}")

    total = cm.sum()
    if total == 0:
        print("  (无数据)")
        return

    acc = np.trace(cm) / total
    print(f"\n  准确率: {np.trace(cm)}/{total} = {acc:.3f}")

    print(f"\n  类别        precision   recall      F1     support")
    print(f"  " + "-" * 50)
    for i, l in enumerate(labels):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        support = cm[i, :].sum()
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        print(f"  {l:<10} {prec:>9.3f}  {rec:>9.3f}  {f1:>7.3f}  {support:>8}")

    f1s = []
    for i in range(n):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1s.append(2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0)
    print(f"\n  Macro-F1: {np.mean(f1s):.3f}")


def main():
    parser = argparse.ArgumentParser(description="离线评估多任务 EEGNet")
    parser.add_argument("--model", "-m", required=True, help="训练好的 .pth 路径")
    parser.add_argument("--data", default="dataset", help="数据目录")
    parser.add_argument("--channels", type=int, default=4)
    parser.add_argument("--samples", type=int, default=500)
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"设备: {device}")

    model = MultiTaskEEGNet(channels=args.channels, samples=args.samples).to(device)
    ckpt = torch.load(args.model, map_location=device)
    state = ckpt["model_state_dict"] if isinstance(ckpt, dict) and "model_state_dict" in ckpt else ckpt
    model.load_state_dict(state)
    model.eval()
    print(f"已加载: {args.model}")

    X, ye, ya, yf, files = load_dataset(args.data)
    print(f"评估集: {len(files)} 个文件, {len(X)} 个窗口")

    X = np.stack([standardize_window(x) for x in X]).astype(np.float32)

    pred_e_list, pred_a_list, pred_f_list = [], [], []
    prob_e_list = []
    with torch.no_grad():
        for i in range(0, len(X), args.batch_size):
            batch = X[i:i + args.batch_size]
            tensor = torch.from_numpy(batch).unsqueeze(1).to(device)
            oe, oa, of = model(tensor)
            prob_e = F.softmax(oe, dim=1).cpu().numpy()
            prob_e_list.append(prob_e)
            pred_e_list.append(prob_e.argmax(axis=1))
            pred_a_list.append((torch.sigmoid(oa.squeeze(1)) >= 0.5).cpu().numpy().astype(np.int64))
            pred_f_list.append((torch.sigmoid(of.squeeze(1)) >= 0.5).cpu().numpy().astype(np.int64))

    pred_e = np.concatenate(pred_e_list)
    pred_a = np.concatenate(pred_a_list)
    pred_f = np.concatenate(pred_f_list)
    prob_e = np.concatenate(prob_e_list)

    print(f"\n{'='*60}")
    print(f"评估结果")
    print(f"{'='*60}")

    print_cm("Emotion (3 类)",
             confusion_matrix(ye, pred_e, 3),
             EMOTION_LABELS)
    print_cm("Attention (二分类)",
             confusion_matrix(ya, pred_a, 2),
             ["不专注", "专注"])
    print_cm("Fatigue (二分类)",
             confusion_matrix(yf, pred_f, 2),
             ["不疲劳", "疲劳"])

    avg_conf = prob_e.max(axis=1).mean()
    print(f"\n情绪头平均最大概率: {avg_conf:.3f}  "
          f"({'置信度高' if avg_conf > 0.7 else '置信度偏低，可能欠拟合或类别太接近'})")


if __name__ == "__main__":
    main()
