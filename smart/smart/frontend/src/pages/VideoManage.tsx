import { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Select, Input,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CameraOutlined, VideoCameraOutlined, PlayCircleOutlined,
  PauseCircleOutlined, CaretUpOutlined, CaretDownOutlined,
  WifiOutlined, ThunderboltOutlined, SearchOutlined,
  FilterOutlined, ReloadOutlined, SettingOutlined,
  ToolOutlined, SyncOutlined, DesktopOutlined,
  FullscreenOutlined, DownloadOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getDeviceList, streamStart, streamStop } from '../api';

const { Text, Title } = Typography;

/* =========================================================================
   CSS INJECTION
   ========================================================================= */
const VideoCSS = `
.video-root { display: flex; flex-direction: column; gap: 10px; }
.video-kpi-card { border-radius: 8px; transition: all 0.2s; border: 1px solid transparent; }
.video-kpi-card:hover { border-color: #0052D9; box-shadow: 0 2px 12px rgba(0,82,217,0.08); transform: translateY(-1px); }
.video-kpi-card .ant-card-body { padding: 10px 14px 8px; }
.video-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.video-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 19px; }
.video-kpi-body { flex: 1; min-width: 0; }
.video-kpi-label { font-size: 11px; color: #86909C; }
.video-kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; color: #1D2129; }
.video-kpi-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; margin-top: 2px; }
.video-grid-wrapper { position: relative; height: 370px; background: #0A0A0A; border-radius: 8px; overflow: hidden; display: flex; flex-wrap: wrap; }
.video-grid-cell { width: 50%; height: 50%; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.video-grid-cell-label { position: absolute; bottom: 4px; left: 4px; color: rgba(255,255,255,0.7); font-size: 9px; z-index: 2; background: rgba(0,0,0,0.5); padding: '1px 5px'; border-radius: 2px; }
.video-grid-cell-status { position: absolute; top: 4px; right: 4px; z-index: 2; }
.video-table-card .ant-card-body { padding: 0; }
@keyframes videoPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes videoScan { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
`;

/* =========================================================================
   DATA
   ========================================================================= */

interface VideoStat {
  key: string; icon: React.ReactNode; bg: string; color: string;
  label: string; value: string | number; suffix: string;
  trend?: string; trendUp?: boolean; sparkline: number[];
}

const statCards: VideoStat[] = [
  {
    key: 'total', label: '设备总数', value: 156, suffix: '台',
    icon: <CameraOutlined />, bg: '#E8F3FF', color: '#0052D9',
    trend: '较上月 ↑ 8', trendUp: true,
    sparkline: [128, 135, 140, 145, 148, 152, 156],
  },
  {
    key: 'online', label: '在线设备', value: 142, suffix: '台',
    icon: <WifiOutlined />, bg: '#E8F8F2', color: '#2BA471',
    trend: '在线率 91.0%', trendUp: true,
    sparkline: [120, 125, 130, 134, 136, 140, 142],
  },
  {
    key: 'offline', label: '离线设备', value: 14, suffix: '台',
    icon: <ExclamationCircleOutlined />, bg: '#FFF1F0', color: '#FF4D4F',
    trend: '较昨日 ↓ 2', trendUp: false,
    sparkline: [18, 16, 18, 16, 17, 15, 14],
  },
  {
    key: 'streaming', label: '推流中', value: 38, suffix: '路',
    icon: <PlayCircleOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    trend: '占用带宽 152 Mbps', trendUp: true,
    sparkline: [28, 30, 32, 33, 35, 37, 38],
  },
];

interface DeviceItem {
  key: string;
  deviceName: string;
  deviceId: string;
  ip: string;
  status: string;
  resolution: string;
  framerate: string;
  codec: string;
  area: string;
  bitrate: string;
  lastOnline: string;
}

