import { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Select, DatePicker, Statistic,
  Slider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EnvironmentOutlined, AimOutlined, CaretUpOutlined, CaretDownOutlined,
  FieldTimeOutlined, CompassOutlined, ThunderboltOutlined,
  ZoomInOutlined, ZoomOutOutlined, PlayCircleOutlined, PauseCircleOutlined,
  HistoryOutlined, ReloadOutlined, FilterOutlined, FullscreenOutlined,
  DownloadOutlined, SearchOutlined, NodeIndexOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/* =========================================================================
   CSS INJECTION
   ========================================================================= */
const TrackCSS = `
.track-root { display: flex; flex-direction: column; gap: 10px; }
.track-kpi-card { border-radius: 8px; transition: all 0.2s; border: 1px solid transparent; }
.track-kpi-card:hover { border-color: #0052D9; box-shadow: 0 2px 12px rgba(0,82,217,0.08); transform: translateY(-1px); }
.track-kpi-card .ant-card-body { padding: 12px 14px 8px; }
.track-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.track-kpi-icon { flex-shrink: 0; width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.track-kpi-body { flex: 1; min-width: 0; }
.track-kpi-label { font-size: 11px; color: #86909C; white-space: nowrap; }
.track-kpi-value { font-size: 26px; font-weight: 700; line-height: 1.2; color: #1D2129; }
.track-kpi-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; margin-top: 2px; }
.track-map-wrapper { position: relative; height: 380px; background: #F5F7FA; border-radius: 8px; border: 1px solid #E5E6EB; overflow: hidden; }
.track-map-grid { position: absolute; inset: 0;
  background-image: linear-gradient(#DCE0E6 1px, transparent 1px), linear-gradient(90deg, #DCE0E6 1px, transparent 1px);
  background-size: 32px 32px; z-index: 0; }
.track-map-zoom { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 3px; z-index: 10; }
.track-map-zoom-btn { width: 28px; height: 28px; border-radius: 6px;
  background: rgba(255,255,255,0.92); border: 1px solid #E5E6EB;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; color: #4E5969;
  transition: all 0.15s; }
.track-map-zoom-btn:hover { color: #1677FF; border-color: #1677FF; background: #E6F0FF; }
.track-map-legend { position: absolute; bottom: 8px; right: 8px;
  background: rgba(255,255,255,0.92); padding: 6px 10px; border-radius: 6px;
  font-size: 10px; border: 1px solid #F0F0F0; z-index: 10; }
.track-table-card .ant-card-body { padding: 0; }
@keyframes trackDash { to { stroke-dashoffset: -20; } }
@keyframes trackPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`;

/* =========================================================================
   DATA
   ========================================================================= */
interface TrackStat {
  key: string; icon: React.ReactNode; bg: string; color: string;
  label: string; value: string | number; suffix: string;
  trend?: string; trendUp?: boolean; sub?: string; sparkline: number[];
}

const statCards: TrackStat[] = [
  {
    key: 'total', label: '轨迹总数', value: '12,840', suffix: '条',
    icon: <NodeIndexOutlined />, bg: '#E8F3FF', color: '#0052D9',
    trend: '较昨日 ↑ 5.2%', trendUp: true,
    sparkline: [10800, 11200, 11600, 11800, 12200, 12500, 12840],
  },
  {
    key: 'today', label: '今日轨迹', value: '1,253', suffix: '条',
    icon: <HistoryOutlined />, bg: '#E8F8F2', color: '#2BA471',
    trend: '较昨日 ↑ 8.7%', trendUp: true,
    sparkline: [980, 1020, 1080, 1120, 1160, 1200, 1253],
  },
  {
    key: 'devices', label: '活跃设备', value: '856', suffix: '台',
    icon: <AimOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    sub: '在线率 92.4%',
    sparkline: [720, 750, 780, 800, 820, 840, 856],
  },
  {
    key: 'points', label: '数据点数', value: '1.2M', suffix: '个',
    icon: <ThunderboltOutlined />, bg: '#FFF7E6', color: '#FAAD14',
    trend: '较昨日 ↑ 12.3%', trendUp: true,
    sparkline: [800000, 880000, 920000, 980000, 1050000, 1120000, 1200000],
  },
];

interface TrackRecord {
  key: string;
  deviceName: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  distance: string;
  duration: string;
  speed: string;
  points: number;
  status: string;
}

const trackData: TrackRecord[] = [
  { key: '1', deviceName: '智能矿帽 MKH-001', deviceId: 'DEV-001', startTime: '2025-05-20 08:00:12', endTime: '2025-05-20 12:05:33', distance: '8.52 km', duration: '4h 05min', speed: '2.08 km/h', points: 245, status: '已完成' },
  { key: '2', deviceName: '智能矿帽 MKH-002', deviceId: 'DEV-002', startTime: '2025-05-20 07:58:45', endTime: '2025-05-20 11:48:20', distance: '6.34 km', duration: '3h 49min', speed: '1.66 km/h', points: 210, status: '已完成' },
  { key: '3', deviceName: '智能矿帽 MKH-003', deviceId: 'DEV-003', startTime: '2025-05-20 08:15:00', endTime: '2025-05-20 16:30:00', distance: '12.18 km', duration: '8h 15min', speed: '1.48 km/h', points: 380, status: '进行中' },
  { key: '4', deviceName: '智能矿帽 MKH-005', deviceId: 'DEV-005', startTime: '2025-05-20 08:05:22', endTime: '2025-05-20 10:42:18', distance: '5.67 km', duration: '2h 36min', speed: '2.18 km/h', points: 156, status: '已完成' },
  { key: '5', deviceName: '智能矿帽 MKH-007', deviceId: 'DEV-007', startTime: '2025-05-20 08:12:08', endTime: '2025-05-20 14:20:00', distance: '9.83 km', duration: '6h 07min', speed: '1.61 km/h', points: 310, status: '进行中' },
  { key: '6', deviceName: '智能矿帽 MKH-008', deviceId: 'DEV-008', startTime: '2025-05-20 08:00:00', endTime: '2025-05-20 12:00:00', distance: '7.21 km', duration: '4h 00min', speed: '1.80 km/h', points: 220, status: '已完成' },
  { key: '7', deviceName: '智能矿帽 MKH-010', deviceId: 'DEV-010', startTime: '2025-05-20 08:30:00', endTime: '2025-05-20 13:45:00', distance: '4.92 km', duration: '5h 15min', speed: '0.94 km/h', points: 180, status: '异常' },
  { key: '8', deviceName: '智能矿帽 MKH-012', deviceId: 'DEV-012', startTime: '2025-05-20 07:50:00', endTime: '2025-05-20 11:30:00', distance: '10.45 km', duration: '3h 40min', speed: '2.85 km/h', points: 290, status: '已完成' },
  { key: '9', deviceName: '智能矿帽 MKH-015', deviceId: 'DEV-015', startTime: '2025-05-20 08:20:00', endTime: '—', distance: '3.28 km', duration: '—', speed: '—', points: 102, status: '进行中' },
  { key: '10', deviceName: '智能矿帽 MKH-018', deviceId: 'DEV-018', startTime: '2025-05-20 08:10:00', endTime: '2025-05-20 15:20:00', distance: '11.06 km', duration: '7h 10min', speed: '1.54 km/h', points: 356, status: '已完成' },
];

const deviceOptions = [
  { value: 'all', label: '全部设备' },
  { value: 'DEV-001', label: 'MKH-001 (张三)' },
  { value: 'DEV-002', label: 'MKH-002 (李四)' },
  { value: 'DEV-003', label: 'MKH-003 (王五)' },
  { value: 'DEV-005', label: 'MKH-005 (赵六)' },
  { value: 'DEV-007', label: 'MKH-007 (孙七)' },
];

/* =========================================================================
   COMPONENT
   ========================================================================= */

export default function TrackReplay() {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [mapZoom, setMapZoom] = useState(1);

  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const trackColumns: ColumnsType<TrackRecord> = useMemo(() => [
    {
      title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 170,
      render: (v: string, r: TrackRecord) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#1677FF', fontSize: 13 }} />
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '设备编号', dataIndex: 'deviceId', key: 'deviceId', width: 100,
      render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 150,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '轨迹距离', dataIndex: 'distance', key: 'distance', width: 100,
      render: (v: string) => <Text strong style={{ fontSize: 12, color: '#0052D9' }}>{v}</Text>,
    },
    {
      title: '持续时长', dataIndex: 'duration', key: 'duration', width: 100,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '平均速度', dataIndex: 'speed', key: 'speed', width: 100,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '数据点', dataIndex: 'points', key: 'points', width: 80,
      render: (v: number) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => {
        const cm: Record<string, string> = { '已完成': 'green', '进行中': 'blue', '异常': 'red' };
        return <Tag color={cm[s] || 'default'} style={{ fontSize: 10, margin: 0 }}>{s}</Tag>;
      },
    },
  ], []);

  const sparklineColors = ['#0052D9', '#2BA471', '#7B61FF', '#FAAD14'];

  const getSparklineOption = useCallback((data: number[], color: string) => {
    const mn = Math.min(...data);
    const mx = Math.max(...data);
    const pad = (mx - mn) * 0.2 || 1;
    return {
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { show: false, data: data.map((_, i) => i) },
      yAxis: { show: false, min: mn - pad, max: mx + pad },
      series: [{
        type: 'line' as const, data, smooth: true, symbol: 'none',
        lineStyle: { color, width: 1.8 },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}30` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
      }],
    };
  }, []);

  const timelineOption = useMemo(() => {
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const track1 = [0.5, 1.2, 2.8, 4.5, 6.2, 7.8, 9.0, 10.5, 12.2];
    const track2 = [0.3, 0.9, 2.1, 3.5, 5.0, 6.4, 7.5, 8.8, 9.8];
    const track3 = [0.1, 0.5, 1.5, 2.8, 4.0, 5.2, 6.5, 7.2, 8.5];
    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E6EB',
        textStyle: { fontSize: 11, color: '#1D2129' },
        formatter: (params: { seriesName: string; value: number }[]) => {
          let html = `<div style="font-weight:600;margin-bottom:4px">${params[0]?.value ?? ''} km</div>`;
          params.forEach((p) => {
            html += `<div style="display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.seriesName === 'MKH-001' ? '#0052D9' : p.seriesName === 'MKH-002' ? '#2BA471' : '#7B61FF'};margin-right:4px"></span>${p.seriesName}: ${p.value} km</div>`;
          });
          return html;
        },
      },
      grid: { left: 48, right: 20, top: 16, bottom: 32 },
      xAxis: {
        type: 'category' as const,
        data: hours,
        axisLabel: { fontSize: 10, color: '#86909C' },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        name: '距离 (km)',
        nameTextStyle: { fontSize: 10, color: '#86909C' },
        axisLabel: { fontSize: 10, color: '#86909C' },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
      },
      series: [
        {
          name: 'MKH-001', type: 'line' as const, data: track1, smooth: true,
          symbol: 'circle', symbolSize: 4,
          lineStyle: { color: '#0052D9', width: 2.5 },
          itemStyle: { color: '#0052D9' },
        },
        {
          name: 'MKH-002', type: 'line' as const, data: track2, smooth: true,
          symbol: 'circle', symbolSize: 4,
          lineStyle: { color: '#2BA471', width: 2.5 },
          itemStyle: { color: '#2BA471' },
        },
        {
          name: 'MKH-003', type: 'line' as const, data: track3, smooth: true,
          symbol: 'circle', symbolSize: 4,
          lineStyle: { color: '#7B61FF', width: 2.5 },
          itemStyle: { color: '#7B61FF' },
        },
      ],
    };
  }, []);

  return (
    <>
      <style>{TrackCSS}</style>
      <div className="track-root">

        {/* ===== Header + Filters ===== */}
        <Card bodyStyle={{ padding: '12px 20px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={12}>
                <Title level={5} style={{ margin: 0 }}>轨迹回放</Title>
                <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>GPS定位中</Tag>
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <RangePicker
                  size="small"
                  defaultValue={[dayjs('2025-05-20 08:00'), dayjs('2025-05-20 16:00')]}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: 320 }}
                />
                <Select
                  size="small"
                  value={selectedDevice}
                  onChange={setSelectedDevice}
                  style={{ width: 180 }}
                  options={deviceOptions}
                  placeholder="选择设备"
                />
                <Button size="small" icon={<FilterOutlined />}>筛选</Button>
                <Button size="small" icon={<DownloadOutlined />}>导出</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ===== KPI Cards ===== */}
        <Row gutter={[10, 10]}>
          {statCards.map((s, i) => (
            <Col span={6} key={s.key}>
              <Card className="track-kpi-card" size="small">
                <div className="track-kpi-inner">
                  <div className="track-kpi-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="track-kpi-body">
                    <div className="track-kpi-label">{s.label}</div>
                    <Statistic
                      value={s.value}
                      suffix={<span style={{ fontSize: 13, fontWeight: 400, color: '#86909C' }}>{s.suffix}</span>}
                      valueStyle={{ fontSize: 24, fontWeight: 700, color: '#1D2129', lineHeight: 1.2 }}
                    />
                    <div className="track-kpi-trend">
                      {s.trend && (
                        <span style={{ color: s.trendUp ? '#FF4D4F' : '#52C41A' }}>
                          {s.trendUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
                          {s.trend}
                        </span>
                      )}
                      {s.sub && <span style={{ color: '#86909C' }}>{s.sub}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ height: 32, marginTop: 6 }}>
                  <ReactECharts option={getSparklineOption(s.sparkline, sparklineColors[i])} style={{ height: 32 }} opts={{ renderer: 'svg' }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== Map + Timeline Chart ===== */}
        <Row gutter={[10, 10]}>
          <Col span={12}>
            <Card
              title={<Space><CompassOutlined style={{ color: '#1677FF' }} /><Text strong style={{ fontSize: 14 }}>轨迹地图</Text></Space>}
              styles={{ body: { padding: 0 } }}
            >
              <div className="track-map-wrapper">
                <div className="track-map-grid" />

                {/* SVG Mine Map */}
                <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} viewBox="0 0 600 380">
                  {/* Tunnel network */}
                  <g fill="none" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.25}>
                    <path d="M 20,180 L 580,175" stroke="#A8C8E8" />
                    <path d="M 260,175 L 258,20" stroke="#A8C8E8" />
                    <path d="M 140,175 L 138,360" stroke="#A8C8E8" />
                    <path d="M 420,175 L 418,50" stroke="#A8C8E8" />
                    <path d="M 260,100 L 418,50" stroke="#B8D4F0" />
                    <path d="M 140,280 L 260,280" stroke="#B8D4F0" />
                  </g>
                  <g fill="none" stroke="#96B8D8" strokeWidth={1} strokeDasharray="6,4" opacity={0.4}>
                    <path d="M 20,175 L 580,175" />
                    <path d="M 260,175 L 260,20" />
                    <path d="M 140,175 L 140,360" />
                    <path d="M 420,175 L 420,50" />
                    <path d="M 260,100 L 418,50" />
                    <path d="M 140,280 L 260,280" />
                  </g>

                  {/* Trajectory path for MKH-001 */}
                  <path d="M 60,178 Q 120,172 180,181 T 300,175 T 420,182 T 500,170"
                    fill="none" stroke="#0052D9" strokeWidth={2.5} strokeDasharray="8,4"
                    opacity={0.9}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1s" repeatCount="indefinite" />
                  </path>

                  {/* Trajectory path for MKH-002 */}
                  <path d="M 260,170 Q 265,120 300,90 Q 350,60 418,52"
                    fill="none" stroke="#2BA471" strokeWidth={2} strokeDasharray="6,4" opacity={0.7}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />
                  </path>

                  {/* Trajectory for MKH-003 */}
                  <path d="M 140,178 Q 142,220 138,270 Q 180,278 220,282 Q 240,278 255,178"
                    fill="none" stroke="#7B61FF" strokeWidth={2} strokeDasharray="5,5" opacity={0.7}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.4s" repeatCount="indefinite" />
                  </path>

                  {/* Device markers */}
                  <circle cx="180" cy="179" r="6" fill="#0052D9" stroke="#fff" strokeWidth={1.5} />
                  <circle cx="380" cy="178" r="5" fill="#2BA471" stroke="#fff" strokeWidth={1.5} />
                  <circle cx="255" cy="178" r="5" fill="#7B61FF" stroke="#fff" strokeWidth={1.5} />

                  {/* Tunnel labels */}
                  <g fill="#7A9ABA" fontSize={9}>
                    <text x="30" y="168">主运输巷道</text>
                    <text x="265" y="16">辅助运输巷</text>
                    <text x="128" y="195" transform="rotate(-90,128,195)">回风巷道</text>
                    <text x="423" y="45">联络巷</text>
                  </g>
                </svg>

                {/* Zoom Controls */}
                <div className="track-map-zoom">
                  <div className="track-map-zoom-btn" onClick={() => setMapZoom((z) => Math.min(z + 0.2, 2))}>
                    <ZoomInOutlined style={{ fontSize: 12 }} />
                  </div>
                  <div className="track-map-zoom-btn" onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.5))}>
                    <ZoomOutOutlined style={{ fontSize: 12 }} />
                  </div>
                  <div className="track-map-zoom-btn">
                    <FullscreenOutlined style={{ fontSize: 11 }} />
                  </div>
                </div>

                {/* Legend */}
                <div className="track-map-legend" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#0052D9', marginRight: 6 }} />MKH-001 张三</span>
                  <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2BA471', marginRight: 6 }} />MKH-002 李四</span>
                  <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7B61FF', marginRight: 6 }} />MKH-003 王五</span>
                </div>

                {/* Coordinate display */}
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 4, zIndex: 10, fontFamily: 'monospace' }}>
                  118°46′E 38°52′N | 标高 -450m
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card
              title={<Space><HistoryOutlined style={{ color: '#1677FF' }} /><Text strong style={{ fontSize: 14 }}>轨迹时间线</Text></Space>}
              styles={{ body: { padding: '4px 6px' } }}
              extra={
                <Space size={4}>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>2025-05-20</Text>
                </Space>
              }
            >
              <ReactECharts option={timelineOption} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>

        {/* ===== Playback Controls ===== */}
        <Card size="small" bodyStyle={{ padding: '10px 16px' }}>
          <Row align="middle" gutter={16}>
            <Col>
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={handlePlay}
              />
            </Col>
            <Col flex="auto">
              <Slider
                value={playProgress}
                onChange={setPlayProgress}
                min={0}
                max={100}
                tooltip={{ formatter: (v) => `${v}%` }}
                style={{ margin: 0 }}
              />
            </Col>
            <Col>
              <Select
                size="small"
                value={playSpeed}
                onChange={setPlaySpeed}
                style={{ width: 80 }}
                options={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1, label: '1x' },
                  { value: 2, label: '2x' },
                  { value: 4, label: '4x' },
                ]}
              />
            </Col>
            <Col>
              <Text style={{ fontSize: 12, color: '#86909C', fontFamily: 'monospace' }}>08:00:12 / 16:30:00</Text>
            </Col>
            <Col>
              <Button size="small" icon={<ReloadOutlined />}>重置</Button>
            </Col>
          </Row>
        </Card>

        {/* ===== Track List Table ===== */}
        <Card
          className="track-table-card"
          title={
            <Space>
              <Text strong style={{ fontSize: 14 }}>轨迹列表</Text>
              <Tag style={{ margin: 0 }}>共 10 条</Tag>
            </Space>
          }
          extra={<Space size={8}><Button size="small" icon={<DownloadOutlined />}>导出轨迹</Button><Button size="small" icon={<SearchOutlined />}>查找</Button></Space>}
        >
          <Table<TrackRecord>
            columns={trackColumns}
            dataSource={trackData}
            size="small"
            scroll={{ x: 1150 }}
            pagination={{
              size: 'small',
              pageSize: 8,
              showTotal: (t) => `共 ${t} 条轨迹`,
              showSizeChanger: true,
              pageSizeOptions: ['5', '8', '15'],
            }}
            rowClassName={(r) => r.status === '异常' ? 'track-row-abnormal' : ''}
          />
        </Card>

      </div>
    </>
  );
}
