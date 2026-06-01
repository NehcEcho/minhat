import argparse
import glob
import os
import random

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, random_split

from ShoujiShuJu import MultiTaskEEGNet, standardize_window


class EEGDataset(Dataset):
    def __init__(self, folder):
        files = sorted(glob.glob(os.path.join(folder, "*.npz")))
        if not files:
            raise FileNotFoundError(f"没有找到训练数据: {folder}/*.npz")

        xs, yes, yas, yfs = [], [], [], []
        for path in files:
            data = np.load(path, allow_pickle=False)
            xs.append(data["X"].astype(np.float32))
            yes.append(data["y_emotion"].astype(np.int64))
            yas.append(data["y_attention"].astype(np.float32))
            yfs.append(data["y_fatigue"].astype(np.float32))

        self.X = np.concatenate(xs, axis=0)
        self.y_emotion = np.concatenate(yes, axis=0)
        self.y_attention = np.concatenate(yas, axis=0)
        self.y_fatigue = np.concatenate(yfs, axis=0)

        self.X = np.stack([standardize_window(x) for x in self.X]).astype(np.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        x = torch.from_numpy(self.X[idx]).unsqueeze(0)
        return (
            x,
            torch.tensor(self.y_emotion[idx], dtype=torch.long),
            torch.tensor(self.y_attention[idx], dtype=torch.float32),
            torch.tensor(self.y_fatigue[idx], dtype=torch.float32),
        )


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def evaluate(model, loader, device):
    model.eval()
    total = 0
    emo_correct = 0
    att_correct = 0
    fat_correct = 0
    with torch.no_grad():
        for x, ye, ya, yf in loader:
            x, ye, ya, yf = x.to(device), ye.to(device), ya.to(device), yf.to(device)
            oe, oa, of = model(x)
            emo_correct += (oe.argmax(dim=1) == ye).sum().item()
            att_correct += ((torch.sigmoid(oa.squeeze(1)) >= 0.5).float() == ya).sum().item()
            fat_correct += ((torch.sigmoid(of.squeeze(1)) >= 0.5).float() == yf).sum().item()
            total += len(x)
    return emo_correct / total, att_correct / total, fat_correct / total


def main():
    parser = argparse.ArgumentParser(description="训练多任务 EEGNet")
    parser.add_argument("--data", default="dataset")
    parser.add_argument("--out", default="weights/eegnet_multitask.pth")
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--channels", type=int, default=4)
    parser.add_argument("--samples", type=int, default=500)
    args = parser.parse_args()

    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    dataset = EEGDataset(args.data)
    print(f"样本数: {len(dataset)}")

    val_size = max(1, int(len(dataset) * args.val_ratio))
    train_size = len(dataset) - val_size
    train_set, val_set = random_split(dataset, [train_size, val_size], generator=torch.Generator().manual_seed(args.seed))
    train_loader = DataLoader(train_set, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_set, batch_size=args.batch_size, shuffle=False)

    model = MultiTaskEEGNet(channels=args.channels, samples=args.samples).to(device)
    ce_loss = nn.CrossEntropyLoss()
    bce_loss = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)

    best_score = -1.0
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        for x, ye, ya, yf in train_loader:
            x, ye, ya, yf = x.to(device), ye.to(device), ya.to(device), yf.to(device)
            oe, oa, of = model(x)
            loss = ce_loss(oe, ye) + bce_loss(oa.squeeze(1), ya) + bce_loss(of.squeeze(1), yf)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            optimizer.step()
            running += loss.item() * len(x)

        emo_acc, att_acc, fat_acc = evaluate(model, val_loader, device)
        score = (emo_acc + att_acc + fat_acc) / 3
        print(f"Epoch {epoch:03d} | loss={running / train_size:.4f} | val emotion={emo_acc:.3f} attention={att_acc:.3f} fatigue={fat_acc:.3f}")

        if score > best_score:
            best_score = score
            torch.save({
                "model_state_dict": model.state_dict(),
                "channels": args.channels,
                "samples": args.samples,
                "best_score": best_score,
            }, args.out)

    print(f"训练完成，最佳模型已保存: {args.out}")


if __name__ == "__main__":
    main()
