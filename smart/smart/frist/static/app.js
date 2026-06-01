// EEG 情绪识别系统 — 前端逻辑（含自动打标签功能）
// =========================================================

const SAMPLE_RATE     = 250;
const N_CHANNELS      = 4;
const DISPLAY_SECONDS = 5;
const DISPLAY_SAMPLES = SAMPLE_RATE * DISPLAY_SECONDS;
const CH_COLORS       = ['#0f766e', '#0891b2', '#7c3aed', '#d97706'];
const BAND_COLORS     = ['#7E57C2', '#5C6BC0', '#26A69A', '#EF6C00', '#C62828'];
const BAND_DEFS       = [['δ',1,4],['θ',4,8],['α',8,13],['β',13,30],['γ',30,45]];
const EMO_EMOJI       = ['😞', '😐', '😊'];
const EMO_LABELS      = ['消极', '平静', '积极'];
const EMO_KEYS        = ['negative', 'neutral', 'positive'];

let yScale = 100;

// ── 自动打标签状态 ──────────────────────────────────────────
let autoLabelMode  = false;   // 当前选择的模式
let isAutoRecording = false;  // 当前录制是否为自动模式（后端确认后设置）
let autoPredCount  = 0;       // 录制中已积累的预测数

// ─── 波形 canvas ────────────────────────────────────────────
class Waveform {
  constructor(canvas, color) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.color  = color;
    this.buf    = new Float32Array(DISPLAY_SAMPLES);
    this.head   = 0;
    this.filled = 0;
    this._resize();
    new ResizeObserver(() => this._resize()).observe(canvas);
  }
  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = Math.max(2, r.width  * dpr);
    this.canvas.height = Math.max(2, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width;
    this.h = r.height;
  }
  push(samples) {
    for (let i = 0; i < samples.length; i++) {
      this.buf[this.head] = samples[i];
      this.head = (this.head + 1) % DISPLAY_SAMPLES;
      if (this.filled < DISPLAY_SAMPLES) this.filled++;
    }
  }
  draw() {
    const ctx = this.ctx, w = this.w, h = this.h;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20,30,50,0.10)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
    if (this.filled < 4) {
      ctx.fillStyle = 'rgba(20,30,50,0.25)';
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText('waiting for data…', 8, h/2);
      return;
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const n = this.filled;
    const startIdx = (this.head - n + DISPLAY_SAMPLES) % DISPLAY_SAMPLES;
    for (let i = 0; i < n; i++) {
      const v = this.buf[(startIdx + i) % DISPLAY_SAMPLES];
      const x = (i / (DISPLAY_SAMPLES - 1)) * w;
      const y = h/2 - (v / yScale) * (h/2) * 0.92;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const grad = ctx.createLinearGradient(w-30, 0, w, 0);
    grad.addColorStop(0, 'rgba(250,248,244,0)');
    grad.addColorStop(1, 'rgba(250,248,244,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(w-30, 0, 30, h);
  }
}

const waves = [];
document.querySelectorAll('.wave-row canvas').forEach((c, i) => {
  waves.push(new Waveform(c, CH_COLORS[i]));
});

// ─── 频带功率 ───────────────────────────────────────────────
class BandChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.values = [0,0,0,0,0];
    this._resize();
    new ResizeObserver(() => { this._resize(); this.draw(); }).observe(canvas);
  }
  _resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = Math.max(2, r.width  * dpr);
    this.canvas.height = Math.max(2, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width; this.h = r.height;
  }
  setValues(v) { this.values = v.slice(); this.draw(); }
  draw() {
    const ctx = this.ctx, w = this.w, h = this.h;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const padL=36,padR=12,padT=12,padB=36;
    const cw = w-padL-padR, ch = h-padT-padB;
    ctx.strokeStyle = 'rgba(20,30,50,0.08)';
    ctx.lineWidth = 1;
    for (let i=0; i<=4; i++) {
      const y = padT+(ch/4)*i;
      ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cw,y); ctx.stroke();
    }
    const maxV = Math.max(...this.values, 1e-6);
    ctx.fillStyle = 'rgba(20,30,50,0.4)';
    ctx.font = '10px "IBM Plex Mono"';
    ctx.textAlign = 'right';
    for (let i=0; i<=4; i++) {
      const v = maxV*(1-i/4), y = padT+(ch/4)*i;
      ctx.fillText(v.toExponential(1), padL-6, y+3);
    }
    const n=this.values.length, gap=12;
    const bw=(cw-gap*(n-1))/n;
    for (let i=0; i<n; i++) {
      const v=this.values[i], bh=(v/maxV)*ch;
      const x=padL+i*(bw+gap), y=padT+ch-bh;
      ctx.fillStyle = BAND_COLORS[i];
      ctx.fillRect(x, y, bw, bh);
      ctx.fillStyle = '#1f2530';
      ctx.font = '13px "IBM Plex Sans"';
      ctx.textAlign = 'center';
      ctx.fillText(BAND_DEFS[i][0], x+bw/2, padT+ch+16);
      ctx.fillStyle = 'rgba(20,30,50,0.45)';
      ctx.font = '10px "IBM Plex Mono"';
      ctx.fillText(`${BAND_DEFS[i][1]}-${BAND_DEFS[i][2]} Hz`, x+bw/2, padT+ch+30);
    }
  }
}
const bandChart = new BandChart(document.getElementById('band-canvas'));

