from __future__ import annotations

import glob
import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from flask import Flask, jsonify, render_template
from flask_socketio import SocketIO
from pythonosc import dispatcher, osc_server

from ShoujiShuJu import EMOTION_LABELS, MultiTaskEEGNet, load_model, standardize_window

SAMPLE_RATE    = 250
N_CHANNELS     = 4
WINDOW_SAMPLES = 500
STRIDE         = 250
BUFFER_SECONDS = 8
BUFFER_CAP     = SAMPLE_RATE * BUFFER_SECONDS

OSC_HOST = "0.0.0.0"
OSC_PORT = 4545
WEB_PORT = 5000

CHANNEL_LABELS = ["FP1", "FP2", "T7", "T8"]

DATA_DIR    = Path("dataset")
WEIGHTS_DIR = Path("weights")
DATA_DIR.mkdir(exist_ok=True)
WEIGHTS_DIR.mkdir(exist_ok=True)

DEFAULT_MODEL_PATH = WEIGHTS_DIR / "eegnet_multitask.pth"


class AppState:
    def __init__(self):
        self.lock = threading.RLock()

        self.ring       = np.zeros((N_CHANNELS, BUFFER_CAP), dtype=np.float32)
        self.ring_write = 0
        self.ring_total = 0

        self.recording  = False
        self.paused     = False
        self.rec_samples: list[np.ndarray] = []
        self.rec_start_time: float | None  = None
        self.auto_stop_at: float | None    = None

        self.label = {"emotion": 1, "attention": 0, "fatigue": 0,
                      "task": "web_session", "subject": "S01"}

        self.model: MultiTaskEEGNet | None = None
        self.model_path: str | None        = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.last_osc_time   = 0.0
        self._rate_t         = time.time()
        self._rate_count     = 0
        self.current_rate_hz = 0.0

        self.saved_files: list[dict] = []

        self.auto_label_mode: bool = False
        self.pred_buffer: list[dict] = []

    def append_sample(self, sample: np.ndarray) -> None:
        with self.lock:
            self.ring[:, self.ring_write] = sample
            self.ring_write = (self.ring_write + 1) % BUFFER_CAP
            self.ring_total += 1
            self.last_osc_time = time.time()
            if self.recording and not self.paused:
                self.rec_samples.append(sample.copy())
            now = time.time()
            elapsed = now - self._rate_t
            if elapsed >= 1.0:
                self.current_rate_hz = (self.ring_total - self._rate_count) / elapsed
                self._rate_t         = now
                self._rate_count     = self.ring_total

    def get_chunk_since(self, last_total: int):
        with self.lock:
            current   = self.ring_total
            new_count = current - last_total
            if new_count <= 0:
                return None, current
            new_count = min(new_count, BUFFER_CAP)
            end   = self.ring_write
            start = end - new_count
            if start >= 0:
                chunk = self.ring[:, start:end].copy()
            else:
                chunk = np.concatenate(
                    [self.ring[:, BUFFER_CAP + start:], self.ring[:, :end]], axis=1)
            return chunk, current

    def get_recent(self, n: int):
        with self.lock:
            if self.ring_total < n:
                return None
            end   = self.ring_write
            start = end - n
            if start >= 0:
                return self.ring[:, start:end].copy()
            return np.concatenate(
                [self.ring[:, BUFFER_CAP + start:], self.ring[:, :end]], axis=1)


state = AppState()

app     = Flask(__name__)
app.config["SECRET_KEY"] = "neeuro-eeg-local"
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")


@app.route("/")
def index():
    return render_template("index.html",
                           channel_labels=CHANNEL_LABELS,
                           sample_rate=SAMPLE_RATE)


@app.route("/api/dataset")
def api_dataset():
    return jsonify(_list_dataset())


def osc_handler(address, *args):
    if len(args) < N_CHANNELS:
        return
    sample = np.asarray(args[:N_CHANNELS], dtype=np.float32)
    if not np.all(np.isfinite(sample)):
        return
    state.append_sample(sample)


