import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Space, Typography,
  Select, Input, Descriptions, Tabs, Avatar, Dropdown, Divider,
} from 'antd';
import {
  UserOutlined, PlusOutlined, SearchOutlined, ReloadOutlined,
  TeamOutlined, IdcardOutlined, RiseOutlined, FallOutlined,
  EyeOutlined, EditOutlined, SwapOutlined, ManOutlined, WomanOutlined,
  CheckCircleOutlined, MinusCircleOutlined, SendOutlined,
  LockOutlined, KeyOutlined, ExportOutlined, MoreOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, CalendarOutlined,
  SolutionOutlined, SafetyOutlined, HomeOutlined, FileTextOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Text, Title } = Typography;
const { Option } = Select;

const statCards = [
  { key: 'total', label: '员工总数', value: '1,268', icon: <TeamOutlined />, bg: '#E8F3FF', color: '#0052D9' },
  { key: 'onDuty', label: '在职', value: '1,156', icon: <CheckCircleOutlined />, bg: '#E8F8F2', color: '#2BA471' },
  { key: 'resigned', label: '离职', value: '112', icon: <MinusCircleOutlined />, bg: '#FFF3E8', color: '#E37318' },
  { key: 'newHires', label: '本月新入', value: '24', icon: <RiseOutlined />, bg: '#F2F3FF', color: '#7B61FF' },
  { key: 'resignedMonth', label: '本月离职', value: '8', icon: <FallOutlined />, bg: '#FDECEE', color: '#D54941' },
  { key: 'outsourced', label: '外包人员', value: '96', icon: <SendOutlined />, bg: '#E8FFFB', color: '#14C9C9' },
];

const departments = ['全部部门', '安全监察部', '生产部', '技术部', '调度中心', '机电部', '通风部'];
const positions = ['全部职位', '管理岗', '技术岗', '操作岗'];
const statuses = ['全部状态', '在职', '休假', '离职'];

const statusTagMap: Record<string, { color: string; label: string }> = {
  '在职': { color: 'green', label: '在职' },
  '休假': { color: 'orange', label: '休假' },
  '离职': { color: 'red', label: '离职' },
};

const employeeData = [
  { key: '1', id: '100001', name: '张三', gender: '男', dept: '安全监察部', position: '安全总监', phone: '138****5678', idCard: '3201********1234', status: '在职', hireDate: '2023-01-15' },
  { key: '2', id: '100002', name: '李红梅', gender: '女', dept: '生产部', position: '生产部长', phone: '139****7890', idCard: '3201********2345', status: '在职', hireDate: '2016-07-22' },
  { key: '3', id: '100003', name: '王建国', gender: '男', dept: '技术部', position: '技术主管', phone: '150****4321', idCard: '3201********3456', status: '在职', hireDate: '2019-01-10' },
  { key: '4', id: '100004', name: '赵小明', gender: '男', dept: '调度中心', position: '调度员', phone: '186****5678', idCard: '3201********4567', status: '在职', hireDate: '2020-06-05' },
  { key: '5', id: '100005', name: '孙丽华', gender: '女', dept: '机电部', position: '电气工程师', phone: '137****8901', idCard: '3201********5678', status: '在职', hireDate: '2017-09-18' },
  { key: '6', id: '100006', name: '钱志强', gender: '男', dept: '通风部', position: '通风队长', phone: '158****0123', idCard: '3201********6789', status: '在职', hireDate: '2015-04-28' },
  { key: '7', id: '100007', name: '周美玲', gender: '女', dept: '安全监察部', position: '安全员', phone: '189****3456', idCard: '3201********7890', status: '休假', hireDate: '2021-02-14' },
  { key: '8', id: '100008', name: '吴伟', gender: '男', dept: '生产部', position: '采矿工程师', phone: '133****6789', idCard: '3201********8901', status: '在职', hireDate: '2019-08-30' },
  { key: '9', id: '100009', name: '郑晓峰', gender: '男', dept: '技术部', position: '地质工程师', phone: '155****9012', idCard: '3201********9012', status: '休假', hireDate: '2014-11-12' },
  { key: '10', id: '100010', name: '陈秀英', gender: '女', dept: '调度中心', position: '调度长', phone: '177****1234', idCard: '3201********0123', status: '在职', hireDate: '2016-05-20' },
  { key: '11', id: '100011', name: '林大伟', gender: '男', dept: '机电部', position: '机械工程师', phone: '152****4567', idCard: '3201********1122', status: '休假', hireDate: '2020-10-08' },
  { key: '12', id: '100012', name: '黄玉兰', gender: '女', dept: '通风部', position: '监测员', phone: '131****7890', idCard: '3201********2233', status: '在职', hireDate: '2022-01-25' },
  { key: '13', id: '100013', name: '刘刚', gender: '男', dept: '安全监察部', position: '监察员', phone: '185****0123', idCard: '3201********3344', status: '离职', hireDate: '2017-07-03' },
  { key: '14', id: '100014', name: '胡桂芳', gender: '女', dept: '技术部', position: '数据分析师', phone: '156****3456', idCard: '3201********4455', status: '在职', hireDate: '2021-09-15' },
];