// ─── 30 fps 重绘 ────────────────────────────────────────────
function animate() { waves.forEach(w => w.draw()); requestAnimationFrame(animate); }
animate();

function computeBandPowers() {
  if (waves[0].filled < SAMPLE_RATE * 2) return null;
  const N = SAMPLE_RATE * 2;
  const avg = new Float32Array(N);
  for (let ch=0; ch<N_CHANNELS; ch++) {
    const w = waves[ch];
    const start = (w.head - N + DISPLAY_SAMPLES) % DISPLAY_SAMPLES;
    for (let i=0; i<N; i++) avg[i] += w.buf[(start+i) % DISPLAY_SAMPLES] / N_CHANNELS;
  }
  let mean = 0;
  for (let i=0; i<N; i++) mean += avg[i];
  mean /= N;
  for (let i=0; i<N; i++) avg[i] -= mean;
  const bandEnergies = [0,0,0,0,0];
  for (let bi=0; bi<BAND_DEFS.length; bi++) {
    const [_,lo,hi] = BAND_DEFS[bi];
    let energy = 0;
    for (let f=lo; f<=hi; f+=1) {
      let re=0, im=0;
      const twoPiF = 2*Math.PI*f/SAMPLE_RATE;
      for (let n=0; n<N; n++) { re += avg[n]*Math.cos(twoPiF*n); im -= avg[n]*Math.sin(twoPiF*n); }
      energy += (re*re+im*im)/(N*N);
    }
    bandEnergies[bi] = energy;
  }
  return bandEnergies;
}
setInterval(() => {
  const panel = document.querySelector('.tab-panel[data-panel="band"]');
  if (panel && !panel.classList.contains('hidden')) {
    const b = computeBandPowers();
    if (b) bandChart.setValues(b);
  }
}, 1000);

// ─── Socket.IO ──────────────────────────────────────────────
const socket = io();

socket.on('connect',    () => setDeviceBadge('待 OSC 数据', false));
socket.on('disconnect', () => setDeviceBadge('Web 服务断开', false, true));

socket.on('hello', (data) => {
  if (data.model_loaded) {
    setModelTag(`已加载 · ${data.device}`, true);
    document.getElementById('model-path').textContent = data.model_loaded;
  } else {
    setModelTag('未加载', false);
    document.getElementById('model-path').textContent = '—';
  }
  if (data.dataset_files) renderDataset(data.dataset_files);
});

socket.on('eeg_chunk', (data) => {
  for (let ch=0; ch<N_CHANNELS; ch++) {
    if (data.data[ch]) waves[ch].push(data.data[ch]);
  }
});

