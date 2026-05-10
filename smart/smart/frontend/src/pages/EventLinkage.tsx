import { useState, useMemo, useCallback, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ThunderboltOutlined, CheckCircleOutlined, SyncOutlined,
  FieldTimeOutlined, ApartmentOutlined, SettingOutlined,
  CaretUpOutlined, CaretDownOutlined, PlayCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { getAlarmList } from '../api';

const { Text, Title } = Typography;

interface LinkageRule {
  key: string;
  id: string;
  eventType: string;
  triggerCondition: string;
  action: string;
  devicesAffected: string;
  status: string;
  lastTriggered: string;
}

interface AlarmRecord {
  id: string;
  level: string;
  type: string;
  area: string;
  time: string;
  status: string;
}

const mockRules: LinkageRule[] = [
  {
    key: '1', id: 'LK-001', eventType: '瓦斯超限',
    triggerCondition: 'CH4浓度 ≥ 1.5%', action: '断电+声光报警+广播疏散',
    devicesAffected: '传感器CH4-12, 广播A区, 风机K2', status: '已启用', lastTriggered: '2025-05-08 14:22',
  },
  {
    key: '2', id: 'LK-002', eventType: '人员越界',
    triggerCondition: '进入禁入电子围栏区域', action: '视频弹窗+对讲呼叫+轨迹跟踪',
    devicesAffected: 'Camera-015, 对讲机CH3', status: '已启用', lastTriggered: '2025-05-08 13:45',
  },
  {
    key: '3', id: 'LK-003', eventType: '设备离线',
    triggerCondition: '设备心跳超时 > 30s', action: '短信通知+备用设备切换',
    devicesAffected: '所有矿井设备', status: '已启用', lastTriggered: '2025-05-08 10:18',
  },
  {
    key: '4', id: 'LK-004', eventType: '人员静止',
    triggerCondition: '人员位置15分钟不变', action: '语音提示+通知班组长',
    devicesAffected: '智能矿帽终端', status: '已启用', lastTriggered: '2025-05-08 09:52',
  },
  {
    key: '5', id: 'LK-005', eventType: '脑电疲劳',
    triggerCondition: '疲劳指数 > 65', action: '强制休息提醒+通知安全员',
    devicesAffected: '脑电检测模块', status: '已启用', lastTriggered: '2025-05-08 08:30',
  },
  {
    key: '6', id: 'LK-006', eventType: '粉尘浓度',
    triggerCondition: 'PM2.5 ≥ 500μg/m³', action: '启动喷雾降尘+通知撤离',
    devicesAffected: '粉尘传感器D10, 喷雾系统S3', status: '暂停', lastTriggered: '2025-05-07 18:15',
  },
  {
    key: '7', id: 'LK-007', eventType: '顶板压力',
    triggerCondition: '压力传感器 ≥ 80MPa', action: '分区断电+紧急撤离广播',
    devicesAffected: '压力传感器P05, 断电开关', status: '已启用', lastTriggered: '2025-05-07 11:02',
  },
  {
    key: '8', id: 'LK-008', eventType: '视频遮挡',
    triggerCondition: '视频画面遮挡率 > 90%', action: '声光提醒+记录日志',
    devicesAffected: 'Camera-022, Camera-031', status: '已启用', lastTriggered: '2025-05-06 16:40',
  },
];

const kpiCards = [
  {
    title: '联动规则总数', value: 12, suffix: '条',
    trend: '+9.1%', up: true, icon: <SettingOutlined />,
    iconBg: '#E6F0FF', iconColor: '#0052D9',
  },
  {
    title: '已启用规则', value: 10, suffix: '条',
    trend: '+11.1%', up: true, icon: <ThunderboltOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
  {
    title: '今日触达次数', value: 47, suffix: '次',
    trend: '+34.3%', up: true, icon: <PlayCircleOutlined />,
    iconBg: '#FFF1F0', iconColor: '#FF4D4F',
  },
  {
    title: '自动处置成功', value: 39, suffix: '次',
    trend: '+5.4%', up: true, icon: <CheckCircleOutlined />,
    iconBg: '#E6F4FF', iconColor: '#1677FF',
  },
];

const triggerHourData = [2, 5, 3, 4, 7, 6, 9, 5, 4, 3, 2, 1, 3, 8, 10, 7, 5, 4, 6, 3, 2, 1, 0, 1];

export default function EventLinkage() {
  const [relatedAlarms, setRelatedAlarms] = useState<AlarmRecord[]>([]);
  const [alarmLoading, setAlarmLoading] = useState(false);

  const fetchRelatedAlarms = useCallback(async () => {
    setAlarmLoading(true);
    try {
      const res = await getAlarmList({ page: 1, page_size: 10, status: 'all' });
      const items: AlarmRecord[] = ((res.data as { data?: { items?: unknown[] } })?.data?.items || []).map(
        (item: unknown, idx: number) => {
          const a = item as Record<string, unknown>;
          return {
            id: (a.id as string) || `AL-${idx + 1}`,
            level: (a.level as string) || '中',
            type: (a.type as string) || '联动告警',
            area: (a.area as string) || '未知区域',
            time: (a.time as string) || '--',
            status: (a.status as string) || '待处置',
          };
        },
      );
      setRelatedAlarms(items);
    } catch {
      setRelatedAlarms([]);
    } finally {
      setAlarmLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRelatedAlarms();
  }, [fetchRelatedAlarms]);

  const barOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { top: 10, right: 16, bottom: 24, left: 36 },
    xAxis: {
      type: 'category' as const,
      data: triggerHourData.map((_, i) => `${String(i).padStart(2, '0')}:00`),
      axisLabel: { fontSize: 10, color: '#86909C', interval: 3 },
    },
    yAxis: {
      type: 'value' as const,
      name: '触发次数',
      nameTextStyle: { fontSize: 10, color: '#86909C' },
      axisLabel: { fontSize: 10, color: '#86909C' },
    },
    series: [{
      name: '触发次数',
      type: 'bar' as const,
      data: triggerHourData,
      itemStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#1677FF' },
            { offset: 1, color: '#69B1FF' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 8,
    }],
  }), []);

  const ruleColumns: ColumnsType<LinkageRule> = useMemo(() => [
    { title: '规则编号', dataIndex: 'id', key: 'id', width: 90, ellipsis: true },
    {
      title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 110,
      render: (v: string) => {
        const cm: Record<string, string> = {
          '瓦斯超限': 'red', '人员越界': 'orange', '设备离线': 'blue',
          '人员静止': 'purple', '脑电疲劳': 'geekblue', '粉尘浓度': 'gold',
          '顶板压力': 'volcano', '视频遮挡': 'cyan',
        };
        return <Tag color={cm[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: '触发条件', dataIndex: 'triggerCondition', key: 'triggerCondition', width: 180, ellipsis: true },
    { title: '执行动作', dataIndex: 'action', key: 'action', width: 200, ellipsis: true },
    { title: '影响设备', dataIndex: 'devicesAffected', key: 'devicesAffected', width: 160, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => {
        const color = v === '已启用' ? 'green' : 'default';
        const icon = v === '已启用' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return <Tag color={color} icon={icon}>{v}</Tag>;
      },
    },
    { title: '上次触达', dataIndex: 'lastTriggered', key: 'lastTriggered', width: 150 },
    {
      title: '操作', key: 'actions', width: 140,
      render: () => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a style={{ fontSize: 12, color: '#1677FF' }}>编辑</a>
          <a style={{ fontSize: 12, color: '#FF4D4F' }}>停用</a>
          <a style={{ fontSize: 12, color: '#1677FF' }}>日志</a>
        </Space>
      ),
    },
  ], []);

  const alarmColumns: ColumnsType<AlarmRecord> = useMemo(() => [
    { title: '告警ID', dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 70,
      render: (v: string) => {
        const cm: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'blue' };
        return <Tag color={cm[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, ellipsis: true },
    { title: '区域', dataIndex: 'area', key: 'area', width: 140, ellipsis: true },
    { title: '触发时间', dataIndex: 'time', key: 'time', width: 130 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const cm: Record<string, string> = { '待处置': 'red', '处置中': 'processing', '已处置': 'green' };
        return <Tag color={cm[v] || 'default'}>{v}</Tag>;
      },
    },
  ], []);

  return (
    <div>
      <style>{`
        .evt-kpi-icon-box {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .evt-trend-text {
          font-size: 11px; display: inline-flex; align-items: center; gap: 2px; margin-top: 4px;
        }
        .evt-section-header {
          font-size: 14px; font-weight: 600; color: #1D2129;
          display: flex; align-items: center; gap: 8px;
        }
        .evt-section-header::before {
          content: ''; width: 4px; height: 16px; border-radius: 2px;
          background: #1677FF; display: inline-block;
        }
        .evt-empty-alarms {
          padding: 40px 0; text-align: center; color: #BFBFBF; font-size: 13px;
        }
      `}</style>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {kpiCards.map((s, i) => (
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
                  <div className="evt-trend-text" style={{ color: s.up ? '#FF4D4F' : '#52C41A' }}>
                    {s.up ? <CaretUpOutlined /> : <CaretDownOutlined />}
                    {s.trend}
                    <span style={{ color: '#BFBFBF', marginLeft: 4 }}>较昨日</span>
                  </div>
                </div>
                <div className="evt-kpi-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart + Rule Table */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {/* Trigger Events by Hour Bar Chart */}
        <Col span={8}>
          <Card
            size="small"
            title={<span className="evt-section-header" style={{ fontSize: 13, fontWeight: 600 }}>今日触发统计</span>}
            styles={{ body: { padding: '8px 8px 0' } }}
          >
            <ReactECharts
              option={barOption}
              style={{ height: 280, width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0', borderTop: '1px solid #F5F5F5', marginTop: 4 }}>
              {[
                { label: '最高时段', value: '14:00-15:00', color: '#FF4D4F' },
                { label: '最低时段', value: '03:00-04:00', color: '#52C41A' },
                { label: '平均每小时', value: '4.3次', color: '#1677FF' },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#86909C' }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: item.color, marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Linkage Rules Table */}
        <Col span={16}>
          <Card
            size="small"
            title={
              <Space>
                <span className="evt-section-header" style={{ fontSize: 13, fontWeight: 600 }}>联动规则列表</span>
                <Tag color="blue">8条规则</Tag>
              </Space>
            }
            extra={
              <Space>
                <Button size="small" type="primary" icon={<ThunderboltOutlined />}>新增规则</Button>
                <Button size="small" icon={<SyncOutlined />}>刷新</Button>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table<LinkageRule>
              columns={ruleColumns}
              dataSource={mockRules}
              size="small"
              scroll={{ x: 1050 }}
              pagination={{ size: 'small', pageSize: 6, showTotal: (t) => `共 ${t} 条规则` }}
            />
          </Card>
        </Col>
      </Row>

      {/* Related Alarms */}
      <Card
        size="small"
        title={
          <Space>
            <span className="evt-section-header" style={{ fontSize: 13, fontWeight: 600 }}>联动告警记录</span>
            <Tag color="orange">关联告警</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button size="small" icon={<SyncOutlined />} loading={alarmLoading} onClick={fetchRelatedAlarms}>刷新</Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        {relatedAlarms.length > 0 ? (
          <Table<AlarmRecord>
            columns={alarmColumns}
            dataSource={relatedAlarms}
            size="small"
            scroll={{ x: 650 }}
            pagination={{ size: 'small', pageSize: 5, showTotal: (t) => `共 ${t} 条记录` }}
          />
        ) : (
          <div className="evt-empty-alarms">
            <ExclamationCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <div>暂无关联告警数据</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>点击刷新按钮重新获取</div>
          </div>
        )}
      </Card>
    </div>
  );
}