def start_osc_server():
    disp = dispatcher.Dispatcher()
    disp.map("/eeg/filtered", osc_handler)
    server = osc_server.ThreadingOSCUDPServer((OSC_HOST, OSC_PORT), disp)
    print(f"[OSC] listening on {OSC_HOST}:{OSC_PORT}")
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def _list_dataset() -> list[dict]:
    files = sorted(glob.glob(str(DATA_DIR / "*.npz")), key=os.path.getmtime, reverse=True)
    result = []
    for f in files:
        try:
            d    = np.load(f, allow_pickle=False)
            meta = {}
            if "meta" in d.files:
                try:
                    meta = json.loads(str(d["meta"]))
                except Exception:
                    pass
            n_windows = int(d["X"].shape[0]) if "X" in d.files else 0
            source    = meta.get("source", "manual")

            if source == "auto" and "emotion_dist" in meta:
                emo_display = "AI: " + " / ".join(
                    f"{v}%{k}" for k, v in meta["emotion_dist"].items() if v > 0
                )
            else:
                emo_display = (EMOTION_LABELS[int(d["y_emotion"][0])]
                               if "y_emotion" in d.files and len(d["y_emotion"]) > 0 else "?")

            result.append({
                "filename" : os.path.basename(f),
                "path"     : f,
                "windows"  : n_windows,
                "duration" : round(n_windows * STRIDE / SAMPLE_RATE, 1),
                "emotion"  : emo_display,
                "attention": int(d["y_attention"][0]) if "y_attention" in d.files and len(d["y_attention"]) > 0 else 0,
                "fatigue"  : int(d["y_fatigue"][0])  if "y_fatigue"  in d.files and len(d["y_fatigue"])  > 0 else 0,
                "created"  : meta.get("created_at", ""),
                "source"   : source,
            })
        except Exception:
            pass
    return result


def _do_save(samples: list, label: dict) -> dict:
    if len(samples) < WINDOW_SAMPLES:
        return {
            "ok" : False,
            "msg": f"录制时长 {len(samples)/SAMPLE_RATE:.1f}s 太短，至少需要 2 秒 (500 采样点)",
        }

    arr   = np.stack(samples, axis=1)
    n_win = (arr.shape[1] - WINDOW_SAMPLES) // STRIDE + 1
    X     = np.stack(
        [arr[:, i * STRIDE: i * STRIDE + WINDOW_SAMPLES] for i in range(n_win)], axis=0
    ).astype(np.float32)

    y_e = np.full(n_win, label["emotion"],   dtype=np.int64)
    y_a = np.full(n_win, label["attention"], dtype=np.float32)
    y_f = np.full(n_win, label["fatigue"],   dtype=np.float32)

    session  = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = (
        f"{label['subject']}_{session}_{label['task']}"
        f"_e{label['emotion']}_a{label['attention']}_f{label['fatigue']}.npz"
    )
    path = DATA_DIR / filename
    meta = {
        "subject": label["subject"], "session": session, "task": label["task"],
        "channels": N_CHANNELS, "samples": WINDOW_SAMPLES, "stride": STRIDE,
        "address": "/eeg/filtered",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "source": "manual",
    }
    np.savez_compressed(path, X=X, y_emotion=y_e, y_attention=y_a, y_fatigue=y_f,
                        meta=json.dumps(meta, ensure_ascii=False))

    return {
        "ok"          : True,
        "path"        : str(path),
        "filename"    : filename,
        "windows"     : int(n_win),
        "duration_sec": float(arr.shape[1] / SAMPLE_RATE),
        "auto_label"  : False,
        "label"       : {
            "emotion"  : EMOTION_LABELS[label["emotion"]],
            "attention": label["attention"],
            "fatigue"  : label["fatigue"],
        },
        "dataset_files": _list_dataset(),
    }