socket.on('status', (s) => {
  document.getElementById('rate-val').textContent   = `${s.sample_rate_hz} Hz`;
  document.getElementById('total-val').textContent  = s.samples_received.toLocaleString();
  document.getElementById('meta-rate').textContent  = `${s.sample_rate_hz} Hz`;
  document.getElementById('meta-rec').textContent   = `${s.duration_sec} s`;

  if (s.osc_alive && s.sample_rate_hz > 50) {
    setDeviceBadge(`OSC ${s.sample_rate_hz} Hz`, true);
  } else if (s.osc_alive) {
    setDeviceBadge('OSC 数据少', false);
  } else {
    setDeviceBadge('等待 OSC 数据', false);
  }

  setRecordingButtons(s.recording, s.paused);
  updateRecPanel(s);
});

socket.on('signal_quality', (q) => {
  document.querySelectorAll('.sq-row').forEach((row, i) => {
    const fill    = row.querySelector('.sq-fill');
    const val     = row.querySelector('.sq-val');
    const quality = q.qualities[i] || 0;
    fill.style.width = `${quality*100}%`;
    fill.classList.remove('warn','bad');
    if (quality < 0.25) fill.classList.add('bad');
    else if (quality < 0.55) fill.classList.add('warn');
    val.textContent = q.stds[i].toFixed(1);
  });
  const avgQ = q.qualities.reduce((a,b) => a+b, 0) / q.qualities.length;
  const tip  = document.getElementById('quality-tip');
  if (avgQ > 0.6) {
    tip.textContent = '✓ 4 通道信号良好';
    tip.style.cssText = 'background:#d1fae5;color:#065f46;border-left-color:#10b981';
  } else if (avgQ > 0.3) {
    tip.textContent = '⚠ 部分通道信号偏弱，请调整电极';
    tip.style.cssText = '';
  } else {
    tip.textContent = '✗ 信号很差，请确保电极片紧贴皮肤';
    tip.style.cssText = 'background:#fee2e2;color:#991b1b;border-left-color:#dc2626';
  }
});

socket.on('prediction', (p) => {
  const top = p.emotion_top;
  document.getElementById('emo-emoji').textContent = EMO_EMOJI[top];
  document.getElementById('emo-label').textContent = EMO_LABELS[top];
  document.getElementById('emo-conf').textContent  = `${(p.emotion_probs[top]*100).toFixed(1)}%`;
  document.querySelectorAll('.emo-bar').forEach((bar) => {
    const idx = EMO_KEYS.indexOf(bar.dataset.key);
    const pct = p.emotion_probs[idx] * 100;
    bar.querySelector('.emo-fill').style.width = `${pct}%`;
    bar.querySelector('.emo-pct').textContent  = `${pct.toFixed(0)}%`;
  });
  document.getElementById('att-fill').style.width = `${p.attention}%`;
  document.getElementById('att-val').textContent  = p.attention.toFixed(1);
  document.getElementById('fat-fill').style.width = `${p.fatigue}%`;
  document.getElementById('fat-val').textContent  = p.fatigue.toFixed(1);

  // 自动标注录制中：计数推理次数（每次 prediction 事件 = 一条预测）
  if (isAutoRecording) {
    autoPredCount++;
    const predText = document.getElementById('auto-pred-text');
    if (predText) predText.textContent = `AI 标注中… 已积累 ${autoPredCount} 条预测`;
  }
});

socket.on('recording_status', (r) => {
  setRecordingButtons(r.recording, r.paused);
  document.getElementById('meta-rec').textContent = `${r.duration_sec.toFixed(1)} s`;
  updateRecPanel(r);
  // 同步自动标注录制状态
  isAutoRecording = r.recording && r.auto_label_mode;
  if (!r.recording) {
    autoPredCount = 0;
    document.getElementById('auto-pred-status').classList.add('hidden');
  }
});

// ─── 保存完成 ────────────────────────────────────────────────
socket.on('save_result', (r) => {
  if (r.ok) {
    if (r.dataset_files) renderDataset(r.dataset_files);
    showSaveDone(r);
    switchTab('dataset');
    if (r.warning) showToast(`⚠ ${r.warning}`, 'warn', 6000);
  } else {
    showToast(`✗ ${r.msg}`, 'error', 5000);
  }
});

// ─── 训练日志 ────────────────────────────────────────────────
socket.on('train_log', (m) => {
  const log = document.getElementById('train-log');
  log.classList.add('active');
  log.textContent += m.line + '\n';
  log.scrollTop = log.scrollHeight;
});

