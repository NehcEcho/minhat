import { useState, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Modal, Form, Input, Select,
  InputNumber, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PushpinOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  ExclamationCircleOutlined, ToolOutlined, EnvironmentOutlined,
  CaretUpOutlined, CaretDownOutlined, ReloadOutlined,
  ZoomInOutlined, ZoomOutOutlined, AimOutlined, FullscreenOutlined,
  SearchOutlined, FilterOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, SettingOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getFenceList, createFence, updateFence, deleteFence } from '../api';

const { Text, Title } = Typography;

/* =========================================================================
   CSS INJECTION
   ========================================================================= */
const FenceCSS = `
.fence-root { display: flex; flex-direction: column; gap: 10px; }
.fence-kpi-card { border-radius: 8px; transition: all 0.2s; border: 1px solid transparent; }
.fence-kpi-card:hover { border-color: #0052D9; box-shadow: 0 2px 12px rgba(0,82,217,0.08); transform: translateY(-1px); }
.fence-kpi-card .ant-card-body { padding: 10px 14px 8px; }
.fence-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.fence-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 19px; }
.fence-kpi-body { flex: 1; min-width: 0; }
.fence-kpi-label { font-size: 11px; color: #86909C; }
.fence-kpi-value { font-size: 24px; font-weight: 700; line-height: 1.15; color: #1D2129; }
.fence-kpi-trend { display: inline-flex; align-items: center; gap: 2px; font-size: 11px; margin-top: 2px; }
.fence-map-wrapper { position: relative; height: 360px; background: #F5F7FA; border-radius: 8px; border: 1px solid #E5E6EB; overflow: hidden; }
.fence-map-grid { position: absolute; inset: 0;
  background-image: linear-gradient(#DCE0E6 1px, transparent 1px), linear-gradient(90deg, #DCE0E6 1px, transparent 1px);
  background-size: 30px 30px; z-index: 0; }
.fence-map-zoom { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 3px; z-index: 10; }
.fence-map-zoom-btn { width: 28px; height: 28px; border-radius: 6px;
  background: rgba(255,255,255,0.92); border: 1px solid #E5E6EB;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; color: #4E5969;
  transition: all 0.15s; }
.fence-map-zoom-btn:hover { color: #1677FF; border-color: #1677FF; background: #E6F0FF; }
.fence-map-legend { position: absolute; bottom: 8px; right: 8px;
  background: rgba(255,255,255,0.92); padding: 5px 9px; border-radius: 6px;
  font-size: 10px; border: 1px solid #F0F0F0; z-index: 10;
  display: flex; flex-direction: column; gap: 2px; }
.fence-table-card .ant-card-body { padding: 0; }
@keyframes fencePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes fenceDash { to { stroke-dashoffset: -24; } }
`;

/* =========================================================================
   DATA
   ========================================================================= */

interface FenceStat {
  key: string; icon: React.ReactNode; bg: string; color: string;
  label: string; value: string | number; suffix?: string;
  trend?: string; trendUp?: boolean; sparkline: number[];
}

const statCards: FenceStat[] = [
  {
    key: 'total', label: '围栏总数', value: 28, suffix: '个',
    icon: <PushpinOutlined />, bg: '#E8F3FF', color: '#0052D9',
    trend: '较昨日 ↑ 2', trendUp: true,
    sparkline: [20, 21, 23, 24, 25, 27, 28],
  },
  {
    key: 'active', label: '启用围栏', value: 22, suffix: '个',
    icon: <CheckCircleOutlined />, bg: '#E8F8F2', color: '#2BA471',
    sparkline: [16, 17, 18, 19, 20, 21, 22],
  },
  {
    key: 'alerts', label: '今日告警', value: 15, suffix: '次',
    icon: <WarningOutlined />, bg: '#FFF1F0', color: '#FF4D4F',
    trend: '较昨日 ↑ 25.0%', trendUp: true,
    sparkline: [8, 10, 11, 12, 13, 14, 15],
  },
  {
    key: 'devices', label: '绑定设备', value: 186, suffix: '台',
    icon: <ToolOutlined />, bg: '#F2F3FF', color: '#7B61FF',
    sparkline: [148, 156, 162, 168, 175, 180, 186],
  },
];

interface FenceRecord {
  key: string;
  id: number;
  fenceName: string;
  eventType: string;
  startTime: string;
  endTime: string;
  deviceCount: number;
  boundDevices: string;
  alertCount: number;
  status: string;
  area: string;
  rule: string;
}

