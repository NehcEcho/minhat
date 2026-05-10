import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Button, Select, Space, Typography, Tooltip, Dropdown, Skeleton } from 'antd';
import {
  TeamOutlined, ToolOutlined, GlobalOutlined,
  CloudServerOutlined, AlertOutlined, AimOutlined,
  ArrowUpOutlined, CaretUpOutlined, CaretDownOutlined,
  DownloadOutlined, ReloadOutlined,
  ZoomInOutlined, ZoomOutOutlined, CompassOutlined,
  EnvironmentOutlined, LineChartOutlined, SyncOutlined,
  CameraOutlined, PushpinOutlined, FilterOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import WorldMapSvg from '../components/WorldMapSvg';
import { getDashboardStats, getAlarmList, getEmployeeList, getDeviceList } from '../api';

const { Text } = Typography;

const SPARKLINE_DATA: Record<string, number[]> = {
  globalOnlinePersonnel: [1080, 1120, 1150, 1180, 1210, 1240, 1268],
  globalOnlineDevices: [3100, 3220, 3350, 3410, 3530, 3600, 3652],
  countries: [25, 27, 28, 29, 30, 31, 32],
  totalTerminals: [5200, 5350, 5500, 5580, 5680, 5740, 5842],
  globalTodayAlarms: [18, 20, 22, 21, 24, 23, 28],
  globalAvgAccuracy: [3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.2],
};

const SPARKLINE_COLORS: Record<string, string> = {
  globalOnlinePersonnel: '#0052D9',
  globalOnlineDevices: '#2BA471',
  countries: '#14C9C9',
  totalTerminals: '#7B61FF',
  globalTodayAlarms: '#D54941',
  globalAvgAccuracy: '#E37318',
};

const getSparklineOption = (data: number[], color: string) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, data: data.map((_, i) => i) },
    yAxis: { show: false, min: min - (max - min) * 0.15, max: max + (max - min) * 0.15 },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 1.8 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${color}35` },
            { offset: 1, color: `${color}05` },
          ],
        },
      },
    }],
  };
};

const statCards = [
  {
    key: 'globalOnlinePersonnel',
    icon: <TeamOutlined />, bg: '#E8F3FF', color: '#0052D9',
    label: '全球在线人员', value: '1,268', unit: '人', trend: '较昨日 ↑ 8.6%', trendUp: true,
  },
  {
    key: 'globalOnlineDevices',
    icon: <ToolOutlined />, bg: '#E8F8F2', color: '#2BA471',
    label: '全球在线设备', value: '3,652', unit: '台', trend: '较昨日 ↑ 6.3%', trendUp: true,
  },
  {
    key: 'countries',
    icon: <GlobalOutlined />, bg: '#E8FFFB', color: '#14C9C9',
    label: '覆盖国家/地区', value: '32', unit: '个', trend: '较昨日 ↑ 2', trendUp: true,
  },
  {
    key: 'totalTerminals',
    icon: <CloudServerOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    label: '总定位终端数', value: '5,842', unit: '台', trend: '较昨日 ↑ 7.4%', trendUp: true,
  },
  {
    key: 'globalTodayAlarms',
    icon: <AlertOutlined />, bg: '#FDECEE', color: '#D54941',
    label: '今日总报警', value: '28', unit: '起', trend: '较昨日 ↑ 27.3%', trendUp: false,
  },
  {
    key: 'globalAvgAccuracy',
    icon: <AimOutlined />, bg: '#FFF3E8', color: '#E37318',
    label: '平均定位精度', value: '3.2', unit: '米', trend: '较昨日 ↓ 0.6 米', trendUp: true,
  },
];

const regionDataRaw = [
  { key: 1, region: '亚太', regionEn: 'asia', online: 632, ratio: '49.8%', trend: '↑ 10.2%', trendUp: true },
  { key: 2, region: '非洲', regionEn: 'africa', online: 286, ratio: '22.5%', trend: '↑ 6.1%', trendUp: true },
  { key: 3, region: '欧洲', regionEn: 'europe', online: 178, ratio: '14.0%', trend: '↓ 1.3%', trendUp: false },
  { key: 4, region: '美洲', regionEn: 'americas', online: 132, ratio: '10.4%', trend: '↑ 3.8%', trendUp: true },
  { key: 5, region: '其他', regionEn: 'other', online: 40, ratio: '3.3%', trend: '↓ 0.6%', trendUp: false },
];

const getMapClusters = (region: string) => {
  const allClusters = [
    { left: '78%', top: '25%', count: 56, color: '#2BA471', region: 'asia' },
    { left: '56%', top: '52%', count: 128, color: '#E37318', region: 'asia' },
    { left: '30%', top: '30%', count: 42, color: '#2BA471', region: 'americas' },
    { left: '22%', top: '62%', count: 32, color: '#2BA471', region: 'africa' },
    { left: '45%', top: '22%', count: 36, color: '#2BA471', region: 'europe' },
  ];
  if (region === 'all') return allClusters;
  return allClusters.filter((c) => c.region === region);
};

const getAlarmPoints = (region: string) => {
  const allPoints = [
    { left: '32%', top: '38%', level: '高', region: 'africa' },
    { left: '58%', top: '50%', level: '中', region: 'asia' },
    { left: '78%', top: '28%', level: '高', region: 'asia' },
    { left: '24%', top: '65%', level: '中', region: 'africa' },
    { left: '84%', top: '56%', level: '低', region: 'other' },
    { left: '40%', top: '18%', level: '高', region: 'europe' },
  ];
  if (region === 'all') return allPoints;
  return allPoints.filter((a) => a.region === region);
};

const getMapPersonnelMarkers = (region: string) => {
  const all = [
    { left: '35%', top: '42%', label: '人' },
    { left: '60%', top: '45%', label: '人' },
    { left: '70%', top: '30%', label: '人' },
    { left: '26%', top: '58%', label: '人' },
    { left: '50%', top: '28%', label: '人' },
  ];
  if (region === 'all') return all;
  return all;
};

const getMapDeviceMarkers = (region: string) => {
  const all = [
    { left: '42%', top: '55%', label: '设' },
    { left: '65%', top: '62%', label: '设' },
    { left: '20%', top: '25%', label: '设' },
    { left: '72%', top: '48%', label: '设' },
  ];
  if (region === 'all') return all;
  return all;
};

const alarmTableData = [
  { key: 1, level: '高危', levelColor: 'red', type: '越界告警', location: '刚果(金)-卡莫阿矿区', target: '人员: 张三', time: '05-20 10:28:31' },
  { key: 2, level: '高危', levelColor: 'red', type: 'SOS紧急报警', location: '南非-韦尔科姆矿区', target: 'MHK-2001', time: '05-20 10:23:15' },
  { key: 3, level: '中危', levelColor: 'orange', type: '脱帽报警', location: '刚果-卢本巴希矿区', target: 'MHK-1024', time: '05-20 09:12:07' },
  { key: 4, level: '中危', levelColor: 'orange', type: '进入禁入区', location: '澳大利亚-卡尔古利', target: 'MHK-4056', time: '05-20 08:34:21' },
  { key: 5, level: '低危', levelColor: 'blue', type: '电量过低', location: '中国-山西大同矿', target: 'MHK-0038', time: '05-20 07:18:44' },
  { key: 6, level: '低危', levelColor: 'blue', type: '信号弱', location: '印度尼西亚-格拉斯伯格', target: 'MHK-5102', time: '05-20 06:02:11' },
];

const assetTypeData = [
  { key: 1, type: '人员终端', total: 4326, online: 1268, rate: '29.3%', trend: 'up' },
  { key: 2, type: '车辆终端', total: 892, online: 356, rate: '39.9%', trend: 'up' },
  { key: 3, type: '固定基站', total: 312, online: 298, rate: '95.5%', trend: 'up' },
  { key: 4, type: '便携基站', total: 168, online: 124, rate: '73.8%', trend: 'down' },
  { key: 5, type: '其他', total: 144, online: 108, rate: '75.0%', trend: 'up' },
];

const assetCountryData = [
  { key: 1, type: '亚太', total: 2150, online: 1780, rate: '82.8%', trend: 'up' },
  { key: 2, type: '非洲', total: 1850, online: 1020, rate: '55.1%', trend: 'up' },
  { key: 3, type: '欧洲', total: 890, online: 520, rate: '58.4%', trend: 'down' },
  { key: 4, type: '美洲', total: 620, online: 210, rate: '33.9%', trend: 'down' },
  { key: 5, type: '其他', total: 332, online: 122, rate: '36.7%', trend: 'up' },
];

const LEVEL_COLOR_MAP: Record<string, string> = { '高危': 'red', '中危': 'orange', '低危': 'blue' };

export default function GlobalPosition() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assetSubTab, setAssetSubTab] = useState<'type' | 'country'>('type');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');
  const [showPersonnel, setShowPersonnel] = useState(true);
  const [showDevices, setShowDevices] = useState(true);
  const [showAlarms, setShowAlarms] = useState(true);
  const [mapZoom, setMapZoom] = useState(100);
  const [timezone, setTimezone] = useState('UTC+08:00');
  const [currentTime, setCurrentTime] = useState('');
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const clusterMarkers = useMemo(() => getMapClusters(selectedRegion), [selectedRegion]);
  const alarmMarkers = useMemo(() => getAlarmPoints(selectedRegion), [selectedRegion]);
  const personnelMarkers = useMemo(() => getMapPersonnelMarkers(selectedRegion), [selectedRegion]);
  const deviceMarkers = useMemo(() => getMapDeviceMarkers(selectedRegion), [selectedRegion]);

  const regionData = useMemo(() => {
    if (selectedRegion === 'all') return regionDataRaw;
    return regionDataRaw.filter((r) => r.regionEn === selectedRegion);
  }, [selectedRegion]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      getDashboardStats(),
      getAlarmList({ page: 1, page_size: 10 }),
      getEmployeeList({ page: 1, page_size: 10 }),
      getDeviceList({ page: 1, page_size: 10 }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled([
      getDashboardStats(),
      getAlarmList({ page: 1, page_size: 10 }),
      getEmployeeList({ page: 1, page_size: 10 }),
      getDeviceList({ page: 1, page_size: 10 }),
    ]).finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('zh-CN', { hour12: false }));
    };
    tick();
    timeInterval.current = setInterval(tick, 1000);
    return () => { if (timeInterval.current) clearInterval(timeInterval.current); };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(handleRefresh, 30000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [autoRefresh, handleRefresh]);

  const alarmDonutOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 起 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `{total|28}\n{label|总数}`,
        textAlign: 'center',
        rich: {
          total: { fontSize: 24, fontWeight: 'bold', color: '#1D2129', lineHeight: 30 },
          label: { fontSize: 11, color: '#86909C', lineHeight: 16 },
        },
      },
    },
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['50%', '43%'],
      avoidLabelOverlap: false,
      label: { show: true, position: 'outside', fontSize: 10, formatter: '{b}\n{d}%' },
      emphasis: {
        scaleSize: 8,
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 8, name: '高危', itemStyle: { color: '#D54941' } },
        { value: 12, name: '中危', itemStyle: { color: '#E37318' } },
        { value: 6, name: '低危', itemStyle: { color: '#FAAD14' } },
        { value: 2, name: '提示', itemStyle: { color: '#2BA471' } },
      ],
    }],
  }), []);

  const accuracyBarOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { dataIndex: number, value: number }[]) => {
        const labels = ['0-2m', '2-5m', '5-10m', '10-20m', '>20m'];
        return `${labels[params[0].dataIndex]}: ${params[0].value}%`;
      },
    },
    grid: { left: 60, right: 60, top: 15, bottom: 25 },
    xAxis: {
      type: 'category',
      data: ['0-2m', '2-5m', '5-10m', '10-20m', '>20m'],
      axisLabel: { fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#E5E6EB' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', fontSize: 10 },
      max: 50,
      splitLine: { lineStyle: { color: '#F0F0F0', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: [
        { value: 28.6, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#3DA87A' }, { offset: 1, color: '#2BA471' }]) } },
        { value: 42.3, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#3370FF' }, { offset: 1, color: '#0052D9' }]) } },
        { value: 18.7, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#F08C3E' }, { offset: 1, color: '#E37318' }]) } },
        { value: 7.6, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#FCC44C' }, { offset: 1, color: '#FAAD14' }]) } },
        { value: 2.8, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#E66A66' }, { offset: 1, color: '#D54941' }]) } },
      ],
      barWidth: 26,
      barGap: '35%',
      animationDelay: (idx: number) => idx * 80,
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        fontWeight: 500,
        color: '#4E5969',
        formatter: '{c}%',
        distance: 4,
      },
      itemStyle: { borderRadius: [5, 5, 0, 0] },
    }],
  }), []);

  const regionColumns = [
    {
      title: '区域', dataIndex: 'region', key: 'region', width: 80,
      render: (text: string, record: typeof regionDataRaw[0]) => (
        <a
          onClick={() => setSelectedRegion(selectedRegion === record.regionEn ? 'all' : record.regionEn)}
          style={{ color: selectedRegion === record.regionEn ? '#0052D9' : '#1D2129', fontWeight: selectedRegion === record.regionEn ? 600 : 400 }}
        >
          {text}
        </a>
      ),
    },
    { title: '在线人数', dataIndex: 'online', key: 'online', width: 80, align: 'right' as const },
    { title: '占比', dataIndex: 'ratio', key: 'ratio', width: 60, align: 'right' as const },
    {
      title: '较昨日', dataIndex: 'trend', key: 'trend', width: 80, align: 'right' as const,
      render: (trend: string) => {
        const up = trend.startsWith('↑');
        return (
          <Text style={{ color: up ? '#D54941' : '#2BA471', fontSize: 12, fontWeight: 500 }}>
            {trend}
          </Text>
        );
      },
    },
  ];

  const alarmTableColumns = [
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 60,
      render: (level: string) => (
        <Tag color={LEVEL_COLOR_MAP[level] || 'default'} style={{ fontSize: 11, margin: 0 }}>{level}</Tag>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 110, ellipsis: true },
    { title: '位置', dataIndex: 'location', key: 'location', width: 170, ellipsis: true },
    { title: '对象', dataIndex: 'target', key: 'target', width: 110 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 150 },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 60,
      render: () => <a style={{ fontSize: 12, color: '#0052D9' }}>查看</a>,
    },
  ];

  const assetTypeColumns = (subTab: string) => [
    { title: subTab === 'type' ? '资产类型' : '国家/地区', dataIndex: 'type', key: 'type', width: 100 },
    { title: '总数', dataIndex: 'total', key: 'total', width: 70, align: 'right' as const },
    { title: '在线数', dataIndex: 'online', key: 'online', width: 70, align: 'right' as const },
    {
      title: '在线率', dataIndex: 'rate', key: 'rate', width: 80, align: 'right' as const,
      render: (rate: string) => {
        const val = parseFloat(rate);
        const color = val >= 90 ? '#2BA471' : val >= 70 ? '#E37318' : '#D54941';
        return <Text style={{ color, fontWeight: 600 }}>{rate}</Text>;
      },
    },
    {
      title: '趋势', dataIndex: 'trend', key: 'trend', width: 60,
      render: (trend: string) => trend === 'up'
        ? <CaretUpOutlined style={{ color: '#2BA471', fontSize: 14 }} />
        : <CaretDownOutlined style={{ color: '#D54941', fontSize: 14 }} />,
    },
  ];

  const handleExport = () => {
    const exportDate = new Date();
    alert(`报告导出中...\n时间：${exportDate.toLocaleString('zh-CN')}\n时区：${timezone}\n包含全部 KPI、区域分布、告警和资产数据。`);
  };

  const handleMapZoomIn = () => {
    setMapZoom((z) => Math.min(z + 20, 200));
  };

  const handleMapZoomOut = () => {
    setMapZoom((z) => Math.max(z - 20, 40));
  };

  const handleResetMap = () => {
    setMapZoom(100);
    setSelectedRegion('all');
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, padding: '4px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text strong style={{ fontSize: 17, color: '#1D2129' }}>全球定位</Text>
          {autoRefresh && (
            <Tag icon={<SyncOutlined spin />} color="processing" style={{ fontSize: 11 }}>
              自动刷新中 (30s)
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 11 }}>{currentTime}</Text>
        </div>
        <Space size={12}>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 11 }}>时区:</Text>
            <Select
              value={timezone}
              size="small"
              style={{ width: 150 }}
              onChange={setTimezone}
            >
              <Select.Option value="UTC+08:00">UTC+08:00 (北京)</Select.Option>
              <Select.Option value="UTC+00:00">UTC+00:00 (伦敦)</Select.Option>
              <Select.Option value="UTC-05:00">UTC-05:00 (纽约)</Select.Option>
              <Select.Option value="UTC+02:00">UTC+02:00 (开罗)</Select.Option>
              <Select.Option value="UTC+10:00">UTC+10:00 (悉尼)</Select.Option>
            </Select>
          </Space>
          <Tooltip title="刷新数据">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              size="small"
              onClick={handleRefresh}
              loading={refreshing}
            />
          </Tooltip>
          <Dropdown menu={{
            items: [{ key: 'auto', label: autoRefresh ? '关闭自动刷新' : '开启自动刷新 (30s)', onClick: () => setAutoRefresh(!autoRefresh) }],
          }}>
            <Button size="small" icon={<SyncOutlined />} />
          </Dropdown>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>导出报告</Button>
        </Space>
      </div>

      {/* KPI Cards Row */}
      <Row gutter={[12, 12]}>
        {statCards.map((card) => (
          <Col span={4} key={card.key}>
            <Card
              bodyStyle={{ padding: '10px 14px' }}
              style={{
                border: card.key === 'globalTodayAlarms' ? '1px solid #FDECEE' : undefined,
                boxShadow: card.key === 'globalTodayAlarms' ? '0 1px 4px rgba(213,73,65,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div className="stat-card-icon" style={{
                  background: card.bg, color: card.color,
                  flexShrink: 0, width: 42, height: 42, borderRadius: 10, fontSize: 20,
                }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="kpi-label" style={{ marginTop: 0, fontSize: 12, color: '#86909C' }}>{card.label}</div>
                  <div className="kpi-value" style={{
                    fontSize: 22, fontWeight: 600, lineHeight: '28px',
                    color: card.key === 'globalTodayAlarms' ? '#D54941' : '#1D2129',
                  }}>
                    {card.value}
                    <Text style={{ fontSize: 12, fontWeight: 400, marginLeft: 2, color: '#86909C' }}>{card.unit}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Text style={{
                      fontSize: 11,
                      color: card.trendUp && card.key !== 'globalTodayAlarms' ? '#D54941' : '#2BA471',
                    }}>
                      {card.trend}
                    </Text>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 4, height: 30 }}>
                <ReactECharts
                  option={getSparklineOption(SPARKLINE_DATA[card.key], SPARKLINE_COLORS[card.key])}
                  style={{ height: 30 }}
                  notMerge
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Map filters quick bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 12, marginBottom: 4,
      }}>
        <Space size={8}>
          <Text type="secondary" style={{ fontSize: 11 }}>地图筛选:</Text>
          <Button
            size="small"
            type={showPersonnel ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => setShowPersonnel(!showPersonnel)}
            style={{ fontSize: 11, height: 24, padding: '0 8px' }}
          >
            人员
          </Button>
          <Button
            size="small"
            type={showDevices ? 'primary' : 'default'}
            icon={<ToolOutlined />}
            onClick={() => setShowDevices(!showDevices)}
            style={{ fontSize: 11, height: 24, padding: '0 8px' }}
          >
            设备
          </Button>
          <Button
            size="small"
            type={showAlarms ? 'primary' : 'default'}
            icon={<AlertOutlined />}
            onClick={() => setShowAlarms(!showAlarms)}
            style={{ fontSize: 11, height: 24, padding: '0 8px' }}
          >
            告警
          </Button>
        </Space>
        {selectedRegion !== 'all' && (
          <Tag
            closable
            color="blue"
            onClose={() => setSelectedRegion('all')}
            style={{ fontSize: 11 }}
          >
            已筛选: {regionDataRaw.find((r) => r.regionEn === selectedRegion)?.region}
          </Tag>
        )}
      </div>

      {/* Middle Section: World Map + Regional Data + Alarm Overview */}
      <Row gutter={[12, 12]} style={{ marginTop: 4 }}>
        {/* World Map - Left */}
        <Col span={14}>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ height: '100%' }}
          >
            {/* Map controls bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 12px', borderBottom: '1px solid #F0F0F0',
              background: '#FAFBFC',
            }}>
              <div style={{ display: 'inline-flex', borderRadius: 4, overflow: 'hidden', border: '1px solid #E5E6EB' }}>
                <Button
                  size="small"
                  type={mapType === 'map' ? 'primary' : 'default'}
                  style={{ borderRadius: 0, fontSize: 12, border: 'none' }}
                  onClick={() => setMapType('map')}
                >
                  地图
                </Button>
                <Button
                  size="small"
                  type={mapType === 'satellite' ? 'primary' : 'default'}
                  style={{ borderRadius: 0, fontSize: 12, border: 'none', color: mapType !== 'satellite' ? '#86909C' : undefined }}
                  onClick={() => setMapType('satellite')}
                >
                  卫星
                </Button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {mapType === 'satellite' && (
                  <Tag color="geekblue" style={{ fontSize: 10, margin: 0 }}>卫星视图 (模拟)</Tag>
                )}
                <Select
                  value={selectedRegion}
                  size="small"
                  style={{ width: 130 }}
                  onChange={setSelectedRegion}
                >
                  <Select.Option value="all">全部区域</Select.Option>
                  <Select.Option value="asia">亚太</Select.Option>
                  <Select.Option value="africa">非洲</Select.Option>
                  <Select.Option value="europe">欧洲</Select.Option>
                  <Select.Option value="americas">美洲</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </div>
            </div>
            {/* Map wrapper with floating controls */}
            <div style={{ position: 'relative' }}>
              <div style={{
                height: 340, position: 'relative', overflow: 'hidden',
                transform: `scale(${mapZoom / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease',
              }}>
                <WorldMapSvg />
                {/* Markers overlay */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Cluster markers */}
                  {clusterMarkers.map((c, i) => (
                    <div key={`cluster-${i}`} style={{
                      position: 'absolute', left: c.left, top: c.top,
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${c.color}1a`, border: `2px solid ${c.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 11, fontWeight: 700, color: c.color,
                      boxShadow: `0 2px 8px ${c.color}22`,
                    }}>
                      {c.count}
                    </div>
                  ))}
                  {/* Personnel markers */}
                  {showPersonnel && personnelMarkers.map((m, i) => (
                    <div key={`person-${i}`} style={{
                      position: 'absolute', left: m.left, top: m.top,
                      transform: 'translate(-50%, -50%)',
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#0052D9', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      boxShadow: '0 1px 6px rgba(0,82,217,0.35)',
                    }}>
                      {m.label}
                    </div>
                  ))}
                  {/* Device markers */}
                  {showDevices && deviceMarkers.map((m, i) => (
                    <div key={`device-${i}`} style={{
                      position: 'absolute', left: m.left, top: m.top,
                      transform: 'translate(-50%, -50%)',
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#7B61FF', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      boxShadow: '0 1px 6px rgba(123,97,255,0.35)',
                    }}>
                      {m.label}
                    </div>
                  ))}
                  {/* Alarm markers */}
                  {showAlarms && alarmMarkers.map((a, i) => (
                    <div key={`alarm-${i}`} style={{
                      position: 'absolute', left: a.left, top: a.top,
                      transform: 'translate(-50%, -50%)',
                      fontSize: 18, fontWeight: 700, lineHeight: 1,
                      color: a.level === '高' ? '#D54941' : a.level === '中' ? '#E37318' : '#FAAD14',
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
                    }}>
                      ▲
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating zoom controls */}
              <div style={{
                position: 'absolute', right: 12, top: 12,
                display: 'flex', flexDirection: 'column', gap: 2,
                background: '#FFF', borderRadius: 6,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                padding: '4px 2px', zIndex: 10,
              }}>
                <Tooltip title="放大" placement="left">
                  <Button size="small" type="text" icon={<ZoomInOutlined />} onClick={handleMapZoomIn}
                    style={{ fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
                <div style={{
                  textAlign: 'center', fontSize: 10, color: '#86909C',
                  padding: '1px 0', cursor: 'default', userSelect: 'none',
                }}>
                  {mapZoom}%
                </div>
                <Tooltip title="缩小" placement="left">
                  <Button size="small" type="text" icon={<ZoomOutOutlined />} onClick={handleMapZoomOut}
                    style={{ fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
                <div style={{ borderTop: '1px solid #F0F0F0', margin: '2px 4px' }} />
                <Tooltip title="复位" placement="left">
                  <Button size="small" type="text" icon={<CompassOutlined />} onClick={handleResetMap}
                    style={{ fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
                <Tooltip title="居中定位" placement="left">
                  <Button size="small" type="text" icon={<PushpinOutlined />}
                    style={{ fontSize: 14, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C' }}
                  />
                </Tooltip>
              </div>
            </div>
            {/* Map legend */}
            <div style={{
              display: 'flex', gap: 18, padding: '6px 14px', borderTop: '1px solid #F0F0F0',
              background: '#FAFAFA', fontSize: 11, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {[
                { label: '在线', color: '#2BA471' },
                { label: '离线', color: '#86909C' },
                { label: '人员', color: '#0052D9' },
                { label: '设备', color: '#7B61FF' },
                { label: '告警-低', color: '#FAAD14' },
                { label: '告警-中', color: '#E37318' },
                { label: '告警-高', color: '#D54941' },
              ].map((item) => (
                <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: item.color }} />
                  {item.label}
                </span>
              ))}
              <div style={{ flex: 1 }} />
              <Text type="secondary" style={{ fontSize: 10 }}>缩放 {mapZoom}%</Text>
            </div>
          </Card>
        </Col>

        {/* Right Side: Region Distribution + Alarm Overview */}
        <Col span={10}>
          <Row gutter={[0, 12]}>
            {/* Regional Distribution */}
            <Col span={24}>
              <Card
                title={
                  <Space size={4}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>全球在线分布 (按区域)</span>
                    {selectedRegion !== 'all' && (
                      <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>已筛选</Tag>
                    )}
                  </Space>
                }
                extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={regionColumns}
                  dataSource={regionData}
                  pagination={false}
                  size="small"
                  onRow={(record) => ({
                    style: {
                      cursor: 'pointer',
                      background: selectedRegion === record.regionEn ? '#E8F3FF' : undefined,
                      transition: 'background 0.2s',
                    },
                    onClick: () => setSelectedRegion(selectedRegion === record.regionEn ? 'all' : record.regionEn),
                  })}
                />
              </Card>
            </Col>

            {/* Global Alarm Overview */}
            <Col span={24}>
              <Card
                title={
                  <Space size={4}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>全球告警概览</span>
                    <span className="stat-badge red" style={{
                      background: '#FDECEE', color: '#D54941',
                      fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                    }}>28 总数</span>
                  </Space>
                }
                extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
                bodyStyle={{ padding: '4px 0' }}
              >
                <ReactECharts option={alarmDonutOption} style={{ height: 220 }} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Bottom Section: 3 Stacked Cards */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        {/* Recent Alarms - Left */}
        <Col span={10}>
          <Card
            title={
              <Space size={8}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>最近告警 (全球)</span>
                <span style={{
                  background: '#FDECEE', color: '#D54941',
                  fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
                }}>
                  {alarmTableData.length}条
                </span>
              </Space>
            }
            extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={alarmTableColumns}
              dataSource={alarmTableData}
              pagination={false}
              size="small"
              scroll={{ x: 660 }}
            />
          </Card>
        </Col>

        {/* Asset Statistics - Middle */}
        <Col span={7}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>全球资产统计</span>
                <Space size={4}>
                  <Button
                    size="small"
                    type={assetSubTab === 'type' ? 'primary' : 'default'}
                    onClick={() => setAssetSubTab('type')}
                    style={{ fontSize: 11, height: 24, padding: '0 8px' }}
                  >
                    按类型
                  </Button>
                  <Button
                    size="small"
                    type={assetSubTab === 'country' ? 'primary' : 'default'}
                    onClick={() => setAssetSubTab('country')}
                    style={{ fontSize: 11, height: 24, padding: '0 8px' }}
                  >
                    按国家/地区
                  </Button>
                </Space>
              </div>
            }
            extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              columns={assetTypeColumns(assetSubTab)}
              dataSource={assetSubTab === 'type' ? assetTypeData : assetCountryData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Accuracy Distribution - Right */}
        <Col span={7}>
          <Card
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>全球定位精度分布</span>}
            extra={<a style={{ fontSize: 12 }}>更多 &gt;</a>}
            bodyStyle={{ padding: '4px 8px' }}
          >
            <ReactECharts option={accuracyBarOption} style={{ height: 230 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
