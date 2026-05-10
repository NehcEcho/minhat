import { useState, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Select, DatePicker, Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  VideoCameraOutlined, PlayCircleOutlined, PauseCircleOutlined,
  CaretUpOutlined, CaretDownOutlined, ClockCircleOutlined,
  CameraOutlined, DownloadOutlined, SearchOutlined,
  FilterOutlined, ReloadOutlined, HistoryOutlined,
  CloudOutlined, FileProtectOutlined, FieldTimeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRecordList, playbackStart, playbackStop } from '../api';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/* =========================================================================
   CSS INJECTION
   ========================================================================= */
const PlaybackCSS = `
.playback-root { display: flex; flex-direction: column; gap: 10px; }
.playback-kpi-card { border-radius: 8px; transition: all 0.2s; border: 1px solid transparent; }
.playback-kpi-card:hover { border-color: #0052D9; box-shadow: 0 2px 12px rgba(0,82,217,0.08); transform: translateY(-1px); }
.playback-kpi-card .ant-card-body { padding: 10px 14px 8px; }
.playback-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.playback-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 19px; }
.playback-kpi-body { flex: 1; min-width: 0; }
.playback-kpi-label { font-size: 11px; color: #86909C; }
.playback-kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; color: #1D2129; }
.playback-kpi-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; margin-top: 2px; }
.playback-player { position: relative; height: 340px; background: #0D0D0D; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.playback-player-grid { position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px; z-index: 0; }
.playback-player-info { position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 24px 16px 12px; z-index: 2; }
.playback-table-card .ant-card-body { padding: 0; }
@keyframes playbackBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

/* =========================================================================
   DATA
   ========================================================================= */

interface PlaybackStat {
  key: string; icon: React.ReactNode; bg: string; color: string;
  label: string; value: string | number; suffix: string;
  trend?: string; trendUp?: boolean; sub?: string; sparkline: number[];
}

const statCards: PlaybackStat[] = [
  {
    key: 'total', label: '录像总数', value: '5,820', suffix: '条',
    icon: <VideoCameraOutlined />, bg: '#E8F3FF', color: '#0052D9',
    trend: '较昨日 ↑ 3.2%', trendUp: true,
    sparkline: [4800, 5100, 5300, 5500, 5600, 5720, 5820],
  },
  {
    key: 'today', label: '今日录像', value: '328', suffix: '条',
    icon: <CameraOutlined />, bg: '#E8F8F2', color: '#2BA471',
    trend: '较昨日 ↑ 12.7%', trendUp: true,
    sparkline: [240, 260, 280, 295, 310, 320, 328],
  },
  {
    key: 'storage', label: '存储用量', value: '1.86', suffix: 'TB',
    icon: <CloudOutlined />, bg: '#FFF7E6', color: '#FAAD14',
    sub: '剩余 3.14 TB',
    sparkline: [0.8, 1.0, 1.2, 1.4, 1.6, 1.75, 1.86],
  },
  {
    key: 'duration', label: '累计时长', value: '4,562', suffix: 'h',
    icon: <FieldTimeOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    trend: '较昨日 ↑ 86h', trendUp: true,
    sparkline: [3800, 4000, 4200, 4350, 4450, 4520, 4562],
  },
];

interface RecordItem {
  key: string;
  deviceName: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  fileSize: string;
  type: string;
  duration: string;
  channel: string;
  status: string;
}

const recordData: RecordItem[] = [
  { key: '1', deviceName: '井下摄像头 CAM-001', deviceId: 'CAM-001', startTime: '2025-05-20 08:00', endTime: '2025-05-20 12:00', fileSize: '2.35 GB', type: '主码流', duration: '4h 00min', channel: 'CH1', status: '已完成' },
  { key: '2', deviceName: '井下摄像头 CAM-002', deviceId: 'CAM-002', startTime: '2025-05-20 08:00', endTime: '2025-05-20 12:00', fileSize: '1.98 GB', type: '主码流', duration: '4h 00min', channel: 'CH1', status: '已完成' },
  { key: '3', deviceName: '井下摄像头 CAM-003', deviceId: 'CAM-003', startTime: '2025-05-20 08:00', endTime: '2025-05-20 16:00', fileSize: '3.42 GB', type: '主码流', duration: '8h 00min', channel: 'CH1', status: '录制中' },
  { key: '4', deviceName: '斜井口摄像头 CAM-004', deviceId: 'CAM-004', startTime: '2025-05-20 06:00', endTime: '2025-05-20 10:30', fileSize: '1.76 GB', type: '子码流', duration: '4h 30min', channel: 'CH2', status: '已完成' },
  { key: '5', deviceName: '采掘面摄像头 CAM-005', deviceId: 'CAM-005', startTime: '2025-05-20 07:30', endTime: '2025-05-20 15:30', fileSize: '3.88 GB', type: '主码流', duration: '8h 00min', channel: 'CH1', status: '已完成' },
  { key: '6', deviceName: '机电硐室 CAM-006', deviceId: 'CAM-006', startTime: '2025-05-20 08:15', endTime: '2025-05-20 11:45', fileSize: '1.23 GB', type: '子码流', duration: '3h 30min', channel: 'CH1', status: '已完成' },
  { key: '7', deviceName: '避灾硐室 CAM-007', deviceId: 'CAM-007', startTime: '2025-05-19 20:00', endTime: '2025-05-20 08:00', fileSize: '4.56 GB', type: '主码流', duration: '12h 00min', channel: 'CH1', status: '已完成' },
  { key: '8', deviceName: '中央变电所 CAM-008', deviceId: 'CAM-008', startTime: '2025-05-20 09:00', endTime: '2025-05-20 14:00', fileSize: '2.10 GB', type: '主码流', duration: '5h 00min', channel: 'CH1', status: '已完成' },
  { key: '9', deviceName: '水泵房摄像头 CAM-009', deviceId: 'CAM-009', startTime: '2025-05-20 08:00', endTime: '—', fileSize: '1.56 GB', type: '主码流', duration: '—', channel: 'CH1', status: '录制中' },
  { key: '10', deviceName: '辅助运输巷 CAM-010', deviceId: 'CAM-010', startTime: '2025-05-20 08:00', endTime: '2025-05-20 16:00', fileSize: '3.15 GB', type: '主码流', duration: '8h 00min', channel: 'CH1', status: '已完成' },
  { key: '11', deviceName: '回风巷摄像头 CAM-011', deviceId: 'CAM-011', startTime: '2025-05-20 08:00', endTime: '2025-05-20 12:00', fileSize: '1.89 GB', type: '子码流', duration: '4h 00min', channel: 'CH2', status: '已完成' },
  { key: '12', deviceName: '井上广场 CAM-012', deviceId: 'CAM-012', startTime: '2025-05-20 06:00', endTime: '2025-05-20 18:00', fileSize: '5.02 GB', type: '主码流', duration: '12h 00min', channel: 'CH1', status: '已完成' },
];

const deviceOptions = [
  { value: 'all', label: '全部设备' },
  { value: 'CAM-001', label: 'CAM-001 井下摄像头' },
  { value: 'CAM-002', label: 'CAM-002 井下摄像头' },
  { value: 'CAM-003', label: 'CAM-003 井下摄像头' },
  { value: 'CAM-004', label: 'CAM-004 斜井口摄像头' },
  { value: 'CAM-005', label: 'CAM-005 采掘面摄像头' },
];

/* =========================================================================
   COMPONENT
   ========================================================================= */

export default function PlaybackManage() {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredRecords = useMemo(() => {
    let data = recordData;
    if (selectedDevice !== 'all') {
      data = data.filter((r) => r.deviceId === selectedDevice);
    }
    if (searchText) {
      data = data.filter((r) =>
        r.deviceName.includes(searchText) || r.deviceId.includes(searchText)
      );
    }
    return data;
  }, [selectedDevice, searchText]);

  const handlePlayback = useCallback(async (record: RecordItem) => {
    try {
      if (isPlaying) {
        await playbackStop({ device: record.deviceId });
        setIsPlaying(false);
      } else {
        await playbackStart({ device: record.deviceId, start: record.startTime, end: record.endTime });
        setIsPlaying(true);
      }
    } catch {
      // API error handled silently
    }
  }, [isPlaying]);

  const recordColumns: ColumnsType<RecordItem> = useMemo(() => [
    {
      title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 180,
      render: (v: string, r: RecordItem) => (
        <Space size={4}>
          <CameraOutlined style={{ color: r.status === '录制中' ? '#FF4D4F' : '#1677FF', fontSize: 13 }} />
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '设备编号', dataIndex: 'deviceId', key: 'deviceId', width: 100,
      render: (v: string) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 140,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 140,
      render: (v: string) => <Text style={{ fontSize: 11, color: v === '—' ? '#C9CDD4' : '#1D2129' }}>{v}</Text>,
    },
    {
      title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 100,
      render: (v: string) => <Text strong style={{ fontSize: 12, color: '#0052D9' }}>{v}</Text>,
    },
    {
      title: '码流类型', dataIndex: 'type', key: 'type', width: 80,
      render: (v: string) => (
        <Tag color={v === '主码流' ? 'blue' : 'green'} style={{ fontSize: 10, margin: 0 }}>{v}</Tag>
      ),
    },
    {
      title: '时长', dataIndex: 'duration', key: 'duration', width: 90,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '通道', dataIndex: 'channel', key: 'channel', width: 60,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => (
        <Tag color={s === '录制中' ? 'red' : 'green'} style={{ fontSize: 10, margin: 0 }}>
          {s === '录制中' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#FF4D4F', marginRight: 4, animation: 'playbackBlink 1.5s infinite' }} />}
          {s}
        </Tag>
      ),
    },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 140,
      render: (_: unknown, record: RecordItem) => (
        <Space size={[4, 4]}>
          <a style={{ fontSize: 11 }} onClick={() => handlePlayback(record)}>
            <PlayCircleOutlined /> 回放
          </a>
          <a style={{ fontSize: 11 }}>
            <DownloadOutlined style={{ fontSize: 10 }} /> 下载
          </a>
        </Space>
      ),
    },
  ], [handlePlayback]);

  const sparklineColors = ['#0052D9', '#2BA471', '#FAAD14', '#7B61FF'];

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

  const storageChartOption = useMemo(() => {
    const days = ['05-14', '05-15', '05-16', '05-17', '05-18', '05-19', '05-20'];
    const used = [1.2, 1.3, 1.42, 1.55, 1.68, 1.78, 1.86];
    const total = [5, 5, 5, 5, 5, 5, 5];
    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E5E6EB',
        textStyle: { fontSize: 11 },
      },
      grid: { left: 46, right: 20, top: 12, bottom: 28 },
      xAxis: {
        type: 'category' as const, data: days,
        axisLabel: { fontSize: 10, color: '#86909C' },
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const, name: 'TB', max: 6,
        nameTextStyle: { fontSize: 10, color: '#86909C' },
        axisLabel: { fontSize: 10, color: '#86909C' },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
      },
      series: [
        {
          name: '已用空间', type: 'line' as const, data: used,
          smooth: true, symbol: 'circle', symbolSize: 4,
          lineStyle: { color: '#FAAD14', width: 2.5 },
          itemStyle: { color: '#FAAD14' },
          areaStyle: {
            color: {
              type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(250,173,20,0.15)' },
                { offset: 1, color: 'rgba(250,173,20,0)' },
              ],
            },
          },
        },
        {
          name: '总容量', type: 'line' as const, data: total,
          smooth: false, symbol: 'none',
          lineStyle: { color: '#E5E6EB', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#E5E6EB' },
        },
      ],
      legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 8 },
    };
  }, []);

  return (
    <>
      <style>{PlaybackCSS}</style>
      <div className="playback-root">

        {/* ===== Header + Filters ===== */}
        <Card bodyStyle={{ padding: '12px 20px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={12}>
                <Title level={5} style={{ margin: 0 }}>录像回放</Title>
                <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>NVR录像管理</Tag>
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <Select
                  size="small"
                  value={selectedDevice}
                  onChange={setSelectedDevice}
                  style={{ width: 200 }}
                  options={deviceOptions}
                  placeholder="选择设备"
                />
                <RangePicker
                  size="small"
                  defaultValue={[dayjs('2025-05-20 06:00'), dayjs('2025-05-20 18:00')]}
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: 320 }}
                />
                <Button size="small" icon={<FilterOutlined />}>筛选</Button>
                <Button size="small" icon={<ReloadOutlined />}>刷新</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ===== KPI Cards ===== */}
        <Row gutter={[10, 10]}>
          {statCards.map((s, i) => (
            <Col span={6} key={s.key}>
              <Card className="playback-kpi-card" size="small">
                <div className="playback-kpi-inner">
                  <div className="playback-kpi-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="playback-kpi-body">
                    <div className="playback-kpi-label">{s.label}</div>
                    <div className="playback-kpi-value">
                      {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: '#86909C' }}> {s.suffix}</span>
                    </div>
                    {s.trend && (
                      <div className="playback-kpi-trend" style={{ color: s.trendUp ? '#FF4D4F' : '#52C41A' }}>
                        {s.trendUp ? <CaretUpOutlined /> : <CaretDownOutlined />}
                        {s.trend}
                      </div>
                    )}
                    {s.sub && <div className="playback-kpi-trend" style={{ color: '#86909C' }}>{s.sub}</div>}
                  </div>
                </div>
                <div style={{ height: 32, marginTop: 4 }}>
                  <ReactECharts option={getSparklineOption(s.sparkline, sparklineColors[i])} style={{ height: 32 }} opts={{ renderer: 'svg' }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ===== Player + Chart ===== */}
        <Row gutter={[10, 10]}>
          <Col span={14}>
            <Card
              title={<Space><VideoCameraOutlined style={{ color: '#1677FF' }} /><Text strong style={{ fontSize: 14 }}>录像播放器</Text></Space>}
              styles={{ body: { padding: 0 } }}
            >
              <div className="playback-player">
                <div className="playback-player-grid" />

                {/* Placeholder mine camera view */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <CameraOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    选择录像文件后播放
                  </div>
                </div>

                {/* Overlay: timestamp + device info */}
                <div className="playback-player-info">
                  <Row justify="space-between" align="bottom">
                    <Col>
                      <Space size={16}>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                          <CameraOutlined style={{ marginRight: 4 }} />CAM-001 井下摄像头
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                          CH1 · 主码流 · H.265
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 13 }}>
                        2025-05-20 10:29:31
                      </Text>
                    </Col>
                  </Row>
                </div>

                {/* Recording indicator */}
                {isPlaying && (
                  <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4D4F', animation: 'playbackBlink 1s infinite' }} />
                    <Text style={{ color: '#FF4D4F', fontSize: 11, fontWeight: 500 }}>回放中</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col span={10}>
            <Card
              title={<Space><CloudOutlined style={{ color: '#FAAD14' }} /><Text strong style={{ fontSize: 14 }}>存储空间趋势</Text></Space>}
              styles={{ body: { padding: '4px 6px' } }}
            >
              <ReactECharts option={storageChartOption} style={{ height: 315 }} />
            </Card>
          </Col>
        </Row>

        {/* ===== Record List Table ===== */}
        <Card
          className="playback-table-card"
          title={
            <Space>
              <Text strong style={{ fontSize: 14 }}>录像列表</Text>
              <Tag style={{ margin: 0 }}>共 {filteredRecords.length} 条</Tag>
            </Space>
          }
          extra={
            <Space size={8}>
              <Input.Search
                placeholder="搜索设备名称/编号"
                allowClear
                size="small"
                style={{ width: 200 }}
                onSearch={setSearchText}
              />
              <Button size="small" icon={<DownloadOutlined />}>批量下载</Button>
            </Space>
          }
        >
          <Table<RecordItem>
            columns={recordColumns}
            dataSource={filteredRecords}
            size="small"
            scroll={{ x: 1200 }}
            pagination={{
              size: 'small',
              pageSize: 8,
              showTotal: (t) => `共 ${t} 条录像`,
              showSizeChanger: true,
              pageSizeOptions: ['6', '8', '15'],
            }}
            rowClassName={(r) => r.status === '录制中' ? 'playback-row-recording' : ''}
          />
        </Card>

      </div>
    </>
  );
}
