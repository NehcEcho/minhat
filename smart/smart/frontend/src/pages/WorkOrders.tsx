import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Statistic, Segmented, Button, Space, Tooltip, Progress, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined,
  ToolOutlined, UserOutlined, WarningOutlined, ThunderboltOutlined, SearchOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined, PlusOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const WorkOrdersCSS = `
.wo-root { display: flex; flex-direction: column; gap: 12px; }
.wo-kpi-card { border-radius: 8px; }
.wo-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.wo-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.wo-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.wo-kpi-body { flex: 1; min-width: 0; }
.wo-kpi-label { font-size: 11px; color: #86909C; }
.wo-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.wo-kpi-sub { font-size: 11px; color: #86909C; }
.wo-filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
`;

interface WorkOrder {
  key: number;
  id: string;
  title: string;
  device: string;
  assignee: string;
  priority: string;
  status: string;
  created_at: string;
  desc: string;
  area: string;
}

const mockOrders: WorkOrder[] = [
  { key: 1, id: 'WO-20250520-0001', title: '采掘面摄像机模糊清灰维护', device: '摄像头-CAM-01', assignee: '李工', priority: '高', status: '待处理', created_at: '2025-05-20 08:30', desc: '采掘工作面A', area: '采掘工作面A' },
  { key: 2, id: 'WO-20250520-0002', title: '定位基站LB-200信号异常排查', device: '定位基站-LB-200', assignee: '王五', priority: '紧急', status: '处理中', created_at: '2025-05-20 09:15', desc: '主运输巷道', area: '主运输巷道' },
  { key: 3, id: 'WO-20250519-0003', title: '矿帽电池更换批量维护', device: '智能矿帽-MKH-00345', assignee: '赵六', priority: '中', status: '已完成', created_at: '2025-05-19 14:20', desc: '回风巷道区域12台', area: '回风巷道' },
  { key: 4, id: 'WO-20250519-0004', title: '气体传感器标定校验', device: '气体传感器-GS-400', assignee: '张工', priority: '高', status: '处理中', created_at: '2025-05-19 16:00', desc: '月度标定任务', area: '回风巷道' },
  { key: 5, id: 'WO-20250518-0005', title: '广播终端PA-301网络故障', device: '广播终端-PA-301', assignee: '钱七', priority: '低', status: '待处理', created_at: '2025-05-18 11:45', desc: '偶发断连', area: '采掘工作面A' },
  { key: 6, id: 'WO-20250518-0006', title: '环境监测仪数据漂移校正', device: '环境监测仪-EM-100', assignee: '孙八', priority: '中', status: '已完成', created_at: '2025-05-18 10:00', desc: '温湿度读数偏差', area: '回风巷道' },
  { key: 7, id: 'WO-20250517-0007', title: '矿帽MKH-00456通讯模块更换', device: '智能矿帽-MKH-00456', assignee: '李工', priority: '紧急', status: '已完成', created_at: '2025-05-17 08:30', desc: '完全无响应', area: '采掘工作面B' },
  { key: 8, id: 'WO-20250517-0008', title: '粉尘传感器月度巡检', device: '粉尘传感器-DS-500', assignee: '王五', priority: '低', status: '已完成', created_at: '2025-05-17 14:00', desc: '例行巡检', area: '主运输巷道' },
  { key: 9, id: 'WO-20250516-0009', title: '摄像头-CAM-02镜头聚焦校准', device: '摄像头-CAM-02', assignee: '赵六', priority: '中', status: '处理中', created_at: '2025-05-16 09:20', desc: '画面模糊', area: '主运输巷道' },
  { key: 10, id: 'WO-20250516-0010', title: '定位系统时间同步校准', device: '定位基站-LB-201', assignee: '张工', priority: '高', status: '待处理', created_at: '2025-05-16 15:30', desc: '时钟偏差超阈值', area: '回风巷道' },
  { key: 11, id: 'WO-20250515-0011', title: '矿帽固件批量升级', device: '智能矿帽-MKH-00123', assignee: '钱七', priority: '中', status: '已完成', created_at: '2025-05-15 18:00', desc: 'v2.4.1 安全补丁', area: '采掘工作面A' },
  { key: 12, id: 'WO-20250515-0012', title: '广播系统音频链路排查', device: '广播终端-PA-300', assignee: '孙八', priority: '低', status: '已关闭', created_at: '2025-05-15 10:15', desc: '偶发杂音', area: '主斜井' },
];