def _do_save_autolabel(samples: list, pred_buffer: list) -> dict:
    if len(samples) < WINDOW_SAMPLES:
        return {
            "ok" : False,
            "msg": f"录制时长 {len(samples)/SAMPLE_RATE:.1f}s 太短，至少需要 2 秒 (500 采样点)",
        }

    arr   = np.stack(samples, axis=1)
    n_win = (arr.shape[1] - WINDOW_SAMPLES) // STRIDE + 1
    X     = np.stack(
        [arr[:, i * STRIDE: i * STRIDE + WINDOW_SAMPLES] for i in range(n_win)], axis=0
    ).astype(np.float32)

    y_e = np.zeros(n_win, dtype=np.int64)
    y_a = np.zeros(n_win, dtype=np.float32)
    y_f = np.zeros(n_win, dtype=np.float32)

    no_model_warning = False

    if pred_buffer:
        pred_indices = np.array([p["rec_idx"] for p in pred_buffer], dtype=np.float32)
        for i in range(n_win):
            win_center = i * STRIDE + WINDOW_SAMPLES // 2
            closest    = int(np.argmin(np.abs(pred_indices - win_center)))
            p          = pred_buffer[closest]
            y_e[i]     = int(p["emotion"])
            y_a[i]     = float(p["attention"])
            y_f[i]     = float(p["fatigue"])
    else:
        y_e[:] = 1
        y_a[:] = 0.5
        y_f[:] = 0.5
        no_model_warning = True

    emo_counts   = [int(np.sum(y_e == k)) for k in range(len(EMOTION_LABELS))]
    emo_dist     = {EMOTION_LABELS[k]: round(emo_counts[k] / n_win * 100, 1)
                    for k in range(len(EMOTION_LABELS))}
    majority_emo = int(np.argmax(emo_counts))
    avg_att      = round(float(y_a.mean()) * 100, 1)
    avg_fat      = round(float(y_f.mean()) * 100, 1)

    session  = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"AUTO_S01_{session}_emix_amix_fmix.npz"
    path     = DATA_DIR / filename
    meta     = {
        "subject"      : "S01",
        "session"      : session,
        "task"         : "auto_labeled",
        "channels"     : N_CHANNELS,
        "samples"      : WINDOW_SAMPLES,
        "stride"       : STRIDE,
        "address"      : "/eeg/filtered",
        "created_at"   : datetime.now().isoformat(timespec="seconds"),
        "source"       : "auto",
        "n_predictions": len(pred_buffer),
        "emotion_dist" : emo_dist,
    }
    np.savez_compressed(
        path,
        X=X, y_emotion=y_e, y_attention=y_a, y_fatigue=y_f,
        meta=json.dumps(meta, ensure_ascii=False),
    )

    result = {
        "ok"          : True,
        "path"        : str(path),
        "filename"    : filename,
        "windows"     : int(n_win),
        "duration_sec": float(arr.shape[1] / SAMPLE_RATE),
        "auto_label"  : True,
        "emotion_dist": emo_dist,
        "label"       : {
            "emotion"  : EMOTION_LABELS[majority_emo],
            "attention": avg_att,
            "fatigue"  : avg_fat,
        },
        "dataset_files": _list_dataset(),
    }
    if no_model_warning:
        result["warning"] = "模型未加载，已使用默认标签。请先训练模型再使用自动打标签。"
    return result


@socketio.on("connect")
def on_connect():
    socketio.emit("hello", {
        "channel_labels" : CHANNEL_LABELS,
        "sample_rate"    : SAMPLE_RATE,
        "model_loaded"   : state.model_path,
        "device"         : str(state.device),
        "dataset_files"  : _list_dataset(),
    })


@socketio.on("set_label")
def on_set_label(data: dict):
    with state.lock:
        for k in ("emotion", "attention", "fatigue", "task", "subject"):
            if k in data:
                state.label[k] = data[k] if k in ("task", "subject") else int(data[k])


@socketio.on("start_recording")
def on_start_recording(data: dict):
    auto_stop  = int((data or {}).get("auto_stop_seconds", 0))
    auto_label = bool((data or {}).get("auto_label", False))

    with state.lock:
        if data:
            for k in ("emotion", "attention", "fatigue", "task", "subject"):
                if k in data:
                    state.label[k] = data[k] if k in ("task", "subject") else int(data[k])
        state.recording       = True
        state.paused          = False
        state.rec_samples     = []
        state.rec_start_time  = time.time()
        state.auto_stop_at    = state.rec_start_time + auto_stop if auto_stop > 0 else None
        state.auto_label_mode = auto_label
        state.pred_buffer     = []

    _emit_recording_status()

    if auto_stop > 0:
        def _auto_stop():
            time.sleep(auto_stop)
            with state.lock:
                if not state.recording:
                    return
                samples   = state.rec_samples
                label     = dict(state.label)
                auto_mode = state.auto_label_mode
                pred_buf  = list(state.pred_buffer)
                state.recording       = False
                state.paused          = False
                state.auto_stop_at    = None
                state.auto_label_mode = False
            _emit_recording_status()
            if auto_mode:
                result = _do_save_autolabel(samples, pred_buf)
            else:
                result = _do_save(samples, label)
            socketio.emit("save_result", result)

        threading.Thread(target=_auto_stop, daemon=True).start()


@socketio.on("pause_recording")
def on_pause_recording():
    with state.lock:
        state.paused = True
    _emit_recording_status()