const fenceData: FenceRecord[] = [
  { key: '1', id: 1, fenceName: '一采区禁入围栏', eventType: '禁入', startTime: '2025-01-01 00:00', endTime: '永久', deviceCount: 45, boundDevices: 'MKH-001~045', alertCount: 3, status: '启用', area: '一采区', rule: '禁止进入' },
  { key: '2', id: 2, fenceName: '运输巷道超时围栏', eventType: '超时', startTime: '2025-01-15 00:00', endTime: '永久', deviceCount: 38, boundDevices: 'MKH-046~083', alertCount: 5, status: '启用', area: '主运输巷道', rule: '停留超过10min告警' },
  { key: '3', id: 3, fenceName: '危险区域预警围栏', eventType: '预警', startTime: '2025-02-01 00:00', endTime: '永久', deviceCount: 28, boundDevices: 'MKH-084~111', alertCount: 2, status: '启用', area: '回风巷', rule: '进入预警' },
  { key: '4', id: 4, fenceName: '水泵房监控围栏', eventType: '禁入', startTime: '2025-05-20 08:00', endTime: '2025-05-20 20:00', deviceCount: 12, boundDevices: 'MKH-112~123', alertCount: 0, status: '启用', area: '水泵房', rule: '禁止进入' },
  { key: '5', id: 5, fenceName: '采掘面安全围栏', eventType: '超员', startTime: '2025-03-01 00:00', endTime: '永久', deviceCount: 35, boundDevices: 'MKH-124~158', alertCount: 4, status: '启用', area: '采掘工作面', rule: '超员告警' },
  { key: '6', id: 6, fenceName: '变电所授权围栏', eventType: '授权', startTime: '2025-04-10 00:00', endTime: '永久', deviceCount: 8, boundDevices: 'MKH-159~166', alertCount: 0, status: '启用', area: '中央变电所', rule: '白名单准入' },
  { key: '7', id: 7, fenceName: '机电硐室越界围栏', eventType: '越界', startTime: '2025-05-18 06:00', endTime: '2025-05-18 18:00', deviceCount: 15, boundDevices: 'MKH-167~181', alertCount: 1, status: '停用', area: '机电硐室', rule: '越界告警' },
  { key: '8', id: 8, fenceName: '紧急避险区域', eventType: '安全', startTime: '2025-01-01 00:00', endTime: '永久', deviceCount: 5, boundDevices: 'MKH-182~186', alertCount: 0, status: '启用', area: '避难硐室', rule: '安全区域' },
  { key: '9', id: 9, fenceName: '运输巷速度围栏', eventType: '超速', startTime: '2025-05-01 00:00', endTime: '永久', deviceCount: 20, boundDevices: 'MKH-187~206', alertCount: 2, status: '启用', area: '辅助运输巷', rule: '移动速度 >3km/h告警' },
  { key: '10', id: 10, fenceName: '瓦斯区禁入围栏', eventType: '禁入', startTime: '2025-05-19 00:00', endTime: '2025-05-25 23:59', deviceCount: 0, boundDevices: '—', alertCount: 0, status: '停用', area: '瓦斯抽采区', rule: '临时关闭' },
];

/* =========================================================================
   COMPONENT
   ========================================================================= */

