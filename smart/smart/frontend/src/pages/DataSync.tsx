import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Statistic, Button, Space, Tooltip, Badge, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudSyncOutlined, SyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LoadingOutlined, ReloadOutlined, ThunderboltOutlined, DatabaseOutlined,
  LinkOutlined, WarningOutlined, SettingOutlined, CloudDownloadOutlined,
  CloudUploadOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const DataSyncCSS = `
.ds-root { display: flex; flex-direction: column; gap: 12px; }
.ds-kpi-card { border-radius: 8px; }
.ds-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.ds-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.ds-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.ds-kpi-body { flex: 1; min-width: 0; }
.ds-kpi-label { font-size: 11px; color: #86909C; }
.ds-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.ds-kpi-sub { font-size: 11px; color: #86909C; }
.ds-toolbar { display: flex; align-items: center; gap: 8px; }
`;

interface SyncTask {
  key: number;
  task_name: string;
  source: string;
  target: string;
  last_sync: string;
  status: string;
  record_count: number;
  sync_type: string;
  frequency: string;
}

const mockTasks: SyncTask[] = [
  { key: 1, task_name: '人员定位数据同步', source: 'UWB定位系统', target: '辰尧云控平台', last_sync: '2025-05-20 10:30:15', status: '同步中', record_count: 23180, sync_type: '实时', frequency: '1s' },
  { key: 2, task_name: '告警事件同步', source: '智能矿帽终端', target: '联动处置平台', last_sync: '2025-05-20 10:30:12', status: '正常', record_count: 1423, sync_type: '实时', frequency: '3s' },
  { key: 3, task_name: '设备运行数据同步', source: 'IoT网关集群', target: '设备管理中心', last_sync: '2025-05-20 10:30:08', status: '正常', record_count: 85620, sync_type: '准实时', frequency: '5s' },
  { key: 4, task_name: '视频录像归档同步', source: 'NVR存储集群', target: '对象存储OSS', last_sync: '2025-05-20 10:00:00', status: '正常', record_count: 12040, sync_type: '定时', frequency: '1h' },
  { key: 5, task_name: '环境监测数据同步', source: '环境传感器网络', target: '数据分析平台', last_sync: '2025-05-20 10:30:05', status: '正常', record_count: 452300, sync_type: '准实时', frequency: '10s' },
  { key: 6, task_name: '人员考勤数据同步', source: '门禁考勤系统', target: 'HR管理系统', last_sync: '2025-05-20 06:00:00', status: '异常', record_count: 5210, sync_type: '定时', frequency: '6h' },
  { key: 7, task_name: '矿帽EEG脑电数据同步', source: '脑电分析引擎', target: '数据仓库', last_sync: '2025-05-20 10:29:55', status: '正常', record_count: 89200, sync_type: '实时', frequency: '2s' },
  { key: 8, task_name: '基础字典数据同步', source: '主数据管理平台', target: '各业务系统', last_sync: '2025-05-20 08:00:00', status: '正常', record_count: 3980, sync_type: '定时', frequency: '24h' },
  { key: 9, task_name: '巡检报告数据同步', source: '巡检终端APP', target: '文档管理系统', last_sync: '2025-05-20 09:45:00', status: '待执行', record_count: 0, sync_type: '手动', frequency: '-' },
  { key: 10, task_name: '电子围栏配置同步', source: '安全规则引擎', target: '定位计算节点', last_sync: '2025-05-20 10:30:00', status: '正常', record_count: 168, sync_type: '实时', frequency: '5s' },
  { key: 11, task_name: '系统日志归档同步', source: '日志采集Agent', target: 'ELK日志集群', last_sync: '2025-05-20 10:30:18', status: '正常', record_count: 1280000, sync_type: '实时', frequency: '1s' },
  { key: 12, task_name: '瓦斯监测数据上报', source: '瓦斯传感器网络', target: '安监局平台', last_sync: '2025-05-20 10:30:02', status: '同步中', record_count: 65400, sync_type: '实时', frequency: '500ms' },
];

