import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Tag, Button, Space, Typography, Tabs, Badge, Progress, Divider, Tooltip } from 'antd';
import {
  TeamOutlined, SafetyCertificateOutlined, AlertOutlined,
  WifiOutlined, VideoCameraOutlined, CloudOutlined,
  CaretRightOutlined, PauseCircleOutlined, ExpandOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboardStats } from '../api';
import { useAuthStore } from '../store';
import MineMapSvg from '../components/MineMapSvg';

/* ======================================================================
   CSS CLASSES — injected as <style> tag at top of component render
   ====================================================================== */
const DashboardCSS = `
/* ---------- Global ---------- */
.dsh-root { display: flex; flex-direction: column; gap: 12px; }

/* ---------- KPI Cards ---------- */
.dsh-kpi-row { margin-bottom: 0; }
.dsh-kpi-card { border-radius: 8px; }
.dsh-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.dsh-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.dsh-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.dsh-kpi-body { flex: 1; min-width: 0; }
.dsh-kpi-label { font-size: 11px; color: #86909C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dsh-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.dsh-kpi-sub { font-size: 11px; color: #86909C; }
.dsh-kpi-sparkline { margin-top: 4px; height: 30px; }

/* ---------- Map Section ---------- */
.dsh-map-card { height: 100%; }
.dsh-map-card .ant-card-body { padding: 0; }
.dsh-map-title { font-size: 14px; font-weight: 600; }
.dsh-map-wrapper { height: 310px; position: relative; overflow: hidden; }
.dsh-map-legend { padding: 6px 16px; border-top: 1px solid #F0F0F0;
  display: flex; gap: 14px; align-items: center; flex-wrap: wrap; background: #FAFAFA; }
.dsh-map-legend-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; }
.dsh-map-legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }

/* ---------- Charts Card ---------- */
.dsh-charts-card .ant-card-body { padding: 2px 0; }
.dsh-charts-split { border-right: 1px solid #F0F0F0; }
.dsh-charts-title { padding: 6px 0 0; text-align: center; font-size: 12px; font-weight: 500; color: #1D2129; }
.dsh-chart-wrapper { height: 155px; }

/* ---------- Alarm List ---------- */
.dsh-alarm-card .ant-card-body { padding: 0; }
.dsh-alarm-title { font-size: 13px; font-weight: 600; }
.dsh-alarm-extra { font-size: 12px; }

/* ---------- Track Replay ---------- */
.dsh-track-card .ant-card-body { padding: 10px 12px; }
.dsh-track-title { font-size: 13px; font-weight: 600; }
.dsh-track-map { position: relative; height: 96px; background: #0a1628; border-radius: 6px;
  overflow: hidden; margin-bottom: 8px; }
.dsh-track-grid { position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 14px 14px; }
.dsh-track-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.dsh-track-start-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: #52C41A; box-shadow: 0 0 8px rgba(82,196,26,0.6); }
.dsh-track-end-dot { position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: #0052D9; box-shadow: 0 0 8px rgba(0,82,217,0.6); }
.dsh-track-info { display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: 12px; }
.dsh-track-time { font-size: 11px; color: #86909C; margin-top: 2px; }
.dsh-track-play-btn { position: absolute; bottom: 6px; right: 6px; }

/* ---------- Device Table ---------- */
.dsh-device-card .ant-card-body { padding: 0; }
.dsh-device-title { font-size: 14px; font-weight: 600; }
.dsh-device-tabs { padding: 0 16px; }
.dsh-device-tabs .ant-tabs-nav { margin-bottom: 0; }

/* ---------- Sync Status ---------- */
.dsh-sync-card .ant-card-body { padding: 10px 14px; }
.dsh-sync-title { font-size: 13px; font-weight: 600; }
.dsh-sync-list { display: flex; flex-direction: column; gap: 10px; }
.dsh-sync-row { display: flex; justify-content: space-between; align-items: center; }
.dsh-sync-left { display: flex; align-items: center; gap: 6px; }
.dsh-sync-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.dsh-sync-name { font-size: 13px; }
.dsh-sync-right { display: flex; align-items: center; gap: 6px; }
.dsh-sync-status { font-size: 12px; color: #52C41A; }
.dsh-sync-time { font-size: 11px; color: #86909C; }

/* ---------- Signal Bars ---------- */
.dsh-signal-wrap { display: flex; gap: 2px; align-items: flex-end; }
.dsh-signal-bar { width: 4px; border-radius: 1px; }
.dsh-signal-bar-on { background: #E5E6EB; }

/* ---------- Misc ---------- */
.dsh-section-gap { margin-top: 12px; }
.dsh-card-title { font-size: 14px; font-weight: 600; }
`;

