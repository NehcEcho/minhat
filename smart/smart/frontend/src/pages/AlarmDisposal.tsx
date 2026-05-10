import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Avatar,
  Segmented, Statistic, Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AlertOutlined, ThunderboltOutlined, AimOutlined,
  VideoCameraOutlined, FieldTimeOutlined, PhoneOutlined,
  UserOutlined, HistoryOutlined, SearchOutlined, SoundOutlined,
  ApartmentOutlined, NotificationOutlined,
  PlayCircleOutlined, SwapOutlined,
  CaretUpOutlined, CaretDownOutlined, CheckCircleOutlined,
  LoadingOutlined, ClockCircleOutlined, SafetyCertificateOutlined,
  EnvironmentOutlined, StopOutlined, WarningOutlined, TeamOutlined,
  FilterOutlined, SyncOutlined, FullscreenOutlined,
  ExpandOutlined, CompressOutlined, AimOutlined as TargetOutlined,
} from '@ant-design/icons';

// ==================== Types ====================

interface Alarm {
  key: string;
  id: string;
  level: string;
  levelColor: string;
  type: string;
  target: string;
  area: string;
  time: string;
  duration: string;
  status: string;
  statusColor: string;
  handler: string;
  disposalTime: string;
  actions: string[];
}

interface WorkflowStepDef {
  id: number;
  title: string;
  desc: string;
  time: string;
  status: 'done' | 'pending' | 'active';
  subItems?: { text: string; result: string }[];
}

// ==================== Mock Data ====================

const allAlarms: Alarm[] = [
  {
    key: '1', id: 'AL-20250520-0007', level: '高', levelColor: 'red', type: '电子围栏',
    target: '张三', area: '井下-区运输巷道 K2+430', time: '10:29:31', duration: '00:11:23',
    status: '待处置', statusColor: 'red', handler: '-', disposalTime: '-',
    actions: ['处置', '指派', '忽略'],
  },
  {
    key: '2', id: 'AL-20250520-0006', level: '高', levelColor: 'red', type: '瓦斯超限(CH4)',
    target: '-', area: '采掘工作面', time: '10:27:12', duration: '00:08:45',
    status: '处置中', statusColor: 'blue', handler: '李四', disposalTime: '10:28:01',
    actions: ['详情', '跟踪'],
  },
  {
    key: '3', id: 'AL-20250520-0005', level: '中', levelColor: 'orange', type: '设备离线',
    target: 'Camera MKH-015', area: '井下-区运输巷道', time: '10:25:42', duration: '00:15:32',
    status: '处置中', statusColor: 'blue', handler: '王五', disposalTime: '10:26:10',
    actions: ['详情', '跟踪'],
  },
  {
    key: '4', id: 'AL-20250520-0004', level: '中', levelColor: 'orange', type: '人员静止',
    target: '李六', area: '回风巷道', time: '10:18:55', duration: '00:25:18',
    status: '已处置', statusColor: 'green', handler: '赵六', disposalTime: '10:22:33',
    actions: ['详情'],
  },
  {
    key: '5', id: 'AL-20250520-0003', level: '低', levelColor: 'blue', type: '视频遮挡',
    target: 'Camera MKH-022', area: '主斜井口', time: '10:15:34', duration: '00:12:02',
    status: '已处置', statusColor: 'green', handler: '孙七', disposalTime: '10:16:08',
    actions: ['详情'],
  },
  {
    key: '6', id: 'AL-20250520-0002', level: '中', levelColor: 'orange', type: '脑电疲劳',
    target: '王八', area: '采掘二区K4', time: '09:48:22', duration: '00:42:10',
    status: '处置中', statusColor: 'blue', handler: '李四', disposalTime: '09:50:05',
    actions: ['详情', '跟踪'],
  },
  {
    key: '7', id: 'AL-20250520-0001', level: '低', levelColor: 'blue', type: '矿帽电量低',
    target: '钱九', area: '机电硐室K7', time: '08:30:15', duration: '02:15:40',
    status: '超时未处置', statusColor: 'red', handler: '-', disposalTime: '-',
    actions: ['处置', '忽略'],
  },
  {
    key: '8', id: 'AL-20250519-0012', level: '高', levelColor: 'red', type: '人员失联',
    target: '赵十', area: '辅助运输巷K1', time: '23:15:08', duration: '09:00:00',
    status: '待处置', statusColor: 'red', handler: '-', disposalTime: '-',
    actions: ['处置', '指派', '忽略'],
  },
];

