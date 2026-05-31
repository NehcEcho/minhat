import { useState, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Space, Typography, Select, Input, DatePicker,
  Progress, Tooltip, Tabs, Segmented, Badge,
} from 'antd';
import {
  CarryOutOutlined, CheckCircleOutlined, PlayCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, EnvironmentOutlined,
  SearchOutlined, ReloadOutlined, PlusOutlined, CaretUpOutlined, CaretDownOutlined,
  ZoomInOutlined, ZoomOutOutlined, AimOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FilterOutlined, DownloadOutlined, ExportOutlined, EyeOutlined, NodeIndexOutlined,
  EditOutlined, BellOutlined, ThunderboltOutlined, FireOutlined, WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import TunnelMapSvg from '../components/TunnelMapSvg';

const { Text, Title } = Typography;

/* =========================================================================
   CSS INJECTION — follow Dashboard pattern
   ========================================================================= */
const InspectionCSS = `
.insp-root { display: flex; flex-direction: column; gap: 10px; }

/* KPI Cards */
.insp-kpi-row { margin-bottom: 0; }
.insp-kpi-card { border-radius: 8px; transition: all 0.2s; cursor: pointer; border: 1px solid transparent; }
.insp-kpi-card:hover { border-color: #0052D9; box-shadow: 0 2px 12px rgba(0,82,217,0.08); transform: translateY(-1px); }
.insp-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.insp-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.insp-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.insp-kpi-body { flex: 1; min-width: 0; }
.insp-kpi-label { font-size: 11px; color: #86909C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.insp-kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; }
.insp-kpi-sub { font-size: 11px; }
.insp-kpi-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; }
.insp-kpi-sparkline { margin-top: 4px; height: 32px; }

/* Map */
.insp-map-card .ant-card-body { padding: 0; }
.insp-map-wrapper { height: 300px; position: relative; overflow: hidden; background: #f0f5f0; border-radius: 0 0 8px 8px; }
.insp-map-zoom { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
.insp-map-zoom-btn { width: 28px; height: 28px; border-radius: 6px;
  background: rgba(255,255,255,0.92); border: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #6b7280; font-size: 12px;
  backdrop-filter: blur(4px); transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.insp-map-zoom-btn:hover { color: #0052D9; border-color: #0052D9; }
.insp-map-legend { position: absolute; bottom: 8px; right: 8px;
  display: flex; gap: 10px; background: rgba(255,255,255,0.92);
  padding: 4px 10px; border-radius: 4px; font-size: 10px; z-index: 10;
  backdrop-filter: blur(4px); }
.insp-map-legend-item { display: inline-flex; align-items: center; gap: 3px; }
.insp-map-legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.insp-map-zoom-level { position: absolute; bottom: 8px; left: 8px;
  background: rgba(0,0,0,0.45); color: #fff; font-size: 9px;
  padding: 2px 6px; border-radius: 3px; z-index: 10; }

/* Route progress */
.insp-route-card .ant-card-body { padding: 10px 16px; }

/* Charts */
.insp-chart-card .ant-card-body { padding: 4px 6px; }

/* Table */
.insp-table-card .ant-card-body { padding: 0; }
.insp-table-tabs { padding: 0 16px; }
.insp-table-tabs .ant-tabs-nav { margin-bottom: 4px; }

/* Reminders */
.insp-reminder-card .ant-card-body { padding: 10px 14px; }
.insp-reminder-item { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0;
  border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.15s; }
.insp-reminder-item:hover { background: #fafafa; margin: 0 -14px; padding: 7px 14px; }
.insp-reminder-item:last-child { border-bottom: none; }
.insp-reminder-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

/* Animated counter */
@keyframes insp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes insp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes insp-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes insp-pin-drop { 0% { transform: translateY(-20px) scale(0); opacity: 0; }
                           60% { transform: translateY(2px) scale(1.1); opacity: 1; }
                           100% { transform: translateY(0) scale(1); opacity: 1; } }
.insp-anim-pin { animation: insp-pin-drop 0.4s ease-out forwards; }
`;

/* =========================================================================
   DATA
   ========================================================================= */

interface StatCardDef {
  key: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
  sparkline: number[];
}

const statCards: StatCardDef[] = [
  {
    key: 'total', label: '任务总数', value: '28',
    icon: <CarryOutOutlined />, bg: '#E8F3FF', color: '#0052D9',
    trend: '较昨日 ↑ 12.5%', trendUp: true,
    sparkline: [20, 22, 23, 24, 26, 27, 28],
  },
  {
    key: 'completed', label: '已完成', value: '18',
    icon: <CheckCircleOutlined />, bg: '#E8F8F2', color: '#2BA471',
    sub: '完成率 64.3%',
    sparkline: [10, 12, 13, 14, 15, 17, 18],
  },
  {
    key: 'inProgress', label: '进行中', value: '7',
    icon: <PlayCircleOutlined />, bg: '#E8F3FF', color: '#0052D9',
    sub: '占比 25.0%',
    sparkline: [5, 6, 6, 7, 7, 8, 7],
  },
  {
    key: 'notStarted', label: '未开始', value: '3',
    icon: <ClockCircleOutlined />, bg: '#F2F3F5', color: '#86909C',
    sub: '占比 10.7%',
    sparkline: [6, 5, 5, 4, 4, 3, 3],
  },
  {
    key: 'abnormal', label: '异常任务', value: '2',
    icon: <ExclamationCircleOutlined />, bg: '#FDECEE', color: '#D54941',
    trend: '较昨日 ↓ 16.7%', trendUp: false,
    sparkline: [4, 3, 3, 2, 3, 2, 2],
  },
  {
    key: 'points', label: '巡检点位', value: '156',
    icon: <EnvironmentOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    sub: '在线 142 / 离线 14',
    sparkline: [140, 142, 145, 148, 150, 153, 156],
  },
];

const routeProgress = [
  { name: '主运输巷巡检路线', pct: 80, done: 4, total: 5, color: '#0052D9', status: 'inProgress' },
  { name: '回风巷巡检路线', pct: 60, done: 3, total: 5, color: '#2BA471', status: 'inProgress' },
  { name: '中央变电所巡检路线', pct: 100, done: 5, total: 5, color: '#2BA471', status: 'completed' },
  { name: '水泵房巡检路线', pct: 40, done: 2, total: 5, color: '#2BA471', status: 'inProgress' },
  { name: '提升机房巡检路线', pct: 60, done: 3, total: 5, color: '#2BA471', status: 'inProgress' },
  { name: '压缩空气站巡检路线', pct: 100, done: 4, total: 4, color: '#2BA471', status: 'completed' },
  { name: '避难硐室巡检路线', pct: 25, done: 1, total: 4, color: '#E37318', status: 'attention' },
  { name: '消防设施巡检路线', pct: 100, done: 3, total: 3, color: '#2BA471', status: 'completed' },
];

interface TaskRow {
  key: string;
  id: string;
  name: string;
  route: string;
  shift: string;
  time: string;
  status: string;
  executor: string;
  progress: number;
  abnormal: string;
  routeKey: string;
}

const allTaskData: TaskRow[] = [
  { key: '1', id: 'XJRW-20250520-001', name: '主运输巷日常巡检', route: '主运输巷巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '进行中', executor: '张三', progress: 80, abnormal: '', routeKey: 'main' },
  { key: '2', id: 'XJRW-20250520-002', name: '回风巷瓦斯巡检', route: '回风巷巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '进行中', executor: '李四', progress: 60, abnormal: '', routeKey: 'returnAir' },
  { key: '3', id: 'XJRW-20250520-003', name: '变电所设备巡检', route: '中央变电所巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '王五', progress: 100, abnormal: '', routeKey: 'substation' },
  { key: '4', id: 'XJRW-20250520-004', name: '水泵房设备巡检', route: '水泵房巡检路线', shift: '中班', time: '05-20 12:00~16:00', status: '未开始', executor: '—', progress: 0, abnormal: '', routeKey: 'pump' },
  { key: '5', id: 'XJRW-20250520-005', name: '提升机房巡检', route: '提升机房巡检路线', shift: '中班', time: '05-20 12:00~16:00', status: '异常', executor: '赵六', progress: 20, abnormal: '发现温度异常', routeKey: 'hoist' },
  { key: '6', id: 'XJRW-20250520-006', name: '采区综合巡检', route: '采区综合巡检路线', shift: '夜班', time: '05-20 20:00~24:00', status: '未开始', executor: '—', progress: 0, abnormal: '', routeKey: 'mining' },
  { key: '7', id: 'XJRW-20250520-007', name: '通风系统巡检', route: '通风系统巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '钱七', progress: 100, abnormal: '', routeKey: 'ventilation' },
  { key: '8', id: 'XJRW-20250520-008', name: '排水系统巡检', route: '排水系统巡检路线', shift: '中班', time: '05-20 14:00~18:00', status: '进行中', executor: '孙八', progress: 55, abnormal: '', routeKey: 'drainage' },
  { key: '9', id: 'XJRW-20250520-009', name: '供电系统巡检', route: '供电系统巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '周九', progress: 100, abnormal: '', routeKey: 'power' },
  { key: '10', id: 'XJRW-20250520-010', name: '运输系统巡检', route: '运输系统巡检路线', shift: '夜班', time: '05-20 20:00~24:00', status: '未开始', executor: '—', progress: 0, abnormal: '', routeKey: 'transport' },
  { key: '11', id: 'XJRW-20250520-011', name: '压缩空气站巡检', route: '压缩空气站巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '吴十', progress: 100, abnormal: '', routeKey: 'compAir' },
  { key: '12', id: 'XJRW-20250520-012', name: '避难硐室巡检', route: '避难硐室巡检路线', shift: '中班', time: '05-20 14:00~18:00', status: '进行中', executor: '郑十一', progress: 35, abnormal: '', routeKey: 'refuge' },
  { key: '13', id: 'XJRW-20250520-013', name: '消防设施巡检', route: '消防设施巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '冯十二', progress: 100, abnormal: '', routeKey: 'fire' },
  { key: '14', id: 'XJRW-20250520-014', name: '通信线路巡检', route: '通信线路巡检路线', shift: '夜班', time: '05-20 20:00~24:00', status: '未开始', executor: '—', progress: 0, abnormal: '', routeKey: 'comm' },
  { key: '15', id: 'XJRW-20250520-015', name: '地面设施巡检', route: '地面设施巡检路线', shift: '白班', time: '05-20 08:00~12:00', status: '已完成', executor: '褚十三', progress: 100, abnormal: '', routeKey: 'surface' },
  { key: '16', id: 'XJRW-20250520-016', name: '监测监控系统巡检', route: '监测监控系统路线', shift: '中班', time: '05-20 14:00~18:00', status: '进行中', executor: '卫十四', progress: 45, abnormal: '', routeKey: 'monitor' },
  { key: '17', id: 'XJRW-20250520-017', name: '应急物资巡检', route: '应急物资巡检路线', shift: '夜班', time: '05-20 20:00~24:00', status: '未开始', executor: '—', progress: 0, abnormal: '', routeKey: 'emergency' },
];

interface ReminderItem {
  severity: 'high' | 'medium' | 'low' | 'info';
  color: string;
  icon: React.ReactNode;
  text: string;
  time: string;
  desc: string;
}

const reminders: ReminderItem[] = [
  { severity: 'high', color: '#D54941', icon: <ThunderboltOutlined />, text: '水泵房巡检任务异常', time: '10:25', desc: '设备振动幅值超出阈值 2.3 倍' },
  { severity: 'medium', color: '#E37318', icon: <WarningOutlined />, text: '回风巷巡检点位离线', time: '09:48', desc: 'MKH-1003 点位连续 3 次无响应' },
  { severity: 'medium', color: '#E37318', icon: <WarningOutlined />, text: '提升机房巡检进度滞后', time: '09:12', desc: '计划完成 60%, 实际仅 20%' },
  { severity: 'high', color: '#D54941', icon: <FireOutlined />, text: '主运输巷瓦斯浓度超标', time: '08:55', desc: 'CH₄ 浓度 1.2%, 超过 1.0% 阈值' },
  { severity: 'medium', color: '#E37318', icon: <WarningOutlined />, text: '中央变电所温度偏高', time: '08:23', desc: '变压器温度 78°C, 接近 80°C 警戒值' },
  { severity: 'low', color: '#0052D9', icon: <InfoCircleOutlined />, text: '避难硐室巡检即将到期', time: '08:05', desc: '距截止时间不足 1 小时' },
  { severity: 'info', color: '#86909C', icon: <BellOutlined />, text: '白班巡检任务已全部下发', time: '07:30', desc: '共下发 8 项巡检任务, 5 人已接收' },
];

const statusTagMap: Record<string, { color: string; label: string }> = {
  '进行中': { color: 'blue', label: '进行中' },
  '已完成': { color: 'green', label: '已完成' },
  '未开始': { color: 'default', label: '未开始' },
  '异常': { color: 'red', label: '异常' },
};

const tableTabs = [
  { key: '全部', label: '全部 17' },
  { key: '进行中', label: '进行中 7' },
  { key: '已完成', label: '已完成 6' },
  { key: '未开始', label: '未开始 5' },
  { key: '异常', label: '异常 1' },
];

/* =========================================================================
   SVGs
   ========================================================================= */

/** Render an inspection marker pin at given SVG coordinates */
function InspPin({ x, y, color, label, delay = 0 }: { x: number; y: number; color: string; label: string; delay?: number }) {
  return (
    <g className="insp-anim-pin" style={{ animationDelay: `${delay}s` }}>
      <path
        d={`M ${x},${y - 15} Q ${x + 5},${y - 2} ${x + 3},${y + 6} L ${x},${y + 12} L ${x - 3},${y + 6} Q ${x - 5},${y - 2} ${x},${y - 15} Z`}
        fill={color}
        stroke="#fff"
        strokeWidth={0.8}
      />
      <circle cx={x} cy={y - 10} r={3.5} fill="white" />
      <text x={x} y={y - 7.5} fontSize={6} fill={color} textAnchor="middle" fontWeight="bold">{label}</text>
      <text x={x} y={y + 22} fontSize={7} fill="#4E5969" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  );
}

/* =========================================================================
   COMPONENT
   ========================================================================= */

const routeKeyMap: Record<string, string> = {
  '主运输巷巡检路线': 'main',
  '回风巷巡检路线': 'returnAir',
  '中央变电所巡检路线': 'substation',
  '水泵房巡检路线': 'pump',
  '提升机房巡检路线': 'hoist',
  '采区综合巡检路线': 'mining',
  '通风系统巡检路线': 'ventilation',
  '排水系统巡检路线': 'drainage',
  '供电系统巡检路线': 'power',
  '运输系统巡检路线': 'transport',
  '压缩空气站巡检路线': 'compAir',
  '避难硐室巡检路线': 'refuge',
  '消防设施巡检路线': 'fire',
  '通信线路巡检路线': 'comm',
  '地面设施巡检路线': 'surface',
  '监测监控系统路线': 'monitor',
  '应急物资巡检路线': 'emergency',
};

const routeKeyForName = (name: string) => routeKeyMap[name] || name;

export default function InspectionTasks() {
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [tableFilter, setTableFilter] = useState('全部');
  const [mapZoom, setMapZoom] = useState(100);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [trendRange, setTrendRange] = useState('近7天');
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  /* ---- Derived state ---- */
  const filteredTasks = useMemo(() => {
    if (tableFilter === '全部') return allTaskData;
    return allTaskData.filter((t) => t.status === tableFilter);
  }, [tableFilter]);

  /* ---- Map zoom handlers ---- */
  const handleZoomIn = useCallback(() => setMapZoom((z) => Math.min(z + 15, 200)), []);
  const handleZoomOut = useCallback(() => setMapZoom((z) => Math.max(z - 15, 50)), []);
  const handleZoomReset = useCallback(() => setMapZoom(100), []);

  /* ---- Sparkline helper ---- */
  const getSparklineOption = useCallback((data: number[], color: string) => {
    const mn = Math.min(...data);
    const mx = Math.max(...data);
    const padding = (mx - mn) * 0.3 || 1;
    return {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
      yAxis: { show: false, type: 'value', min: mn - padding, max: mx + padding },
      series: [{
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        animation: true,
        animationDuration: 1200,
        animationEasing: 'cubicOut' as const,
        lineStyle: { color, width: 1.8 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}24` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
      }],
    };
  }, []);

  /* ---- Chart options ---- */
  const trendOption = useMemo(() => {
    const days = trendRange === '近7天'
      ? ['05-14', '05-15', '05-16', '05-17', '05-18', '05-19', '05-20']
      : ['04-21', '04-24', '04-27', '04-30', '05-03', '05-06', '05-09', '05-12', '05-15', '05-18', '05-20'];
    const totalData = trendRange === '近7天'
      ? [22, 24, 26, 27, 25, 28, 28]
      : [18, 20, 21, 22, 23, 24, 24, 25, 26, 27, 28];
    const compData = trendRange === '近7天'
      ? [14, 15, 16, 17, 16, 18, 18]
      : [11, 13, 13, 14, 15, 15, 16, 17, 17, 18, 18];
    const abnData = trendRange === '近7天'
      ? [3, 4, 3, 3, 2, 2, 2]
      : [2, 3, 2, 3, 2, 2, 1, 1, 2, 1, 2];
    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E6EB',
        textStyle: { fontSize: 11, color: '#1D2129' },
        axisPointer: { type: 'cross' as const, crossStyle: { color: '#86909C' } },
      },
      grid: { left: 40, right: 20, top: 15, bottom: 28 },
      xAxis: {
        type: 'category' as const,
        data: days,
        axisLabel: { fontSize: 10, color: '#86909C' },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        min: 0,
        max: 40,
        interval: 10,
        axisLabel: { fontSize: 10, color: '#86909C' },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
      },
      legend: {
        bottom: 0,
        textStyle: { fontSize: 10 },
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      series: [
        {
          name: '任务总数', type: 'line' as const, data: totalData,
          smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#0052D9', width: 2.5 },
          itemStyle: { color: '#0052D9' },
          emphasis: { scale: 1.5 },
        },
        {
          name: '已完成', type: 'line' as const, data: compData,
          smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#2BA471', width: 2.5 },
          itemStyle: { color: '#2BA471' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(43,164,113,0.12)' },
                { offset: 1, color: 'rgba(43,164,113,0)' },
              ],
            },
          },
        },
        {
          name: '异常', type: 'line' as const, data: abnData,
          smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#D54941', width: 2.5, type: 'dashed' },
          itemStyle: { color: '#D54941' },
        },
      ],
    };
  }, [trendRange]);

  const anomalyDonutOption = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} 条 ({d}%)',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E5E6EB',
      textStyle: { fontSize: 11 },
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10, color: '#86909C' },
      itemWidth: 10,
      itemHeight: 8,
    },
    series: [{
      type: 'pie' as const,
      radius: ['52%', '74%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scaleSize: 8, label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      itemStyle: { borderColor: '#fff', borderWidth: 2.5 },
      data: [
        { value: 5, name: '设备异常', itemStyle: { color: '#D54941' } },
        { value: 4, name: '环境异常', itemStyle: { color: '#E37318' } },
        { value: 2, name: '安全隐患', itemStyle: { color: '#FAC858' } },
        { value: 1, name: '其他', itemStyle: { color: '#0052D9' } },
      ],
    }],
    graphic: [
      { type: 'text' as const, left: 'center', top: '34%', style: { text: '12', textAlign: 'center', fill: '#1D2129', fontSize: 22, fontWeight: 'bold' } },
      { type: 'text' as const, left: 'center', top: '48%', style: { text: '异常总数', textAlign: 'center', fill: '#86909C', fontSize: 10 } },
    ],
  }), []);

  const complianceGaugeOption = useMemo(() => ({
    series: [{
      type: 'gauge' as const,
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      center: ['50%', '58%'],
      radius: '85%',
      progress: { show: true, width: 12, itemStyle: { color: '#0052D9' } },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[0.55, '#D54941'], [0.8, '#E37318'], [0.9, '#2BA471'], [1, '#2BA471']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: true, length: '55%', width: 4, itemStyle: { color: '#0052D9' } },
      detail: {
        valueAnimation: true,
        animationDuration: 1500,
        animationEasing: 'cubicInOut',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1D2129',
        offsetCenter: [0, '65%'],
        formatter: '{value}%',
      },
      title: { offsetCenter: [0, '88%'], fontSize: 11, color: '#86909C' },
      data: [{ value: 92.6, name: '合规率' }],
    }],
  }), []);

  /* ---- Table columns ---- */
  const taskColumns = useMemo(() => [
    {
      title: '任务编号', dataIndex: 'id', key: 'id', width: 150,
      render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }} copyable={{ text: v, tooltips: false }}>{v}</Text>,
    },
    {
      title: '任务名称', dataIndex: 'name', key: 'name', width: 140,
      render: (v: string, record: TaskRow) => (
        <Tooltip title={`路线: ${record.route} | 执行人: ${record.executor}`}>
          <Text style={{ fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{v}</Text>
        </Tooltip>
      ),
    },
    {
      title: '巡检路线', dataIndex: 'route', key: 'route', width: 130,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '执行班次', dataIndex: 'shift', key: 'shift', width: 70,
      render: (v: string) => {
        const c: Record<string, string> = { '白班': '#0052D9', '中班': '#E37318', '夜班': '#7B61FF' };
        return <Tag color={c[v] || 'default'} style={{ margin: 0, fontSize: 10 }}>{v}</Tag>;
      },
    },
    {
      title: '计划时间', dataIndex: 'time', key: 'time', width: 125,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const m = statusTagMap[s] || { color: 'default', label: s };
        return (
          <Tag color={m.color} style={{ margin: 0, fontSize: 10 }}>
            {s === '进行中' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#0052D9', marginRight: 4, animation: 'insp-pulse 1.5s infinite' }} />}
            {s}
          </Tag>
        );
      },
    },
    {
      title: '执行人', dataIndex: 'executor', key: 'executor', width: 70,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '完成进度', dataIndex: 'progress', key: 'progress', width: 105,
      render: (v: number) => {
        const sc = v >= 100 ? '#2BA471' : v > 50 ? '#0052D9' : v > 0 ? '#E37318' : '#C9CDD4';
        return (
          <Space size={4}>
            <Progress
              percent={v}
              size="small"
              style={{ width: 65, margin: 0 }}
              strokeColor={{ from: sc, to: sc }}
              showInfo={false}
            />
            <Text style={{ fontSize: 10, fontWeight: 500, minWidth: 28, textAlign: 'right' }}>{v}%</Text>
          </Space>
        );
      },
    },
    {
      title: '异常情况', dataIndex: 'abnormal', key: 'abnormal', width: 110,
      render: (v: string) => v
        ? <Tooltip title={v}><Text style={{ fontSize: 11, color: '#D54941', fontWeight: 500 }}><WarningOutlined style={{ marginRight: 2 }} />{v}</Text></Tooltip>
        : <Text style={{ fontSize: 11, color: '#C9CDD4' }}>—</Text>,
    },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 150,
      render: (_: unknown, record: TaskRow) => (
        <Space size={[8, 4]} wrap>
          <a style={{ fontSize: 11 }} onClick={() => setSelectedRoute(record.routeKey)}><EyeOutlined /> 详情</a>
          <a style={{ fontSize: 11 }}><NodeIndexOutlined style={{ fontSize: 10 }} /> 轨迹</a>
          <a style={{ fontSize: 11 }}><EditOutlined style={{ fontSize: 10 }} /> 记录</a>
        </Space>
      ),
    },
  ], []);

  return (
    <>
      <style>{InspectionCSS}</style>

      <div className="insp-root">

        {/* ============================================================
            HEADER + FILTER BAR
            ============================================================ */}
        <Card bodyStyle={{ padding: '12px 20px' }} style={{ marginBottom: 0 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={12}>
                <Title level={5} style={{ margin: 0 }}>巡检任务</Title>
                <Segmented
                  size="small"
                  options={[
                    { label: '列表视图', value: 'list' },
                    { label: '地图视图', value: 'map' },
                  ]}
                />
                <Badge count={3} size="small" offset={[6, -4]}>
                  <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>运行中</Tag>
                </Badge>
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <Button type="text" size="small" icon={filtersExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />} onClick={() => setFiltersExpanded(!filtersExpanded)}>
                  {filtersExpanded ? '收起筛选' : '展开筛选'}
                </Button>
                <Button size="small" icon={<DownloadOutlined />} style={{}}>导出</Button>
                <Button size="small" icon={<ReloadOutlined />}>重置</Button>
                <Button type="primary" size="small" icon={<PlusOutlined />}>新建任务</Button>
              </Space>
            </Col>
          </Row>
          {filtersExpanded && (
            <div style={{ marginTop: 12 }}>
              <Space size={8} wrap>
                <DatePicker
                  size="small"
                  defaultValue={dayjs('2025-05-20')}
                  style={{ width: 140 }}
                  placeholder="选择日期"
                  picker="date"
                />
                <Select size="small" defaultValue="全部班次" style={{ width: 110 }}
                  options={[
                    { value: '全部班次', label: '全部班次' },
                    { value: '白班', label: '白班 (08:00-16:00)' },
                    { value: '中班', label: '中班 (16:00-24:00)' },
                    { value: '夜班', label: '夜班 (00:00-08:00)' },
                  ]}
                />
                <Select size="small" defaultValue="全部区域" style={{ width: 110 }}
                  options={[
                    { value: '全部区域', label: '全部区域' },
                    { value: '一采区', label: '一采区' },
                    { value: '二采区', label: '二采区' },
                    { value: '运输区', label: '运输区' },
                    { value: '通风区', label: '通风区' },
                  ]}
                />
                <Select size="small" defaultValue="全部巡检路线" style={{ width: 130 }}
                  options={[
                    { value: '全部巡检路线', label: '全部巡检路线' },
                    { value: '主运输巷', label: '主运输巷' },
                    { value: '回风巷', label: '回风巷' },
                    { value: '中央变电所', label: '中央变电所' },
                    { value: '水泵房', label: '水泵房' },
                  ]}
                />
                <Select size="small" defaultValue="全部状态" style={{ width: 110 }}
                  options={[
                    { value: '全部状态', label: '全部状态' },
                    { value: '进行中', label: '进行中' },
                    { value: '已完成', label: '已完成' },
                    { value: '未开始', label: '未开始' },
                    { value: '异常', label: '异常' },
                  ]}
                />
                <Input
                  size="small"
                  placeholder="请输入任务名称/编号"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  allowClear
                  suffix={<FilterOutlined style={{ color: '#86909C' }} />}
                />
              </Space>
            </div>
          )}
        </Card>

        {/* ============================================================
            6 KPI CARDS
            ============================================================ */}
        <Row gutter={[10, 10]} className="insp-kpi-row">
          {statCards.map((card) => (
            <Col span={4} key={card.key}>
              <Card
                className="insp-kpi-card"
                bodyStyle={{ padding: '10px 14px 6px' }}
                onMouseEnter={() => setHoveredKpi(card.key)}
                onMouseLeave={() => setHoveredKpi(null)}
                style={{
                  borderColor: hoveredKpi === card.key ? '#0052D9' : 'transparent',
                  transform: hoveredKpi === card.key ? 'translateY(-2px)' : undefined,
                  transition: 'all 0.2s',
                }}
              >
                <div className="insp-kpi-inner">
                  <div className="insp-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="insp-kpi-body">
                    <div className="insp-kpi-label">{card.label}</div>
                    <div className="insp-kpi-value" style={{
                      color: card.key === 'abnormal' ? '#D54941' : '#1D2129',
                    }}>
                      {card.value}
                      {card.key === 'points' && <span style={{ fontSize: 13, fontWeight: 400, color: '#86909C' }}> 个</span>}
                    </div>
                    <div className="insp-kpi-sub">
                      {card.trend && (
                        <span className="insp-kpi-trend" style={{ color: card.trendUp ? '#D54941' : '#2BA471' }}>
                          {card.trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          {card.trend}
                        </span>
                      )}
                      {card.sub && <span style={{ color: '#86909C' }}>{card.sub}</span>}
                    </div>
                  </div>
                </div>
                <div className="insp-kpi-sparkline">
                  <ReactECharts
                    option={getSparklineOption(card.sparkline, card.color)}
                    style={{ height: 32 }}
                    notMerge
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ============================================================
            MIDDLE ROW: Routes + Map + Charts
            ============================================================ */}
        <Row gutter={[10, 10]}>
          {/* LEFT: Route Status */}
          <Col span={6}>
            <Card
              className="insp-route-card"
              title={
                <Space>
                  <Text strong style={{ fontSize: 14 }}>巡检路线状态</Text>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>8 条路线</Tag>
                </Space>
              }
              bodyStyle={{ padding: '10px 14px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 280, overflowY: 'auto' }}>
                {routeProgress.map((route) => (
                  <div
                    key={route.name}
                    onClick={() => setSelectedRoute(routeKeyForName(route.name))}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 4,
                      background: selectedRoute === routeKeyForName(route.name)
                        ? 'rgba(0,82,217,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space size={4}>
                        <span style={{
                          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                          background: route.status === 'completed' ? '#2BA471' : route.status === 'attention' ? '#D54941' : '#0052D9',
                        }} />
                        <Text style={{ fontSize: 12 }}>{route.name}</Text>
                      </Space>
                      <Text style={{ fontSize: 11, color: '#86909C' }}>
                        今日完成 <Text strong style={{ color: '#1D2129', fontSize: 11 }}>{route.done}</Text> / {route.total}
                      </Text>
                    </div>
                    <Progress
                      percent={route.pct}
                      strokeColor={{
                        '0%': route.color,
                        '100%': route.status === 'completed' ? '#2BA471' : route.color,
                      }}
                      showInfo={true}
                      size="small"
                      format={(pct) => `${pct}%`}
                      trailColor="#F2F3F5"
                    />
                  </div>
                ))}
              </div>
              <div style={{
                display: 'flex', gap: 16, paddingTop: 10, marginTop: 8,
                borderTop: '1px solid #F2F3F5', flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {[
                  { color: '#2BA471', label: '已完成' },
                  { color: '#0052D9', label: '进行中' },
                  { color: '#C9CDD4', label: '未开始' },
                  { color: '#D54941', label: '异常' },
                ].map((l) => (
                  <Space size={4} key={l.label}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                    <Text style={{ fontSize: 10 }}>{l.label}</Text>
                  </Space>
                ))}
              </div>
            </Card>
          </Col>

          {/* CENTER: Map */}
          <Col span={12}>
            <Card
              className="insp-map-card"
              title={
                <Space>
                  <Text strong style={{ fontSize: 14 }}>巡检任务分布</Text>
                  <Select
                    size="small"
                    defaultValue="all"
                    style={{ width: 100 }}
                    options={[
                      { value: 'all', label: '全部类型' },
                      { value: '正常', label: '正常点位' },
                      { value: '异常', label: '异常点位' },
                    ]}
                  />
                </Space>
              }
              extra={
                <Space size={4}>
                  <Tooltip title="全屏">
                    <Button size="small" icon={<ExportOutlined />} />
                  </Tooltip>
                </Space>
              }
              bodyStyle={{ padding: 0 }}
            >
              <div className="insp-map-wrapper">
                <div style={{
                  transform: `scale(${mapZoom / 100})`,
                  transformOrigin: 'top left',
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.25s ease',
                }}>
                  <TunnelMapSvg width="100%" height="320" />
                </div>

                {/* Zoom Controls */}
                <div className="insp-map-zoom">
                  {[
                    { icon: <ZoomInOutlined />, action: handleZoomIn, tip: '放大' },
                    { icon: <ZoomOutOutlined />, action: handleZoomOut, tip: '缩小' },
                    { icon: <AimOutlined />, action: handleZoomReset, tip: '复位' },
                  ].map((btn, i) => (
                    <Tooltip key={i} title={btn.tip} placement="left">
                      <div className="insp-map-zoom-btn" onClick={btn.action}>
                        {btn.icon}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Zoom level indicator */}
                <div className="insp-map-zoom-level">{mapZoom}%</div>

                {/* Legend */}
                <div className="insp-map-legend">
                  {[
                    { color: '#2BA471', label: '已完成' },
                    { color: '#0052D9', label: '进行中' },
                    { color: '#C9CDD4', label: '未开始' },
                    { color: '#D54941', label: '异常' },
                  ].map((l) => (
                    <span className="insp-map-legend-item" key={l.label}>
                      <span className="insp-map-legend-dot" style={{ background: l.color }} />
                      <span>{l.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </Col>

          {/* RIGHT: 2 charts vertically stacked */}
          <Col span={6}>
            <Row gutter={[0, 10]}>
              <Col span={24}>
                <Card
                  className="insp-chart-card"
                  title={<Text strong style={{ fontSize: 13 }}>巡检任务趋势</Text>}
                  extra={
                    <Select
                      size="small"
                      value={trendRange}
                      onChange={setTrendRange}
                      style={{ width: 80 }}
                      options={[
                        { value: '近7天', label: '近7天' },
                        { value: '近30天', label: '近30天' },
                      ]}
                    />
                  }
                  bodyStyle={{ padding: '4px 4px' }}
                >
                  <ReactECharts option={trendOption} style={{ height: 165 }} />
                </Card>
              </Col>
              <Col span={24}>
                <Card
                  className="insp-chart-card"
                  title={
                    <Space size={6}>
                      <Text strong style={{ fontSize: 13 }}>巡检异常统计</Text>
                      <Tooltip title="近7天异常分布统计">
                        <InfoCircleOutlined style={{ fontSize: 11, color: '#86909C' }} />
                      </Tooltip>
                    </Space>
                  }
                  bodyStyle={{ padding: '4px 4px' }}
                >
                  <ReactECharts option={anomalyDonutOption} style={{ height: 165 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Compliance Gauge Row */}
        <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
          <Col span={24}>
            <Card
              className="insp-chart-card"
              title={<Text strong style={{ fontSize: 13 }}>巡检合规率</Text>}
              extra={<Tag color="green" style={{ fontSize: 10, margin: 0 }}>达标</Tag>}
              bodyStyle={{ padding: '4px 4px' }}
            >
              <ReactECharts option={complianceGaugeOption} style={{ height: 170 }} />
            </Card>
          </Col>
        </Row>

        {/* ============================================================
            BOTTOM ROW: Task Table + Reminders
            ============================================================ */}
        <Row gutter={[10, 10]}>
          <Col span={18}>
            <Card
              className="insp-table-card"
              title={
                <Space size={12}>
                  <Text strong style={{ fontSize: 14 }}>巡检任务列表</Text>
                  <Tabs
                    activeKey={tableFilter}
                    onChange={setTableFilter}
                    size="small"
                    className="insp-table-tabs"
                    items={tableTabs}
                  />
                </Space>
              }
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={taskColumns}
                dataSource={filteredTasks}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  pageSizeOptions: ['8', '15', '25'],
                  showTotal: (total: number) => `共 ${total} 条任务`,
                  size: 'small',
                }}
                size="small"
                scroll={{ x: 1100 }}
                rowClassName={(record) => {
                  if (record.status === '异常') return 'insp-row-abnormal';
                  return '';
                }}
                onRow={(record) => ({
                  onClick: () => setSelectedRoute(record.routeKey),
                  style: {
                    cursor: 'pointer',
                    background: selectedRoute === record.routeKey ? 'rgba(0,82,217,0.03)' : undefined,
                  },
                })}
              />
            </Card>
          </Col>

          <Col span={6}>
            <Card
              className="insp-reminder-card"
              title={
                <Space>
                  <BellOutlined style={{ color: '#D54941', fontSize: 14 }} />
                  <Text strong style={{ fontSize: 14 }}>巡检提醒</Text>
                  <Badge count={7} size="small" overflowCount={99} style={{ backgroundColor: '#D54941' }} />
                </Space>
              }
              extra={<a style={{ fontSize: 12 }}>更多 {'>'}</a>}
              bodyStyle={{ padding: '8px 14px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {reminders.map((r, i) => (
                  <div key={i} className="insp-reminder-item">
                    <Tooltip title={r.severity === 'high' ? '高风险' : r.severity === 'medium' ? '中风险' : r.severity === 'low' ? '低风险' : '信息'}>
                      <span className="insp-reminder-dot" style={{ background: r.color }} />
                    </Tooltip>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: r.color }}>{r.icon}</span>
                        <Text style={{ fontSize: 12, fontWeight: 500 }}>{r.text}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 1 }}>{r.desc}</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{r.time}</Text>
                      {r.severity === 'high' && <Tag color="error" style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', margin: 0 }}>紧急</Tag>}
                      {r.severity === 'medium' && <Tag color="warning" style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', margin: 0 }}>关注</Tag>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

      </div>
    </>
  );
}