/* ======================================================================
   STATIC DATA
   ====================================================================== */

interface StatCardDef {
  key: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
  value: string;
  sub: string;
}

const statCards: StatCardDef[] = [
  {
    key: 'onlinePersonnel',
    icon: <TeamOutlined />,
    bg: '#E8F3FF', color: '#0052D9',
    label: '在线人员', value: '128', sub: '总人数 210 人',
  },
  {
    key: 'helmetRate',
    icon: <SafetyCertificateOutlined />,
    bg: '#E8F3FF', color: '#0052D9',
    label: '智能帽在线率', value: '92.4%', sub: '在线 193 / 总数 209',
  },
  {
    key: 'todayAlarms',
    icon: <AlertOutlined />,
    bg: '#FDECEE', color: '#F5222D',
    label: '今日报警', value: '23', sub: '未处置 7 起',
  },
  {
    key: 'deviceOnlineRate',
    icon: <WifiOutlined />,
    bg: '#E8F8F2', color: '#52C41A',
    label: '设备在线率', value: '89.7%', sub: '在线 268 / 总数 299',
  },
  {
    key: 'videoOnlineRate',
    icon: <VideoCameraOutlined />,
    bg: '#F2F3FF', color: '#7B61FF',
    label: '视频通道在线率', value: '95.1%', sub: '在线 192 / 总数 202',
  },
  {
    key: 'dataSync',
    icon: <CloudOutlined />,
    bg: '#E8F3FF', color: '#0052D9',
    label: '数据同步状态', value: '正常', sub: '延迟 2 秒',
  },
];

const sparklineDataMap: Record<string, number[]> = {
  onlinePersonnel: [108, 112, 118, 115, 122, 125, 128],
  helmetRate: [88, 89, 90, 91, 91.5, 92, 92.4],
  todayAlarms: [18, 20, 22, 21, 23, 22, 23],
  deviceOnlineRate: [85, 86, 87, 88, 88.5, 89, 89.7],
  videoOnlineRate: [92, 93, 93.5, 94, 94.5, 95, 95.1],
  dataSync: [98, 98.5, 99, 99.2, 99.5, 99.8, 99.9],
};

const sparklineColors: Record<string, string> = {
  onlinePersonnel: '#0052D9',
  helmetRate: '#0052D9',
  todayAlarms: '#F5222D',
  deviceOnlineRate: '#52C41A',
  videoOnlineRate: '#7B61FF',
  dataSync: '#0052D9',
};

function getValueColor(key: string): string {
  if (key === 'todayAlarms') return '#F5222D';
  if (key === 'dataSync') return '#52C41A';
  return '#1D2129';
}

