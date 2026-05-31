import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Space, Typography, Select,
  DatePicker, Input, Progress, Breadcrumb, Tooltip, Switch, Badge,
  Divider, Modal,
} from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, WarningOutlined, BellOutlined,
  AlertOutlined, RiseOutlined, FallOutlined, ReloadOutlined, ExportOutlined,
  SearchOutlined, UserOutlined, ClockCircleOutlined,
  WifiOutlined, SignalFilled, InfoCircleOutlined,
  FullscreenOutlined, FilterOutlined, DownloadOutlined,
  SafetyOutlined, ThunderboltOutlined, AimOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const moduleTabs = ['实时监测', '异常告警', '历史记录', '统计分析', '设备管理', '算法模型'];

const kpiCards = [
  { key: 'online', label: '在线监测人数', value: '68', unit: '人', sub: '占比 85.0%', icon: <TeamOutlined />, circleBg: '#E8F3FF', iconColor: '#0052D9' },
  { key: 'normal', label: '正常状态人数', value: '54', unit: '人', sub: '占比 79.4%', icon: <CheckCircleOutlined />, circleBg: '#E8F8F2', iconColor: '#2BA471' },
  { key: 'risk', label: '风险状态人数', value: '11', unit: '人', sub: '占比 16.2%', icon: <WarningOutlined />, circleBg: '#FFF3E8', iconColor: '#E37318' },
  { key: 'severe', label: '严重风险人数', value: '3', unit: '人', sub: '占比 4.4%', icon: <BellOutlined />, circleBg: '#FDECEE', iconColor: '#D54941' },
  { key: 'alarms', label: '今日告警次数', value: '14', unit: '次', sub: '较昨日 ↓ 12.5%', icon: <AlertOutlined />, circleBg: '#E8FFFB', iconColor: '#14C9C9', trendColor: '#2BA471' },
  { key: 'attention', label: '平均专注度', value: '72.3', unit: '分', sub: '较昨日 ↑ 3.6 分', icon: <RiseOutlined />, circleBg: '#F2F3FF', iconColor: '#7B61FF', trendColor: '#D54941' },
  { key: 'fatigue', label: '平均疲劳度', value: '28.7', unit: '分', sub: '较昨日 ↓ 4.2 分', icon: <FallOutlined />, circleBg: '#E8F3FF', iconColor: '#0052D9', trendColor: '#2BA471' },
];

const personnelDataBase = [
  { key: '1', name: '张三', id: '100001', status: '正常', attention: 85, fatigue: 22, drowsiness: 18, stress: 25, duration: '02:35:24' },
  { key: '2', name: '李四', id: '100002', status: '正常', attention: 78, fatigue: 26, drowsiness: 22, stress: 28, duration: '02:32:18' },
  { key: '3', name: '王五', id: '100003', status: '风险', attention: 62, fatigue: 45, drowsiness: 42, stress: 48, duration: '02:31:07' },
  { key: '4', name: '赵六', id: '100004', status: '风险', attention: 55, fatigue: 58, drowsiness: 52, stress: 55, duration: '02:28:33' },
  { key: '5', name: '孙七', id: '100005', status: '严重', attention: 32, fatigue: 72, drowsiness: 65, stress: 62, duration: '02:26:11' },
  { key: '6', name: '周八', id: '100006', status: '正常', attention: 81, fatigue: 23, drowsiness: 20, stress: 22, duration: '02:25:45' },
  { key: '7', name: '吴九', id: '100007', status: '风险', attention: 60, fatigue: 48, drowsiness: 45, stress: 44, duration: '02:23:56' },
];