const tabStatusMap: Record<string, string[]> = {
  '全部': [],
  '待处置': ['待处置'],
  '处置中': ['处置中'],
  '已处置': ['已处置'],
  '超时未处置': ['超时未处置', '超期'],
};

const tabLabels = [
  { label: '全部 23', value: '全部' },
  { label: '待处置 7', value: '待处置' },
  { label: '处置中 8', value: '处置中' },
  { label: '已处置 8', value: '已处置' },
  { label: '超时未处置 2', value: '超时未处置' },
];

const sparklineData: Record<number, number[]> = {
  0: [18, 19, 20, 21, 22, 23],
  1: [5, 6, 5, 6, 7, 7],
  2: [6, 7, 8, 7, 8, 8],
  3: [12, 11, 10, 9, 8, 8],
  4: [0, 1, 1, 1, 2, 2],
  5: [88.0, 89.0, 90.5, 91.2, 92.3, 92.3],
};

const statCards = [
  {
    title: '今日报警总数', value: 23, suffix: '起',
    trend: '+27.8%', up: true, icon: <AlertOutlined />,
    iconBg: '#E6F0FF', iconColor: '#0052D9',
  },
  {
    title: '待处置报警', value: 7, suffix: '起',
    trend: '+16.7%', up: true, icon: <WarningOutlined />,
    iconBg: '#FFF1F0', iconColor: '#FF4D4F',
  },
  {
    title: '处置中报警', value: 8, suffix: '起',
    trend: '+14.3%', up: true, icon: <PlayCircleOutlined />,
    iconBg: '#E6F4FF', iconColor: '#1677FF',
  },
  {
    title: '已处置报警', value: 8, suffix: '起',
    trend: '-33.3%', up: false, icon: <CheckCircleOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
  {
    title: '超时未处置', value: 2, suffix: '起',
    trend: '+100%', up: true, icon: <FieldTimeOutlined />,
    iconBg: '#FFF7E6', iconColor: '#FAAD14',
  },
  {
    title: '联动处置成功率', value: '92.3', suffix: '%',
    trend: '+5.6%', up: true, icon: <SafetyCertificateOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
];

const workflowSteps: WorkflowStepDef[] = [
  {
    id: 1, title: '报警触发', desc: '人员越界电子围栏#003', time: '10:29:31', status: 'done',
  },
  {
    id: 2, title: '规则匹配', desc: '人员超时围栏规则', time: '10:29:31', status: 'done',
  },
  {
    id: 3, title: '联动动作(已执行)', desc: '',
    subItems: [
      { text: '声光报警', result: '成功' },
      { text: '视频弹窗', result: '成功' },
      { text: '语音广播', result: '成功' },
    ],
    time: '10:29:35', status: 'done',
  },
  {
    id: 4, title: '通知推送', desc: '推送至值班人员/班组长/安全员',
    subItems: [
      { text: '至: 值班人员/班组长/安全员', result: '成功' },
    ],
    time: '10:29:40', status: 'done',
  },
  {
    id: 5, title: '人工处置', desc: '调度员核实处置', time: '待处置', status: 'pending',
  },
];

const quickActions = [
  { icon: <SoundOutlined />, label: '应急广播', color: '#FF4D4F' },
  { icon: <VideoCameraOutlined />, label: '视频调度', color: '#1677FF' },
  { icon: <SearchOutlined />, label: '人员搜寻', color: '#52C41A' },
  { icon: <HistoryOutlined />, label: '轨迹回放', color: '#FAAD14' },
  { icon: <ApartmentOutlined />, label: '电子围栏', color: '#0052D9' },
  { icon: <NotificationOutlined />, label: '预案启动', color: '#FF4D4F' },
];

// ==================== Sub-components ====================

function makeSparklineOption(data: number[], color: string) {
  return {
    grid: { top: 2, right: 0, bottom: 2, left: 0 },
    xAxis: { type: 'category' as const, show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value' as const, show: false, min: Math.floor(Math.min(...data) * 0.95), max: Math.ceil(Math.max(...data) * 1.05) },
    series: [{
      data,
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' },
          ],
        },
      },
    }],
  };
}