@socketio.on("resume_recording")
def on_resume_recording():
    with state.lock:
        state.paused = False
    _emit_recording_status()


@socketio.on("stop_and_save")
def on_stop_and_save(data: dict | None):
    with state.lock:
        if not state.recording:
            socketio.emit("save_result", {"ok": False, "msg": "未在记录状态"})
            return
        samples   = list(state.rec_samples)
        label     = dict(state.label)
        auto_mode = state.auto_label_mode
        pred_buf  = list(state.pred_buffer)

        if data and not auto_mode:
            for k in ("emotion", "attention", "fatigue", "task", "subject"):
                if k in data:
                    label[k] = data[k] if k in ("task", "subject") else int(data[k])

        state.recording       = False
        state.paused          = False
        state.auto_stop_at    = None
        state.auto_label_mode = False

    _emit_recording_status()

    if auto_mode:
        result = _do_save_autolabel(samples, pred_buf)
    else:
        result = _do_save(samples, label)
    socketio.emit("save_result", result)


@socketio.on("train_model")
def on_train_model(data: dict | None):
    epochs = int((data or {}).get("epochs", 80))

    def _run():
        try:
            socketio.emit("train_log", {"line": f"▶ 开始训练 (epochs={epochs}，数据目录={DATA_DIR})"})
            proc = subprocess.Popen(
                [sys.executable, "-u", "train_eegnet.py",
                 "--data", str(DATA_DIR),
                 "--out",  str(DEFAULT_MODEL_PATH),
                 "--epochs", str(epochs)],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, bufsize=1, encoding="utf-8", errors="replace",
            )
            assert proc.stdout is not None
            last_lines: list[str] = []
            for line in proc.stdout:
                socketio.emit("train_log", {"line": line.rstrip()})
                last_lines.append(line.rstrip())
                if len(last_lines) > 50:
                    last_lines.pop(0)
            proc.wait()
            ok = proc.returncode == 0
            metrics = _parse_last_epoch(last_lines)
            socketio.emit("train_done", {
                "ok"     : ok,
                "msg"    : "训练完成" if ok else f"训练失败 (returncode={proc.returncode})",
                "metrics": metrics,
            })
            if ok and DEFAULT_MODEL_PATH.exists():
                _load_model(str(DEFAULT_MODEL_PATH))
        except Exception as e:
            socketio.emit("train_done", {"ok": False, "msg": f"训练异常: {e}", "metrics": None})

    threading.Thread(target=_run, daemon=True).start()


def _parse_last_epoch(lines: list[str]) -> dict | None:
    import re
    pattern = re.compile(
        r"Epoch\s+(\d+).*?loss=([\d.]+).*?emotion=([\d.]+).*?attention=([\d.]+).*?fatigue=([\d.]+)"
    )
    result = None
    for line in reversed(lines):
        m = pattern.search(line)
        if m:
            result = {
                "epoch"    : int(m.group(1)),
                "loss"     : float(m.group(2)),
                "emotion"  : float(m.group(3)),
                "attention": float(m.group(4)),
                "fatigue"  : float(m.group(5)),
            }
            break
    return result


@socketio.on("reload_model")
def on_reload_model(data: dict | None):
    path = (data or {}).get("path", str(DEFAULT_MODEL_PATH))
    _load_model(path)


def _load_model(path: str):
    try:
        model = load_model(path, state.device, N_CHANNELS, WINDOW_SAMPLES)
        with state.lock:
            state.model      = model
            state.model_path = path
        socketio.emit("model_status", {
            "loaded": True, "path": path, "device": str(state.device),
        })
        print(f"[Model] loaded {path} on {state.device}")
    except Exception as e:
        socketio.emit("model_status", {"loaded": False, "error": str(e)})
        print(f"[Model] failed to load {path}: {e}")


def _emit_recording_status():
    with state.lock:
        elapsed   = len(state.rec_samples) / SAMPLE_RATE
        remaining = None
        if state.auto_stop_at is not None and state.recording and not state.paused:
            remaining = max(0.0, state.auto_stop_at - time.time())
        socketio.emit("recording_status", {
            "recording"       : state.recording,
            "paused"          : state.paused,
            "samples_recorded": len(state.rec_samples),
            "duration_sec"    : elapsed,
            "remaining_sec"   : remaining,
            "label"           : dict(state.label),
            "auto_label_mode" : state.auto_label_mode,
        })


