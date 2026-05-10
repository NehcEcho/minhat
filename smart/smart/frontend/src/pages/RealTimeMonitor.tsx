import { useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Tag, Input, Tree, Tabs, Typography, Space, Button, Select, Progress, Tooltip, Segmented } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  VideoCameraOutlined, WifiOutlined, CloudUploadOutlined,
  HddOutlined, CameraOutlined, DashboardOutlined,
  CaretRightOutlined, SearchOutlined, ExpandOutlined,
  SoundOutlined, FullscreenOutlined, PlayCircleOutlined, SettingOutlined,
  ZoomInOutlined, ZoomOutOutlined, AimOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import TunnelMapSvg from '../components/TunnelMapSvg';

const { Text } = Typography;

const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const RED = '#ef4444';
const ORANGE = '#f97316';
const CYAN = '#06b6d4';
const PURPLE = '#8b5cf6';

const statCards = [
  {
    key: 'totalDevices',
    icon: <VideoCameraOutlined />, bg: '#E8F3FF', color: '#0052D9',
    label: '视频设备总数', value: '206', sub: '在线 192 / 离线 14',
  },
  {
    key: 'onlineRate',
    icon: <WifiOutlined />, bg: '#E8F8F2', color: '#2BA471',
    label: '在线率', value: '93.2%', sub: '今日新增 3 台',
  },
  {
    key: 'liveStreaming',
    icon: <PlayCircleOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    label: '实时推流数', value: '168', sub: '占总数的 81.6%',
  },
  {
    key: 'storage',
    icon: <HddOutlined />, bg: '#E8FFFB', color: '#14C9C9',
    label: '存储容量', value: '58.6 TB', sub: '已用 32.1 TB',
  },
  {
    key: 'todayRecording',
    icon: <CameraOutlined />, bg: '#FFF3E8', color: '#E37318',
    label: '今日录像', value: '1,024 条', sub: '较昨日 ↑ 12.4%',
  },
  {
    key: 'bandwidth',
    icon: <DashboardOutlined />, bg: '#FDECEE', color: '#D54941',
    label: '带宽占用率', value: '45.6%', sub: '上行 85Mbps / 下行 162Mbps',
  },
];

const treeData: DataNode[] = [
  {
    title: '示例矿区A (206/192)',
    key: 'root',
    children: [
      {
        title: '井上区域 (58/54)',
        key: 'aboveground',
        children: [
          { title: '调度中心 (12/12)', key: 'dispatch' },
          { title: '井口 (20/18)', key: 'wellhead' },
          { title: '变电所 (10/10)', key: 'substation' },
          { title: '风机房 (8/6)', key: 'fan-room' },
          { title: '办公楼 (8/8)', key: 'office' },
        ],
      },
      {
        title: '井下区域 (148/138)',
        key: 'underground',
        children: [
          {
            title: '一采区 (86/78)',
            key: 'area1',
            children: [
              { title: '一采区运输巷 (18/17)', key: 'a1-transport' },
              { title: '一采区回风巷 (16/14)', key: 'a1-return' },
              { title: '一采区工作面 (28/26)', key: 'a1-face' },
              { title: '一采区辅巷 (24/21)', key: 'a1-aux' },
            ],
          },
          {
            title: '二采区 (62/60)',
            key: 'area2',
            children: [
              { title: '二采区运输巷 (22/21)', key: 'a2-transport' },
              { title: '二采区回风巷 (18/18)', key: 'a2-return' },
              { title: '二采区工作面 (22/21)', key: 'a2-face' },
            ],
          },
        ],
      },
    ],
  },
];

const snapshots = [
  { id: 'MKH-1008', time: '05-20 10:30:45', stream: true },
  { id: 'MKH-1001', time: '05-20 10:30:32', stream: true },
  { id: 'MKH-1015', time: '05-20 10:30:18', stream: false },
  { id: 'MKH-1003', time: '05-20 10:30:05', stream: true },
  { id: 'MKH-1020', time: '05-20 10:29:52', stream: false },
  { id: 'MKH-1006', time: '05-20 10:29:40', stream: true },
];

const deviceAlarms = [
  { id: 1, level: '高', type: '设备离线', device: 'MKH-1016', location: '一采区回风巷', time: '10:29:31', acknowledged: false },
  { id: 2, level: '中', type: '画面丢失', device: 'MKH-1003', location: '中央变电所', time: '10:28:17', acknowledged: false },
  { id: 3, level: '中', type: '存储异常', device: 'MKH-1007', location: '一采区工作面', time: '10:25:42', acknowledged: true },
  { id: 4, level: '低', type: '带宽波动', device: 'MKH-1022', location: '二采区回风巷', time: '10:20:15', acknowledged: true },
];