socket.on('train_done', (r) => {
  document.getElementById('btn-train').disabled = false;
  if (r.ok) {
    showTrainResult(r.metrics);
    showToast('✅ 训练完成！模型已自动加载', 'ok', 5000);
  } else {
    showToast(`✗ ${r.msg}`, 'error', 5000);
  }
});

socket.on('model_status', (m) => {
  if (m.loaded) {
    setModelTag(`已加载 · ${m.device}`, true);
    document.getElementById('model-path').textContent = m.path;
  } else {
    setModelTag('加载失败', false);
  }
});


// ─── 录制进度面板 ────────────────────────────────────────────
function updateRecPanel(s) {
  const panel = document.getElementById('rec-panel');
  if (!s.recording) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  // 模式标签
  const modeLabel = document.getElementById('rec-mode-label');
  if (s.auto_label_mode) {
    modeLabel.textContent = '🤖 AI 自动标注中';
    modeLabel.style.color = '#7c3aed';
    document.getElementById('rec-info-tags').textContent = '模型实时打标签，无需手动设置';

    // 显示 AI 预测计数器
    const predStatus = document.getElementById('auto-pred-status');
    predStatus.classList.remove('hidden');
    const predText = document.getElementById('auto-pred-text');
    if (predText) predText.textContent = `AI 标注中… 已积累 ${autoPredCount} 条预测`;
  } else {
    modeLabel.textContent = '正在录制';
    modeLabel.style.color = '';
    document.getElementById('auto-pred-status').classList.add('hidden');
    if (s.label) {
      const emoName = ['消极','平静','积极'][s.label.emotion] || '?';
      const attName = s.label.attention ? '专注' : '不专注';
      const fatName = s.label.fatigue   ? '疲劳' : '不疲劳';
      document.getElementById('rec-info-tags').textContent =
        `情绪: ${emoName} · ${attName} · ${fatName} · ${s.label.task || 'web_session'}`;
    }
  }

  document.getElementById('rec-elapsed').textContent =
    `${(s.duration_sec || 0).toFixed(1)} s`;
  document.getElementById('rec-windows').textContent =
    String(Math.max(0, Math.floor(((s.samples_recorded||0) - 500) / 250) + 1));

  const cntWrap = document.getElementById('rec-countdown-wrap');
  const cntSep  = document.getElementById('rec-countdown-sep');
  if (s.remaining_sec !== null && s.remaining_sec !== undefined) {
    cntWrap.style.display = '';
    cntSep.style.display  = '';
    document.getElementById('rec-countdown').textContent =
      `${Math.ceil(s.remaining_sec)} s`;
  } else {
    cntWrap.style.display = 'none';
    cntSep.style.display  = 'none';
  }
}


// ─── 保存完成横幅 ────────────────────────────────────────────
let saveDoneTimer = null;
function showSaveDone(r) {
  const el  = document.getElementById('save-done');
  document.getElementById('save-done-filename').textContent = r.filename || r.path || '';

  let detail = '';
  if (r.auto_label) {
    // 自动标注结果：显示情绪分布
    const dist = r.emotion_dist || {};
    const distStr = Object.entries(dist)
      .filter(([,v]) => v > 0)
      .map(([k,v]) => `${k} ${v}%`)
      .join(' · ');
    detail = `🤖 AI 自动标注 · ${r.windows} 窗口 (${(r.duration_sec||0).toFixed(1)}s) · ${distStr}`;
  } else {
    const lbl     = r.label || {};
    const emoName = lbl.emotion || '?';
    const attName = lbl.attention ? '专注' : '不专注';
    const fatName = lbl.fatigue   ? '疲劳' : '不疲劳';
    detail = `✅ 已保存 ${r.windows} 个窗口 (${(r.duration_sec||0).toFixed(1)}s) ` +
             `· 标签: ${emoName} / ${attName} / ${fatName}`;
  }
  document.getElementById('save-done-detail').textContent = detail;
  el.classList.remove('hidden');
  if (saveDoneTimer) clearTimeout(saveDoneTimer);
  saveDoneTimer = setTimeout(hideSaveDone, 8000);
}
function hideSaveDone() {
  document.getElementById('save-done').classList.add('hidden');
}