/** Vertical workflow timeline */
function WorkflowTimeline({ steps }: { steps: WorkflowStepDef[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 0 }}>
      <div style={{
        position: 'absolute', left: 11, top: 8, bottom: 8, width: 2,
        background: '#E5E6EB', zIndex: 0,
      }} />
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isPending = step.status === 'pending';
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} style={{ display: 'flex', gap: 10, padding: '4px 0', position: 'relative', marginBottom: isLast ? 0 : 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, zIndex: 1, marginTop: 2,
              background: isDone ? '#1677FF' : isPending ? '#F0F0F0' : '#1677FF',
              color: isDone ? '#fff' : isPending ? '#BFBFBF' : '#fff',
              fontSize: 12,
              border: isPending ? '2px solid #D9D9D9' : 'none',
            }}>
              {isDone ? <CheckCircleOutlined style={{ fontSize: 14 }} /> : isPending ? <ClockCircleOutlined style={{ fontSize: 12 }} /> : <LoadingOutlined style={{ fontSize: 12 }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: isPending ? '#8C8C8C' : '#1D2129', lineHeight: 1.4 }}>
                {step.title}
              </div>
              {step.subItems ? (
                <div style={{ marginTop: 2 }}>
                  {step.subItems.map((si, j) => (
                    <div key={j} style={{ fontSize: 11, color: '#86909C', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{si.text}</span>
                      <Tag color="green" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px', margin: 0 }}>
                        {si.result}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#86909C', lineHeight: 1.5 }}>{step.desc}</div>
              )}
              <div style={{ fontSize: 11, color: '#BFBFBF', marginTop: 2 }}>{step.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Main Component ====================

export default function AlarmDisposal() {
  const [activeTab, setActiveTab] = useState('全部');
  const [selectedRow, setSelectedRow] = useState<string>('1');
  const [disposeLoading, setDisposeLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [mapZoom, setMapZoom] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setRefreshCountdown((prev) => {
          if (prev <= 1) return 30;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRefreshCountdown(30);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const selectedAlarm = useMemo(
    () => allAlarms.find((a) => a.key === selectedRow) || allAlarms[0],
    [selectedRow],
  );

  const filteredAlarms = useMemo(() => {
    const statuses = tabStatusMap[activeTab] || [];
    if (statuses.length === 0) return allAlarms;
    return allAlarms.filter((a) => statuses.includes(a.status));
  }, [activeTab]);

  const handleDispose = useCallback(() => {
    setDisposeLoading(true);
    setTimeout(() => setDisposeLoading(false), 1500);
  }, []);

  const handleQuickAction = useCallback((label: string) => {
    console.log(`Quick action: ${label}`);
  }, []);

  const alarmColumns: ColumnsType<Alarm> = useMemo(() => [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 145, ellipsis: true },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 60,
      render: (v: string) => {
        const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
          '高': { icon: <WarningOutlined />, color: '#FF4D4F' },
          '中': { icon: <WarningOutlined />, color: '#FAAD14' },
          '低': { icon: <WarningOutlined />, color: '#1677FF' },
        };
        const m = iconMap[v] || { icon: null, color: '#999' };
        return <Space size={4}><span style={{ color: m.color, fontSize: 12 }}>{m.icon}</span><Tag color={v === '高' ? 'red' : v === '中' ? 'orange' : 'blue'}>{v}</Tag></Space>;
      },
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 110, ellipsis: true },
    { title: '对象', dataIndex: 'target', key: 'target', width: 100, ellipsis: true },
    { title: '区域', dataIndex: 'area', key: 'area', width: 140, ellipsis: true },
    { title: '时间', dataIndex: 'time', key: 'time', width: 75 },
    { title: '持续', dataIndex: 'duration', key: 'duration', width: 75 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 85,
      render: (v: string) => {
        const cm: Record<string, string> = { '待处置': 'red', '处置中': 'processing', '已处置': 'green', '超时未处置': 'error', '超期': 'error' };
        return <Tag color={cm[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: '处理人', dataIndex: 'handler', key: 'handler', width: 65 },
    { title: '处置时间', dataIndex: 'disposalTime', key: 'disposalTime', width: 85 },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 125,
      render: (actions: string[]) => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 4px' }}>|</span>}>
          {actions.map((a) => (
            <a key={a} style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#1677FF' }}>{a}</a>
          ))}
        </Space>
      ),
    },
  ], []);

  const sparklineColors = ['#0052D9', '#FF4D4F', '#1677FF', '#52C41A', '#FAAD14', '#52C41A'];

  return (
    <div>
      {/* ===== Embedded Styles ===== */}
      <style>{`
        .adm-stat-icon-box {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .adm-trend-text {
          font-size: 11px; display: inline-flex; align-items: center; gap: 2px; margin-top: 4px;
        }
        .adm-map-box {
          position: relative; width: 100%; height: 360px;
          background: #F5F7FA; border: 1px solid #E5E6EB; border-radius: 8px; overflow: hidden;
        }
        .adm-map-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(#DCE0E6 1px, transparent 1px),
            linear-gradient(90deg, #DCE0E6 1px, transparent 1px);
          background-size: 35px 35px; z-index: 0;
        }
        .adm-pulse-center {
          position: absolute; width: 18px; height: 18px; border-radius: 50%;
          background: #FF4D4F; top: 48%; left: 52%; transform: translate(-50%, -50%);
          z-index: 3; animation: admCenterBeat 1.5s ease-in-out infinite;
        }
        .adm-pulse-ring {
          position: absolute; top: 48%; left: 52%; width: 18px; height: 18px;
          border-radius: 50%; border: 2px solid rgba(255,77,79,0.5);
          transform: translate(-50%, -50%);
          animation: admRingExpand 2.5s cubic-bezier(0, 0.5, 0.5, 0) infinite; z-index: 2;
        }
        .adm-pulse-ring:nth-child(3) { animation-delay: 0.8s; }
        .adm-pulse-ring:nth-child(4) { animation-delay: 1.6s; }
        @keyframes admCenterBeat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 15px rgba(255,77,79,0.7), 0 0 30px rgba(255,77,79,0.3); }
          50% { transform: translate(-50%, -50%) scale(1.4); box-shadow: 0 0 25px rgba(255,77,79,1), 0 0 50px rgba(255,77,79,0.5); }
        }
        @keyframes admRingExpand {
          0% { width: 18px; height: 18px; opacity: 1; }
          100% { width: 160px; height: 160px; opacity: 0; }
        }
        .adm-qk-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 10px 4px; border-radius: 8px; cursor: pointer;
          border: 1px solid #F0F0F0; background: #FAFAFA;
          transition: all 0.25s; gap: 4px; min-height: 60px;
        }
        .adm-qk-btn:hover { background: #E6F0FF; border-color: #1677FF; }
        .adm-qk-btn .anticon { font-size: 20px; }
        .adm-qk-btn span { font-size: 11px; white-space: nowrap; color: #595959; }
        .adm-row-selected td { background: #E6F4FF !important; }
        .adm-detail-label { font-size: 12px; color: #86909C; white-space: nowrap; }
        .adm-detail-value { font-size: 13px; color: #1D2129; word-break: break-all; }
        .adm-zoom-btn {
          width: 28px; height: 28px; background: rgba(255,255,255,0.92);
          border: 1px solid #E5E6EB; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; font-weight: 600; color: #4E5969;
          transition: all 0.15s;
        }
        .adm-zoom-btn:hover { background: #E6F0FF; color: #1677FF; border-color: #1677FF; }
        .adm-map-label {
          position: absolute; bottom: 8px; left: 8px; z-index: 5;
          background: #fff; padding: '3px 10px'; border-radius: 4px;
          font-size: 11px; font-family: monospace; font-weight: 600;
          color: #FF4D4F; border: 1px solid #FFCCC7;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .adm-map-legend {
          position: absolute; bottom: 8px; right: 8px; z-index: 5;
          display: flex; flex-direction: column; gap: 2px;
          background: rgba(255,255,255,0.92); padding: 6px 8px;
          border-radius: 6px; font-size: 10px; border: 1px solid #F0F0F0;
        }
        .adm-map-zoom-controls {
          position: absolute; top: 8px; right: 8px; z-index: 5;
          display: flex; flex-direction: column; gap: 2px;
        }
      `}</style>

      {/* ===== Row 1: KPI Cards ===== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {statCards.map((s, i) => (
          <Col span={4} key={i}>
            <Card size="small" styles={{ body: { padding: '13px 14px 10px' } }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 2 }}>{s.title}</div>
                  <Statistic
                    value={s.value}
                    suffix={<span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}>{s.suffix}</span>}
                    valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1D2129', lineHeight: 1.2 }}
                  />
                  <div className="adm-trend-text" style={{ color: s.up ? '#FF4D4F' : '#52C41A' }}>
                    {s.up ? <CaretUpOutlined /> : <CaretDownOutlined />}
                    {s.trend}
                    <span style={{ color: '#BFBFBF', marginLeft: 4 }}>较昨日</span>
                  </div>
                </div>
                <div className="adm-stat-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
              </div>
              <div style={{ height: 32, marginTop: 4 }}>
                <ReactECharts
                  option={makeSparklineOption(sparklineData[i], sparklineColors[i])}
                  style={{ height: 32, width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ===== Row 2: Tab Bar ===== */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Segmented
            size="large"
            value={activeTab}
            onChange={(v) => setActiveTab(v as string)}
            options={tabLabels}
          />
          <Space size={12}>
            <Space size={4}>
              <span style={{ fontSize: 12, color: '#595959' }}>自动刷新</span>
              <Switch
                size="small"
                checked={autoRefresh}
                onChange={setAutoRefresh}
              />
              <span style={{ fontSize: 11, color: autoRefresh ? '#1677FF' : '#BFBFBF', fontWeight: 500, minWidth: 30 }}>
                ({refreshCountdown}s)
              </span>
            </Space>
            <Button size="small" icon={<FilterOutlined />} style={{ fontSize: 12 }}>
              筛选
            </Button>
          </Space>
        </div>
      </Card>

      {/* ===== Row 3: Middle Section — Map | Details | Workflow ===== */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {/* ---- Left: Alarm Distribution Map ---- */}
        <Col span={7}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>告警分布地图</span>}
            styles={{ body: { padding: 0 } }}
          >
            <div className="adm-map-box">
              <div className="adm-map-grid" />

              {/* Detailed Mine Map SVG */}
              <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} viewBox="0 0 600 360">
                {/* Tunnel paths */}
                <g fill="none" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" opacity={0.3}>
                  <path d="M 20,180 L 580,175" stroke="#A8C8E8" />
                  <path d="M 280,175 L 278,20" stroke="#A8C8E8" />
                  <path d="M 160,175 L 158,350" stroke="#A8C8E8" />
                  <path d="M 440,175 L 438,60" stroke="#A8C8E8" />
                  <path d="M 280,100 L 438,55" stroke="#B8D4F0" />
                </g>
                {/* Tunnel center lines */}
                <g fill="none" stroke="#96B8D8" strokeWidth={1} strokeDasharray="6,4" opacity={0.5}>
                  <path d="M 20,175 L 580,175" />
                  <path d="M 280,175 L 280,20" />
                  <path d="M 160,175 L 160,350" />
                  <path d="M 440,175 L 440,60" />
                  <path d="M 280,100 L 438,55" />
                </g>
                {/* Tunnel labels */}
                <g fill="#7A9ABA" fontSize={9}>
                  <text x="30" y="168">主运输巷道</text>
                  <text x="285" y="24">辅助运输巷</text>
                  <text x="148" y="195" transform="rotate(-90, 148, 195)">回风巷道</text>
                  <text x="442" y="55">联络巷</text>
                </g>

                {/* Equipment markers (Blue dots) */}
                {[[80,172],[200,172],[350,172],[500,172],[140,250],[140,310]].map(([cx,cy],idx) => (
                  <g key={`eq-${idx}`}>
                    <circle cx={cx} cy={cy} r={5} fill="#0052D9" opacity={0.7} />
                    <animate attributeName="opacity" values="0.7;0.4;0.7" dur={2 + idx * 0.3} repeatCount="indefinite" />
                  </g>
                ))}

                {/* Environment markers (Yellow triangles) */}
                {[[120,195],[340,190],[480,185],[260,130],[260,80]].map(([cx,cy],idx) => (
                  <polygon key={`env-${idx}`} points={`${cx},${cy - 6} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`}
                    fill="#FAAD14" opacity={0.8} />
                ))}

                {/* Video markers (Grey dots) */}
                {[[60,185],[430,185],[300,110]].map(([cx,cy],idx) => (
                  <g key={`vid-${idx}`}>
                    <circle cx={cx} cy={cy} r={4} fill="#8B8B8B" opacity={0.6} />
                    <animate attributeName="opacity" values="0.6;0.3;0.6" dur={2.5 + idx * 0.4} repeatCount="indefinite" />
                  </g>
                ))}

                {/* Resolved markers (Green dots) */}
                {[[180,180],[410,185],[160,220],[160,280]].map(([cx,cy],idx) => (
                  <circle key={`res-${idx}`} cx={cx} cy={cy} r={4} fill="#52C41A" opacity={0.6} />
                ))}

                {/* Personnel alarm markers (Red triangles) */}
                {[[280,175],[240,180],[320,178],[400,180]].map(([cx,cy],idx) => (
                  <polygon key={`per-${idx}`} points={`${cx},${cy - 7} ${cx - 6},${cy + 5} ${cx + 6},${cy + 5}`}
                    fill="#FF4D4F" opacity={idx === 0 ? 1 : 0.7}>
                    {idx === 0 && <animate attributeName="opacity" values="1;0.5;1" dur={1} repeatCount="indefinite" />}
                  </polygon>
                ))}

                {/* Alarm "!" marker on selected position */}
                <g transform="translate(280, 175)">
                  <circle cx={0} cy={-14} r={7} fill="#FF4D4F" />
                  <text x={0} y={-10} fontSize={9} fill="#fff" textAnchor="middle" fontWeight="bold">!</text>
                </g>

                {/* Area highlight circle */}
                <circle cx="280" cy="175" r="35" fill="none" stroke="rgba(255,77,79,0.25)" strokeWidth={3}
                  strokeDasharray="6,3">
                  <animate attributeName="r" values="35;45;35" dur={2} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur={2} repeatCount="indefinite" />
                </circle>
              </svg>

              {/* Pulsating alarm indicator */}
              <div className="adm-pulse-center" />
              <div className="adm-pulse-ring" />
              <div className="adm-pulse-ring" />
              <div className="adm-pulse-ring" />

              {/* Coordinate label */}
              <div className="adm-map-label" style={{ bottom: 8, left: 8, zIndex: 5, background: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#FF4D4F', border: '1px solid #FFCCC7', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'absolute' }}>
                (K2+430) 运输巷道
              </div>

              {/* Zoom controls */}
              <div className="adm-map-zoom-controls">
                <div className="adm-zoom-btn" title="放大" onClick={() => setMapZoom((z) => Math.min(z + 0.2, 2))}>+</div>
                <div className="adm-zoom-btn" title="缩小" onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.5))}>−</div>
                <div className="adm-zoom-btn" title="图层" style={{ fontSize: 12 }}>≡</div>
                <div className="adm-zoom-btn" title="全屏"><FullscreenOutlined style={{ fontSize: 11 }} /></div>
              </div>

              {/* Legend */}
              <div className="adm-map-legend">
                <span><span style={{ color: '#FF4D4F', marginRight: 4 }}>▲</span>人员报警</span>
                <span><span style={{ color: '#0052D9', marginRight: 4 }}>●</span>设备报警</span>
                <span><span style={{ color: '#FAAD14', marginRight: 4 }}>▲</span>环境报警</span>
                <span><span style={{ color: '#8B8B8B', marginRight: 4 }}>●</span>视频报警</span>
                <span><span style={{ color: '#52C41A', marginRight: 4 }}>●</span>已处置</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* ---- Center: Alarm Details ---- */}
        <Col span={12}>
          <Card
            size="small"
            title={
              <Space size={8}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>告警详情</span>
                <Tag color="red" style={{ fontSize: 11 }}>人员超时电子围栏告警</Tag>
                <Tag color="error" style={{ fontSize: 11 }}>待处置</Tag>
              </Space>
            }
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Row gutter={[16, 10]}>
              <Col span={8}>
                <div className="adm-detail-label">告警编号</div>
                <div className="adm-detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {selectedAlarm.id}
                </div>
              </Col>
              <Col span={8}>
                <div className="adm-detail-label">告警等级</div>
                <div className="adm-detail-value">
                  <Space size={4}>
                    <WarningOutlined style={{ color: '#FF4D4F', fontSize: 14 }} />
                    <span style={{ fontWeight: 600, color: '#FF4D4F' }}>高</span>
                  </Space>
                </div>
              </Col>
              <Col span={8}>
                <div className="adm-detail-label">告警时间</div>
                <div className="adm-detail-value" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  2025-05-20 10:29:31
                </div>
              </Col>
              <Col span={8}>
                <div className="adm-detail-label">告警位置</div>
                <div className="adm-detail-value">井下 一区运输巷道 K2+430</div>
              </Col>
              <Col span={8}>
                <div className="adm-detail-label">告警对象</div>
                <div className="adm-detail-value">张三 (工号: A10234)</div>
              </Col>
              <Col span={8}>
                <div className="adm-detail-label">所属班组</div>
                <div className="adm-detail-value">机电维护班</div>
              </Col>
              <Col span={24}>
                <div className="adm-detail-label">告警描述</div>
                <div className="adm-detail-value" style={{ padding: '6px 10px', background: '#FFF7E6', borderRadius: 6, border: '1px solid #FFE58F', marginTop: 4 }}>
                  人员在禁入区域停留超过设定时间(10分钟)
                </div>
              </Col>
              <Col span={24}>
                <div className="adm-detail-label">推荐处置</div>
                <div className="adm-detail-value" style={{ color: '#0052D9', padding: '6px 10px', background: '#E6F0FF', borderRadius: 6, border: '1px solid #91CAFF', marginTop: 4 }}>
                  请确认人员状态，必要时启动应急联动处置
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                loading={disposeLoading}
                onClick={handleDispose}
                style={{
                  flex: 1.5, height: 48, fontSize: 15, fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(24,144,255,0.35)',
                }}
              >
                立即处置
              </Button>
              <Button size="large" icon={<SwapOutlined />} style={{ flex: 1, height: 48, fontSize: 13 }}>
                指派处置
              </Button>
              <Button size="large" icon={<StopOutlined />} style={{ flex: 1, height: 48, fontSize: 13 }}>
                忽略告警
              </Button>
            </div>
          </Card>
        </Col>

        {/* ---- Right: Workflow Timeline ---- */}
        <Col span={5}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>联动处置流程</span>}
            styles={{ body: { padding: '10px 14px' } }}
          >
            <WorkflowTimeline steps={workflowSteps} />
          </Card>
        </Col>
      </Row>

      {/* ===== Row 4: Bottom Section — Alarm List | Shift Info ===== */}
      <Row gutter={12}>
        {/* ---- Left: Alarm List Table ---- */}
        <Col span={17}>
          <Card
            size="small"
            title={
              <Space>
                <span style={{ fontWeight: 600, fontSize: 14 }}>告警列表</span>
                <Tag style={{ marginLeft: 4 }}>全部告警</Tag>
              </Space>
            }
            extra={<Button size="small" type="link" style={{ fontSize: 12 }}>更多筛选</Button>}
            styles={{ body: { padding: 0 } }}
          >
            <Table<Alarm>
              columns={alarmColumns}
              dataSource={filteredAlarms}
              size="small"
              scroll={{ x: 1050 }}
              pagination={{ size: 'small', pageSize: 5, showTotal: (t) => `共 ${t} 条` }}
              rowClassName={(rec) => selectedRow === rec.key ? 'adm-row-selected' : ''}
              onRow={(rec) => ({
                onClick: () => setSelectedRow(rec.key),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>

        {/* ---- Right: Shift Info + Quick Actions ---- */}
        <Col span={7}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>值班信息</span>}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Avatar size={40} icon={<UserOutlined />} style={{ background: '#1677FF' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1D2129' }}>周强</div>
                <div style={{ fontSize: 11, color: '#86909C' }}>值班班长</div>
              </div>
            </div>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <PhoneOutlined style={{ color: '#86909C', fontSize: 14 }} />
                <span style={{ color: '#86909C' }}>电话：</span>
                <span style={{ fontWeight: 500 }}>138 **** 5678</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <TeamOutlined style={{ color: '#86909C', fontSize: 14 }} />
                <span style={{ color: '#86909C' }}>班组：</span>
                <span style={{ fontWeight: 500 }}>机电维护班</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <ClockCircleOutlined style={{ color: '#86909C', fontSize: 14 }} />
                <span style={{ color: '#86909C' }}>时间：</span>
                <span style={{ fontWeight: 500 }}>08:00 - 20:00</span>
              </div>
            </Space>

            <div style={{ marginTop: 16, borderTop: '1px solid #F0F0F0', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2129', marginBottom: 10 }}>快捷操作</div>
              <Row gutter={[6, 6]}>
                {quickActions.map((qa, i) => (
                  <Col span={8} key={i}>
                    <div className="adm-qk-btn" onClick={() => handleQuickAction(qa.label)}>
                      <span style={{ color: qa.color }}>{qa.icon}</span>
                      <span>{qa.label}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