function generateExtraPersonnel(startIndex: number, count: number) {
  const statuses = ['正常', '正常', '正常', '正常', '风险', '风险', '严重'];
  const surnames = ['陈', '林', '黄', '刘', '杨', '马', '朱', '胡', '郭', '何', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '邓', '韩'];
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '军', '杰', '娟', '艳', '涛', '明', '超', '秀兰', '霞'];
  const result = [];
  for (let i = 0; i < count; i++) {
    const s = statuses[i % statuses.length];
    const baseAtt = s === '正常' ? 75 + Math.floor(Math.random() * 20) : s === '风险' ? 50 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 20);
    const baseFat = s === '正常' ? 15 + Math.floor(Math.random() * 15) : s === '风险' ? 35 + Math.floor(Math.random() * 25) : 60 + Math.floor(Math.random() * 30);
    const idx = startIndex + i;
    result.push({
      key: String(idx + 1),
      name: surnames[i % surnames.length] + names[i % names.length],
      id: String(100008 + idx),
      status: s,
      attention: baseAtt,
      fatigue: baseFat,
      drowsiness: Math.floor(baseFat * 0.85 + Math.random() * 5),
      stress: Math.floor(baseFat * 0.75 + Math.random() * 10),
      duration: `0${Math.floor(Math.random() * 4)}:${String(20 + Math.floor(Math.random() * 40)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    });
  }
  return result;
}

const allPersonnelData = [...personnelDataBase, ...generateExtraPersonnel(7, 61)];

const alarmRecords = [
  { time: '2025-05-20 22:18:34', person: '孙七', personId: '100005', type: '高度疲劳', severity: '严重', severityColor: 'red', status: '未处理', statusColor: '#D54941' },
  { time: '2025-05-20 21:05:12', person: '赵六', personId: '100004', type: '注意力下降', severity: '风险', severityColor: 'orange', status: '处理中', statusColor: '#0052D9' },
  { time: '2025-05-20 20:47:53', person: '王五', personId: '100003', type: '轻度疲劳', severity: '风险', severityColor: 'orange', status: '已处理', statusColor: '#2BA471' },
  { time: '2025-05-20 19:33:22', person: '周八', personId: '100006', type: '注意力下降', severity: '风险', severityColor: 'orange', status: '已处理', statusColor: '#2BA471' },
];

const riskJudgment = [
  { level: '正常', attention: '>= 70', fatigue: '<= 30', drowsiness: '<= 30', action: '保持当前工作状态', color: '#2BA471' },
  { level: '风险', attention: '40 - 70', fatigue: '30 - 60', drowsiness: '30 - 60', action: '注意休息，调整状态', color: '#E37318' },
  { level: '严重风险', attention: '< 40', fatigue: '> 60', drowsiness: '> 60', action: '立即停止作业，休息或离岗', color: '#D54941' },
];

const statusTagColor: Record<string, string> = { '正常': 'green', '风险': 'orange', '严重': 'red' };
const barColorMap: Record<string, string> = { '正常': '#2BA471', '风险': '#E37318', '严重': '#D54941' };

const eegChannels = [
  { name: 'F3', freq: 10, amp: 45, phase: 0, noise: 8, color: '#5470C6' },
  { name: 'F4', freq: 9.5, amp: 42, phase: 0.5, noise: 7, color: '#91CC75' },
  { name: 'C3', freq: 11, amp: 48, phase: 1.0, noise: 9, color: '#FAC858' },
  { name: 'C4', freq: 10.5, amp: 44, phase: 1.5, noise: 8, color: '#EE6666' },
  { name: 'P3', freq: 8.5, amp: 40, phase: 2.0, noise: 7, color: '#73C0DE' },
  { name: 'P4', freq: 9, amp: 38, phase: 2.5, noise: 6, color: '#3BA272' },
  { name: 'O1', freq: 8, amp: 35, phase: 3.0, noise: 7, color: '#FC8452' },
  { name: 'O2', freq: 7.5, amp: 33, phase: 3.5, noise: 6, color: '#9A60B4' },
];

const freqBands = [
  { name: 'Delta δ', range: '0.5-4Hz', color: '#7B61FF', freqCenter: 2, ampBase: 15 },
  { name: 'Theta θ', range: '4-8Hz', color: '#0052D9', freqCenter: 6, ampBase: 12 },
  { name: 'Alpha α', range: '8-13Hz', color: '#2BA471', freqCenter: 10, ampBase: 20 },
  { name: 'Beta β', range: '13-30Hz', color: '#E37318', freqCenter: 22, ampBase: 8 },
  { name: 'Gamma γ', range: '30-45Hz', color: '#D54941', freqCenter: 38, ampBase: 5 },
];

function genEEGWave(points: number, freq: number, amp: number, phase: number, noise: number): number[] {
  return Array.from({ length: points }, (_, i) => {
    const t = i / points;
    return amp * Math.sin(2 * Math.PI * freq * t + phase) + (Math.random() - 0.5) * noise;
  });
}

const electrodePositions = [
  { name: 'F3', x: 60, y: 38 },
  { name: 'F4', x: 98, y: 38 },
  { name: 'C3', x: 50, y: 65 },
  { name: 'C4', x: 108, y: 65 },
  { name: 'P3', x: 58, y: 95 },
  { name: 'P4', x: 100, y: 95 },
  { name: 'O1', x: 70, y: 118 },
  { name: 'O2', x: 90, y: 118 },
];

const brainWireframeArcsH = [
  'M 38 50 Q 80 40, 120 50',
  'M 35 64 Q 80 54, 123 64',
  'M 33 78 Q 80 68, 125 78',
  'M 35 92 Q 80 82, 123 92',
  'M 38 106 Q 80 96, 120 106',
  'M 43 120 Q 80 110, 118 120',
];

const brainWireframeArcsV = [
  'M 45 35 Q 40 75, 45 130',
  'M 55 32 Q 50 75, 55 130',
  'M 65 30 Q 60 75, 65 132',
  'M 75 28 Q 70 75, 75 134',
  'M 85 28 Q 80 75, 85 134',
  'M 95 30 Q 90 75, 95 132',
  'M 105 32 Q 100 75, 105 130',
  'M 115 35 Q 110 75, 115 128',
];

const HEAD_SVG = ({ attention, fatigue }: { attention: number; fatigue: number }) => {
  const riskLevel = fatigue > 60 || attention < 40 ? 'severe' : fatigue > 30 || attention < 70 ? 'risk' : 'normal';
  const heatmapIntensity = fatigue > 60 ? 0.9 : fatigue > 30 ? 0.6 : 0.3;
  const hotColor = riskLevel === 'severe' ? '#D54941' : riskLevel === 'risk' ? '#E37318' : '#2BA471';
  const pulseAnim = riskLevel === 'severe' ? 'blink-warning 1s ease-in-out infinite' : riskLevel === 'risk' ? 'pulse-dot 2s ease-in-out infinite' : 'none';
  return (
    <svg viewBox="0 0 160 200" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="hmGrad" cx="45%" cy="38%" r="55%">
          <stop offset="0%" stopColor={hotColor} stopOpacity={heatmapIntensity} />
          <stop offset="35%" stopColor="#E37318" stopOpacity={heatmapIntensity * 0.8} />
          <stop offset="65%" stopColor="#FAC858" stopOpacity={heatmapIntensity * 0.5} />
          <stop offset="85%" stopColor="#2BA471" stopOpacity={heatmapIntensity * 0.25} />
          <stop offset="100%" stopColor="#0052D9" stopOpacity={0.15} />
        </radialGradient>
        <linearGradient id="scaleGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0052D9" />
          <stop offset="35%" stopColor="#2BA471" />
          <stop offset="65%" stopColor="#FAC858" />
          <stop offset="85%" stopColor="#E37318" />
          <stop offset="100%" stopColor="#D54941" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="brainClip">
          <ellipse cx="78" cy="75" rx="36" ry="44" />
        </clipPath>
      </defs>
      {/* Neck */}
      <path d="M 55 168 Q 50 185, 52 200" fill="none" stroke="#1a1a2e" strokeWidth="2" opacity="0.3" />
      <path d="M 100 168 Q 105 185, 103 200" fill="none" stroke="#1a1a2e" strokeWidth="2" opacity="0.3" />
      {/* Head outline */}
      <ellipse cx="78" cy="100" rx="52" ry="68" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
      {/* Face profile */}
      <path d="M 30 78 C 18 82, 8 90, 12 96 C 15 99, 22 96, 24 101 C 18 103, 10 108, 12 113 C 16 116, 24 112, 26 118 C 27 122, 25 128, 28 134"
        fill="none" stroke="#1a1a2e" strokeWidth="2" />
      {/* Ear */}
      <ellipse cx="128" cy="95" rx="5" ry="12" fill="none" stroke="#1a1a2e" strokeWidth="1.5" opacity="0.3" />
      <path d="M 128 83 C 133 85, 133 90, 128 92" fill="none" stroke="#1a1a2e" strokeWidth="1" opacity="0.3" />
      <path d="M 128 98 C 133 96, 133 100, 128 107" fill="none" stroke="#1a1a2e" strokeWidth="1" opacity="0.3" />
      {/* Brain area - base */}
      <ellipse cx="78" cy="75" rx="36" ry="44" fill="#1a1a2e" opacity="0.08" />
      {/* Heatmap overlay */}
      <ellipse cx="78" cy="75" rx="36" ry="44" fill="url(#hmGrad)" clipPath="url(#brainClip)" />
      {/* Wireframe horizontal arcs */}
      {brainWireframeArcsH.map((d, i) => (
        <path key={'h' + i} d={d} fill="none" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.25" />
      ))}
      {/* Wireframe vertical arcs */}
      {brainWireframeArcsV.map((d, i) => (
        <path key={'v' + i} d={d} fill="none" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.25" />
      ))}
      {/* Brain border */}
      <ellipse cx="78" cy="75" rx="36" ry="44" fill="none" stroke="#1a1a2e" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
      {/* Electrode nodes */}
      {electrodePositions.map((ep) => {
        const isHighlighted = riskLevel === 'severe' || (riskLevel === 'risk' && (ep.name === 'C3' || ep.name === 'C4' || ep.name === 'F3'));
        return (
          <g key={ep.name}>
            {isHighlighted && (
              <circle cx={ep.x} cy={ep.y} r="8" fill={hotColor} opacity="0.15" style={{ animation: pulseAnim }}>
                <animate attributeName="r" values="6;10;6" dur={riskLevel === 'severe' ? '1s' : '2s'} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur={riskLevel === 'severe' ? '1s' : '2s'} repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={ep.x} cy={ep.y} r="3" fill={isHighlighted ? hotColor : '#4FC3F7'} stroke="#fff" strokeWidth="1" filter={isHighlighted ? 'url(#glow)' : undefined} />
            <text x={ep.x < 78 ? ep.x - 14 : ep.x + 6} y={ep.y + 3} fontSize="5.5" fill="#86909C" textAnchor={ep.x < 78 ? 'end' : 'start'}>{ep.name}</text>
          </g>
        );
      })}
      {/* Connecting lines */}
      <line x1="60" y1="38" x2="50" y2="65" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="98" y1="38" x2="108" y2="65" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="50" y1="65" x2="58" y2="95" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="108" y1="65" x2="100" y2="95" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="58" y1="95" x2="70" y2="118" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="100" y1="95" x2="90" y2="118" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="60" y1="38" x2="98" y2="38" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="50" y1="65" x2="108" y2="65" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      <line x1="58" y1="95" x2="100" y2="95" stroke="#1a1a2e" strokeWidth="0.4" opacity="0.15" />
      {/* Activity scale bar */}
      <rect x="145" y="32" width="5" height="100" rx="2.5" fill="url(#scaleGrad)" />
      <text x="153" y="35" fontSize="6" fill="#86909C">高</text>
      <text x="153" y="130" fontSize="6" fill="#86909C">低</text>
      <text x="153" y="83" fontSize="5" fill="#86909C" textAnchor="middle" transform="rotate(90, 153, 83)">活跃度</text>
    </svg>
  );
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function EEGMonitor() {
  const [activeTab, setActiveTab] = useState('实时监测');
  const [selectedPerson, setSelectedPerson] = useState(allPersonnelData[4]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部人员');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(7);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [eegTick, setEegTick] = useState(0);
  const [simAttention, setSimAttention] = useState(allPersonnelData[4].attention);
  const [simFatigue, setSimFatigue] = useState(allPersonnelData[4].fatigue);
  const [trendData, setTrendData] = useState({
    attention: [82, 80, 78, 76, 79, 81],
    fatigue: [52, 55, 60, 58, 56, 54],
    drowsiness: [22, 25, 28, 26, 24, 23],
  });

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exportInProgress = useRef(false);

  useEffect(() => {
    setSimAttention(selectedPerson.attention);
    setSimFatigue(selectedPerson.fatigue);
  }, [selectedPerson]);

  useEffect(() => {
    if (!autoRefresh) {
      if (refreshRef.current) { clearInterval(refreshRef.current); refreshRef.current = null; }
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      return;
    }
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    refreshRef.current = setInterval(() => {
      setSimAttention((prev) => clamp(prev + (Math.random() - 0.5) * 8, 10, 95));
      setSimFatigue((prev) => clamp(prev + (Math.random() - 0.5) * 8, 10, 95));
      setTrendData((prev) => ({
        attention: [...prev.attention.slice(1), clamp(prev.attention[5] + (Math.random() - 0.5) * 14, 20, 100)],
        fatigue: [...prev.fatigue.slice(1), clamp(prev.fatigue[5] + (Math.random() - 0.5) * 14, 10, 90)],
        drowsiness: [...prev.drowsiness.slice(1), clamp(prev.drowsiness[5] + (Math.random() - 0.5) * 10, 5, 70)],
      }));
      setEegTick((t) => t + 1);
    }, 5000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh]);

  const filteredPersonnel = useMemo(() => {
    return allPersonnelData.filter((p) => {
      if (statusFilter !== '全部人员' && p.status !== statusFilter) return false;
      if (searchText && !p.name.includes(searchText) && !p.id.includes(searchText)) return false;
      return true;
    });
  }, [statusFilter, searchText]);

  const paginatedPersonnel = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPersonnel.slice(start, start + pageSize);
  }, [filteredPersonnel, currentPage, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredPersonnel.length / pageSize)), [filteredPersonnel.length, pageSize]);

  const eegWaveData = useMemo(() => {
    const pts = 120;
    return eegChannels.map((ch) => genEEGWave(pts, ch.freq, ch.amp, ch.phase + eegTick * 0.3, ch.noise));
  }, [eegTick]);

  const freqBandData = useMemo(() => {
    const pts = 50;
    return freqBands.map((b, i) => genEEGWave(pts, b.freqCenter, b.ampBase, i * 0.7 + eegTick * 0.2, b.ampBase * 0.3));
  }, [eegTick]);

  const channelEEGOption = useMemo(() => {
    const pts = 120;
    const series = eegChannels.map((ch, i) => ({
      type: 'line' as const,
      name: ch.name,
      data: eegWaveData[i],
      symbol: 'none',
      smooth: 0.4,
      lineStyle: { width: 1.2, color: ch.color },
      areaStyle: { color: 'transparent' },
      emphasis: { focus: 'series' as const },
    }));
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 12, top: 8, bottom: 24 },
      xAxis: {
        show: true,
        data: Array.from({ length: pts }, (_, i) => `${((i / 20) * 2).toFixed(0)}s`),
        axisLabel: { fontSize: 9, interval: 19, color: '#86909C' },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
      },
      yAxis: { type: 'value' as const, show: false, min: -70, max: 70 },
      legend: {
        right: 0,
        top: 0,
        textStyle: { fontSize: 10 },
        itemWidth: 12,
        itemHeight: 8,
        data: eegChannels.map((c) => c.name),
      },
      tooltip: { trigger: 'axis' as const },
      series,
    };
  }, [eegWaveData]);

  const trendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 42, right: 24, top: 18, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
      axisLabel: { fontSize: 10, color: '#86909C' },
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: { fontSize: 10, color: '#86909C' },
      splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E5E6EB',
      textStyle: { fontSize: 11, color: '#1D2129' },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10 },
      itemWidth: 12,
      itemHeight: 8,
    },
    series: [
      {
        name: '专注度',
        type: 'line' as const,
        data: trendData.attention.map((v) => Math.round(v)),
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        lineStyle: { color: '#0052D9', width: 2.5 },
        itemStyle: { color: '#0052D9' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,82,217,0.18)' },
              { offset: 1, color: 'rgba(0,82,217,0.01)' },
            ],
          },
        },
      },
      {
        name: '疲劳度',
        type: 'line' as const,
        data: trendData.fatigue.map((v) => Math.round(v)),
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        lineStyle: { color: '#E37318', width: 2.5 },
        itemStyle: { color: '#E37318' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(227,115,24,0.18)' },
              { offset: 1, color: 'rgba(227,115,24,0.01)' },
            ],
          },
        },
      },
      {
        name: '困倦指数',
        type: 'line' as const,
        data: trendData.drowsiness.map((v) => Math.round(v)),
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        lineStyle: { color: '#2BA471', width: 2.5 },
        itemStyle: { color: '#2BA471' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(43,164,113,0.18)' },
              { offset: 1, color: 'rgba(43,164,113,0.01)' },
            ],
          },
        },
      },
    ],
  }), [trendData]);

  const riskDonutOption = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} 人 ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10 },
      itemWidth: 10,
      itemHeight: 8,
    },
    series: [{
      type: 'pie' as const,
      radius: ['58%', '80%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
      data: [
        { value: 54, name: '正常', itemStyle: { color: '#2BA471' } },
        { value: 11, name: '风险', itemStyle: { color: '#E37318' } },
        { value: 3, name: '严重风险', itemStyle: { color: '#D54941' } },
      ],
    }],
    graphic: [
      {
        type: 'text' as const,
        left: 'center',
        top: '36%',
        style: { text: '68', textAlign: 'center' as const, fill: '#1D2129', fontSize: 22, fontWeight: 'bold' as const },
      },
      {
        type: 'text' as const,
        left: 'center',
        top: '50%',
        style: { text: '总数', textAlign: 'center' as const, fill: '#86909C', fontSize: 10 },
      },
    ],
  }), []);

  const attentionGauge = useMemo(() => {
    const safeVal = clamp(Math.round(simAttention), 0, 100);
    const zoneColor = safeVal < 40 ? '#D54941' : safeVal < 70 ? '#E37318' : '#2BA471';
    return {
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge' as const,
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        center: ['50%', '58%'],
        radius: '82%',
        pointer: { show: true, length: '55%', width: 4, itemStyle: { color: zoneColor } },
        progress: { show: true, overlap: false, roundCap: true, clip: false, itemStyle: { color: zoneColor } },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.4, '#D54941'],
              [0.7, '#E37318'],
              [1, '#2BA471'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 18,
          fontWeight: 'bold' as const,
          color: zoneColor,
          offsetCenter: [0, '64%'],
          formatter: '{value}',
        },
        title: { offsetCenter: [0, '88%'], fontSize: 10, color: '#86909C' },
        data: [{ value: safeVal, name: '专注度(分)' }],
      }],
      graphic: [
        { type: 'group' as const, left: 'center', bottom: 2, children: [
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#2BA471' }, left: -55 },
          { type: 'text' as const, style: { text: '正常 ≥70', fill: '#86909C', fontSize: 8 }, left: -48, top: -3 },
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#E37318' }, left: 8 },
          { type: 'text' as const, style: { text: '风险 40-70', fill: '#86909C', fontSize: 8 }, left: 15, top: -3 },
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#D54941' }, left: 62 },
          { type: 'text' as const, style: { text: '严重 <40', fill: '#86909C', fontSize: 8 }, left: 69, top: -3 },
        ] },
      ],
    };
  }, [simAttention]);

  const fatigueGauge = useMemo(() => {
    const safeVal = clamp(Math.round(simFatigue), 0, 100);
    const zoneColor = safeVal > 60 ? '#D54941' : safeVal > 30 ? '#E37318' : '#2BA471';
    return {
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge' as const,
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        center: ['50%', '58%'],
        radius: '82%',
        pointer: { show: true, length: '55%', width: 4, itemStyle: { color: zoneColor } },
        progress: { show: true, overlap: false, roundCap: true, clip: false, itemStyle: { color: zoneColor } },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.3, '#2BA471'],
              [0.6, '#E37318'],
              [1, '#D54941'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 18,
          fontWeight: 'bold' as const,
          color: zoneColor,
          offsetCenter: [0, '64%'],
          formatter: '{value}',
        },
        title: { offsetCenter: [0, '88%'], fontSize: 10, color: '#86909C' },
        data: [{ value: safeVal, name: '疲劳度(分)' }],
      }],
      graphic: [
        { type: 'group' as const, left: 'center', bottom: 2, children: [
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#2BA471' }, left: -55 },
          { type: 'text' as const, style: { text: '正常 ≤30', fill: '#86909C', fontSize: 8 }, left: -48, top: -3 },
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#E37318' }, left: 8 },
          { type: 'text' as const, style: { text: '风险 30-60', fill: '#86909C', fontSize: 8 }, left: 15, top: -3 },
          { type: 'circle' as const, shape: { cx: 0, cy: 0, r: 3 }, style: { fill: '#D54941' }, left: 62 },
          { type: 'text' as const, style: { text: '严重 >60', fill: '#86909C', fontSize: 8 }, left: 69, top: -3 },
        ] },
      ],
    };
  }, [simFatigue]);

  const bandSparkOptions = useMemo(() => freqBandData.map((data, i) => {
    const b = freqBands[i];
    return {
      backgroundColor: 'transparent',
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { show: false, data: data.map((_, j) => j) },
      yAxis: { show: false, min: -35, max: 35 },
      series: [{
        type: 'line' as const,
        data,
        symbol: 'none',
        smooth: true,
        lineStyle: { color: b.color, width: 1.3 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${b.color}35` },
              { offset: 1, color: `${b.color}05` },
            ],
          },
        },
      }],
    };
  }), [freqBandData]);

  const statusDistOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 0, right: 10, top: 5, bottom: 5 },
    xAxis: { show: false },
    yAxis: {
      type: 'category' as const,
      data: ['严重', '风险', '正常'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 9, color: '#86909C' },
    },
    series: [{
      type: 'bar' as const,
      data: [
        { value: 3, itemStyle: { color: '#D54941', borderRadius: [0, 3, 3, 0] } },
        { value: 11, itemStyle: { color: '#E37318', borderRadius: [0, 3, 3, 0] } },
        { value: 54, itemStyle: { color: '#2BA471', borderRadius: [0, 3, 3, 0] } },
      ],
      barWidth: 10,
      label: { show: true, position: 'right' as const, fontSize: 9, color: '#1D2129', formatter: '{c}人' },
    }],
  }), []);

  const handleExport = useCallback(() => {
    if (exportInProgress.current) return;
    exportInProgress.current = true;
    setTimeout(() => {
      setExportModalVisible(false);
      exportInProgress.current = false;
    }, 1500);
  }, []);

  const handleRefresh = useCallback(() => {
    setEegTick((t) => t + 1);
    setSimAttention(clamp(32 + (Math.random() - 0.5) * 10, 10, 95));
    setSimFatigue(clamp(72 + (Math.random() - 0.5) * 10, 10, 95));
  }, []);

  const personnelColumns = useMemo(() => [
    {
      title: '姓名/工号',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      render: (_: string, record: typeof allPersonnelData[0]) => (
        <Space size={8}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${barColorMap[record.status]}, ${barColorMap[record.status]}CC)`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, flexShrink: 0,
            boxShadow: `0 2px 6px ${barColorMap[record.status]}33`,
          }}>
            {record.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 11, color: '#86909C' }}>{record.id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (s: string) => <Tag color={statusTagColor[s]} style={{ margin: 0, fontSize: 11 }}>{s}</Tag>,
    },
    {
      title: '专注度',
      dataIndex: 'attention',
      key: 'attention',
      width: 85,
      render: (v: number, record: typeof allPersonnelData[0]) => (
        <Space size={4}>
          <div style={{ width: 48, height: 7, background: '#F2F3F5', borderRadius: 3.5, overflow: 'hidden' }}>
            <div style={{
              width: `${v}%`, height: '100%',
              background: `linear-gradient(90deg, ${barColorMap[record.status]}, ${barColorMap[record.status]}88)`,
              borderRadius: 3.5,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <Text style={{ fontSize: 11, fontWeight: 500, minWidth: 18 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '疲劳度',
      dataIndex: 'fatigue',
      key: 'fatigue',
      width: 85,
      render: (v: number) => (
        <Space size={4}>
          <div style={{ width: 48, height: 7, background: '#F2F3F5', borderRadius: 3.5, overflow: 'hidden' }}>
            <div style={{
              width: `${v}%`, height: '100%',
              background: `linear-gradient(90deg, ${v > 60 ? '#D54941' : v > 30 ? '#E37318' : '#2BA471'}, ${v > 60 ? '#D5494188' : v > 30 ? '#E3731888' : '#2BA47188'})`,
              borderRadius: 3.5,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <Text style={{ fontSize: 11, fontWeight: 500, minWidth: 18 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '监测时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 85,
      render: (v: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ fontSize: 10, color: '#86909C' }} />
          <Text style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ),
    },
  ], []);

  const alarmColumns = useMemo(() => [
    { title: '告警时间', dataIndex: 'time', key: 'time', width: 150, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '人员', dataIndex: 'person', key: 'person', width: 100, render: (_: string, r: typeof alarmRecords[0]) => <Text style={{ fontSize: 11 }}>{r.person} ({r.personId})</Text> },
    { title: '告警类型', dataIndex: 'type', key: 'type', width: 90, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 80, render: (_: string, r: typeof alarmRecords[0]) => <Tag color={r.severityColor} style={{ margin: 0, fontSize: 10 }}>{r.severity}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (_: string, r: typeof alarmRecords[0]) => <Text style={{ fontSize: 11, color: r.statusColor, fontWeight: 500 }}>{r.status}</Text> },
  ], []);

  const riskColumns = useMemo(() => [
    { title: '风险等级', dataIndex: 'level', key: 'level', width: 80, render: (v: string, r: typeof riskJudgment[0]) => <Tag color={r.color === '#2BA471' ? 'green' : r.color === '#E37318' ? 'orange' : 'red'} style={{ margin: 0, fontSize: 11 }}>{v}</Tag> },
    { title: '专注度(分)', dataIndex: 'attention', key: 'attention', width: 90, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '疲劳度(分)', dataIndex: 'fatigue', key: 'fatigue', width: 90, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '困倦指数(分)', dataIndex: 'drowsiness', key: 'drowsiness', width: 100, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '处理建议', dataIndex: 'action', key: 'action', width: 170, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
  ], []);

  const statusBadge = selectedPerson.status === '严重' ? '严重风险' : selectedPerson.status === '风险' ? '风险' : '正常';

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchText]);

  return (
    <div style={{ padding: '0 0 24px' }}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        @keyframes blink-warning {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .eeg-table-row:hover { background: #F0F5FF !important; }
        .eeg-table-row-selected { background: #E8F3FF !important; }
        .eeg-table-row-selected td { background: #E8F3FF !important; }
      `}</style>

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Breadcrumb
          items={[
            { title: <><SafetyOutlined style={{ fontSize: 12, marginRight: 4 }} />安全监管</> },
            { title: '脑电监督' },
          ]}
        />
        <Tooltip title="脑电监督模块用于实时监测作业人员脑电状态，提供风险预警与趋势分析。数据仅用于安全管理，不作为医疗诊断依据。">
          <InfoCircleOutlined style={{ fontSize: 12, color: '#86909C', cursor: 'help' }} />
        </Tooltip>
      </div>

      <Card style={{ marginBottom: 12 }} styles={{ body: { padding: '10px 20px' } }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size={0}>
              {moduleTabs.map((tab) => (
                <Button
                  key={tab}
                  type="text"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    color: activeTab === tab ? '#0052D9' : '#4E5969',
                    fontWeight: activeTab === tab ? 600 : 400,
                    borderBottom: activeTab === tab ? '2px solid #0052D9' : '2px solid transparent',
                    borderRadius: 0,
                    padding: '4px 16px',
                    fontSize: 13,
                    height: 32,
                  }}
                >
                  {tab}
                </Button>
              ))}
            </Space>
          </Col>
          <Col>
            <Space size={8} wrap>
              <DatePicker
                size="small"
                defaultValue={dayjs('2025-05-20')}
                style={{ width: 140 }}
                suffixIcon={<ClockCircleOutlined />}
              />
              <Select
                size="small"
                defaultValue="全部班组"
                style={{ width: 100 }}
                options={[
                  { value: '全部班组', label: '全部班组' },
                  { value: '白班', label: '白班' },
                  { value: '中班', label: '中班' },
                  { value: '夜班', label: '夜班' },
                ]}
              />
              <Tooltip title={`自动刷新: ${autoRefresh ? '开启' : '关闭'} (${countdown}s)`}>
                <Switch
                  size="small"
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                  checkedChildren={<CaretRightOutlined />}
                />
              </Tooltip>
              {autoRefresh && (
                <Badge count={countdown} size="small" color="#0052D9" style={{ fontSize: 10 }}>
                  <Text style={{ fontSize: 10, color: '#86909C', width: 6, display: 'inline-block' }} />
                </Badge>
              )}
              <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} />
              <Tooltip title="全屏">
                <Button size="small" icon={<FullscreenOutlined />} />
              </Tooltip>
              <Button type="primary" size="small" icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
                导出报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {kpiCards.map((card) => (
          <Col key={card.key} flex="1" style={{ minWidth: 138 }}>
            <Card styles={{ body: { padding: '14px 16px 10px' } }} style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: card.circleBg, color: card.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 19, flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#86909C', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#1D2129', lineHeight: 1 }}>{card.value}</span>
                    <span style={{ fontSize: 12, color: '#86909C' }}>{card.unit}</span>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: card.trendColor || '#86909C',
                    marginTop: 2,
                  }}>
                    {card.sub}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={9}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>实时脑电监测</Text>}
            extra={
              <Space size={6}>
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 100 }}
                  options={[
                    { value: '全部人员', label: '全部人员' },
                    { value: '正常', label: '正常' },
                    { value: '风险', label: '风险' },
                    { value: '严重', label: '严重' },
                  ]}
                />
                <Input
                  size="small"
                  placeholder="搜索姓名/工号"
                  prefix={<SearchOutlined />}
                  style={{ width: 130 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={personnelColumns}
              dataSource={paginatedPersonnel}
              pagination={false}
              size="small"
              showHeader={true}
              rowClassName={(record) =>
                record.key === selectedPerson.key ? 'eeg-table-row-selected' : 'eeg-table-row'
              }
              onRow={(record) => ({
                onClick: () => setSelectedPerson(record),
                style: {
                  cursor: 'pointer',
                  background: record.key === selectedPerson.key ? '#E8F3FF' : undefined,
                },
              })}
              style={{ fontSize: 12 }}
              scroll={{ y: 388 }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 16px', borderTop: '1px solid #F2F3F5',
              fontSize: 12, color: '#86909C',
            }}>
              <span>共 {filteredPersonnel.length} 人</span>
              <Space size={6}>
                <Button
                  size="small"
                  type="text"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  {'<'}
                </Button>
                <span>{currentPage} / {totalPages}</span>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                  style={{ width: 56 }}
                  options={[
                    { value: 7, label: '7' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                  ]}
                />
                <Button
                  size="small"
                  type="text"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  {'>'}
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={9}>
          <Card
            title={
              <Space size={8}>
                <Text strong style={{ fontSize: 14 }}>
                  当前选中人员：{selectedPerson.name} ({selectedPerson.id})
                </Text>
                <Tag color={statusTagColor[selectedPerson.status]} style={{ margin: 0 }}>
                  {statusBadge}
                </Tag>
                {selectedPerson.status === '严重' && (
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: '#D54941', animation: 'blink-warning 0.8s ease-in-out infinite',
                    marginLeft: -2,
                  }} />
                )}
              </Space>
            }
            styles={{ body: { padding: '10px 14px' } }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', width: 138, height: 178, flexShrink: 0 }}>
                <HEAD_SVG attention={simAttention} fatigue={simFatigue} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
                <div style={{ height: 105 }}>
                  <ReactECharts option={attentionGauge} style={{ height: '100%' }} />
                </div>
                <div style={{ height: 105 }}>
                  <ReactECharts option={fatigueGauge} style={{ height: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', height: 60 }}>
                  <ReactECharts
                    option={statusDistOption}
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>实时脑电波形</Text>
                <Divider orientation="vertical" style={{ margin: 0, borderColor: '#E5E6EB' }} />
                <Badge status="processing" text={<Text style={{ fontSize: 10, color: '#86909C' }}>实时采集</Text>} />
                <Tooltip title="五频段脑电波形分析">
                  <InfoCircleOutlined style={{ fontSize: 11, color: '#86909C' }} />
                </Tooltip>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {freqBands.map((band, i) => (
                  <div
                    key={band.name}
                    style={{
                      background: '#F7F8FA', borderRadius: 8, padding: '5px 7px',
                      border: `1px solid ${band.color}15`,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 600, color: band.color, marginBottom: 1 }}>
                      {band.name}
                    </div>
                    <div style={{ fontSize: 9, color: '#86909C', marginBottom: 2 }}>{band.range}</div>
                    <div style={{ height: 42 }}>
                      <ReactECharts option={bandSparkOptions[i]} style={{ height: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 10, padding: '8px 14px', background: '#F7F8FA', borderRadius: 8,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '4px 12px',
            }}>
              <Space size={4}>
                <ThunderboltOutlined style={{ color: '#0052D9', fontSize: 11 }} />
                <Text style={{ fontSize: 10, color: '#86909C' }}>设备型号:</Text>
                <Text style={{ fontSize: 11, fontWeight: 500 }}>EEG-4000</Text>
              </Space>
              <Space size={4}>
                <WifiOutlined style={{ color: '#2BA471', fontSize: 11 }} />
                <Text style={{ fontSize: 10, color: '#86909C' }}>信号质量:</Text>
                <Text style={{ fontSize: 11, color: '#2BA471', fontWeight: 500 }}>良好 92%</Text>
              </Space>
              <Space size={4}>
                <SignalFilled style={{ color: simFatigue > 60 ? '#D54941' : '#E37318', fontSize: 11 }} />
                <Text style={{ fontSize: 10, color: '#86909C' }}>电池电量:</Text>
                <Progress
                  percent={68}
                  size="small"
                  style={{ width: 60, margin: 0 }}
                  strokeColor={68 > 50 ? '#2BA471' : 68 > 20 ? '#E37318' : '#D54941'}
                  showInfo={false}
                />
                <Text style={{ fontSize: 11 }}>68%</Text>
              </Space>
              <Space size={4}>
                <Badge status="success" />
                <Text style={{ fontSize: 10, color: '#86909C' }}>连接:</Text>
                <Text style={{ fontSize: 11, color: '#2BA471', fontWeight: 500 }}>在线</Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>脑电指标趋势 (近6小时)</Text>}
            styles={{ body: { padding: '6px 4px' } }}
          >
            <ReactECharts option={trendOption} style={{ height: 180 }} />
          </Card>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>风险分布</Text>}
            styles={{ body: { padding: '6px 4px' } }}
          >
            <ReactECharts option={riskDonutOption} style={{ height: 180 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col span={6}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>脑电指标说明</Text>}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { color: '#0052D9', label: '专注度 (Attention)', desc: '反映作业人员的注意力集中程度。分值越高表示注意力越集中，低于40分表示存在严重注意力涣散风险。' },
                { color: '#E37318', label: '疲劳度 (Fatigue)', desc: '反映作业人员的疲劳程度。分值越高表示越疲劳，高于60分表示严重疲劳，建议立即休息。' },
                { color: '#2BA471', label: '困倦指数 (Drowsiness)', desc: '反映作业人员的困倦程度。通过脑电θ波与α波比值计算，高于60分表示严重困倦状态。' },
                { color: '#14C9C9', label: '信号质量 (Signal Quality)', desc: 'EEG信号采集质量。低于70%可能影响分析准确性，需检查电极接触或设备状态。' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: 2, background: item.color,
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    <Text strong style={{ fontSize: 12 }}>{item.label}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.65, paddingLeft: 15, display: 'block' }}>
                    {item.desc}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            title={<Text strong style={{ fontSize: 14 }}>风险判断依据</Text>}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={riskColumns}
              dataSource={riskJudgment.map((r, i) => ({ ...r, key: String(i) }))}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card
            title={
              <Space>
                <Text strong style={{ fontSize: 14 }}>告警记录 (最新)</Text>
                <Badge count={4} size="small" style={{ backgroundColor: '#D54941' }} />
              </Space>
            }
            extra={<a style={{ fontSize: 12 }}>查看全部</a>}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={alarmColumns}
              dataSource={alarmRecords.map((r, i) => ({ ...r, key: String(i) }))}
              pagination={false}
              size="small"
              showHeader={true}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="导出报告"
        open={exportModalVisible}
        onOk={handleExport}
        onCancel={() => setExportModalVisible(false)}
        okText="确认导出"
        cancelText="取消"
        confirmLoading={exportInProgress.current}
        width={480}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13 }}>导出内容</Text>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text style={{ fontSize: 12 }}><CheckCircleOutlined style={{ color: '#2BA471', marginRight: 6 }} />实时监测数据汇总</Text>
              <Text style={{ fontSize: 12 }}><CheckCircleOutlined style={{ color: '#2BA471', marginRight: 6 }} />异常告警记录 (4条)</Text>
              <Text style={{ fontSize: 12 }}><CheckCircleOutlined style={{ color: '#2BA471', marginRight: 6 }} />脑电指标趋势图</Text>
              <Text style={{ fontSize: 12 }}><CheckCircleOutlined style={{ color: '#2BA471', marginRight: 6 }} />风险分布统计数据</Text>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13 }}>导出格式</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={8}>
                <Button type="primary" size="small">PDF 报告</Button>
                <Button size="small">Excel 数据</Button>
                <Button size="small">CSV 文件</Button>
              </Space>
            </div>
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>时间范围</Text>
            <div style={{ marginTop: 8 }}>
              <DatePicker.RangePicker
                size="small"
                defaultValue={[dayjs('2025-05-20'), dayjs('2025-05-20')]}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
