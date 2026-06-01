import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Typography, Statistic, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TeamOutlined, UserOutlined, ClockCircleOutlined,
  ScheduleOutlined, CaretUpOutlined, CaretDownOutlined,
  SwapOutlined, PhoneOutlined, IdcardOutlined,
  CheckCircleOutlined, MinusCircleOutlined,
  EnvironmentOutlined, PlusOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface ShiftRecord {
  key: string;
  shiftName: string;
  timeRange: string;
  leader: string;
  leaderPhone: string;
  members: string;
  memberCount: number;
  area: string;
  status: string;
}

interface DaySchedule {
  day: string;
  date: string;
  morningShift: string;
  afternoonShift: string;
  nightShift: string;
}

const mockShifts: ShiftRecord[] = [
  {
    key: '1', shiftName: '早班-A组', timeRange: '06:00 - 14:00',
    leader: '周强', leaderPhone: '138****5678', members: '王磊, 李华, 赵明, 刘洋',
    memberCount: 4, area: '采掘一区', status: '值班中',
  },
  {
    key: '2', shiftName: '早班-B组', timeRange: '06:00 - 14:00',
    leader: '陈刚', leaderPhone: '139****2345', members: '孙亮, 钱程, 吴杰',
    memberCount: 3, area: '采掘二区', status: '值班中',
  },
  {
    key: '3', shiftName: '中班-A组', timeRange: '14:00 - 22:00',
    leader: '林峰', leaderPhone: '137****9876', members: '郑伟, 黄强, 许可',
    memberCount: 3, area: '机电硐室', status: '待接班',
  },
  {
    key: '4', shiftName: '中班-B组', timeRange: '14:00 - 22:00',
    leader: '杨志', leaderPhone: '136****5432', members: '马超, 宋涛, 韩冰, 冯刚',
    memberCount: 4, area: '运输巷道', status: '待接班',
  },
  {
    key: '5', shiftName: '夜班-A组', timeRange: '22:00 - 06:00',
    leader: '何勇', leaderPhone: '135****6789', members: '曹伟, 崔磊, 潘浩',
    memberCount: 3, area: '全矿巡逻', status: '待接班',
  },
  {
    key: '6', shiftName: '夜班-B组', timeRange: '22:00 - 06:00',
    leader: '吕明', leaderPhone: '134****3456', members: '石磊, 侯强',
    memberCount: 2, area: '井口值守', status: '待接班',
  },
  {
    key: '7', shiftName: '应急值班', timeRange: '00:00 - 24:00',
    leader: '张工', leaderPhone: '133****1122', members: '应急救援小组全员',
    memberCount: 6, area: '应急指挥中心', status: '值班中',
  },
];

const weekSchedule: DaySchedule[] = [
  { day: '周一', date: '05/05', morningShift: 'A组(周强)', afternoonShift: 'A组(林峰)', nightShift: 'A组(何勇)' },
  { day: '周二', date: '05/06', morningShift: 'B组(陈刚)', afternoonShift: 'B组(杨志)', nightShift: 'B组(吕明)' },
  { day: '周三', date: '05/07', morningShift: 'A组(周强)', afternoonShift: 'A组(林峰)', nightShift: 'A组(何勇)' },
  { day: '周四', date: '05/08', morningShift: 'B组(陈刚)', afternoonShift: 'B组(杨志)', nightShift: 'B组(吕明)' },
  { day: '周五', date: '05/09', morningShift: 'A组(周强)', afternoonShift: 'A组(林峰)', nightShift: 'A组(何勇)' },
  { day: '周六', date: '05/10', morningShift: 'B组(陈刚)', afternoonShift: 'B组(杨志)', nightShift: 'B组(吕明)' },
  { day: '周日', date: '05/11', morningShift: '应急值班', afternoonShift: '应急值班', nightShift: 'A组(何勇)' },
];