// ─── 数据集列表渲染 ──────────────────────────────────────────
function renderDataset(files) {
  const empty   = document.getElementById('dataset-empty');
  const table   = document.getElementById('dataset-table');
  const tbody   = document.getElementById('dataset-tbody');
  const summary = document.getElementById('dataset-summary');

  if (!files || files.length === 0) {
    empty.style.display = '';
    table.style.display = 'none';
    summary.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  table.style.display = '';
  summary.style.display = '';

  tbody.innerHTML = '';
  let totalWins = 0;
  let autoCount = 0;
  files.forEach((f, idx) => {
    totalWins += f.windows;
    if (f.source === 'auto') autoCount++;
    const tr = document.createElement('tr');
    if (idx === 0) tr.classList.add('latest-row');
    const attTxt = f.attention ? '🎯 专注' : '💤 不专注';
    const fatTxt = f.fatigue   ? '😴 疲劳' : '✅ 不疲劳';
    const srcBadge = f.source === 'auto'
      ? '<span class="src-badge src-auto">🤖 AI</span>'
      : '<span class="src-badge src-manual">✏️ 手动</span>';
    tr.innerHTML = `
      <td class="mono fn-cell" title="${f.path}">${f.filename}</td>
      <td>${f.emotion}</td>
      <td>${attTxt}</td>
      <td>${fatTxt}</td>
      <td class="mono">${f.windows}</td>
      <td class="mono">${f.duration}s</td>
      <td>${srcBadge}</td>
      <td class="mono ts-cell">${(f.created||'').replace('T',' ').slice(0,19)}</td>
    `;
    tbody.appendChild(tr);
  });

  summary.textContent =
    `共 ${files.length} 个文件 · ${totalWins} 个窗口 · ` +
    `${autoCount} 个 AI 自动标注 · ${files.length - autoCount} 个手动标注`;
}

function refreshDataset() {
  fetch('/api/dataset').then(r => r.json()).then(renderDataset);
}


// ─── 训练结果展示 ────────────────────────────────────────────
function showTrainResult(metrics) {
  const el = document.getElementById('train-result');
  if (!metrics) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  document.getElementById('tr-emotion').textContent   = `${(metrics.emotion   *100).toFixed(1)}%`;
  document.getElementById('tr-attention').textContent = `${(metrics.attention *100).toFixed(1)}%`;
  document.getElementById('tr-fatigue').textContent   = `${(metrics.fatigue   *100).toFixed(1)}%`;
  const avg = (metrics.emotion + metrics.attention + metrics.fatigue) / 3;
  document.getElementById('tr-avg').textContent  = `${(avg*100).toFixed(1)}%`;
  document.getElementById('tr-loss').textContent = metrics.loss.toFixed(4);
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// ─── UI 工具 ────────────────────────────────────────────────
function setDeviceBadge(text, online, offline) {
  const b = document.getElementById('device-badge');
  b.classList.remove('online','offline');
  if (online) b.classList.add('online');
  else if (offline) b.classList.add('offline');
  document.getElementById('device-label').textContent = text;
}

function setModelTag(text, loaded) {
  const tag = document.getElementById('model-tag');
  tag.textContent = text;
  tag.closest('.model-opt').classList.toggle('loaded', !!loaded);
}

function setRecordingButtons(recording, paused) {
  const btnRec   = document.getElementById('btn-record');
  const btnPause = document.getElementById('btn-pause');
  const btnSave  = document.getElementById('btn-save');
  if (!recording) {
    btnRec.textContent = autoLabelMode ? '🤖 AI 自动标注录制' : '● 开始记录';
    btnRec.classList.remove('is-recording','is-auto-recording');
    btnRec.disabled   = false;
    btnPause.disabled = true;
    btnPause.textContent = '⏸ 暂停';
    btnSave.disabled  = true;
  } else if (paused) {
    btnRec.textContent = '● 记录暂停中';
    btnRec.classList.remove('is-recording','is-auto-recording');
    btnRec.disabled   = true;
    btnPause.disabled = false;
    btnPause.textContent = '▶ 继续';
    btnSave.disabled  = false;
  } else {
    btnRec.textContent = isAutoRecording ? '🤖 AI 标注中…' : '● 记录中…';
    btnRec.classList.remove('is-recording','is-auto-recording');
    btnRec.classList.add(isAutoRecording ? 'is-auto-recording' : 'is-recording');
    btnRec.disabled   = true;
    btnPause.disabled = false;
    btnPause.textContent = '⏸ 暂停';
    btnSave.disabled  = false;
  }
}

let toastTimer = null;
function showToast(msg, kind='ok', ms=3000) {
  const el = document.getElementById('toast');
  el.classList.remove('hidden','ok','error','warn');
  if (kind) el.classList.add(kind);
  el.textContent = msg;
  void el.offsetWidth;
  el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 250);
  }, ms);
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('is-active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  const tab   = document.querySelector(`.tab[data-tab="${tabName}"]`);
  const panel = document.querySelector(`.tab-panel[data-panel="${tabName}"]`);
  if (tab)   tab.classList.add('is-active');
  if (panel) panel.classList.remove('hidden');
}