export default function WorkOrders() {
  const [statusFilter, setStatusFilter] = useState('全部');

  const filteredOrders = useMemo(() => {
    if (statusFilter === '全部') return mockOrders;
    return mockOrders.filter((o) => o.status === statusFilter);
  }, [statusFilter]);

  const total = mockOrders.length;
  const pending = mockOrders.filter((o) => o.status === '待处理').length;
  const inProgress = mockOrders.filter((o) => o.status === '处理中').length;
  const completed = mockOrders.filter((o) => o.status === '已完成').length;

  const kpiCards = [
    { label: '工单总数', value: total, suffix: '张', icon: <FileTextOutlined />, bg: '#E8F3FF', color: '#0052D9' },
    { label: '待处理', value: pending, suffix: '张', icon: <ClockCircleOutlined />, bg: '#FFF1F0', color: '#FF4D4F' },
    { label: '处理中', value: inProgress, suffix: '张', icon: <SyncOutlined />, bg: '#E6F4FF', color: '#1677FF' },
    { label: '已完成', value: completed, suffix: '张', icon: <CheckCircleOutlined />, bg: '#F0FBE6', color: '#52C41A' },
  ];

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单编号', dataIndex: 'id', key: 'id', width: 155,
      render: (id: string) => <Text code style={{ fontSize: 11 }}>{id}</Text>,
    },
    {
      title: '标题', dataIndex: 'title', key: 'title', width: 210, ellipsis: true,
      render: (title: string) => <a style={{ fontSize: 13 }}>{title}</a>,
    },
    {
      title: '关联设备', dataIndex: 'device', key: 'device', width: 150, ellipsis: true,
      render: (device: string) => (
        <Space size={4}>
          <ToolOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{device}</Text>
        </Space>
      ),
    },
    {
      title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 75,
      render: (assignee: string) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{assignee}</Text>
        </Space>
      ),
    },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (priority: string) => {
        const colorMap: Record<string, string> = { '紧急': 'red', '高': 'orange', '中': 'blue', '低': 'default' };
        const iconMap: Record<string, React.ReactNode> = {
          '紧急': <ThunderboltOutlined />,
          '高': <WarningOutlined />,
          '中': <ExclamationCircleOutlined />,
          '低': <ClockCircleOutlined />,
        };
        return (
          <Tag color={colorMap[priority] || 'default'} icon={iconMap[priority]} style={{ margin: 0, fontSize: 11 }}>
            {priority}
          </Tag>
        );
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '待处理': 'red', '处理中': 'processing', '已完成': 'green', '已关闭': 'default',
        };
        return <Tag color={colorMap[status] || 'default'} style={{ margin: 0 }}>{status}</Tag>;
      },
    },
    { title: '区域', dataIndex: 'area', key: 'area', width: 110, ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 140 },
    {
      title: '操作', dataIndex: 'id', key: 'action', width: 120, fixed: 'right',
      render: (_: string, rec: WorkOrder) => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a style={{ fontSize: 12 }}>详情</a>
          {rec.status === '待处理' && <a style={{ fontSize: 12, color: '#1677FF' }}>接单</a>}
          {rec.status === '处理中' && <a style={{ fontSize: 12, color: '#52C41A' }}>完成</a>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{WorkOrdersCSS}</style>
      <div className="wo-root">
        <Row gutter={[12, 12]}>
          {kpiCards.map((card) => (
            <Col span={6} key={card.label}>
              <Card className="wo-kpi-card" bodyStyle={{ padding: '10px 14px 6px' }}>
                <div className="wo-kpi-inner">
                  <div className="wo-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="wo-kpi-body">
                    <div className="wo-kpi-label">{card.label}</div>
                    <div className="wo-kpi-value" style={{ color: card.color }}>
                      {card.value}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> {card.suffix}</span>
                    </div>
                    <div className="wo-kpi-sub">
                      完成率 {total > 0 ? ((completed / total) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>工单列表</span>}
          extra={
            <div className="wo-filter-bar">
              <Segmented
                size="small"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as string)}
                options={[
                  { label: '全部', value: '全部' },
                  { label: '待处理', value: '待处理' },
                  { label: '处理中', value: '处理中' },
                  { label: '已完成', value: '已完成' },
                ]}
              />
              <Button type="primary" size="small" icon={<PlusOutlined />}>
                新建工单
              </Button>
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table<WorkOrder>
            columns={columns}
            dataSource={filteredOrders}
            size="small"
            rowKey="id"
            scroll={{ x: 1030 }}
            pagination={{
              size: 'small',
              pageSize: 10,
              showTotal: (t: number) => `共 ${t} 张工单`,
            }}
          />
        </Card>
      </div>
    </>
  );
}