export default function GeoFence() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFence, setEditingFence] = useState<FenceRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [mapZoom, setMapZoom] = useState(1);
  const [form] = Form.useForm();

  const filteredFences = useMemo(() => {
    if (!searchText) return fenceData;
    return fenceData.filter((f) =>
      f.fenceName.includes(searchText) || f.area.includes(searchText) || f.eventType.includes(searchText)
    );
  }, [searchText]);

  const handleAdd = useCallback(() => {
    setEditingFence(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: FenceRecord) => {
    setEditingFence(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }, [form]);

  const handleDelete = useCallback((record: FenceRecord) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除围栏 "${record.fenceName}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteFence(record.id);
          message.success('围栏已删除');
        } catch {
          message.error('删除失败');
        }
      },
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (editingFence) {
        await updateFence(editingFence.id, values);
        message.success('围栏已更新');
      } else {
        await createFence(values);
        message.success('围栏已创建');
      }
      setModalOpen(false);
    } catch {
      // validation failed or API error
    }
  }, [editingFence, form]);

  const fenceColumns: ColumnsType<FenceRecord> = useMemo(() => [
    {
      title: '围栏名称', dataIndex: 'fenceName', key: 'fenceName', width: 170,
      render: (v: string) => (
        <Space size={4}>
          <PushpinOutlined style={{ color: '#FF4D4F', fontSize: 12 }} />
          <Text strong style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ),
    },
    {
      title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 80,
      render: (v: string) => {
        const cm: Record<string, string> = {
          '禁入': 'error', '超时': 'warning', '预警': 'processing', '超员': 'orange',
          '授权': 'green', '越界': 'red', '安全': 'green', '超速': 'orange',
        };
        return <Tag color={cm[v] || 'default'} style={{ fontSize: 10, margin: 0 }}>{v}</Tag>;
      },
    },
    {
      title: '生效时间', dataIndex: 'startTime', key: 'startTime', width: 140,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '到期时间', dataIndex: 'endTime', key: 'endTime', width: 140,
      render: (v: string) => (
        <Text style={{ fontSize: 11, color: v === '永久' ? '#2BA471' : '#1D2129' }}>
          {v === '永久' && <ClockCircleOutlined style={{ marginRight: 3 }} />}
          {v}
        </Text>
      ),
    },
    {
      title: '绑定设备', dataIndex: 'deviceCount', key: 'deviceCount', width: 90,
      render: (v: number) => (
        <Space size={4}>
          <ToolOutlined style={{ color: '#7B61FF', fontSize: 11 }} />
          <Text strong style={{ fontSize: 12 }}>{v}</Text>
          <Text style={{ fontSize: 10, color: '#86909C' }}>台</Text>
        </Space>
      ),
    },
    {
      title: '今日告警', dataIndex: 'alertCount', key: 'alertCount', width: 90,
      render: (v: number) => v > 0
        ? <Tag color="error" style={{ fontSize: 10, margin: 0 }}><WarningOutlined /> {v} 次</Tag>
        : <Text style={{ fontSize: 11, color: '#C9CDD4' }}>—</Text>,
    },
    {
      title: '所属区域', dataIndex: 'area', key: 'area', width: 120,
      render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => (
        <Tag color={s === '启用' ? 'green' : 'default'} style={{ fontSize: 10, margin: 0 }}>
          {s === '启用' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#2BA471', marginRight: 4, animation: 'fencePulse 1.5s infinite' }} />}
          {s}
        </Tag>
      ),
    },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 140,
      render: (_: unknown, record: FenceRecord) => (
        <Space size={[4, 4]}>
          <a style={{ fontSize: 11 }} onClick={() => handleEdit(record)}><EditOutlined /> 编辑</a>
          <a style={{ fontSize: 11, color: '#FF4D4F' }} onClick={() => handleDelete(record)}><DeleteOutlined /> 删除</a>
        </Space>
      ),
    },
  ], [handleEdit, handleDelete]);

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

  const alertTrendOption = useMemo(() => {
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const c1 = [0, 0, 0, 1, 3, 4, 2, 3, 1, 1, 0, 0];
    const c2 = [0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0];
    const c3 = [0, 0, 0, 1, 2, 1, 1, 2, 1, 0, 0, 0];
    return {
      tooltip: { trigger: 'axis' as const, backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#E5E6EB', textStyle: { fontSize: 11 } },
      grid: { left: 40, right: 20, top: 10, bottom: 25 },
      xAxis: { type: 'category' as const, data: hours, axisLabel: { fontSize: 10, color: '#86909C' }, axisLine: { lineStyle: { color: '#E5E6EB' } }, axisTick: { show: false } },
      yAxis: { type: 'value' as const, min: 0, max: 6, interval: 2, axisLabel: { fontSize: 10, color: '#86909C' }, splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } } },
      series: [
        { name: '禁入告警', type: 'bar' as const, data: c1, barWidth: 8, itemStyle: { color: '#FF4D4F', borderRadius: [3, 3, 0, 0] }, stack: 'total' },
        { name: '超时告警', type: 'bar' as const, data: c2, barWidth: 8, itemStyle: { color: '#FAAD14', borderRadius: [3, 3, 0, 0] }, stack: 'total' },
        { name: '越界告警', type: 'bar' as const, data: c3, barWidth: 8, itemStyle: { color: '#1677FF', borderRadius: [3, 3, 0, 0] }, stack: 'total' },
      ],
      legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 12, itemHeight: 8 },
    };
  }, []);

  return (
    <>
      <style>{FenceCSS}</style>
      <div className="fence-root">

        {/* ===== Header ===== */}
        <Card bodyStyle={{ padding: '12px 20px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={12}>
                <Title level={5} style={{ margin: 0 }}>电子围栏</Title>
                <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>22个围栏运行中</Tag>
              </Space>
            </Col>
            <Col>
              <Space size={8}>
                <Input.Search
                  placeholder="搜索围栏名称/区域"
                  allowClear
                  style={{ width: 220 }}
                  size="small"
                  onSearch={setSearchText}
                  prefix={<SearchOutlined />}
                />
                <Button size="small" icon={<FilterOutlined />}>筛选</Button>
                <Button size="small" icon={<ReloadOutlined />}>刷新</Button>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>新建围栏</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ===== KPI Cards ===== */}
        <Row gutter={[10, 10]}>
          {statCards.map((s, i) => (
            <Col span={6} key={s.key}>
              <Card className="fence-kpi-card" size="small">
                <div className="fence-kpi-inner">
                  <div className="fence-kpi-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div className="fence-kpi-body">
                    <div className="fence-kpi-label">{s.label}</div>
                    <div className="fence-kpi-value">
                      {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: '#86909C' }}>{s.suffix && ` ${s.suffix}`}</span>
                    </div>
                    {s.trend && (
                      <div className="fence-kpi-trend" style={{ color: s.trendUp ? '#FF4D4F' : '#52C41A' }}>
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

        {/* ===== Map + Alert Chart ===== */}
        <Row gutter={[10, 10]}>
          <Col span={14}>
            <Card
              title={<Space><EnvironmentOutlined style={{ color: '#1677FF' }} /><Text strong style={{ fontSize: 14 }}>围栏分布地图</Text></Space>}
              styles={{ body: { padding: 0 } }}
            >
              <div className="fence-map-wrapper">
                <div className="fence-map-grid" />

                <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} viewBox="0 0 700 360">
                  {/* Tunnels */}
                  <g fill="none" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" opacity={0.22}>
                    <path d="M 20,160 L 680,155" stroke="#A8C8E8" />
                    <path d="M 300,155 L 298,20" stroke="#A8C8E8" />
                    <path d="M 160,155 L 158,350" stroke="#A8C8E8" />
                    <path d="M 500,155 L 498,40" stroke="#A8C8E8" />
                    <path d="M 300,100 L 498,40" stroke="#B8D4F0" />
                  </g>

                  {/* Fence overlays - colored rectangles */}
                  {/* 一采区禁入围栏 */}
                  <rect x="55" y="120" width="90" height="45" rx="4" fill="none" stroke="#FF4D4F" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite" />
                  </rect>
                  <text x="100" y="148" fontSize={8} fill="#FF4D4F" textAnchor="middle" fontWeight="bold">一采区禁入</text>

                  {/* 运输巷道超时围栏 */}
                  <rect x="220" y="120" width="140" height="40" rx="4" fill="none" stroke="#FAAD14" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.2s" repeatCount="indefinite" />
                  </rect>
                  <text x="290" y="145" fontSize={8} fill="#FAAD14" textAnchor="middle" fontWeight="bold">主运输巷超时</text>

                  {/* 回风巷预警 */}
                  <rect x="130" y="210" width="80" height="90" rx="4" fill="none" stroke="#1677FF" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.4s" repeatCount="indefinite" />
                  </rect>
                  <text x="170" y="260" fontSize={8} fill="#1677FF" textAnchor="middle" fontWeight="bold">回风巷预警</text>

                  {/* 采掘面安全围栏 */}
                  <rect x="440" y="120" width="110" height="52" rx="4" fill="none" stroke="#E37318" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.9s" repeatCount="indefinite" />
                  </rect>
                  <text x="495" y="150" fontSize={8} fill="#E37318" textAnchor="middle" fontWeight="bold">采掘面安全</text>

                  {/* 变电所授权 */}
                  <rect x="480" y="40" width="60" height="45" rx="4" fill="none" stroke="#2BA471" strokeWidth={2} strokeDasharray="5,3" opacity={0.6}>
                    <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.1s" repeatCount="indefinite" />
                  </rect>
                  <text x="510" y="68" fontSize={8} fill="#2BA471" textAnchor="middle" fontWeight="bold">变电所</text>

                  {/* Tunnel labels */}
                  <g fill="#7A9ABA" fontSize={9}>
                    <text x="30" y="148">主运输巷道</text>
                    <text x="305" y="14">辅助运输巷</text>
                    <text x="148" y="175" transform="rotate(-90,148,175)">回风巷道</text>
                    <text x="503" y="35">联络巷</text>
                  </g>
                </svg>

                <div className="fence-map-zoom">
                  <div className="fence-map-zoom-btn" onClick={() => setMapZoom((z) => Math.min(z + 0.2, 2))}><ZoomInOutlined style={{ fontSize: 12 }} /></div>
                  <div className="fence-map-zoom-btn" onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.5))}><ZoomOutOutlined style={{ fontSize: 12 }} /></div>
                  <div className="fence-map-zoom-btn"><AimOutlined style={{ fontSize: 11 }} /></div>
                  <div className="fence-map-zoom-btn"><FullscreenOutlined style={{ fontSize: 11 }} /></div>
                </div>

                <div className="fence-map-legend">
                  <span><span style={{ display: 'inline-block', width: 10, height: 2, background: '#FF4D4F', marginRight: 6, verticalAlign: 'middle' }} />禁入围栏</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 2, background: '#FAAD14', marginRight: 6, verticalAlign: 'middle' }} />超时围栏</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 2, background: '#1677FF', marginRight: 6, verticalAlign: 'middle' }} />预警围栏</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 2, background: '#E37318', marginRight: 6, verticalAlign: 'middle' }} />安全围栏</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 2, background: '#2BA471', marginRight: 6, verticalAlign: 'middle' }} />授权围栏</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={10}>
            <Card
              title={<Space><WarningOutlined style={{ color: '#FF4D4F' }} /><Text strong style={{ fontSize: 14 }}>今日告警趋势</Text></Space>}
              styles={{ body: { padding: '4px 6px' } }}
            >
              <ReactECharts option={alertTrendOption} style={{ height: 330 }} />
            </Card>
          </Col>
        </Row>

        {/* ===== Fence List Table ===== */}
        <Card
          className="fence-table-card"
          title={
            <Space>
              <Text strong style={{ fontSize: 14 }}>围栏列表</Text>
              <Tag style={{ margin: 0 }}>共 {filteredFences.length} 条</Tag>
            </Space>
          }
          extra={
            <Space size={8}>
              <Button size="small" icon={<SettingOutlined />}>批量配置</Button>
            </Space>
          }
        >
          <Table<FenceRecord>
            columns={fenceColumns}
            dataSource={filteredFences}
            size="small"
            scroll={{ x: 1100 }}
            rowKey="id"
            pagination={{
              size: 'small',
              pageSize: 8,
              showTotal: (t) => `共 ${t} 条围栏`,
              showSizeChanger: true,
              pageSizeOptions: ['5', '8', '15'],
            }}
            rowClassName={(r) => r.status === '停用' ? 'fence-row-disabled' : ''}
          />
        </Card>

        {/* ===== Modal: Create / Edit Fence ===== */}
        <Modal
          title={editingFence ? '编辑围栏' : '新建围栏'}
          open={modalOpen}
          onOk={handleSubmit}
          onCancel={() => setModalOpen(false)}
          okText={editingFence ? '保存' : '创建'}
          cancelText="取消"
          width={560}
          destroyOnClose
        >
          <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item name="fenceName" label="围栏名称" rules={[{ required: true, message: '请输入围栏名称' }]}>
              <Input placeholder="请输入围栏名称" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="eventType" label="事件类型" rules={[{ required: true, message: '请选择事件类型' }]}>
                  <Select
                    options={[
                      { value: '禁入', label: '禁入' },
                      { value: '超时', label: '超时' },
                      { value: '预警', label: '预警' },
                      { value: '超员', label: '超员' },
                      { value: '授权', label: '授权' },
                      { value: '越界', label: '越界' },
                      { value: '超速', label: '超速' },
                      { value: '安全', label: '安全' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="area" label="所属区域" rules={[{ required: true, message: '请输入所属区域' }]}>
                  <Input placeholder="如: 一采区" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="rule" label="触发规则">
              <Input placeholder="如: 禁止进入 / 停留超过10min告警" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="startTime" label="生效时间">
                  <Input placeholder="如: 2025-01-01 00:00" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="endTime" label="到期时间">
                  <Input placeholder="如: 永久 / 2025-12-31 23:59" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="deviceCount" label="绑定设备数">
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select options={[{ value: '启用', label: '启用' }, { value: '停用', label: '停用' }]} />
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </>
  );
}