// ─── 自动标注模式切换 ────────────────────────────────────────
function setLabelMode(isAuto) {
  autoLabelMode = isAuto;
  document.getElementById('btn-mode-manual').classList.toggle('active', !isAuto);
  document.getElementById('btn-mode-auto').classList.toggle('active', isAuto);

  const form    = document.getElementById('manual-label-form');
  const tip     = document.getElementById('auto-label-tip');
  const hint    = document.getElementById('label-hint');
  const btnRec  = document.getElementById('btn-record');

  if (isAuto) {
    form.style.opacity    = '0.4';
    form.style.pointerEvents = 'none';
    tip.classList.remove('hidden');
    hint.textContent = 'AI 自动标注：模型实时预测，按窗口自动赋予标签，无需手动设置。';
    btnRec.textContent = '🤖 AI 自动标注录制';
  } else {
    form.style.opacity    = '';
    form.style.pointerEvents = '';
    tip.classList.add('hidden');
    hint.textContent = '标签在点击"开始记录"时锁定，自动保存到 dataset/ 目录。';
    btnRec.textContent = '● 开始记录';
  }
}


// ─── 用户操作 ────────────────────────────────────────────────
function readLabels() {
  return {
    emotion          : parseInt(document.getElementById('lbl-emotion').value),
    attention        : parseInt(document.getElementById('lbl-attention').value),
    fatigue          : parseInt(document.getElementById('lbl-fatigue').value),
    task             : document.getElementById('lbl-task').value.trim() || 'web_session',
    subject          : 'S01',
    auto_stop_seconds: parseInt(document.getElementById('auto-stop-sec').value) || 0,
    auto_label       : autoLabelMode,
  };
}

document.getElementById('btn-record').addEventListener('click', () => {
  autoPredCount = 0;
  socket.emit('start_recording', readLabels());
});

document.getElementById('btn-pause').addEventListener('click', () => {
  const btn = document.getElementById('btn-pause');
  if (btn.textContent.includes('继续')) socket.emit('resume_recording');
  else socket.emit('pause_recording');
});

document.getElementById('btn-save').addEventListener('click', () => {
  socket.emit('stop_and_save', readLabels());
});

document.getElementById('btn-train').addEventListener('click', () => {
  const epochs = parseInt(document.getElementById('train-epochs').value) || 80;
  const btn    = document.getElementById('btn-train');
  btn.disabled = true;
  document.getElementById('train-log').textContent = '';
  document.getElementById('train-log').classList.add('active');
  document.getElementById('train-result').classList.add('hidden');
  socket.emit('train_model', { epochs });
});

document.getElementById('scale-select').addEventListener('change', (e) => {
  yScale = parseFloat(e.target.value);
});

['lbl-emotion','lbl-attention','lbl-fatigue','lbl-task'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    socket.emit('set_label', readLabels());
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab);
  });
});

// 顶部计时器
const startTs = Date.now();
setInterval(() => {
  const s  = Math.floor((Date.now() - startTs) / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2,'0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2,'0');
  const ss = String(s % 60).padStart(2,'0');
  document.getElementById('timer').textContent = `${hh}:${mm}:${ss}`;
}, 1000);
