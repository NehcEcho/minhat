import { useState, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Statistic, Modal, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyCertificateOutlined, AimOutlined, FieldTimeOutlined,
  PercentageOutlined, FireOutlined, AlertOutlined, ToolOutlined,
  ExperimentOutlined, EnvironmentOutlined, CaretUpOutlined,
  CaretDownOutlined, BookOutlined, ThunderboltOutlined,
  FileProtectOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface EmergencyPlan {
  key: string;
  id: string;
  planName: string;
  type: string;
  level: string;
  applicableArea: string;
  status: string;
  updateTime: string;
  description: string;
}

const mockPlans: EmergencyPlan[] = [
  {
    key: '1', id: 'EP-001', planName: '矿井瓦斯爆炸应急预案',
    type: '瓦斯', level: '一级', applicableArea: '采掘工作面全区域',
    status: '已生效', updateTime: '2025-05-01',
    description: '针对CH4浓度超标引发的瓦斯爆炸事故，包含人员撤离路线、断电方案、救护队调度等。',
  },
  {
    key: '2', id: 'EP-002', planName: '井下火灾应急处置预案',
    type: '火灾', level: '一级', applicableArea: '主运输巷道及机电硐室',
    status: '已生效', updateTime: '2025-04-28',
    description: '覆盖电气火灾、皮带摩擦火灾等多种火灾类型，明确灭火器材位置及使用方法。',
  },
  {
    key: '3', id: 'EP-003', planName: '采空区塌方应急方案',
    type: '塌方', level: '一级', applicableArea: '采掘二区K4-K6段',
    status: '已生效', updateTime: '2025-04-20',
    description: '塌方事故发生时的人员搜救、支护加固、通风恢复等应急处置流程。',
  },
  {
    key: '4', id: 'EP-004', planName: '透水事故应急预案',
    type: '透水', level: '二级', applicableArea: '井下含水层邻近区域',
    status: '已生效', updateTime: '2025-04-15',
    description: '地下突水、涌水事故的预警、堵水、排水及人员撤离方案。',
  },
  {
    key: '5', id: 'EP-005', planName: '有害气体超标应急预案',
    type: '瓦斯', level: '二级', applicableArea: '回风巷道及密闭空间',
    status: '已生效', updateTime: '2025-04-10',
    description: 'CO、H2S等有害气体浓度超标时的通风加强、人员疏散方案。',
  },
  {
    key: '6', id: 'EP-006', planName: '大面积停电应急方案',
    type: '其他', level: '二级', applicableArea: '全矿供电系统',
    status: '已生效', updateTime: '2025-04-05',
    description: '主供电线路故障导致大面积停电时的应急电源切换、人员升井方案。',
  },
  {
    key: '7', id: 'EP-007', planName: '台风暴雨防汛预案',
    type: '其他', level: '三级', applicableArea: '井口及地面设施',
    status: '已生效', updateTime: '2025-03-28',
    description: '极端天气下井口防水、排水设备启动、地面设施加固方案。',
  },
  {
    key: '8', id: 'EP-008', planName: '提升运输事故预案',
    type: '其他', level: '三级', applicableArea: '主副井提升系统',
    status: '修订中', updateTime: '2025-03-20',
    description: '提升机故障、断绳、过卷等事故的应急救援和人员解救方案。',
  },
];

const kpiData = [
  {
    title: '应急预案总数', value: 15, suffix: '个',
    trend: '+15.4%', up: true, icon: <SafetyCertificateOutlined />,
    iconBg: '#E6F0FF', iconColor: '#0052D9',
  },
  {
    title: '演练次数(年度)', value: 23, suffix: '次',
    trend: '+27.8%', up: true, icon: <AimOutlined />,
    iconBg: '#E6F4FF', iconColor: '#1677FF',
  },
  {
    title: '最近演练日期', value: '2025-05-06', suffix: '',
    trend: '3天前', up: false, icon: <FieldTimeOutlined />,
    iconBg: '#FFF7E6', iconColor: '#FAAD14',
  },
  {
    title: '区域覆盖率', value: 94.5, suffix: '%',
    trend: '+2.3%', up: true, icon: <PercentageOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
];

const typeIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
  '瓦斯': { icon: <AlertOutlined />, color: 'red' },
  '火灾': { icon: <FireOutlined />, color: 'volcano' },
  '塌方': { icon: <ToolOutlined />, color: 'orange' },
  '透水': { icon: <ExperimentOutlined />, color: 'blue' },
  '其他': { icon: <FileProtectOutlined />, color: 'default' },
};

const levelColorMap: Record<string, string> = {
  '一级': 'red',
  '二级': 'orange',
  '三级': 'blue',
};

export default function EmergencyPlan() {
  const [drillLoading, setDrillLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<EmergencyPlan | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleView = useCallback((plan: EmergencyPlan) => {
    setSelectedPlan(plan);
    setDetailVisible(true);
  }, []);

  const handleDrill = useCallback((planId: string) => {
    setDrillLoading(planId);
    setTimeout(() => {
      setDrillLoading(null);
      message.success(`预案 ${planId} 演练已启动，请关注演练进度`);
    }, 1800);
  }, []);

  const columns: ColumnsType<EmergencyPlan> = useMemo(() => [
    { title: '预案编号', dataIndex: 'id', key: 'id', width: 95, ellipsis: true },
    {
      title: '预案名称', dataIndex: 'planName', key: 'planName', width: 200, ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (v: string) => {
        const m = typeIconMap[v] || typeIconMap['其他'];
        return <Tag color={m.color} icon={m.icon}>{v}</Tag>;
      },
    },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 80,
      render: (v: string) => <Tag color={levelColorMap[v] || 'default'}>{v}</Tag>,
    },
    { title: '适用区域', dataIndex: 'applicableArea', key: 'applicableArea', width: 170, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const color = v === '已生效' ? 'green' : v === '修订中' ? 'processing' : 'default';
        const icon = v === '已生效' ? <CheckCircleOutlined /> : v === '修订中' ? <ClockCircleOutlined /> : null;
        return <Tag color={color} icon={icon}>{v}</Tag>;
      },
    },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 110 },
    {
      title: '操作', key: 'actions', width: 160,
      render: (_: unknown, record: EmergencyPlan) => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a style={{ fontSize: 12, color: '#1677FF' }} onClick={() => handleView(record)}>查看</a>
          <a
            style={{ fontSize: 12, color: drillLoading === record.key ? '#BFBFBF' : '#FF4D4F' }}
            onClick={() => drillLoading !== record.key && handleDrill(record.id)}
          >
            {drillLoading === record.key ? '启动中...' : '执行演练'}
          </a>
        </Space>
      ),
    },
  ], [drillLoading, handleView, handleDrill]);

  return (
    <div>
      <style>{`
        .emp-kpi-icon-box {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .emp-trend-text {
          font-size: 11px; display: inline-flex; align-items: center; gap: 2px; margin-top: 4px;
        }
        .emp-section-header {
          font-size: 14px; font-weight: 600; color: #1D2129;
          display: flex; align-items: center; gap: 8px;
        }
        .emp-section-header::before {
          content: ''; width: 4px; height: 16px; border-radius: 2px;
          background: #FF4D4F; display: inline-block;
        }
        .emp-detail-item {
          display: flex; gap: 10px; margin-bottom: 12px;
        }
        .emp-detail-label {
          font-size: 12px; color: #86909C; min-width: 70px; flex-shrink: 0;
        }
        .emp-detail-value {
          font-size: 13px; color: #1D2129; word-break: break-all;
        }
        .emp-quick-stats {
          background: linear-gradient(135deg, #FFF1F0 0%, #FFF7E6 100%);
          border: 1px solid #FFE58F; border-radius: 8px; padding: 16px;
          margin-bottom: 16px;
        }
      `}</style>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {kpiData.map((s, i) => (
          <Col span={6} key={i}>
            <Card size="small" styles={{ body: { padding: '14px 16px 12px' } }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 2 }}>{s.title}</div>
                  <Statistic
                    value={s.value}
                    suffix={<span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}>{s.suffix}</span>}
                    valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1D2129', lineHeight: 1.2 }}
                  />
                  <div className="emp-trend-text" style={{ color: typeof s.value === 'number' && s.up ? '#FF4D4F' : '#52C41A' }}>
                    {typeof s.value === 'number' && <CaretUpOutlined />}
                    {s.trend}
                    <span style={{ color: '#BFBFBF', marginLeft: 4 }}>
                      {typeof s.value === 'number' ? '较上季度' : ''}
                    </span>
                  </div>
                </div>
                <div className="emp-kpi-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Stats Banner */}
      <div className="emp-quick-stats">
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#86909C' }}>一级预案</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#FF4D4F' }}>4</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#86909C' }}>二级预案</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#FAAD14' }}>6</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#86909C' }}>三级预案</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1677FF' }}>5</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#86909C' }}>参与演练人次</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#52C41A' }}>1,240</div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Plan Table */}
      <Card
        size="small"
        title={
          <Space>
            <span className="emp-section-header" style={{ fontSize: 13, fontWeight: 600 }}>应急预案列表</span>
            <Tag color="red">15个预案</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={() => message.info('打开新建预案表单')}>新建预案</Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => message.info('启动批量应急演练...')}>批量演练</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table<EmergencyPlan>
          columns={columns}
          dataSource={mockPlans}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{ size: 'small', pageSize: 6, showTotal: (t) => `共 ${t} 个预案` }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#FF4D4F' }} />
            <span>预案详情</span>
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button
            key="drill"
            type="primary"
            danger
            icon={<ThunderboltOutlined />}
            onClick={() => {
              if (selectedPlan) {
                setDetailVisible(false);
                handleDrill(selectedPlan.id);
              }
            }}
          >
            执行演练
          </Button>,
        ]}
        width={600}
      >
        {selectedPlan && (
          <div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">预案编号</span>
              <span className="emp-detail-value" style={{ fontFamily: 'monospace' }}>{selectedPlan.id}</span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">预案名称</span>
              <span className="emp-detail-value" style={{ fontWeight: 600 }}>{selectedPlan.planName}</span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">预案类型</span>
              <span className="emp-detail-value">
                {(() => {
                  const m = typeIconMap[selectedPlan.type] || typeIconMap['其他'];
                  return <Tag color={m.color} icon={m.icon}>{selectedPlan.type}</Tag>;
                })()}
              </span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">预案等级</span>
              <span className="emp-detail-value">
                <Tag color={levelColorMap[selectedPlan.level] || 'default'}>{selectedPlan.level}</Tag>
              </span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">适用区域</span>
              <span className="emp-detail-value"><EnvironmentOutlined style={{ marginRight: 4, color: '#86909C' }} />{selectedPlan.applicableArea}</span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">当前状态</span>
              <span className="emp-detail-value">
                <Tag color={selectedPlan.status === '已生效' ? 'green' : 'processing'}>{selectedPlan.status}</Tag>
              </span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">更新时间</span>
              <span className="emp-detail-value">{selectedPlan.updateTime}</span>
            </div>
            <div className="emp-detail-item">
              <span className="emp-detail-label">预案描述</span>
              <span className="emp-detail-value" style={{ padding: '10px 12px', background: '#FFF7E6', borderRadius: 6, border: '1px solid #FFE58F', marginTop: 0 }}>
                {selectedPlan.description}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