const detailTabs = ['基本信息', '岗位', '学历', '证书', '培训', '考勤', '绩效', '日志'];

const quickActions = [
  { icon: <EyeOutlined />, label: '查看档案', color: '#0052D9', bg: '#E8F3FF' },
  { icon: <EditOutlined />, label: '编辑信息', color: '#2BA471', bg: '#E8F8F2' },
  { icon: <SwapOutlined />, label: '岗位变动', color: '#E37318', bg: '#FFF3E8' },
  { icon: <SafetyOutlined />, label: '权限设置', color: '#7B61FF', bg: '#F2F3FF' },
  { icon: <KeyOutlined />, label: '重置密码', color: '#14C9C9', bg: '#E8FFFB' },
  { icon: <FallOutlined />, label: '离职办理', color: '#D54941', bg: '#FDECEE' },
  { icon: <ExportOutlined />, label: '导出', color: '#86909C', bg: '#F2F3F5' },
  { icon: <MoreOutlined />, label: '更多', color: '#86909C', bg: '#F2F3F5' },
];

const employeeDetailData: Record<string, unknown> = {
  gender: '男',
  dob: '1990-06-15',
  ethnicity: '汉族',
  email: 'zhangsan@kuangyu.com',
  address: '江苏省南京市江宁区某某街道某某路123号',
  politicalStatus: '中共党员',
  maritalStatus: '已婚',
  emergencyContact: '妻子',
  emergencyPhone: '139****8765',
};