const videoColumns = [
  { title: '设备编号', dataIndex: 'deviceId', key: 'deviceId', width: 100 },
  { title: '设备名称', dataIndex: 'name', key: 'name', width: 140, ellipsis: true },
  { title: '所属区域', dataIndex: 'area', key: 'area', width: 110, ellipsis: true },
  { title: '设备类型', dataIndex: 'type', key: 'type', width: 90 },
  {
    title: '状态', dataIndex: 'status', key: 'status', width: 72,
    render: (status: string) => {
      const colorMap: Record<string, string> = { '在线': 'green', '离线': 'red', '故障': 'orange' };
      return (
        <Tag color={colorMap[status] || 'default'} style={{ margin: 0, fontSize: 11 }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: colorMap[status] === 'green' ? '#2BA471' : colorMap[status] === 'red' ? '#D54941' : '#E37318',
            marginRight: 4,
          }} />
          {status}
        </Tag>
      );
    },
  },
  {
    title: '网络状态', dataIndex: 'network', key: 'network', width: 80,
    render: (network: string) => {
      if (network === '-') return <Text type="secondary">-</Text>;
      const ms = parseInt(network);
      const color = ms < 100 ? '#2BA471' : ms < 150 ? '#E37318' : '#D54941';
      return (
        <Space size={1}>
          {[1, 2, 3, 4].map((b) => (
            <div key={b} style={{
              width: 3, height: b * 4,
              background: b <= (ms < 100 ? 4 : ms < 150 ? 3 : 2) ? color : '#E5E6EB',
              borderRadius: 1,
            }} />
          ))}
          <Text style={{ fontSize: 11, marginLeft: 4 }}>{network}</Text>
        </Space>
      );
    },
  },
  { title: '码率', dataIndex: 'bitrate', key: 'bitrate', width: 85 },
  {
    title: '存储状态', dataIndex: 'storageStatus', key: 'storageStatus', width: 85,
    render: (val: string) => {
      const colorMap: Record<string, string> = { '正常': 'green', '容量不足': 'orange', '异常': 'red' };
      return (
        <Tag color={colorMap[val] || 'default'} style={{ margin: 0, fontSize: 11 }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: colorMap[val] === 'green' ? '#2BA471' : colorMap[val] === 'red' ? '#D54941' : '#E37318',
            marginRight: 4,
          }} />
          {val}
        </Tag>
      );
    },
  },
  {
    title: '操作', dataIndex: 'action', key: 'action', width: 160,
    render: () => (
      <Space size="small">
        <a style={{ fontSize: 12 }}>预览</a>
        <a style={{ fontSize: 12 }}>回放</a>
        <a style={{ fontSize: 12 }}>配置</a>
      </Space>
    ),
  },
];