function getSparklineOption(data: number[], color: string) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
    yAxis: { show: false, type: 'value', min: min - 1, max: max + 1 },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      animation: false,
      lineStyle: { color, width: 1.5 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${color}30` },
            { offset: 1, color: `${color}00` },
          ],
        },
      },
    }],
  };
}

const alarmDonutOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { fontSize: 10, color: '#86909C' } },
  series: [{
    type: 'pie',
    radius: ['55%', '75%'],
    center: ['50%', '42%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
    data: [
      { value: 7, name: '未处置', itemStyle: { color: '#F5222D' } },
      { value: 8, name: '处置中', itemStyle: { color: '#0052D9' } },
      { value: 16, name: '已处置', itemStyle: { color: '#52C41A' } },
    ],
  }],
};

const personnelBarOption = {
  grid: { left: 95, right: 20, top: 5, bottom: 5 },
  xAxis: { show: false },
  yAxis: {
    type: 'category',
    data: ['采掘工作面', '主运输巷道', '回风巷道', '主斜井', '中央变电所'],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontSize: 11, color: '#4E5969' },
  },
  series: [
    {
      type: 'bar', data: [32, 28, 23, 18, 12], barWidth: 12,
      itemStyle: { color: '#0052D9', borderRadius: [0, 6, 6, 0] },
      label: {
        show: true, position: 'right', fontSize: 10, color: '#86909C',
        formatter: (p: { value: number; dataIndex: number }) => {
          const totals = [48, 40, 35, 25, 18];
          return `${p.value}/${totals[p.dataIndex]}`;
        },
      },
    },
    {
      type: 'bar', data: [48, 40, 35, 25, 18], barWidth: 12, barGap: '-100%',
      itemStyle: { color: '#E5E6EB', borderRadius: [0, 6, 6, 0] },
      tooltip: { show: false },
    },
  ],
};

/* ---------- Alarm List ---------- */
const alarmListData = [
  { key: 1, level: '高', type: '人员超越电子围栏', location: '采掘工作面A', time: '10:32:15', status: '未处置', statusColor: 'red' },
  { key: 2, level: '高', type: '气体浓度超限 (CH₄)', location: '回风巷道', time: '10:28:04', status: '处置中', statusColor: 'blue' },
  { key: 3, level: '中', type: '设备离线', location: '主运输巷道', time: '10:15:42', status: '已处置', statusColor: 'green' },
  { key: 4, level: '中', type: '人员长时间静止', location: '采掘工作面B', time: '09:58:11', status: '处置中', statusColor: 'blue' },
  { key: 5, level: '低', type: '摄像头遮挡', location: '主斜井', time: '09:42:33', status: '已处置', statusColor: 'green' },
];

const alarmColumns = [
  {
    title: '等级', dataIndex: 'level', key: 'level', width: 50,
    render: (level: string) => {
      const colorMap: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'blue' };
      return <Tag color={colorMap[level] || 'default'} style={{ fontSize: 11, margin: 0 }}>{level}</Tag>;
    },
  },
  { title: '告警内容', dataIndex: 'type', key: 'type', width: 165, ellipsis: true },
  { title: '位置', dataIndex: 'location', key: 'location', width: 100 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 75 },
  {
    title: '状态', dataIndex: 'status', key: 'status', width: 65,
    render: (s: string) => {
      const colorMap: Record<string, string> = { '未处置': 'red', '处置中': 'blue', '已处置': 'green' };
      return <Tag color={colorMap[s] || 'default'} style={{ fontSize: 11, margin: 0 }}>{s}</Tag>;
    },
  },
];

/* ---------- Device Table ---------- */
interface DeviceRow {
  key: number;
  name: string;
  typeCn: string;
  model: string;
  area: string;
  status: string;
  signal: number;
  power: string;
  onlineTime: string;
}

const deviceData: DeviceRow[] = [
  { key: 1, name: '矿帽-MKH-00123', typeCn: '智能矿帽', model: 'MKH-1000', area: '采掘工作面A', status: '在线', signal: 92, power: '78%', onlineTime: '7h32m' },
  { key: 2, name: '矿帽-MKH-00234', typeCn: '智能矿帽', model: 'MKH-1000', area: '主运输巷道', status: '在线', signal: 85, power: '62%', onlineTime: '12h15m' },
  { key: 3, name: '矿帽-MKH-00345', typeCn: '智能矿帽', model: 'MKH-1000', area: '回风巷道', status: '在线', signal: 95, power: '91%', onlineTime: '20h08m' },
  { key: 4, name: '矿帽-MKH-00456', typeCn: '智能矿帽', model: 'MKH-1000', area: '采掘工作面B', status: '离线', signal: 0, power: '电量低', onlineTime: '0h0m' },
  { key: 5, name: '定位基站-LB-200', typeCn: '定位基站', model: 'LB-200', area: '主运输巷道', status: '在线', signal: 88, power: 'POE供电', onlineTime: '10d2h' },
  { key: 6, name: '定位基站-LB-201', typeCn: '定位基站', model: 'LB-200', area: '回风巷道', status: '在线', signal: 90, power: 'POE供电', onlineTime: '12d8h' },
  { key: 7, name: '摄像头-CAM-01', typeCn: '摄像头', model: 'IPC-HF862', area: '采掘工作面A', status: '在线', signal: 78, power: 'POE供电', onlineTime: '15d6h' },
  { key: 8, name: '摄像头-CAM-02', typeCn: '摄像头', model: 'IPC-HF862', area: '主运输巷道', status: '在线', signal: 62, power: 'POE供电', onlineTime: '10d5h' },
  { key: 9, name: '摄像头-CAM-03', typeCn: '摄像头', model: 'IPC-HF862', area: '主斜井', status: '离线', signal: 0, power: 'POE供电', onlineTime: '0h0m' },
  { key: 10, name: '传感器-GS-400', typeCn: '传感器', model: 'GS-400', area: '回风巷道', status: '在线', signal: 82, power: 'AC供电', onlineTime: '22d10h' },
  { key: 11, name: '传感器-GS-401', typeCn: '传感器', model: 'GS-400', area: '采掘工作面B', status: '在线', signal: 74, power: 'AC供电', onlineTime: '18d6h' },
  { key: 12, name: '广播-PA-300', typeCn: '广播', model: 'PA-300', area: '主斜井', status: '在线', signal: 72, power: 'AC供电', onlineTime: '23d18h' },
  { key: 13, name: '广播-PA-301', typeCn: '广播', model: 'PA-300', area: '采掘工作面A', status: '在线', signal: 80, power: 'AC供电', onlineTime: '21d3h' },
  { key: 14, name: '环境监测-EM-100', typeCn: '其他', model: 'EM-100', area: '回风巷道', status: '在线', signal: 68, power: 'AC供电', onlineTime: '25d14h' },
];

function SignalBars({ signal }: { signal: number }) {
  const fill = signal > 75 ? '#52C41A' : signal > 40 ? '#FAAD14' : '#F5222D';
  const active = signal > 0 ? Math.ceil(signal / 25) : 0;
  return (
    <div className="dsh-signal-wrap">
      {[1, 2, 3, 4].map((b) => (
        <div key={b} className="dsh-signal-bar" style={{
          height: b * 5,
          background: b <= active ? fill : '#E5E6EB',
        }} />
      ))}
    </div>
  );
}

const deviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 145, ellipsis: true },
  { title: '类型', dataIndex: 'typeCn', key: 'typeCn', width: 80 },
  { title: '型号', dataIndex: 'model', key: 'model', width: 100 },
  { title: '区域', dataIndex: 'area', key: 'area', width: 115, ellipsis: true },
  {
    title: '状态', dataIndex: 'status', key: 'status', width: 70,
    render: (status: string) => (
      <Badge status={status === '在线' ? 'success' : 'error'} text={<span style={{ fontSize: 12 }}>{status}</span>} />
    ),
  },
  {
    title: '信号', dataIndex: 'signal', key: 'signal', width: 65,
    render: (signal: number) => <SignalBars signal={signal} />,
  },
  {
    title: '电源', dataIndex: 'power', key: 'power', width: 85,
    render: (val: string) => {
      if (val === 'POE供电') return <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>POE</Tag>;
      if (val === 'AC供电') return <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>AC</Tag>;
      if (val.includes('低') || val === '电量低') return <Typography.Text style={{ fontSize: 11, color: '#F5222D' }}>{val}</Typography.Text>;
      return <Typography.Text style={{ fontSize: 12 }}>{val}</Typography.Text>;
    },
  },
  { title: '在线时长', dataIndex: 'onlineTime', key: 'onlineTime', width: 90 },
  {
    title: '操作', dataIndex: 'key', key: 'action', width: 55,
    render: () => <a style={{ fontSize: 12 }}>详情</a>,
  },
];

const deviceTabs = [
  { key: 'all', label: '全部' },
  { key: '智能矿帽', label: '智能矿帽' },
  { key: '定位基站', label: '定位基站' },
  { key: '摄像头', label: '摄像头' },
  { key: '传感器', label: '传感器' },
  { key: '广播', label: '广播' },
  { key: '其他', label: '其他' },
];

/* ---------- Sync Status ---------- */
interface SyncItem {
  name: string;
  status: string;
  time: string;
  color: string;
}

const syncItems: SyncItem[] = [
  { name: '数据同步', status: '正常', time: '2秒', color: '#52C41A' },
  { name: '定位数据', status: '正常', time: '1秒', color: '#52C41A' },
  { name: '告警数据', status: '正常', time: '3秒', color: '#52C41A' },
  { name: '视频数据', status: '正常', time: '2秒', color: '#52C41A' },
  { name: '设备数据', status: '正常', time: '1秒', color: '#52C41A' },
  { name: '基础数据', status: '正常', time: '5秒', color: '#52C41A' },
];

/* ======================================================================
   COMPONENT
   ====================================================================== */
export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [deviceTab, setDeviceTab] = useState('all');
  const { username } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    getDashboardStats()
      .then(() => {})
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredDeviceData = useMemo(() => {
    if (deviceTab === 'all') return deviceData;
    if (deviceTab === '其他') {
      return deviceData.filter(
        (d) => !['智能矿帽', '定位基站', '摄像头', '传感器', '广播'].includes(d.typeCn),
      );
    }
    return deviceData.filter((d) => d.typeCn === deviceTab);
  }, [deviceTab]);

  return (
    <>
      <style>{DashboardCSS}</style>

      <div className="dsh-root">

        {/* ================================================================
            ROW 1 — KPI CARDS (6 cards)
            ================================================================ */}
        <Row gutter={[12, 12]} className="dsh-kpi-row">
          {statCards.map((card) => (
            <Col span={4} key={card.key}>
              <Card loading={loading} className="dsh-kpi-card" styles={{ body: { padding: '10px 14px 6px' } }}>
                <div className="dsh-kpi-inner">
                  <div className="dsh-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="dsh-kpi-body">
                    <div className="dsh-kpi-label">{card.label}</div>
                    <div className="dsh-kpi-value" style={{ color: getValueColor(card.key) }}>
                      {card.value}
                      {card.key === 'onlinePersonnel' && <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> 人</span>}
                      {card.key === 'todayAlarms' && <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> 起</span>}
                    </div>
                    <div className="dsh-kpi-sub">{card.sub}</div>
                  </div>
                </div>
                <div className="dsh-kpi-sparkline">
                  <ReactECharts
                    option={getSparklineOption(sparklineDataMap[card.key], sparklineColors[card.key])}
                    style={{ height: 30 }}
                    notMerge
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ================================================================
            ROW 2 — MINE MAP (left) + CHARTS (right)
            ================================================================ */}
        <Row gutter={[12, 12]}>
          {/* ---------- Mine Overview Map ---------- */}
          <Col span={15}>
            <Card
              title={<span className="dsh-map-title">矿场总览地图</span>}
              className="dsh-map-card"
              styles={{ body: { padding: 0 } }}
            >
              <div className="dsh-map-wrapper">
                <MineMapSvg />
              </div>
              <div className="dsh-map-legend">
                {[
                  { label: '人员 (128)', dot: '#0052D9' },
                  { label: '设备 (268)', dot: '#52C41A' },
                  { label: '告警 (23)', dot: '#F5222D' },
                  { label: '视频 (192)', dot: '#003EB3' },
                  { label: '围栏 (8)', dot: '#86909C' },
                ].map((item) => (
                  <span className="dsh-map-legend-item" key={item.label}>
                    <span className="dsh-map-legend-dot" style={{ background: item.dot }} />
                    {item.label}
                  </span>
                ))}
              </div>
            </Card>
          </Col>

          {/* ---------- Right Charts Stack ---------- */}
          <Col span={9}>
            <Row gutter={[0, 12]}>
              {/* Alarm Donut + Personnel Bar */}
              <Col span={24}>
                <Card className="dsh-charts-card" styles={{ body: { padding: '2px 0' } }}>
                  <Row gutter={0}>
                    <Col span={12} className="dsh-charts-split">
                      <div className="dsh-charts-title">
                        <Tooltip title="近7天告警分布统计">
                          <span style={{ cursor: 'help' }}>告警统计 (共 31)</span>
                        </Tooltip>
                      </div>
                      <div className="dsh-chart-wrapper">
                        <ReactECharts option={alarmDonutOption} style={{ height: 150 }} />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="dsh-charts-title">人员分布 (在线/总数)</div>
                      <div className="dsh-chart-wrapper">
                        <ReactECharts option={personnelBarOption} style={{ height: 150 }} />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* Alarm List */}
              <Col span={24}>
                <Card
                  title={<span className="dsh-alarm-title">告警列表</span>}
                  extra={
                    <Space size={8}>
                      <Button type="primary" size="small" style={{ fontSize: 11, height: 22, padding: '0 8px' }}>全部 (31)</Button>
                      <a className="dsh-alarm-extra">更多</a>
                    </Space>
                  }
                  className="dsh-alarm-card"
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    columns={alarmColumns}
                    dataSource={alarmListData}
                    pagination={false}
                    size="small"
                    scroll={{ x: 455 }}
                    showHeader={false}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Track Replay Row */}
        <Row gutter={[12, 12]} className="dsh-section-gap">
          <Col span={24}>
            <Card
              title={<span className="dsh-track-title">轨迹回放</span>}
              className="dsh-track-card"
              extra={
                <Space size={4}>
                  <Button type="text" size="small" icon={<PauseCircleOutlined />} style={{ fontSize: 12 }} />
                  <Button type="text" size="small" icon={<ExpandOutlined />} style={{ fontSize: 12 }} />
                </Space>
              }
              styles={{ body: { padding: '10px 12px' } }}
            >
              <div className="dsh-track-map">
                <div className="dsh-track-grid" />
                <svg viewBox="0 0 220 90" className="dsh-track-svg">
                  <defs>
                    <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#52C41A" />
                      <stop offset="100%" stopColor="#0052D9" />
                    </linearGradient>
                  </defs>
                  <path d="M 14 56 Q 50 30, 85 28 T 160 28 T 206 32" stroke="url(#trackGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <circle cx="14" cy="56" r="4" fill="#52C41A" stroke="#fff" strokeWidth="1.5">
                    <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="206" cy="32" r="4" fill="#0052D9" stroke="#fff" strokeWidth="1.5" />
                </svg>
                <Tooltip title="回放轨迹">
                  <Button
                    type="primary"
                    size="small"
                    shape="circle"
                    icon={<CaretRightOutlined />}
                    className="dsh-track-play-btn"
                  />
                </Tooltip>
              </div>
              <div className="dsh-track-info">
                <span><Typography.Text type="secondary">人员:</Typography.Text> 张三</span>
                <span><Typography.Text type="secondary">工号:</Typography.Text> A10234</span>
                <span><Typography.Text type="secondary">里程:</Typography.Text> 2.43 km</span>
              </div>
              <div className="dsh-track-time">2025-05-20 08:00:00 ~ 10:30:00</div>
            </Card>
          </Col>
        </Row>

        {/* ================================================================
            ROW 3 — DEVICE TABLE (left) + SYNC STATUS (right)
            ================================================================ */}
        <Row gutter={[12, 12]} className="dsh-section-gap">
          {/* ---------- Device Operating Status Table ---------- */}
          <Col span={18}>
            <Card
              title={<span className="dsh-device-title">设备运行状态</span>}
              className="dsh-device-card"
              styles={{ body: { padding: 0 } }}
            >
              <Tabs
                activeKey={deviceTab}
                onChange={setDeviceTab}
                size="small"
                className="dsh-device-tabs"
                items={deviceTabs}
              />
              <Table
                columns={deviceColumns}
                dataSource={filteredDeviceData}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                  showTotal: (total: number) => `共 ${total} 条`,
                  size: 'small',
                }}
                loading={loading}
                size="small"
                scroll={{ x: 785 }}
              />
            </Card>
          </Col>

          {/* ---------- Sync Status ---------- */}
          <Col span={6}>
            <Card
              title={<span className="dsh-sync-title">同步状态</span>}
              className="dsh-sync-card"
              styles={{ body: { padding: '8px 14px' } }}
            >
              <div className="dsh-sync-list">
                {syncItems.map((item, idx) => (
                  <div key={item.name}>
                    <div className="dsh-sync-row">
                      <div className="dsh-sync-left">
                        <span className="dsh-sync-dot" style={{ background: item.color }} />
                        <Typography.Text className="dsh-sync-name">{item.name}</Typography.Text>
                      </div>
                      <div className="dsh-sync-right">
                        <Typography.Text className="dsh-sync-status">{item.status}</Typography.Text>
                        <Typography.Text className="dsh-sync-time">({item.time})</Typography.Text>
                      </div>
                    </div>
                    {idx < syncItems.length - 1 && <Divider style={{ margin: '8px 0' }} />}
                  </div>
                ))}
              </div>
              <Divider style={{ margin: '12px 0 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                <Typography.Text type="secondary">系统运行</Typography.Text>
                <Progress percent={100} size="small" style={{ width: 120, margin: 0 }} strokeColor="#52C41A" showInfo={false} />
                <Typography.Text style={{ color: '#52C41A' }}>健康</Typography.Text>
              </div>
            </Card>
          </Col>
        </Row>

      </div>
    </>
  );
}