export default function EmployeeManagement() {
  const [selectedRow, setSelectedRow] = useState(employeeData[0]);
  const [detailTab, setDetailTab] = useState('基本信息');

  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchDept, setSearchDept] = useState('全部部门');
  const [searchPosition, setSearchPosition] = useState('全部职位');
  const [searchStatus, setSearchStatus] = useState('全部状态');

  const actionItems = [
    { key: 'view', label: '查看', icon: <EyeOutlined /> },
    { key: 'edit', label: '编辑', icon: <EditOutlined /> },
    { type: 'divider' as const },
    { key: 'position', label: '岗位变动', icon: <SwapOutlined /> },
    { key: 'permission', label: '权限设置', icon: <LockOutlined /> },
    { key: 'resetPwd', label: '重置密码', icon: <KeyOutlined /> },
  ];

  const filteredData = useMemo(() => {
    return employeeData.filter((item) => {
      if (searchName && !item.name.includes(searchName)) return false;
      if (searchId && !item.id.includes(searchId)) return false;
      if (searchDept !== '全部部门' && item.dept !== searchDept) return false;
      if (searchPosition !== '全部职位' && item.position !== searchPosition) return false;
      if (searchStatus !== '全部状态' && item.status !== searchStatus) return false;
      return true;
    });
  }, [searchName, searchId, searchDept, searchPosition, searchStatus]);

  const handleReset = () => {
    setSearchName('');
    setSearchId('');
    setSearchDept('全部部门');
    setSearchPosition('全部职位');
    setSearchStatus('全部状态');
  };

  const personnelStructureOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}%' },
    legend: {
      orient: 'vertical' as const,
      right: 0,
      top: 'middle',
      textStyle: { fontSize: 10, lineHeight: 14 },
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 6,
      formatter: (name: string) => {
        const item = [{ name: '安全监察部', value: 22.6 }, { name: '生产部', value: 20.1 }, { name: '技术部', value: 18.4 }, { name: '调度中心', value: 14.2 }, { name: '机电部', value: 13.5 }, { name: '通风部', value: 11.2 }].find((d) => d.name === name);
        return item ? `${name}  ${item.value}%` : name;
      },
    },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '78%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 22.6, name: '安全监察部', itemStyle: { color: '#5470C6' } },
        { value: 20.1, name: '生产部', itemStyle: { color: '#91CC75' } },
        { value: 18.4, name: '技术部', itemStyle: { color: '#FAC858' } },
        { value: 14.2, name: '调度中心', itemStyle: { color: '#EE6666' } },
        { value: 13.5, name: '机电部', itemStyle: { color: '#73C0DE' } },
        { value: 11.2, name: '通风部', itemStyle: { color: '#FC8452' } },
      ],
    }],
    graphic: [
      { type: 'text', left: '32%', top: '42%', style: { text: '1,268', textAlign: 'center', fill: '#1D2129', fontSize: 20, fontWeight: 'bold' } },
      { type: 'text', left: '32%', top: '52%', style: { text: '总人数', textAlign: 'center', fill: '#86909C', fontSize: 11 } },
    ],
  }), []);

  const statusDonutOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}%' },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 10, itemHeight: 8 },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '78%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 91.2, name: '在职', itemStyle: { color: '#2BA471' } },
        { value: 4.4, name: '休假', itemStyle: { color: '#E37318' } },
        { value: 2.2, name: '外勤', itemStyle: { color: '#C9CDD4' } },
        { value: 2.2, name: '离职', itemStyle: { color: '#D54941' } },
      ],
    }],
    graphic: [
      { type: 'text', left: 'center', top: '35%', style: { text: '91.2%', textAlign: 'center', fill: '#1D2129', fontSize: 20, fontWeight: 'bold' } },
      { type: 'text', left: 'center', top: '47%', style: { text: '在职率', textAlign: 'center', fill: '#86909C', fontSize: 11 } },
    ],
  }), []);

  const personnelTrendOption = useMemo(() => ({
    grid: { left: 45, right: 15, top: 10, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: ['12月', '01月', '02月', '03月', '04月', '05月'],
      axisLabel: { fontSize: 10, color: '#86909C' },
      axisLine: { lineStyle: { color: '#E5E6EB' } },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 12,
      interval: 2,
      axisLabel: { fontSize: 10, color: '#86909C' },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
    },
    tooltip: { trigger: 'axis' as const },
    legend: {
      data: ['新入职', '离职'],
      bottom: 0,
      textStyle: { fontSize: 10 },
      itemWidth: 12,
      itemHeight: 8,
    },
    series: [
      {
        name: '新入职',
        type: 'line' as const,
        data: [4, 6, 3, 8, 5, 7],
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#0052D9', width: 2.5 },
        itemStyle: { color: '#0052D9' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#0052D940' }, { offset: 1, color: '#0052D905' }],
          },
        },
      },
      {
        name: '离职',
        type: 'line' as const,
        data: [2, 1, 3, 0, 1, 2],
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#D54941', width: 2.5 },
        itemStyle: { color: '#D54941' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#D5494140' }, { offset: 1, color: '#D5494105' }],
          },
        },
      },
    ],
  }), []);

  const columns = [
    {
      title: '姓名', dataIndex: 'name', key: 'name', width: 80,
      render: (v: string) => <Text strong style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '性别', dataIndex: 'gender', key: 'gender', width: 55,
      render: (g: string) => (
        <Tag
          color={g === '男' ? 'blue' : 'pink'}
          icon={g === '男' ? <ManOutlined /> : <WomanOutlined />}
          style={{ margin: 0, fontSize: 10 }}
        >
          {g}
        </Tag>
      ),
    },
    { title: '部门', dataIndex: 'dept', key: 'dept', width: 110, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '职位', dataIndex: 'position', key: 'position', width: 110, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 110, render: (v: string) => <Text style={{ fontSize: 11, color: '#86909C' }}>{v}</Text> },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard', width: 130, render: (v: string) => <Text style={{ fontSize: 11, color: '#86909C' }}>{v}</Text> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 70,
      render: (s: string) => <Tag color={statusTagMap[s]?.color || 'default'} style={{ margin: 0, fontSize: 10 }}>{s}</Tag>,
    },
    { title: '入职日期', dataIndex: 'hireDate', key: 'hireDate', width: 95, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    {
      title: '操作', dataIndex: 'actions', key: 'actions', width: 130, fixed: 'right' as const,
      render: () => (
        <Space size={6}>
          <a style={{ fontSize: 11 }}>查看</a>
          <a style={{ fontSize: 11 }}>编辑</a>
          <Dropdown menu={{ items: actionItems }} trigger={['click']}>
            <a style={{ fontSize: 11 }}>更多 <MoreOutlined style={{ fontSize: 10 }} /></a>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header: Title + Action buttons */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={5} style={{ margin: 0 }}>员工管理</Title>
        </Col>
        <Col>
          <Space size={8}>
            <Button type="primary" icon={<PlusOutlined />}>新增员工</Button>
            <Button icon={<SendOutlined style={{ transform: 'rotate(-90deg)' }} />}>导入</Button>
          </Space>
        </Col>
      </Row>

      {/* 6 KPI stat cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {statCards.map((card) => (
          <Col span={4} key={card.key}>
            <Card bodyStyle={{ padding: '14px 16px 10px' }} style={{ height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: card.bg, color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#86909C', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#1D2129', lineHeight: 1 }}>{card.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filter bar */}
      <Card bodyStyle={{ padding: '10px 20px' }} style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Space size={8} wrap>
              <Input
                size="small"
                placeholder="搜索姓名"
                prefix={<SearchOutlined />}
                style={{ width: 130 }}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                allowClear
              />
              <Input
                size="small"
                placeholder="搜索工号"
                prefix={<IdcardOutlined />}
                style={{ width: 130 }}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                allowClear
              />
              <Select
                size="small"
                value={searchDept}
                onChange={setSearchDept}
                style={{ width: 120 }}
              >
                {departments.map((d) => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
              <Select
                size="small"
                value={searchPosition}
                onChange={setSearchPosition}
                style={{ width: 110 }}
              >
                {positions.map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
              <Select
                size="small"
                value={searchStatus}
                onChange={setSearchStatus}
                style={{ width: 110 }}
              >
                {statuses.map((s) => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space size={8}>
              <Button size="small" type="primary" icon={<SearchOutlined />}>搜索</Button>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Two-column: Employee table + Right sidebar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {/* LEFT: Employee table */}
        <Col span={15}>
          <Card title={<Text strong style={{ fontSize: 14 }}>员工列表</Text>} bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={filteredData}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total: number) => `共 ${total} 条`,
                style: { marginRight: 8 },
              }}
              size="small"
              scroll={{ x: 950 }}
              rowClassName={(record) => record.key === selectedRow.key ? 'ant-table-row-selected' : ''}
              onRow={(record) => ({
                onClick: () => setSelectedRow(record),
                style: { cursor: 'pointer', background: record.key === selectedRow.key ? '#E8F3FF' : undefined },
              })}
            />
          </Card>
        </Col>

        {/* RIGHT: Charts + Quick actions */}
        <Col span={9}>
          <Card
            title={<Text strong style={{ fontSize: 13 }}>人员架构</Text>}
            bodyStyle={{ padding: '4px 4px' }}
            style={{ marginBottom: 12 }}
          >
            <ReactECharts option={personnelStructureOption} style={{ height: 170 }} />
          </Card>
          <Card
            title={<Text strong style={{ fontSize: 13 }}>人员统计 (近6个月)</Text>}
            bodyStyle={{ padding: '4px 4px' }}
            style={{ marginBottom: 12 }}
          >
            <ReactECharts option={personnelTrendOption} style={{ height: 160 }} />
          </Card>
          <Card
            title={<Text strong style={{ fontSize: 13 }}>状态分布</Text>}
            bodyStyle={{ padding: '4px 4px' }}
          >
            <ReactECharts option={statusDonutOption} style={{ height: 170 }} />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions Row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={24}>
          <Card title={<Text strong style={{ fontSize: 13 }}>快捷操作</Text>} bodyStyle={{ padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {quickActions.map((action, i) => (
                <div
                  key={i}
                  className="quick-action-btn"
                  style={{
                    padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                    borderRadius: 8, transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = action.bg; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ fontSize: 18, color: action.color, marginBottom: 4 }}>{action.icon}</div>
                  <Text style={{ fontSize: 10, color: '#4E5969' }}>{action.label}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom: Detailed Employee Info panel */}
      <Card bodyStyle={{ padding: 0 }}>
        {/* Employee summary header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F2F3F5' }}>
          <Row align="middle" gutter={24}>
            <Col flex="56px">
              <Avatar size={56} icon={<UserOutlined />} style={{ background: '#0052D9' }} />
            </Col>
            <Col flex="auto">
              <Space size={12} align="center">
                <Text strong style={{ fontSize: 16 }}>{selectedRow.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>ID: {selectedRow.id}</Text>
                <Tag color={statusTagMap[selectedRow.status]?.color || 'default'}>{selectedRow.status}</Tag>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Space size={16} wrap>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>
                    <SolutionOutlined style={{ marginRight: 4 }} />{selectedRow.dept}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>
                    <IdcardOutlined style={{ marginRight: 4 }} />{selectedRow.position}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />{selectedRow.phone}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>
                    <IdcardOutlined style={{ marginRight: 4 }} />{selectedRow.idCard}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#86909C' }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />入职: {selectedRow.hireDate}
                  </Text>
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={detailTab}
          onChange={setDetailTab}
          style={{ padding: '8px 20px 0' }}
          items={detailTabs.map((tab) => ({ key: tab, label: tab }))}
        />

        {/* Tab content */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #F2F3F5', maxHeight: 360, overflow: 'auto' }}>
          {detailTab === '基本信息' && (
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="性别">{String(employeeDetailData.gender)}</Descriptions.Item>
              <Descriptions.Item label="出生日期">{String(employeeDetailData.dob)}</Descriptions.Item>
              <Descriptions.Item label="民族">{String(employeeDetailData.ethnicity)}</Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space size={4}><MailOutlined /> {String(employeeDetailData.email)}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="户籍地址" span={2}>
                <Space size={4}><EnvironmentOutlined /> {String(employeeDetailData.address)}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="政治面貌">
                <Tag color="red">{String(employeeDetailData.politicalStatus)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="婚姻状况">{String(employeeDetailData.maritalStatus)}</Descriptions.Item>
              <Descriptions.Item label="紧急联系人">
                {String(employeeDetailData.emergencyContact)} ({String(employeeDetailData.emergencyPhone)})
              </Descriptions.Item>
            </Descriptions>
          )}

          {detailTab === '岗位' && (
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="工号">{selectedRow.id}</Descriptions.Item>
              <Descriptions.Item label="部门">{selectedRow.dept}</Descriptions.Item>
              <Descriptions.Item label="职位">{selectedRow.position}</Descriptions.Item>
              <Descriptions.Item label="入职日期">{selectedRow.hireDate}</Descriptions.Item>
              <Descriptions.Item label="用工性质">合同制</Descriptions.Item>
              <Descriptions.Item label="合同期限">2023-01-01 至 2026-12-31</Descriptions.Item>
              <Descriptions.Item label="工作地点">示例矿区A</Descriptions.Item>
              <Descriptions.Item label="直属上级">陈总经理</Descriptions.Item>
              <Descriptions.Item label="岗位等级">P6</Descriptions.Item>
              <Descriptions.Item label="薪资档位">8档</Descriptions.Item>
              <Descriptions.Item label="班次">白班</Descriptions.Item>
              <Descriptions.Item label="井下/井上">井下</Descriptions.Item>
            </Descriptions>
          )}

          {detailTab === '学历' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', school: '中国矿业大学', major: '采矿工程', degree: '硕士', period: '2014-09 至 2017-06', type: '全日制' },
                { key: '2', school: '太原理工大学', major: '安全工程', degree: '本科', period: '2010-09 至 2014-06', type: '全日制' },
              ]}
              columns={[
                { title: '毕业院校', dataIndex: 'school', key: 'school' },
                { title: '专业', dataIndex: 'major', key: 'major' },
                { title: '学历', dataIndex: 'degree', key: 'degree', render: (v: string) => <Tag color="blue">{v}</Tag> },
                { title: '起止时间', dataIndex: 'period', key: 'period' },
                { title: '学习形式', dataIndex: 'type', key: 'type' },
              ]}
            />
          )}

          {detailTab === '证书' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', name: '注册安全工程师', number: 'AQ2023-001234', issueDate: '2023-06-01', expireDate: '2026-05-31', org: '应急管理部' },
                { key: '2', name: '特种作业操作证', number: 'TZ2024-005678', issueDate: '2024-03-15', expireDate: '2027-03-14', org: '省安监局' },
                { key: '3', name: '煤矿安全培训合格证', number: 'MK2025-009012', issueDate: '2025-01-20', expireDate: '2028-01-19', org: '省煤监局' },
                { key: '4', name: '电气工程师职称证', number: 'DQ2022-003456', issueDate: '2022-12-01', expireDate: '长期有效', org: '省人社厅' },
              ]}
              columns={[
                { title: '证书名称', dataIndex: 'name', key: 'name' },
                { title: '证书编号', dataIndex: 'number', key: 'number' },
                { title: '发证日期', dataIndex: 'issueDate', key: 'issueDate' },
                { title: '有效期至', dataIndex: 'expireDate', key: 'expireDate' },
                { title: '发证机构', dataIndex: 'org', key: 'org' },
              ]}
            />
          )}

          {detailTab === '培训' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', course: '矿山安全规程培训', date: '2025-04-15', result: '合格', hours: '16', org: '安全培训中心' },
                { key: '2', course: '应急救援演练', date: '2025-03-20', result: '优秀', hours: '8', org: '矿安全科' },
                { key: '3', course: '煤矿防突知识', date: '2025-01-10', result: '合格', hours: '24', org: '省煤监局' },
                { key: '4', course: '电气安全操作', date: '2024-11-05', result: '合格', hours: '12', org: '机电部' },
              ]}
              columns={[
                { title: '培训课程', dataIndex: 'course', key: 'course' },
                { title: '培训日期', dataIndex: 'date', key: 'date' },
                { title: '考核结果', dataIndex: 'result', key: 'result', render: (v: string) => <Tag color={v === '优秀' ? 'green' : 'blue'}>{v}</Tag> },
                { title: '学时', dataIndex: 'hours', key: 'hours' },
                { title: '培训机构', dataIndex: 'org', key: 'org' },
              ]}
            />
          )}

          {detailTab === '考勤' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', month: '2025-04', shouldWork: 22, actualWork: 22, late: 0, early: 0, overtime: '8h', leave: '0天', rate: '100%' },
                { key: '2', month: '2025-03', shouldWork: 21, actualWork: 20, late: 1, early: 0, overtime: '12h', leave: '1天', rate: '95.2%' },
                { key: '3', month: '2025-02', shouldWork: 18, actualWork: 18, late: 0, early: 0, overtime: '6h', leave: '0天', rate: '100%' },
                { key: '4', month: '2025-01', shouldWork: 20, actualWork: 20, late: 0, early: 0, overtime: '10h', leave: '0天', rate: '100%' },
              ]}
              columns={[
                { title: '月份', dataIndex: 'month', key: 'month' },
                { title: '应出勤', dataIndex: 'shouldWork', key: 'shouldWork' },
                { title: '实际出勤', dataIndex: 'actualWork', key: 'actualWork' },
                { title: '迟到', dataIndex: 'late', key: 'late', render: (v: number) => <Text style={{ color: v > 0 ? '#D54941' : '#86909C' }}>{v}次</Text> },
                { title: '早退', dataIndex: 'early', key: 'early' },
                { title: '加班', dataIndex: 'overtime', key: 'overtime' },
                { title: '请假', dataIndex: 'leave', key: 'leave' },
                { title: '出勤率', dataIndex: 'rate', key: 'rate', render: (v: string) => <Tag color={Number(v.replace('%', '')) >= 95 ? 'green' : 'orange'}>{v}</Tag> },
              ]}
            />
          )}

          {detailTab === '绩效' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', period: '2025年Q1', score: 92, grade: 'A', evaluator: '陈总经理', comment: '工作表现优秀，责任心强' },
                { key: '2', period: '2024年Q4', score: 88, grade: 'B+', evaluator: '陈总经理', comment: '安全生产指标达标' },
                { key: '3', period: '2024年Q3', score: 90, grade: 'A', evaluator: '陈总经理', comment: '团队管理能力突出' },
                { key: '4', period: '2024年Q2', score: 87, grade: 'B+', evaluator: '陈总经理', comment: '按时完成各项任务' },
              ]}
              columns={[
                { title: '考核周期', dataIndex: 'period', key: 'period' },
                { title: '得分', dataIndex: 'score', key: 'score', render: (v: number) => <Text strong style={{ color: v >= 90 ? '#2BA471' : '#1D2129' }}>{v}</Text> },
                { title: '等级', dataIndex: 'grade', key: 'grade', render: (v: string) => <Tag color={v.startsWith('A') ? 'green' : 'blue'}>{v}</Tag> },
                { title: '考核人', dataIndex: 'evaluator', key: 'evaluator' },
                { title: '评语', dataIndex: 'comment', key: 'comment' },
              ]}
            />
          )}

          {detailTab === '日志' && (
            <Table
              size="small"
              pagination={false}
              dataSource={[
                { key: '1', time: '2025-05-06 14:30:22', operator: '系统管理员', action: '修改基本信息', detail: '更新了联系电话', ip: '192.168.1.100' },
                { key: '2', time: '2025-05-05 09:15:10', operator: '张三', action: '登录系统', detail: '通过账号密码登录', ip: '192.168.1.101' },
                { key: '3', time: '2025-05-04 16:45:33', operator: '人事主管', action: '岗位调整', detail: '由安全员调整为安全总监', ip: '192.168.1.102' },
                { key: '4', time: '2025-04-28 11:20:05', operator: '部门经理', action: '权限变更', detail: '增加井下访问权限', ip: '192.168.1.103' },
                { key: '5', time: '2025-04-20 08:05:47', operator: '张三', action: '登录系统', detail: '通过指纹识别登录', ip: '192.168.1.101' },
              ]}
              columns={[
                { title: '操作时间', dataIndex: 'time', key: 'time', width: 160 },
                { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
                { title: '操作类型', dataIndex: 'action', key: 'action', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
                { title: '详情', dataIndex: 'detail', key: 'detail' },
                { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130, render: (v: string) => <Text style={{ fontSize: 11, color: '#86909C' }}>{v}</Text> },
              ]}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