const deviceData: DeviceItem[] = [
  { key: '1', deviceName: '井下摄像头 CAM-001', deviceId: 'CAM-001', ip: '192.168.1.101', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.265', area: '主运输巷道', bitrate: '4 Mbps', lastOnline: '10:29' },
  { key: '2', deviceName: '井下摄像头 CAM-002', deviceId: 'CAM-002', ip: '192.168.1.102', status: '在线', resolution: '2560×1440', framerate: '30fps', codec: 'H.265', area: '主运输巷道', bitrate: '6 Mbps', lastOnline: '10:29' },
  { key: '3', deviceName: '井下摄像头 CAM-003', deviceId: 'CAM-003', ip: '192.168.1.103', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.264', area: '采掘工作面', bitrate: '4 Mbps', lastOnline: '10:28' },
  { key: '4', deviceName: '斜井口摄像头 CAM-004', deviceId: 'CAM-004', ip: '192.168.1.104', status: '离线', resolution: '1920×1080', framerate: '—', codec: 'H.265', area: '主斜井口', bitrate: '—', lastOnline: '09:15' },
  { key: '5', deviceName: '采掘面摄像头 CAM-005', deviceId: 'CAM-005', ip: '192.168.1.105', status: '在线', resolution: '2560×1440', framerate: '30fps', codec: 'H.265', area: '采掘工作面', bitrate: '6 Mbps', lastOnline: '10:29' },
  { key: '6', deviceName: '机电硐室 CAM-006', deviceId: 'CAM-006', ip: '192.168.1.106', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.265', area: '机电硐室', bitrate: '3 Mbps', lastOnline: '10:27' },
  { key: '7', deviceName: '避灾硐室 CAM-007', deviceId: 'CAM-007', ip: '192.168.1.107', status: '在线', resolution: '1280×720', framerate: '15fps', codec: 'H.264', area: '避灾硐室', bitrate: '2 Mbps', lastOnline: '10:29' },
  { key: '8', deviceName: '中央变电所 CAM-008', deviceId: 'CAM-008', ip: '192.168.1.108', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.265', area: '中央变电所', bitrate: '4 Mbps', lastOnline: '10:28' },
  { key: '9', deviceName: '水泵房摄像头 CAM-009', deviceId: 'CAM-009', ip: '192.168.1.109', status: '在线', resolution: '1280×720', framerate: '20fps', codec: 'H.264', area: '水泵房', bitrate: '2 Mbps', lastOnline: '10:29' },
  { key: '10', deviceName: '辅助运输巷 CAM-010', deviceId: 'CAM-010', ip: '192.168.1.110', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.265', area: '辅助运输巷', bitrate: '4 Mbps', lastOnline: '10:29' },
  { key: '11', deviceName: '回风巷摄像头 CAM-011', deviceId: 'CAM-011', ip: '192.168.1.111', status: '离线', resolution: '1920×1080', framerate: '—', codec: 'H.264', area: '回风巷道', bitrate: '—', lastOnline: '08:42' },
  { key: '12', deviceName: '井上广场 CAM-012', deviceId: 'CAM-012', ip: '192.168.1.112', status: '在线', resolution: '2560×1440', framerate: '30fps', codec: 'H.265', area: '井上广场', bitrate: '8 Mbps', lastOnline: '10:29' },
  { key: '13', deviceName: '提升机房 CAM-013', deviceId: 'CAM-013', ip: '192.168.1.113', status: '在线', resolution: '1920×1080', framerate: '25fps', codec: 'H.265', area: '提升机房', bitrate: '4 Mbps', lastOnline: '10:28' },
  { key: '14', deviceName: '通风机房 CAM-014', deviceId: 'CAM-014', ip: '192.168.1.114', status: '在线', resolution: '1280×720', framerate: '15fps', codec: 'H.264', area: '通风机房', bitrate: '2 Mbps', lastOnline: '10:27' },
  { key: '15', deviceName: '压风机房 CAM-015', deviceId: 'CAM-015', ip: '192.168.1.115', status: '离线', resolution: '1920×1080', framerate: '—', codec: 'H.265', area: '压缩空气站', bitrate: '—', lastOnline: '05:30' },
];

/* =========================================================================
   COMPONENT
   ========================================================================= */

export default function VideoManage() {
  const [streamingDevices, setStreamingDevices] = useState<Set<string>>(new Set(['CAM-001', 'CAM-002', 'CAM-005', 'CAM-008']));
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');

  const filteredDevices = useMemo(() => {
    let data = deviceData;
    if (statusFilter === '在线') data = data.filter((d) => d.status === '在线');
    else if (statusFilter === '离线') data = data.filter((d) => d.status === '离线');
    if (searchText) {
      data = data.filter((d) => d.deviceName.includes(searchText) || d.deviceId.includes(searchText) || d.ip.includes(searchText));
    }
    return data;
  }, [searchText, statusFilter]);

  const handleStreamToggle = useCallback(async (device: DeviceItem) => {
    const devId = device.deviceId;
    try {
      if (streamingDevices.has(devId)) {
        await streamStop({ device: devId });
        setStreamingDevices((prev) => { const next = new Set(prev); next.delete(devId); return next; });
      } else {
        await streamStart({ device: devId });
        setStreamingDevices((prev) => { const next = new Set(prev); next.add(devId); return next; });
      }
    } catch {
      // API error handled silently
    }
  }, [streamingDevices]);

  const deviceColumns: ColumnsType<DeviceItem> = useMemo(() => [
    {
      title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 180,
      render: (v: string, r: DeviceItem) => (
        <Space size={4}>
          <CameraOutlined style={{ color: r.status === '在线' ? '#2BA471' : '#C9CDD4', fontSize: 13 }} />
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '设备编号', dataIndex: 'deviceId', key: 'deviceId', width: 100,
      render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 75,
      render: (s: string, r: DeviceItem) => {
        if (s === '在线' && streamingDevices.has(r.deviceId)) {
          return (
            <Badge status="processing" text={
              <Text style={{ fontSize: 11, color: '#7B61FF', fontWeight: 500 }}>
                <PlayCircleOutlined style={{ marginRight: 2, fontSize: 10 }} />推流中
              </Text>
            } />
          );
        }
        return (
          <Tag color={s === '在线' ? 'green' : 'default'} style={{ fontSize: 10, margin: 0 }}>
            {s === '在线' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#2BA471', marginRight: 4 }} />}
            {s}
          </Tag>
        );
      },
    },
    {
      title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130,
      render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '分辨率', dataIndex: 'resolution', key: 'resolution', width: 110,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '帧率', dataIndex: 'framerate', key: 'framerate', width: 70,
      render: (v: string) => <Text style={{ fontSize: 11, color: v === '—' ? '#C9CDD4' : '#1D2129' }}>{v}</Text>,
    },
    {
      title: '编码格式', dataIndex: 'codec', key: 'codec', width: 80,
      render: (v: string) => (
        <Tag color={v === 'H.265' ? 'blue' : 'green'} style={{ fontSize: 10, margin: 0 }}>{v}</Tag>
      ),
    },
    {
      title: '所属区域', dataIndex: 'area', key: 'area', width: 110,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '码率', dataIndex: 'bitrate', key: 'bitrate', width: 80,
      render: (v: string) => <Text style={{ fontSize: 11, color: v === '—' ? '#C9CDD4' : '#1D2129' }}>{v}</Text>,
    },
    {
      title: '最近在线', dataIndex: 'lastOnline', key: 'lastOnline', width: 90,
      render: (v: string, r: DeviceItem) => (
        <Text style={{ fontSize: 11, color: r.status === '离线' ? '#FF4D4F' : '#86909C' }}>{v}</Text>
      ),
    },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 130,
      render: (_: unknown, record: DeviceItem) => (
        <Space size={[4, 4]}>
          {record.status === '在线' ? (
            <>
              <a style={{ fontSize: 11 }} onClick={() => handleStreamToggle(record)}>
                {streamingDevices.has(record.deviceId) ? (
                  <><PauseCircleOutlined /> 停止</>
                ) : (
                  <><PlayCircleOutlined /> 推流</>
                )}
              </a>
              <a style={{ fontSize: 11 }}><FullscreenOutlined style={{ fontSize: 10 }} /> 预览</a>
            </>
          ) : (
            <a style={{ fontSize: 11, color: '#C9CDD4' }}><ToolOutlined /> 修复</a>
          )}
        </Space>
      ),
    },
  ], [handleStreamToggle, streamingDevices]);

  const sparklineColors = ['#0052D9', '#2BA471', '#FF4D4F', '#7B61FF'];

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

  const bandwidthOption = useMemo(() => {
    const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];
    const data = [110, 130, 145, 148, 152, 150];
    return {
      grid: { left: 44, right: 16, top: 10, bottom: 26 },
      xAxis: {
        type: 'category' as const, data: hours,
        axisLabel: { fontSize: 10, color: '#86909C' },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const, name: 'Mbps', max: 200,
        nameTextStyle: { fontSize: 10, color: '#86909C' },
        axisLabel: { fontSize: 10, color: '#86909C' },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
      },
      series: [{
        type: 'line' as const, data, smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { color: '#7B61FF', width: 2.5 },
        itemStyle: { color: '#7B61FF' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(123,97,255,0.15)' },
              { offset: 1, color: 'rgba(123,97,255,0)' },
            ],
          },
        },
      }],
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E6EB',
        textStyle: { fontSize: 11 },
        formatter: '{b}<br/>带宽: <b>{c} Mbps</b>',
      },
    };
  }, []);

  return (
    <>
      <style>{VideoCSS}</style>
      <div className="video-root">

        {/* ===== Header ===== */}
        <Card bodyStyle={{ padding: '12px 20px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={12}>
                <Title level={5} style={{ margin: 0 }}>视频管理</Title>
                <Badge status="processing" text={<Text style={{ fontSize: 12 }}>38路推流中</Text>} />
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <Input.Search
                  placeholder="搜索设备名称/编号/IP"
                  allowClear
                  style={{ width: 240 }}
                  size="small"
                  onSearch={setSearchText}
                  prefix={<SearchOutlined />}
                />
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 100 }}
                  options={[
                    { value: '全部', label: '全部状态' },
                    { value: '在线', label: '在线' },
                    { value: '离线', label: '离线' },
                  ]}
                />
                <Button size="small" icon={<FilterOutlined />}>筛选</Button>
                <Button size="small" icon={<ReloadOutlined />}>刷新</Button>
                <Button size="small" icon={<SettingOutlined />}>配置</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ===== KPI Cards ===== */}
        <Row gutter={[10, 10]}>
          {statCards.map((s, i) => (
            <Col span={6} key={s.key}>
              <Card className="video-kpi-card" size="small">
                <div className="video-kpi-inner">
                  <div className="video-kpi-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="video-kpi-body">
                    <div className="video-kpi-label">{s.label}</div>
                    <div className="video-kpi-value">
                      {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: '#86909C' }}> {s.suffix}</span>
                    </div>
                    {s.trend && (
                      <div className="video-kpi-trend" style={{ color: s.trendUp ? '#FF4D4F' : '#52C41A' }}>
                        {s.trendUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
                        {s.trend}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ height: 32, marginTop: 4 }}>
                  <ReactECharts option={getSparklineOption(s.sparkline, sparklineColors[i])} style={{ height: 32 }} opts={{ renderer: 'svg' }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== Video Grid + Bandwidth Chart ===== */}
        <Row gutter={[10, 10]}>
          <Col span={14}>
            <Card
              title={<Space><DesktopOutlined style={{ color: '#1677FF' }} /><Text strong style={{ fontSize: 14 }}>多路视频预览</Text></Space>}
              styles={{ body: { padding: 0 } }}
            >
              <div className="video-grid-wrapper">
                {/* Cell 1 */}
                <div className="video-grid-cell" style={{ background: '#1A1A2E' }}>
                  <CameraOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 2 }}>
                      CAM-001 主运输巷道
                    </Text>
                  </div>
                  <Badge status="processing" style={{ position: 'absolute', top: 6, right: 6 }} />
                  {/* Scan line animation */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.4), transparent)',
                    animation: 'videoScan 3s linear infinite', zIndex: 1,
                  }} />
                </div>

                {/* Cell 2 */}
                <div className="video-grid-cell" style={{ background: '#16213E' }}>
                  <CameraOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 2 }}>
                      CAM-002 主运输巷道
                    </Text>
                  </div>
                  <Badge status="processing" style={{ position: 'absolute', top: 6, right: 6 }} />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.4), transparent)',
                    animation: 'videoScan 3s linear infinite', animationDelay: '0.5s', zIndex: 1,
                  }} />
                </div>

                {/* Cell 3 */}
                <div className="video-grid-cell" style={{ background: '#0F3460' }}>
                  <CameraOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 2 }}>
                      CAM-005 采掘工作面
                    </Text>
                  </div>
                  <Badge status="processing" style={{ position: 'absolute', top: 6, right: 6 }} />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.4), transparent)',
                    animation: 'videoScan 3s linear infinite', animationDelay: '1s', zIndex: 1,
                  }} />
                </div>

                {/* Cell 4 */}
                <div className="video-grid-cell" style={{ background: '#1A1A2E' }}>
                  <CameraOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, zIndex: 2 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 2 }}>
                      CAM-008 中央变电所
                    </Text>
                  </div>
                  <Badge status="processing" style={{ position: 'absolute', top: 6, right: 6 }} />
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(123,97,255,0.4), transparent)',
                    animation: 'videoScan 3s linear infinite', animationDelay: '1.5s', zIndex: 1,
                  }} />
                </div>

                {/* Center overlay: offline indicator for empty/dark cells */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, display: 'none' }} />
              </div>
            </Card>
          </Col>

          <Col span={10}>
            <Card
              title={<Space><ThunderboltOutlined style={{ color: '#7B61FF' }} /><Text strong style={{ fontSize: 14 }}>实时带宽</Text></Space>}
              styles={{ body: { padding: '4px 6px' } }}
              extra={<Text style={{ fontSize: 11, color: '#86909C' }}>当前: 150 Mbps</Text>}
            >
              <ReactECharts option={bandwidthOption} style={{ height: 340 }} />
            </Card>
          </Col>
        </Row>

        {/* ===== Device List Table ===== */}
        <Card
          className="video-table-card"
          title={
            <Space>
              <Text strong style={{ fontSize: 14 }}>设备列表</Text>
              <Tag style={{ margin: 0 }}>共 {filteredDevices.length} 台</Tag>
            </Space>
          }
          extra={
            <Space size={8}>
              <Button size="small" icon={<SyncOutlined />}>全部同步</Button>
              <Button size="small" icon={<DownloadOutlined />}>导出列表</Button>
            </Space>
          }
        >
          <Table<DeviceItem>
            columns={deviceColumns}
            dataSource={filteredDevices}
            size="small"
            scroll={{ x: 1300 }}
            pagination={{
              size: 'small',
              pageSize: 10,
              showTotal: (t) => `共 ${t} 台设备`,
              showSizeChanger: true,
              pageSizeOptions: ['8', '10', '15'],
            }}
            rowClassName={(r) => r.status === '离线' ? 'video-row-offline' : ''}
          />
        </Card>

      </div>
    </>
  );
}
