import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Statistic, Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined, CheckCircleOutlined, SyncOutlined,
  FieldTimeOutlined, CaretUpOutlined, CaretDownOutlined,
  WarningOutlined, FilterOutlined, SearchOutlined,
  ClockCircleOutlined, EnvironmentOutlined, UserOutlined,
  PlayCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { getAlarmList } from '../api';

const { Text, Title } = Typography;

interface DisposalRecord {
  key: string;
  id: string;
  level: string;
  type: string;
  location: string;
  status: string;
  handler: string;
  triggeredTime: string;
  disposedTime: string;
  responseMinutes: number;
}

const statusOptions = [
  { label: '全部 47', value: '全部' },
  { label: '已处置 31', value: '已处置' },
  { label: '处置中 12', value: '处置中' },
  { label: '超时 4', value: '超时' },
];

const kpiData = [
  {
    title: '处置总数(月)', value: 312, suffix: '条',
    trend: '+12.6%', up: true, icon: <AuditOutlined />,
    iconBg: '#E6F0FF', iconColor: '#0052D9',
  },
  {
    title: '已处置', value: 271, suffix: '条',
    trend: '+8.4%', up: true, icon: <CheckCircleOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
  {
    title: '处置中', value: 31, suffix: '条',
    trend: '-5.2%', up: false, icon: <SyncOutlined />,
    iconBg: '#E6F4FF', iconColor: '#1677FF',
  },
  {
    title: '平均响应时间', value: 4.8, suffix: '分钟',
    trend: '-18.6%', up: false, icon: <FieldTimeOutlined />,
    iconBg: '#FFF7E6', iconColor: '#FAAD14',
  },
];

export default function DisposalRecord() {
  const [activeStatus, setActiveStatus] = useState('全部');
  const [records, setRecords] = useState<DisposalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, page_size: 50 };
      if (status !== '全部') {
        params.status = status;
      }
      const res = await getAlarmList(params);
      const items = ((res.data as { data?: { items?: unknown[] } })?.data?.items || []) as Record<string, unknown>[];
      const mapped: DisposalRecord[] = items.map((item: Record<string, unknown>, idx: number) => ({
        key: String(idx + 1),
        id: (item.id as string) || `AL-${String(idx).padStart(4, '0')}`,
        level: (item.level as string) || '中',
        type: (item.type as string) || '未知',
        location: (item.area as string) || '未知区域',
        status: (item.status as string) || '待处置',
        handler: (item.handler as string) || '--',
        triggeredTime: (item.time as string) || '--',
        disposedTime: (item.disposalTime as string) || '--',
        responseMinutes: Math.floor(Math.random() * 30) + 1,
      }));
      setRecords(mapped);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(activeStatus);
  }, [activeStatus, fetchRecords]);

  const columns: ColumnsType<DisposalRecord> = useMemo(() => [
    {
      title: '告警编号', dataIndex: 'id', key: 'id', width: 140, ellipsis: true,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 70,
      render: (v: string) => {
        const cm: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'blue' };
        const iconMap: Record<string, React.ReactNode> = {
          '高': <WarningOutlined style={{ color: '#FF4D4F' }} />,
          '中': <WarningOutlined style={{ color: '#FAAD14' }} />,
          '低': <WarningOutlined style={{ color: '#1677FF' }} />,
        };
        return (
          <Space size={4}>
            {iconMap[v]}
            <Tag color={cm[v] || 'default'}>{v}</Tag>
          </Space>
        );
      },
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, ellipsis: true },
    {
      title: '位置', dataIndex: 'location', key: 'location', width: 150, ellipsis: true,
      render: (v: string) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => {
        const cm: Record<string, string> = {
          '待处置': 'red', '处置中': 'processing', '已处置': 'green',
          '超时未处置': 'error', '超期': 'error',
        };
        return <Tag color={cm[v] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: '处理人', dataIndex: 'handler', key: 'handler', width: 90,
      render: (v: string) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#86909C', fontSize: 11 }} />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '触发时间', dataIndex: 'triggeredTime', key: 'triggeredTime', width: 130,
      render: (v: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#86909C', fontSize: 11 }} />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '处置时间', dataIndex: 'disposedTime', key: 'disposedTime', width: 130,
      render: (v: string) => (
        <Space size={4}>
          <CheckCircleOutlined style={{ color: v === '--' ? '#BFBFBF' : '#52C41A', fontSize: 11 }} />
          <span style={{ color: v === '--' ? '#BFBFBF' : '#1D2129' }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '响应耗时', dataIndex: 'responseMinutes', key: 'responseMinutes', width: 100,
      render: (v: number) => {
        let color = '#52C41A';
        if (v > 15) color = '#FF4D4F';
        else if (v > 10) color = '#FAAD14';
        return (
          <Tag color={color === '#FF4D4F' ? 'red' : color === '#FAAD14' ? 'orange' : 'green'}>
            {v} 分钟
          </Tag>
        );
      },
    },
  ], []);

  return (
    <div>
      <style>{`
        .dpr-kpi-icon-box {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .dpr-trend-text {
          font-size: 11px; display: inline-flex; align-items: center; gap: 2px; margin-top: 4px;
        }
        .dpr-section-header {
          font-size: 14px; font-weight: 600; color: #1D2129;
          display: flex; align-items: center; gap: 8px;
        }
        .dpr-section-header::before {
          content: ''; width: 4px; height: 16px; border-radius: 2px;
          background: #52C41A; display: inline-block;
        }
        .dpr-filter-bar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
        }
        .dpr-response-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; padding: 2px 8px; border-radius: 4px;
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
                  <div className="dpr-trend-text" style={{ color: s.up ? '#FF4D4F' : '#52C41A' }}>
                    {s.up ? <CaretUpOutlined /> : <CaretDownOutlined />}
                    {s.trend}
                    <span style={{ color: '#BFBFBF', marginLeft: 4 }}>较上月</span>
                  </div>
                </div>
                <div className="dpr-kpi-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filter Bar */}
      <div className="dpr-filter-bar">
        <Segmented
          size="large"
          value={activeStatus}
          onChange={(v) => setActiveStatus(v as string)}
          options={statusOptions}
        />
        <Space size={8}>
          <Button size="small" icon={<FilterOutlined />} style={{ fontSize: 12 }}>高级筛选</Button>
          <Button size="small" icon={<SearchOutlined />} style={{ fontSize: 12 }}>搜索</Button>
        </Space>
      </div>

      {/* Disposal Records Table */}
      <Card
        size="small"
        title={
          <Space>
            <span className="dpr-section-header" style={{ fontSize: 13, fontWeight: 600 }}>处置记录</span>
            <Tag color="blue">处置记录</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button size="small" icon={<SyncOutlined />} loading={loading} onClick={() => fetchRecords(activeStatus)}>
              刷新
            </Button>
            <Button size="small" type="primary" icon={<PlayCircleOutlined />}>导出报表</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table<DisposalRecord>
          columns={columns}
          dataSource={records}
          size="small"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            size: 'small',
            pageSize: 10,
            showTotal: (t) => `共 ${t} 条处置记录`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>
    </div>
  );
}
