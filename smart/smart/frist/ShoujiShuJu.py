import argparse
import os
import sys
import threading
from collections import deque

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from pythonosc import dispatcher, osc_server


EMOTION_LABELS = ["消极", "平静", "积极"]


def standardize_window(x: np.ndarray) -> np.ndarray:
    mean = x.mean(axis=1, keepdims=True)
    std = x.std(axis=1, keepdims=True) + 1e-8
    return (x - mean) / std


class MultiTaskEEGNet(nn.Module):
    def __init__(self, channels=4, samples=500, dropout_rate=0.5, F1=8, D=2, F2=16, kernel_length=125):
        super().__init__()
        self.channels = channels
        self.samples = samples
        self.block1 = nn.Sequential(
            nn.Conv2d(1, F1, (1, kernel_length), padding=(0, kernel_length // 2), bias=False),
            nn.BatchNorm2d(F1),
        )
        self.block2 = nn.Sequential(
            nn.Conv2d(F1, F1 * D, (channels, 1), groups=F1, bias=False),
            nn.BatchNorm2d(F1 * D),
            nn.ELU(),
            nn.AvgPool2d((1, 4)),
            nn.Dropout(dropout_rate),
        )
        self.block3 = nn.Sequential(
            nn.Conv2d(F1 * D, F1 * D, (1, 16), padding=(0, 8), groups=F1 * D, bias=False),
            nn.Conv2d(F1 * D, F2, (1, 1), bias=False),
            nn.BatchNorm2d(F2),
            nn.ELU(),
            nn.AvgPool2d((1, 8)),
            nn.Dropout(dropout_rate),
        )
        out_dim = self._calculate_out_dim()
        self.emotion_head = nn.Linear(out_dim, 3)
        self.attention_head = nn.Linear(out_dim, 1)
        self.fatigue_head = nn.Linear(out_dim, 1)

    def _calculate_out_dim(self):
        with torch.no_grad():
            x = torch.zeros(1, 1, self.channels, self.samples)
            x = self.block3(self.block2(self.block1(x)))
        return int(x.numel())

    def forward(self, x):
        x = self.block3(self.block2(self.block1(x)))
        x = x.flatten(start_dim=1)
        return self.emotion_head(x), self.attention_head(x), self.fatigue_head(x)


class EEGDataStreamer:
    def __init__(self, model, channels=4, samples=500, stride=250, address="/eeg/filtered"):
        self.model = model
        self.channels = channels
        self.samples = samples
        self.stride = stride
        self.address = address
        self.buffer = deque(maxlen=samples)
        self.new_data_count = 0
        self.lock = threading.Lock()
        self.device = next(model.parameters()).device
        self.first_packet = True

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
                print(f"已收到 EEG: {address} {values.tolist()}")
                self.first_packet = False

            if len(self.buffer) == self.samples and self.new_data_count >= self.stride:
                window = np.stack(self.buffer, axis=1)
                self.new_data_count = 0
            else:
                return

        self.perform_inference(window)

    def perform_inference(self, window: np.ndarray):
        x = standardize_window(window).astype(np.float32)
        tensor = torch.from_numpy(x).unsqueeze(0).unsqueeze(0).to(self.device)

        self.model.eval()
        with torch.no_grad():
            out_emotion, out_attention, out_fatigue = self.model(tensor)
            emotion_probs = F.softmax(out_emotion[0], dim=0).detach().cpu().numpy()
            attention_score = torch.sigmoid(out_attention[0]).item() * 100
            fatigue_score = torch.sigmoid(out_fatigue[0]).item() * 100

        predicted_emotion = int(np.argmax(emotion_probs))
        sys.stdout.write("\033[2J\033[H")
        sys.stdout.flush()
        print("--- EEGNet 实时报告 ---")
        print(f"情绪: {EMOTION_LABELS[predicted_emotion]} ({emotion_probs[predicted_emotion] * 100:.1f}%)")
        print(f"专注: {attention_score:.1f}")
        print(f"疲劳: {fatigue_score:.1f}")
        print("----------------------")


def load_model(path, device, channels, samples):
    model = MultiTaskEEGNet(channels=channels, samples=samples)
    if not path:
        raise ValueError("请用 --model 指定训练好的 .pth 权重。不要用随机初始化模型做判断。")
    if not os.path.exists(path):
        raise FileNotFoundError(f"模型文件不存在: {path}")

    checkpoint = torch.load(path, map_location=device)
    state = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    model.load_state_dict(state)
    model.to(device)
    model.eval()
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EEGNet 实时推理 - 接收 NeeuroOS OSC /eeg/filtered 数据")
    parser.add_argument("--model", "-m", required=True, help="训练好的模型权重文件路径，例如 weights/eegnet_multitask.pth")
    parser.add_argument("--port", "-p", type=int, default=4545)
    parser.add_argument("--ip", default="127.0.0.1")
    parser.add_argument("--channels", type=int, default=4)
    parser.add_argument("--samples", type=int, default=500)
    parser.add_argument("--stride", type=int, default=250, help="每收到多少个新采样点推理一次")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"设备: {device}")
    model = load_model(args.model, device, args.channels, args.samples)
    print(f"已加载模型: {args.model}")

    streamer = EEGDataStreamer(model, channels=args.channels, samples=args.samples, stride=args.stride)
    disp = dispatcher.Dispatcher()
    disp.map("/eeg/filtered", streamer.osc_handler)

    server = osc_server.ThreadingOSCUDPServer((args.ip, args.port), disp)
    print(f"监听 OSC: {args.ip}:{args.port}，等待 Neeuro /eeg/filtered ...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已终止")
        server.shutdown()