export default function DataSync() {
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const total = mockTasks.length;
  const normalCount = mockTasks.filter((t) => t.status === '正常').length;
  const syncingCount = mockTasks.filter((t) => t.status === '同步中').length;
  const errorCount = mockTasks.filter((t) => t.status === '异常').length;
  const pendingCount = mockTasks.filter((t) => t.status === '待执行').length;

  const successRate = total > 0 ? ((normalCount + syncingCount) / total * 100).toFixed(1) : '100.0';

  const lastSuccessTask = useMemo(() => {
    const normal = mockTasks.filter((t) => t.status === '正常' || t.status === '同步中');
    if (normal.length === 0) return '暂无';
    const latest = normal.reduce((a, b) => (a.last_sync > b.last_sync ? a : b));
    return latest.last_sync;
  }, []);

  const kpiCards = [
    { label: '同步任务总数', value: total, suffix: '个', icon: <CloudSyncOutlined />, bg: '#E8F3FF', color: '#0052D9' },
    { label: '同步成功率', value: successRate, suffix: '%', icon: <CheckCircleOutlined />, bg: '#F0FBE6', color: '#52C41A' },
    { label: '最后同步时间', value: lastSuccessTask, suffix: '', icon: <ClockCircleOutlined />, bg: '#F2F3FF', color: '#7B61FF' },
    { label: '异常/待执行', value: `${errorCount}/${pendingCount}`, suffix: '个', icon: <ExclamationCircleOutlined />, bg: '#FFF7E6', color: '#FAAD14' },
  ];

  const handleSync = (key: number, taskName: string) => {
    setSyncing((prev) => ({ ...prev, [taskName]: true }));
    setTimeout(() => {
      setSyncing((prev) => ({ ...prev, [taskName]: false }));
    }, 2000);
  };

  const handleSyncAll = () => {
    mockTasks.forEach((t) => {
      setSyncing((prev) => ({ ...prev, [t.task_name]: true }));
    });
    setTimeout(() => {
      setSyncing({});
    }, 3000);
  };

  const columns: ColumnsType<SyncTask> = [
    {
      title: '任务名称', dataIndex: 'task_name', key: 'task_name', width: 180, ellipsis: true,
      render: (name: string) => (
        <Space size={4}>
          <CloudSyncOutlined style={{ color: '#0052D9', fontSize: 13 }} />
          <a style={{ fontSize: 13 }}>{name}</a>
        </Space>
      ),
    },
    {
      title: '数据源', dataIndex: 'source', key: 'source', width: 130, ellipsis: true,
      render: (source: string) => (
        <Space size={4}>
          <CloudUploadOutlined style={{ color: '#86909C', fontSize: 11 }} />
          <Text style={{ fontSize: 12 }}>{source}</Text>
        </Space>
      ),
    },
    {
      title: '目标端', dataIndex: 'target', key: 'target', width: 130, ellipsis: true,
      render: (target: string) => (
        <Space size={4}>
          <CloudDownloadOutlined style={{ color: '#86909C', fontSize: 11 }} />
          <Text style={{ fontSize: 12 }}>{target}</Text>
        </Space>
      ),
    },
    { title: '同步方式', dataIndex: 'sync_type', key: 'sync_type', width: 70, ellipsis: true },
    { title: '频率', dataIndex: 'frequency', key: 'frequency', width: 65 },
    {
      title: '最后同步', dataIndex: 'last_sync', key: 'last_sync', width: 145,
      render: (time: string) => <Text code style={{ fontSize: 11 }}>{time}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          '正常': 'green', '同步中': 'processing', '异常': 'error', '待执行': 'default',
        };
        const iconMap: Record<string, React.ReactNode> = {
          '正常': <CheckCircleOutlined />,
          '同步中': <LoadingOutlined />,
          '异常': <WarningOutlined />,
          '待执行': <ClockCircleOutlined />,
        };
        return (
          <Tag color={colorMap[status] || 'default'} icon={iconMap[status]} style={{ margin: 0 }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: '同步记录数', dataIndex: 'record_count', key: 'record_count', width: 100,
      render: (count: number) => (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {count > 0 ? new Intl.NumberFormat().format(count) : '-'}
        </Text>
      ),
    },
    {
      title: '操作', dataIndex: 'key', key: 'action', width: 120, fixed: 'right',
      render: (key: number, rec: SyncTask) => (
        <Space size={0} separator={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a
            style={{ fontSize: 12, color: rec.status === '同步中' ? '#BFBFBF' : '#1677FF' }}
            onClick={() => rec.status !== '同步中' && handleSync(key, rec.task_name)}
          >
            {syncing[rec.task_name] ? <LoadingOutlined style={{ marginRight: 2 }} /> : <ReloadOutlined style={{ marginRight: 2 }} />}
            {syncing[rec.task_name] ? '同步中' : '立即同步'}
          </a>
          <a style={{ fontSize: 12 }}>日志</a>
          <a style={{ fontSize: 12 }}>配置</a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{DataSyncCSS}</style>
      <div className="ds-root">
        <Row gutter={[12, 12]}>
          {kpiCards.map((card) => (
            <Col span={6} key={card.label}>
              <Card className="ds-kpi-card" bodyStyle={{ padding: '10px 14px 6px' }}>
                <div className="ds-kpi-inner">
                  <div className="ds-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="ds-kpi-body">
                    <div className="ds-kpi-label">{card.label}</div>
                    <div className="ds-kpi-value" style={{
                      color: card.color,
                      fontSize: card.label === '最后同步时间' ? 13 : 22,
                    }}>
                      {card.value}
                      {card.suffix && (
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> {card.suffix}</span>
                      )}
                    </div>
                    <div className="ds-kpi-sub">
                      {card.label === '异常/待执行' ? '需关注' : '近24小时'}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>同步任务列表</span>}
          extra={
            <div className="ds-toolbar">
              <Button
                type="primary"
                size="small"
                icon={<ThunderboltOutlined />}
                onClick={handleSyncAll}
                loading={Object.values(syncing).some(Boolean)}
              >
                一键全量同步
              </Button>
              <Button size="small" icon={<SettingOutlined />}>
                同步配置
              </Button>
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table<SyncTask>
            columns={columns}
            dataSource={mockTasks}
            size="small"
            rowKey="key"
            scroll={{ x: 1050 }}
            pagination={{
              size: 'small',
              pageSize: 10,
              showTotal: (t: number) => `共 ${t} 个同步任务`,
            }}
          />
        </Card>
      </div>
    </>
  );
}