const kpiData = [
  {
    title: '今日班组', value: 7, suffix: '个',
    trend: '正常', up: true, icon: <TeamOutlined />,
    iconBg: '#E6F0FF', iconColor: '#0052D9',
  },
  {
    title: '在岗人数', value: 16, suffix: '人',
    trend: '+6.7%', up: true, icon: <UserOutlined />,
    iconBg: '#F0FBE6', iconColor: '#52C41A',
  },
  {
    title: '下个交接', value: '14:00', suffix: '',
    trend: '约2.5小时后', up: false, icon: <ClockCircleOutlined />,
    iconBg: '#FFF7E6', iconColor: '#FAAD14',
  },
  {
    title: '值班总人数', value: 28, suffix: '人',
    trend: '+16.7%', up: true, icon: <IdcardOutlined />,
    iconBg: '#E6F4FF', iconColor: '#1677FF',
  },
];

export default function ShiftManage() {
  const [selectedShift, setSelectedShift] = useState<string>('1');

  const columns: ColumnsType<ShiftRecord> = useMemo(() => [
    { title: '班组名称', dataIndex: 'shiftName', key: 'shiftName', width: 110, ellipsis: true },
    {
      title: '时段', dataIndex: 'timeRange', key: 'timeRange', width: 130,
      render: (v: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '班组长', dataIndex: 'leader', key: 'leader', width: 90,
      render: (v: string, record: ShiftRecord) => (
        <Space size={4}>
          <UserOutlined style={{ color: '#1677FF', fontSize: 12 }} />
          <span>{v}</span>
          <span style={{ fontSize: 10, color: '#BFBFBF' }}>{record.leaderPhone}</span>
        </Space>
      ),
    },
    {
      title: '成员', dataIndex: 'members', key: 'members', width: 200, ellipsis: true,
      render: (v: string, record: ShiftRecord) => (
        <Space size={4}>
          <TeamOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <span>{v}</span>
          <Tag style={{ fontSize: 10, marginLeft: 4 }}>{record.memberCount}人</Tag>
        </Space>
      ),
    },
    {
      title: '负责区域', dataIndex: 'area', key: 'area', width: 130,
      render: (v: string) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#86909C', fontSize: 12 }} />
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const color = v === '值班中' ? 'green' : v === '待接班' ? 'orange' : 'default';
        const icon = v === '值班中' ? <CheckCircleOutlined /> : v === '待接班' ? <ClockCircleOutlined /> : null;
        return <Tag color={color} icon={icon}>{v}</Tag>;
      },
    },
    {
      title: '操作', key: 'actions', width: 140,
      render: () => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a style={{ fontSize: 12, color: '#1677FF' }} onClick={() => message.info('加载值班详情...')}>详情</a>
          <a style={{ fontSize: 12, color: '#1677FF' }} onClick={() => message.info('打开排班编辑器')}>排班</a>
          <a style={{ fontSize: 12, color: '#FF4D4F' }} onClick={() => message.info('打开交接表单')}>交接</a>
        </Space>
      ),
    },
  ], []);

  return (
    <div>
      <style>{`
        .sft-kpi-icon-box {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .sft-trend-text {
          font-size: 11px; display: inline-flex; align-items: center; gap: 2px; margin-top: 4px;
        }
        .sft-section-header {
          font-size: 14px; font-weight: 600; color: #1D2129;
          display: flex; align-items: center; gap: 8px;
        }
        .sft-section-header::before {
          content: ''; width: 4px; height: 16px; border-radius: 2px;
          background: #0052D9; display: inline-block;
        }
        .sft-week-grid {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
          font-size: 11px;
        }
        .sft-week-header {
          text-align: center; font-weight: 600; padding: 6px 4px;
          background: #F5F7FA; border-radius: 6px; color: #4E5969;
          font-size: 12px; white-space: nowrap;
        }
        .sft-week-cell {
          text-align: center; padding: 6px 4px; border-radius: 6px;
          border: 1px solid #F0F0F0; min-height: 72px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .sft-week-cell-today {
          text-align: center; padding: 6px 4px; border-radius: 6px;
          border: 2px solid #1677FF; min-height: 72px;
          display: flex; flex-direction: column; gap: 4px;
          background: #E6F4FF;
        }
        .sft-shift-tag {
          font-size: 10px; padding: 2px 6px; border-radius: 4px;
          background: #F0F0F0; color: #595959; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .sft-shift-active {
          font-size: 10px; padding: 2px 6px; border-radius: 4px;
          background: #52C41A; color: #fff; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .sft-date-label {
          font-size: 10px; color: #BFBFBF; margin-bottom: 2px;
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
                  <div className="sft-trend-text" style={{ color: s.up ? '#52C41A' : '#FF4D4F' }}>
                    {typeof s.value === 'number' ? (s.up ? <CaretUpOutlined /> : <CaretDownOutlined />) : <ClockCircleOutlined />}
                    {s.trend}
                    <span style={{ color: '#BFBFBF', marginLeft: 4 }}>较昨日</span>
                  </div>
                </div>
                <div className="sft-kpi-icon-box" style={{ background: s.iconBg, color: s.iconColor }}>
                  {s.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={12}>
        {/* Shift List Table */}
        <Col span={14}>
          <Card
            size="small"
            title={
              <Space>
                <span className="sft-section-header" style={{ fontSize: 13, fontWeight: 600 }}>值班班组</span>
                <Tag color="blue">7个班组</Tag>
              </Space>
            }
            extra={
              <Space>
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => message.info('打开新增排班表单')}>新增排班</Button>
                <Button size="small" icon={<SwapOutlined />} onClick={() => message.info('启动批量交接流程')}>批量交接</Button>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table<ShiftRecord>
              columns={columns}
              dataSource={mockShifts}
              size="small"
              scroll={{ x: 950 }}
              pagination={{ size: 'small', pageSize: 7, showTotal: (t) => `共 ${t} 个班组` }}
              rowClassName={(rec) => selectedShift === rec.key ? 'adm-row-selected' : ''}
              onRow={(rec) => ({
                onClick: () => setSelectedShift(rec.key),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>

        {/* Weekly Schedule View */}
        <Col span={10}>
          <Card
            size="small"
            title={
              <Space>
                <ScheduleOutlined style={{ color: '#1677FF' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>本周排班表</span>
                <Tag color="green">2025年第19周</Tag>
              </Space>
            }
            extra={
              <Button size="small" icon={<SwapOutlined />} style={{ fontSize: 12 }} onClick={() => message.info('打开排班调整编辑器')}>调整排班</Button>
            }
            styles={{ body: { padding: '10px 12px' } }}
          >
            {/* Column Headers */}
            <div className="sft-week-grid" style={{ marginBottom: 4 }}>
              {weekSchedule.map((d) => (
                <div key={d.day} className="sft-week-header">
                  <div>{d.day}</div>
                  <div className="sft-date-label">{d.date}</div>
                </div>
              ))}
            </div>

            {/* Shift rows */}
            <div style={{ fontSize: 10, color: '#86909C', marginBottom: 4, fontWeight: 500 }}>早班 06:00-14:00</div>
            <div className="sft-week-grid" style={{ marginBottom: 8 }}>
              {weekSchedule.map((d, i) => (
                <div key={`m-${i}`} className={i === 3 ? 'sft-week-cell-today' : 'sft-week-cell'}>
                  <span className={i === 2 || i === 4 ? 'sft-shift-active' : 'sft-shift-tag'}>
                    {d.morningShift}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: '#86909C', marginBottom: 4, fontWeight: 500 }}>中班 14:00-22:00</div>
            <div className="sft-week-grid" style={{ marginBottom: 8 }}>
              {weekSchedule.map((d, i) => (
                <div key={`a-${i}`} className={i === 3 ? 'sft-week-cell-today' : 'sft-week-cell'}>
                  <span className="sft-shift-tag">{d.afternoonShift}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: '#86909C', marginBottom: 4, fontWeight: 500 }}>夜班 22:00-06:00</div>
            <div className="sft-week-grid">
              {weekSchedule.map((d, i) => (
                <div key={`n-${i}`} className={i === 3 ? 'sft-week-cell-today' : 'sft-week-cell'}>
                  <span className="sft-shift-tag">{d.nightShift}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, padding: '8px 0', borderTop: '1px solid #F0F0F0' }}>
              <Space size={4}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#E6F4FF', border: '2px solid #1677FF', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#595959' }}>今日</span>
              </Space>
              <Space size={4}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#52C41A', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#595959' }}>值班中</span>
              </Space>
              <Space size={4}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F0F0F0', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: '#595959' }}>待接班</span>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