def waveform_pusher():
    last_total = 0
    while True:
        socketio.sleep(0.04)
        chunk, last_total = state.get_chunk_since(last_total)
        if chunk is None or chunk.shape[1] == 0:
            continue
        socketio.emit("eeg_chunk", {
            "n"   : int(chunk.shape[1]),
            "data": [chunk[c].tolist() for c in range(N_CHANNELS)],
        })


def status_pusher():
    while True:
        socketio.sleep(1.0)
        now = time.time()
        with state.lock:
            elapsed   = len(state.rec_samples) / SAMPLE_RATE
            remaining = None
            if state.auto_stop_at and state.recording and not state.paused:
                remaining = max(0.0, state.auto_stop_at - now)
            socketio.emit("status", {
                "samples_received" : state.ring_total,
                "sample_rate_hz"   : round(state.current_rate_hz, 1),
                "osc_alive"        : (now - state.last_osc_time) < 2.0,
                "model_loaded"     : state.model_path,
                "recording"        : state.recording,
                "paused"           : state.paused,
                "samples_recorded" : len(state.rec_samples),
                "duration_sec"     : round(elapsed, 1),
                "remaining_sec"    : round(remaining, 1) if remaining is not None else None,
                "auto_label_mode"  : state.auto_label_mode,
            })


def signal_quality_pusher():
    while True:
        socketio.sleep(1.0)
        win = state.get_recent(SAMPLE_RATE * 2)
        if win is None:
            continue
        stds  = win.std(axis=1).astype(float)
        p2ps  = (win.max(axis=1) - win.min(axis=1)).astype(float)
        quals = []
        for s, p in zip(stds, p2ps):
            if s < 0.5:
                q = 0.0
            elif p > 5000:
                q = 0.25
            else:
                q = float(np.clip(np.log10(max(s, 0.5) + 1) / np.log10(50), 0.1, 1.0))
            quals.append(q)
        socketio.emit("signal_quality", {
            "qualities": quals,
            "stds"     : stds.tolist(),
            "p2ps"     : p2ps.tolist(),
        })


def inference_pusher():
    while True:
        socketio.sleep(1.0)
        model = state.model
        if model is None:
            continue
        win = state.get_recent(WINDOW_SAMPLES)
        if win is None:
            continue
        try:
            x = standardize_window(win).astype(np.float32)
            t = torch.from_numpy(x).unsqueeze(0).unsqueeze(0).to(state.device)
            model.eval()
            with torch.no_grad():
                e_logits, a_logit, f_logit = model(t)
                e_probs = F.softmax(e_logits[0], dim=0).cpu().numpy()
                a       = float(torch.sigmoid(a_logit[0]).item()) * 100.0
                f       = float(torch.sigmoid(f_logit[0]).item()) * 100.0

            with state.lock:
                if state.recording and not state.paused and state.auto_label_mode:
                    state.pred_buffer.append({
                        "rec_idx" : len(state.rec_samples),
                        "emotion" : int(np.argmax(e_probs)),
                        "attention": round(a / 100.0, 4),
                        "fatigue" : round(f / 100.0, 4),
                    })

            socketio.emit("prediction", {
                "emotion_probs" : e_probs.tolist(),
                "emotion_labels": EMOTION_LABELS,
                "emotion_top"   : int(np.argmax(e_probs)),
                "attention"     : round(a, 1),
                "fatigue"       : round(f, 1),
            })
        except Exception as e:
            print(f"[Inference error] {e}")


def main():
    if DEFAULT_MODEL_PATH.exists():
        _load_model(str(DEFAULT_MODEL_PATH))
    else:
        print(f"[Model] {DEFAULT_MODEL_PATH} 不存在，训练后会自动加载")

    start_osc_server()

    threading.Thread(target=waveform_pusher,       daemon=True).start()
    threading.Thread(target=status_pusher,         daemon=True).start()
    threading.Thread(target=signal_quality_pusher, daemon=True).start()
    threading.Thread(target=inference_pusher,      daemon=True).start()

    print(f"\n========================================")
    print(f"  EEG 情绪识别 Web 服务已启动")
    print(f"  浏览器访问: http://127.0.0.1:{WEB_PORT}")
    print(f"  OSC 监听:   {OSC_HOST}:{OSC_PORT}  /eeg/filtered")
    print(f"========================================\n")

    socketio.run(app, host="0.0.0.0", port=WEB_PORT,
                 allow_unsafe_werkzeug=True, debug=False)


if __name__ == "__main__":
    main()