const allVideoData = [
  { key: 1, deviceId: 'MKH-1008', name: 'MKH-1008 枪型摄像机', area: '一采区运输巷', type: '枪型摄像机', status: '在线', network: '45ms', bitrate: '4.2 Mbps', storageStatus: '正常' },
  { key: 2, deviceId: 'MKH-1009', name: 'MKH-1009 枪型摄像机', area: '一采区回风巷', type: '枪型摄像机', status: '在线', network: '62ms', bitrate: '3.8 Mbps', storageStatus: '正常' },
  { key: 3, deviceId: 'MKH-1010', name: 'MKH-1010 球型摄像机', area: '一采区工作面', type: '球型摄像机', status: '在线', network: '78ms', bitrate: '5.1 Mbps', storageStatus: '正常' },
  { key: 4, deviceId: 'MKH-1011', name: 'MKH-1011 枪型摄像机', area: '一采区辅巷', type: '枪型摄像机', status: '在线', network: '88ms', bitrate: '3.5 Mbps', storageStatus: '容量不足' },
  { key: 5, deviceId: 'MKH-1012', name: 'MKH-1012 枪型摄像机', area: '二采区运输巷', type: '枪型摄像机', status: '离线', network: '-', bitrate: '-', storageStatus: '异常' },
  { key: 6, deviceId: 'MKH-1013', name: 'MKH-1013 球型摄像机', area: '二采区回风巷', type: '球型摄像机', status: '在线', network: '55ms', bitrate: '4.8 Mbps', storageStatus: '正常' },
  { key: 7, deviceId: 'MKH-1014', name: 'MKH-1014 枪型摄像机', area: '二采区工作面', type: '枪型摄像机', status: '故障', network: '230ms', bitrate: '1.2 Mbps', storageStatus: '正常' },
  { key: 8, deviceId: 'MKH-1015', name: 'MKH-1015 枪型摄像机', area: '调度中心', type: '枪型摄像机', status: '在线', network: '35ms', bitrate: '6.0 Mbps', storageStatus: '正常' },
  { key: 9, deviceId: 'MKH-1016', name: 'MKH-1016 球型摄像机', area: '一采区回风巷', type: '球型摄像机', status: '离线', network: '-', bitrate: '-', storageStatus: '异常' },
  { key: 10, deviceId: 'MKH-1017', name: 'MKH-1017 枪型摄像机', area: '井口', type: '枪型摄像机', status: '在线', network: '42ms', bitrate: '4.0 Mbps', storageStatus: '正常' },
  { key: 11, deviceId: 'MKH-1018', name: 'MKH-1018 球型摄像机', area: '变电所', type: '球型摄像机', status: '故障', network: '310ms', bitrate: '0.8 Mbps', storageStatus: '正常' },
  { key: 12, deviceId: 'MKH-1019', name: 'MKH-1019 枪型摄像机', area: '风机房', type: '枪型摄像机', status: '在线', network: '52ms', bitrate: '3.2 Mbps', storageStatus: '容量不足' },
];

const tableTabs = [
  { key: '全部', label: '全部 206' },
  { key: '在线', label: '在线 192' },
  { key: '离线', label: '离线 14' },
  { key: '故障', label: '故障 8' },
];

const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
const onlineRateData = [91.2, 92.1, 92.8, 93.0, 93.5, 93.2, 93.8, 94.1, 93.6, 93.9, 93.4, 93.2];
const uploadData = [62, 58, 55, 70, 88, 90, 85, 92, 80, 78, 72, 75];
const downloadData = [120, 115, 110, 135, 165, 170, 162, 175, 155, 148, 140, 145];
const recordingData = [78, 65, 52, 48, 72, 98, 110, 108, 95, 88, 82, 74];

const onlineRateTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 36, right: 12, top: 16, bottom: 24 },
  xAxis: {
    type: 'category',
    data: hours,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#9ca3af', fontSize: 10, interval: 1, rotate: 30 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    min: 88,
    max: 96,
    axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '{value}%' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  series: [{
    name: '在线率',
    type: 'line',
    data: onlineRateData,
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    lineStyle: { color: '#22c55e', width: 2 },
    itemStyle: { color: '#22c55e' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(34,197,94,0.25)' },
          { offset: 1, color: 'rgba(34,197,94,0.02)' },
        ],
      },
    },
  }],
};

const bandwidthOption = {
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['上行', '下行'],
    right: 8,
    top: 2,
    textStyle: { fontSize: 10, color: '#6b7280' },
    itemWidth: 10,
    itemHeight: 6,
  },
  grid: { left: 42, right: 12, top: 28, bottom: 24 },
  xAxis: {
    type: 'category',
    data: hours,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#9ca3af', fontSize: 10, interval: 1, rotate: 30 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '{value}' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  series: [
    {
      name: '上行',
      type: 'bar',
      data: uploadData,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: 'rgba(59,130,246,0.3)' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 10,
    },
    {
      name: '下行',
      type: 'line',
      data: downloadData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 3,
      lineStyle: { color: '#f97316', width: 2 },
      itemStyle: { color: '#f97316' },
    },
  ],
};

const storageGaugeOption = {
  tooltip: { show: false },
  series: [
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      center: ['50%', '55%'],
      radius: '85%',
      min: 0,
      max: 100,
      progress: { show: true, width: 12, itemStyle: { color: '#06b6d4' } },
      axisLine: { lineStyle: { width: 12, color: [[0.547, '#06b6d4'], [1, '#e5e7eb']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color: '#1f2937',
        fontSize: 20,
        fontWeight: 700,
        offsetCenter: [0, '60%'],
      },
      title: { show: false },
      data: [{ value: 54.7, name: '已用' }],
    },
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      center: ['50%', '55%'],
      radius: '85%',
      min: 0,
      max: 100,
      progress: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      data: [],
      markPoint: { show: false },
      silent: true,
      animation: false,
      pointer: { show: false },
    },
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '38%',
      style: {
        text: '已用 32.1TB / 58.6TB',
        textAlign: 'center',
        fill: '#6b7280',
        fontSize: 10,
      },
    },
  ],
};

const recordingTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 42, right: 12, top: 16, bottom: 24 },
  xAxis: {
    type: 'category',
    data: hours,
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#9ca3af', fontSize: 10, interval: 1, rotate: 30 },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '{value}' },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
  },
  series: [{
    name: '录像数量',
    type: 'bar',
    data: recordingData,
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#8b5cf6' },
          { offset: 1, color: 'rgba(139,92,246,0.3)' },
        ],
      },
      borderRadius: [4, 4, 0, 0],
    },
    barWidth: 14,
    emphasis: {
      itemStyle: { color: '#7c3aed' },
    },
  }],
};

const alarmList = [
  { id: 1, device: 'MKH-1016', location: '一采区回风巷', time: '10:29:31', },
  { id: 2, device: 'MKH-1003', location: '中央变电所', time: '10:28:17', },
  { id: 3, device: 'MKH-1007', location: '一采区工作面', time: '10:25:42', },
];

export default function RealTimeMonitor() {
  const [tableFilter, setTableFilter] = useState('全部');
  const [selectedSnapshot, setSelectedSnapshot] = useState(0);
  const [treeSearch, setTreeSearch] = useState('');
  const [mapZoom, setMapZoom] = useState(100);
  const [viewMode, setViewMode] = useState<string>('standard');
  const [currentDevice, setCurrentDevice] = useState({
    id: 'MKH-1008',
    type: '枪型摄像机',
    area: '一采区运输巷',
    location: 'K2+430 左侧',
  });

  const filteredData = useMemo(() => {
    if (tableFilter === '全部') return allVideoData;
    return allVideoData.filter((item) => item.status === tableFilter);
  }, [tableFilter]);

  const filteredTreeData = useMemo(() => {
    if (!treeSearch.trim()) return treeData;
    const filter = (nodes: DataNode[]): DataNode[] => {
      const results: DataNode[] = [];
      for (const node of nodes) {
        const title = String(node.title).toLowerCase();
        const match = title.includes(treeSearch.toLowerCase());
        const children = node.children ? filter(node.children) : undefined;
        if (match || (children && children.length > 0)) {
          results.push({ ...node, children: children && children.length > 0 ? children : node.children });
        }
      }
      return results;
    };
    return filter(treeData);
  }, [treeSearch]);

  const expandedKeys = useMemo(() => {
    if (!treeSearch.trim()) return ['root', 'underground', 'area1', 'area2', 'aboveground'];
    const collectKeys = (nodes: DataNode[]): string[] => {
      const keys: string[] = [];
      for (const node of nodes) {
        keys.push(node.key as string);
        if (node.children) keys.push(...collectKeys(node.children));
      }
      return keys;
    };
    return collectKeys(filteredTreeData);
  }, [filteredTreeData, treeSearch]);

  const titleRender = useCallback((nodeData: DataNode) => {
    const title = String(nodeData.title ?? '');
    const match = title.match(/^(.*?) \((\d+)\/(\d+)\)$/);
    if (match) {
      const online = parseInt(match[2]);
      const total = parseInt(match[3]);
      const allOnline = online === total;
      const hasFault = !allOnline && online > 0;
      return (
        <span>
          {match[1]}{' '}
          <span style={{
            color: allOnline ? '#2BA471' : hasFault ? '#E37318' : '#D54941',
            fontWeight: 500,
            fontSize: 12,
          }}>
            ({match[2]}/{match[3]})
          </span>
        </span>
      );
    }
    return <span>{title}</span>;
  }, []);

  const handleSnapshotPrev = () => setSelectedSnapshot((p) => (p > 0 ? p - 1 : snapshots.length - 1));
  const handleSnapshotNext = () => setSelectedSnapshot((p) => (p < snapshots.length - 1 ? p + 1 : 0));

  const handleZoomIn = () => setMapZoom((z) => Math.min(z + 10, 200));
  const handleZoomOut = () => setMapZoom((z) => Math.max(z - 10, 50));
  const handleZoomReset = () => setMapZoom(100);

  return (
    <div>
      {/* Top Utility Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, gap: 12, flexWrap: 'wrap',
      }}>
        <Space size={8}>
          <Text strong style={{ fontSize: 16, color: '#1f2937' }}>实时监控</Text>
          <Tag color="processing" style={{ fontSize: 10 }}>运行中</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            刷新间隔 5s | 数据更新于 2025-05-20 10:30:45
          </Text>
        </Space>
        <Space size={8}>
          <Select defaultValue="all" size="small" style={{ width: 130 }}>
            <Select.Option value="all">全部区域</Select.Option>
            <Select.Option value="aboveground">井上区域</Select.Option>
            <Select.Option value="underground">井下区域</Select.Option>
          </Select>
          <Segmented
            size="small"
            value={viewMode}
            onChange={(v) => setViewMode(v as string)}
            options={[
              { label: '标准', value: 'standard' },
              { label: '紧凑', value: 'compact' },
              { label: '宽屏', value: 'wide' },
            ]}
          />
          <Button size="small" icon={<SettingOutlined />}>自定义布局</Button>
          <Button type="primary" size="small" icon={<FullscreenOutlined />}>大屏模式</Button>
        </Space>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[12, 12]}>
        {statCards.map((card) => (
          <Col span={4} key={card.key}>
            <Card
              bodyStyle={{ padding: '10px 14px' }}
              hoverable
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div className="stat-card-icon" style={{
                  background: card.bg, color: card.color,
                  flexShrink: 0, width: 40, height: 40, borderRadius: 10, fontSize: 18,
                }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="kpi-label" style={{ marginTop: 0, fontSize: 11 }}>{card.label}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, lineHeight: 1.2,
                    color: card.key === 'todayRecording' ? '#E37318' : '#1f2937',
                  }}>
                    {card.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>{card.sub}</Text>
                    {card.key === 'todayRecording' && (
                      <span style={{
                        fontSize: 10, color: '#22c55e',
                        display: 'inline-flex', alignItems: 'center', gap: 1,
                      }}>
                        ↑
                      </span>
                    )}
                    {card.key === 'onlineRate' && (
                      <div style={{ width: 40, height: 14 }}>
                        <ReactECharts
                          option={{
                            grid: { left: 0, right: 0, top: 0, bottom: 0 },
                            xAxis: { show: false, data: hours },
                            yAxis: { show: false, min: 90, max: 95 },
                            series: [{
                              type: 'line',
                              data: onlineRateData,
                              smooth: true,
                              symbol: 'none',
                              lineStyle: { color: '#22c55e', width: 1.5 },
                              areaStyle: { color: 'rgba(34,197,94,0.15)' },
                            }],
                          }}
                          style={{ height: 14, width: 40 }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}
                    {card.key === 'bandwidth' && (
                      <div style={{ width: 40, height: 14 }}>
                        <ReactECharts
                          option={{
                            grid: { left: 0, right: 0, top: 0, bottom: 0 },
                            xAxis: { show: false, data: hours },
                            yAxis: { show: false },
                            series: [{
                              type: 'line',
                              data: downloadData,
                              smooth: true,
                              symbol: 'none',
                              lineStyle: { color: '#ef4444', width: 1.5 },
                              areaStyle: { color: 'rgba(239,68,68,0.12)' },
                            }],
                          }}
                          style={{ height: 14, width: 40 }}
                          opts={{ renderer: 'svg' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col span={8}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>在线率趋势 (24h)</Text>}
            bodyStyle={{ padding: '4px 0' }}
          >
            <ReactECharts option={onlineRateTrendOption} style={{ height: 180 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>带宽流量监控</Text>}
            bodyStyle={{ padding: '4px 0' }}
          >
            <ReactECharts option={bandwidthOption} style={{ height: 180 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>今日录像统计</Text>}
            bodyStyle={{ padding: '4px 0' }}
          >
            <ReactECharts option={recordingTrendOption} style={{ height: 180 }} />
          </Card>
        </Col>
      </Row>

      {/* Three Column Section: Tree Nav + Map & Thumbnails + Video & Info */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        {/* Left: Tree Navigation */}
        <Col span={5}>
          <Card
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>设备区域导航</span>}
            size="small"
            bodyStyle={{ padding: 12 }}
          >
            <Input
              placeholder="搜索设备/区域"
              prefix={<SearchOutlined />}
              size="small"
              allowClear
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <Tree
                treeData={filteredTreeData}
                defaultExpandedKeys={expandedKeys}
                expandedKeys={expandedKeys}
                blockNode
                style={{ fontSize: 12 }}
                titleRender={titleRender}
              />
            </div>
            <div style={{
              display: 'flex', gap: 12, marginTop: 10, paddingTop: 10,
              borderTop: '1px solid #F0F0F0', fontSize: 11,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2BA471', display: 'inline-block' }} />
                在线
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D54941', display: 'inline-block' }} />
                离线
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#E37318', fontSize: 12, fontWeight: 700 }}>▲</span>
                故障
              </span>
            </div>
          </Card>
        </Col>

        {/* Center: Map + Thumbnail Strip */}
        <Col span={11}>
          <Card
            size="small"
            bodyStyle={{ padding: 0 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Space size={6}>
                  <Text style={{ fontSize: 12, color: '#86909C' }}>井下总览</Text>
                  <Text style={{ fontSize: 12, color: '#C9CDD4' }}>/</Text>
                  <Text style={{ fontSize: 12, color: '#1D2129', fontWeight: 500 }}>一采区运输巷</Text>
                </Space>
                <Space size={8}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2BA471', display: 'inline-block' }} />
                    在线 17/18
                  </span>
                  <Tooltip title="全屏">
                    <ExpandOutlined style={{ fontSize: 14, cursor: 'pointer', color: '#86909C' }} />
                  </Tooltip>
                </Space>
              </div>
            }
          >
            {/* Map Container with Zoom Overlay */}
            <div style={{ height: 310, position: 'relative', overflow: 'hidden', background: '#f0f5f0' }}>
              <div style={{ transform: `scale(${mapZoom / 100})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
                <TunnelMapSvg />
              </div>

              {/* Camera FOV Cones (overlay on top of SVG map) */}
              <svg style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none',
              }} viewBox="0 0 500 320">
                <defs>
                  <radialGradient id="fovGrad-active">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </radialGradient>
                  <radialGradient id="fovGrad-stream">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </radialGradient>
                </defs>
                {/* Camera FOVs */}
                {[
                  { x: 100, y: 80, angle: 45, active: true },
                  { x: 180, y: 140, angle: -30, active: true },
                  { x: 260, y: 100, angle: 15, active: true },
                  { x: 200, y: 200, angle: 60, active: false },
                  { x: 320, y: 180, angle: -45, active: true },
                  { x: 380, y: 130, angle: -15, active: true },
                  { x: 400, y: 220, angle: 30, active: false },
                ].map((cam, i) => (
                  <g key={i} style={{ animation: cam.active ? `pulse-fov ${2 + i * 0.3}s ease-in-out infinite` : 'none' }}>
                    <path
                      d={`M ${cam.x} ${cam.y} L ${cam.x + Math.cos((cam.angle - 20) * Math.PI / 180) * 50} ${cam.y + Math.sin((cam.angle - 20) * Math.PI / 180) * 50} A 55 55 0 0 1 ${cam.x + Math.cos((cam.angle + 20) * Math.PI / 180) * 50} ${cam.y + Math.sin((cam.angle + 20) * Math.PI / 180) * 50} Z`}
                      fill={cam.active ? 'url(#fovGrad-active)' : 'url(#fovGrad-stream)'}
                    />
                    <line
                      x1={cam.x} y1={cam.y}
                      x2={cam.x + Math.cos((cam.angle - 20) * Math.PI / 180) * 45}
                      y2={cam.y + Math.sin((cam.angle - 20) * Math.PI / 180) * 45}
                      stroke={cam.active ? '#3b82f6' : '#d1d5db'}
                      strokeWidth={0.5}
                      strokeDasharray="3 4"
                      opacity={0.6}
                    />
                    <line
                      x1={cam.x} y1={cam.y}
                      x2={cam.x + Math.cos((cam.angle + 20) * Math.PI / 180) * 45}
                      y2={cam.y + Math.sin((cam.angle + 20) * Math.PI / 180) * 45}
                      stroke={cam.active ? '#3b82f6' : '#d1d5db'}
                      strokeWidth={0.5}
                      strokeDasharray="3 4"
                      opacity={0.6}
                    />
                  </g>
                ))}
              </svg>

              {/* Floating Zoom Controls */}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                display: 'flex', flexDirection: 'column', gap: 4,
                zIndex: 10,
              }}>
                {[
                  { icon: <ZoomInOutlined style={{ fontSize: 12 }} />, action: handleZoomIn, tip: '放大' },
                  { icon: <ZoomOutOutlined style={{ fontSize: 12 }} />, action: handleZoomOut, tip: '缩小' },
                  { icon: <AimOutlined style={{ fontSize: 12 }} />, action: handleZoomReset, tip: '复位' },
                  { icon: <ApartmentOutlined style={{ fontSize: 12 }} />, action: () => {}, tip: '图层' },
                ].map((btn, i) => (
                  <Tooltip key={i} title={btn.tip} placement="left">
                    <div
                      onClick={btn.action}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6b7280',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.15s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0052D9'; (e.currentTarget as HTMLElement).style.borderColor = '#0052D9'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
                    >
                      {btn.icon}
                    </div>
                  </Tooltip>
                ))}
              </div>

              {/* Zoom indicator */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                fontSize: 9, padding: '2px 6px', borderRadius: 3,
                zIndex: 10,
              }}>
                {mapZoom}%
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div style={{
              padding: '6px 12px', display: 'flex', gap: 8, overflowX: 'auto',
              background: '#fafafa', borderTop: '1px solid #F0F0F0', alignItems: 'center',
            }}>
              <div
                onClick={handleSnapshotPrev}
                style={{ flexShrink: 0, cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '0 2px' }}
              >
                ◀
              </div>
              {snapshots.map((shot, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedSnapshot(i)}
                  style={{
                    minWidth: 104, width: 104, height: 64,
                    background: i === selectedSnapshot ? '#1a2332' : '#2d3748',
                    borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                    border: i === selectedSnapshot ? `2px solid ${BLUE}` : '1px solid #4a5568',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <VideoCameraOutlined style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.18)',
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }} />
                  {shot.stream && (
                    <span style={{
                      position: 'absolute', top: 4, left: 4,
                      width: 6, height: 6, borderRadius: '50%', background: GREEN,
                      boxShadow: `0 0 4px ${GREEN}`,
                    }} />
                  )}
                  <Text style={{
                    position: 'absolute', bottom: 3, left: 5,
                    fontSize: 8, color: i === selectedSnapshot ? BLUE : 'rgba(255,255,255,0.7)',
                  }}>
                    {shot.time}
                  </Text>
                  <Text style={{
                    position: 'absolute', top: 3, right: 5,
                    fontSize: 7, color: 'rgba(255,255,255,0.35)',
                    fontWeight: 500,
                  }}>
                    {shot.id}
                  </Text>
                  {i === selectedSnapshot && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2, background: BLUE,
                    }} />
                  )}
                </div>
              ))}
              <div
                onClick={handleSnapshotNext}
                style={{ flexShrink: 0, cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '0 2px' }}
              >
                ▶
              </div>
            </div>
          </Card>
        </Col>

        {/* Right: Video Preview + Device Info + Alarms */}
        <Col span={8}>
          <Row gutter={[0, 12]}>
            {/* Current Preview */}
            <Col span={24}>
              <Card
                title={
                  <Space size={8}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>实时预览</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#2BA471',
                        display: 'inline-block', animation: 'pulse 1.5s infinite',
                      }} />
                      推流中
                    </span>
                  </Space>
                }
                size="small"
                bodyStyle={{ padding: 12 }}
              >
                {/* 16:9 Video Player */}
                <div style={{
                  width: '100%', paddingBottom: '56.25%', position: 'relative',
                  background: '#0f172a', borderRadius: 8, overflow: 'hidden', marginBottom: 8,
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%)',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.03) 2px, rgba(59,130,246,0.03) 4px)',
                  }} />

                  {/* Crosshair overlay */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 48, height: 48, pointerEvents: 'none',
                  }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(59,130,246,0.3)' }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(59,130,246,0.3)' }} />
                  </div>

                  {/* Timestamp overlay */}
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    fontFamily: 'monospace', letterSpacing: 0.5,
                    backdropFilter: 'blur(4px)',
                  }}>
                    2025-05-20 10:30:45
                  </div>

                  {/* Device name overlay */}
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 11, padding: '3px 8px', borderRadius: 4,
                    backdropFilter: 'blur(4px)',
                  }}>
                    MKH-1008 · 一采区运输巷
                  </div>

                  {/* Recording indicator */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, color: '#ef4444', fontWeight: 600,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                      animation: 'pulse 1s infinite',
                    }} />
                    REC
                  </div>

                  {/* Bottom controls */}
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6,
                  }}>
                    {[
                      { Icon: CameraOutlined, label: '截图' },
                      { Icon: SoundOutlined, label: '音频' },
                      { Icon: ExpandOutlined, label: '全屏' },
                    ].map(({ Icon, label }, i) => (
                      <Tooltip key={i} title={label}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          <Icon style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Device Info Grid - 2 columns */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '4px 20px', fontSize: 12, marginBottom: 6,
                }}>
                  {[
                    ['设备编号', currentDevice.id],
                    ['设备类型', currentDevice.type],
                    ['所属区域', currentDevice.area],
                    ['安装位置', currentDevice.location],
                    ['存储状态', '正常'],
                    ['网络状态', '45ms / 4格'],
                    ['带宽上行', '2.6 Mbps'],
                    ['带宽下行', '5.4 Mbps'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
                      <Text style={{
                        fontSize: 11, fontWeight: 500,
                        color: val === '正常' ? '#2BA471' : '#1f2937',
                      }}>
                        {val}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Storage progress bar */}
                <div style={{ marginTop: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                    <Text type="secondary">本地存储</Text>
                    <Text style={{ fontWeight: 500 }}>128GB / 256GB</Text>
                  </div>
                  <Progress
                    percent={50}
                    showInfo={false}
                    size="small"
                    strokeColor={{
                      '0%': '#22c55e',
                      '100%': '#06b6d4',
                    }}
                    trailColor="#f3f4f6"
                  />
                </div>
              </Card>
            </Col>

            {/* Equipment Alarms */}
            <Col span={24}>
              <Card
                title={
                  <Space size={8}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>设备告警</span>
                    <span className="stat-badge red">4条</span>
                  </Space>
                }
                extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
                size="small"
                bodyStyle={{ padding: '4px 12px' }}
              >
                {deviceAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '7px 0',
                      borderBottom: alarm.id < deviceAlarms.length ? '1px solid #F5F5F5' : 'none',
                      gap: 10, opacity: alarm.acknowledged ? 0.5 : 1,
                    }}
                  >
                    <span style={{
                      color: alarm.level === '高' ? '#ef4444' : alarm.level === '中' ? '#f97316' : '#3b82f6',
                      fontSize: 14, fontWeight: 700, flexShrink: 0, lineHeight: 1,
                    }}>▲</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: 600 }}>{alarm.type}</Text>
                        <Tag
                          color={alarm.level === '高' ? 'error' : alarm.level === '中' ? 'warning' : 'processing'}
                          style={{ fontSize: 9, lineHeight: '16px', padding: '0 4px', margin: 0 }}
                        >
                          {alarm.level}
                        </Tag>
                      </div>
                      <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                        {alarm.device} · {alarm.location} · {alarm.time}
                      </Text>
                    </div>
                    {!alarm.acknowledged && (
                      <Button type="link" size="small" style={{ fontSize: 11, padding: 0, height: 20 }}>
                        确认
                      </Button>
                    )}
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Bottom: Storage Gauge + Video Device Status Table */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col span={6}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>存储容量</Text>}
            bodyStyle={{ padding: 0 }}
          >
            <ReactECharts option={storageGaugeOption} style={{ height: 220 }} />
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px',
              padding: '0 16px 12px', fontSize: 11,
            }}>
              {[
                ['总容量', '58.6 TB'],
                ['已使用', '32.1 TB'],
                ['剩余', '26.5 TB'],
                ['录像保留', '30 天'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{k}</Text>
                  <Text strong>{v}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={18}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>视频设备状态</span>
                <Space size={4}>
                  <Tag color="green" style={{ margin: 0 }}>在线 192</Tag>
                  <Tag color="red" style={{ margin: 0 }}>离线 14</Tag>
                  <Tag color="orange" style={{ margin: 0 }}>故障 8</Tag>
                </Space>
              </div>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Tabs
              activeKey={tableFilter}
              onChange={setTableFilter}
              size="small"
              style={{ padding: '0 16px' }}
              items={tableTabs}
            />
            <Table
              columns={videoColumns}
              dataSource={filteredData}
              pagination={{
                pageSize: 6,
                showSizeChanger: false,
                showTotal: (total: number) => `共 ${total} 条`,
              }}
              size="small"
              scroll={{ x: 860 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Animation keyframes injected via style tag */}
      <style>{`
        @keyframes pulse-fov {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
