import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Statistic, Segmented, Progress, Space, Tooltip, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import {
  GoldOutlined, TableOutlined, FileOutlined, CloudOutlined,
  DatabaseOutlined, CheckSquareOutlined, StarFilled, SafetyCertificateOutlined,
  ApartmentOutlined, FundOutlined, BarChartOutlined, PieChartOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

const DataAssetCSS = `
.da-root { display: flex; flex-direction: column; gap: 12px; }
.da-kpi-card { border-radius: 8px; }
.da-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.da-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.da-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.da-kpi-body { flex: 1; min-width: 0; }
.da-kpi-label { font-size: 11px; color: #86909C; }
.da-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.da-kpi-sub { font-size: 11px; color: #86909C; }
.da-charts-row { margin-bottom: 0; }
.da-chart-card .ant-card-body { padding: 4px 0; }
.da-chart-title { padding: 6px 0 0; text-align: center; font-size: 12px; font-weight: 500; color: #1D2129; }
.da-chart-wrapper { height: 220px; }
.da-quality-bar { display: flex; align-items: center; gap: 6px; }
`;

interface DataAsset {
  key: number;
  category: string;
  name: string;
  type: string;
  size: string;
  update_time: string;
  quality_score: number;
  owner: string;
  description: string;
}

const mockAssets: DataAsset[] = [
  { key: 1, category: '人员数据', name: '人员基础信息表', type: '数据表', size: '2.3 GB', update_time: '2025-05-20 10:00', quality_score: 98, owner: 'HR系统', description: '矿工基本信息、工种、部门' },
  { key: 2, category: '人员数据', name: '人员考勤记录', type: '数据表', size: '4.1 GB', update_time: '2025-05-20 06:00', quality_score: 95, owner: '考勤系统', description: '打卡记录、班次信息' },
  { key: 3, category: '定位数据', name: '实时定位轨迹表', type: '数据表', size: '128.6 GB', update_time: '2025-05-20 10:30', quality_score: 99, owner: 'UWB系统', description: '人员设备实时坐标轨迹' },
  { key: 4, category: '定位数据', name: '电子围栏规则库', type: '配置表', size: '256 MB', update_time: '2025-05-19 14:00', quality_score: 92, owner: '安全平台', description: '围栏边界及规则定义' },
  { key: 5, category: '设备数据', name: '设备运行状态日志', type: '数据表', size: '56.2 GB', update_time: '2025-05-20 10:30', quality_score: 96, owner: 'IoT平台', description: '设备状态、遥测数据' },
  { key: 6, category: '设备数据', name: '设备维保记录', type: '数据表', size: '1.8 GB', update_time: '2025-05-19 16:30', quality_score: 88, owner: '运维系统', description: '维修保养历史记录' },
  { key: 7, category: '告警数据', name: '告警事件流水表', type: '数据表', size: '32.4 GB', update_time: '2025-05-20 10:30', quality_score: 94, owner: '告警平台', description: '全量告警事件记录' },
  { key: 8, category: '告警数据', name: '处置记录归档表', type: '数据表', size: '8.7 GB', update_time: '2025-05-20 10:15', quality_score: 90, owner: '联动平台', description: '告警处置过程记录' },
  { key: 9, category: '视频数据', name: 'NVR录像元数据', type: '索引表', size: '1.2 TB', update_time: '2025-05-20 10:30', quality_score: 97, owner: '视频平台', description: '录像文件索引信息' },
  { key: 10, category: '视频数据', name: 'AI分析结果集', type: '数据表', size: '15.3 GB', update_time: '2025-05-20 10:25', quality_score: 85, owner: 'AI引擎', description: '视频智能分析结果' },
  { key: 11, category: '环境数据', name: '环境监测时序库', type: '时序表', size: '242.8 GB', update_time: '2025-05-20 10:30', quality_score: 99, owner: '传感器网', description: '温湿度、气体、粉尘' },
  { key: 12, category: '环境数据', name: '瓦斯监测上报记录', type: '数据表', size: '18.6 GB', update_time: '2025-05-20 10:30', quality_score: 93, owner: '安监局', description: '监管上报数据记录' },
  { key: 13, category: '脑电数据', name: 'EEG脑电信号采集', type: '时序表', size: '89.5 GB', update_time: '2025-05-20 10:29', quality_score: 91, owner: '脑电引擎', description: '多通道脑电原始数据' },
  { key: 14, category: '脑电数据', name: '疲劳度分析报告', type: '文件', size: '3.2 GB', update_time: '2025-05-20 09:00', quality_score: 86, owner: '分析平台', description: 'PDF/JSON格式报告文件' },
  { key: 15, category: '基础数据', name: '矿区地理信息库', type: '空间库', size: '6.4 GB', update_time: '2025-05-15 08:00', quality_score: 100, owner: 'GIS平台', description: '矿区地图、巷道模型' },
  { key: 16, category: '基础数据', name: '标准代码字典库', type: '配置表', size: '512 MB', update_time: '2025-05-18 00:00', quality_score: 100, owner: '主数据', description: '国标/行业标准代码' },
];

const categoryColors: Record<string, string> = {
  '人员数据': '#0052D9',
  '定位数据': '#1677FF',
  '设备数据': '#52C41A',
  '告警数据': '#FAAD14',
  '视频数据': '#7B61FF',
  '环境数据': '#FF4D4F',
  '脑电数据': '#EB2F96',
  '基础数据': '#13C2C2',
};

export default function DataAsset() {
  const [viewMode, setViewMode] = useState<string>('全部');

  const filteredAssets = useMemo(() => {
    if (viewMode === '全部') return mockAssets;
    return mockAssets.filter((a) => a.category === viewMode);
  }, [viewMode]);

  const totalAssets = mockAssets.length;
  const tableCount = mockAssets.filter((a) => a.type === '数据表' || a.type === '时序表' || a.type === '配置表' || a.type === '索引表' || a.type === '空间库').length;
  const fileCount = mockAssets.filter((a) => a.type === '文件').length;
  const avgQuality = Math.round(mockAssets.reduce((sum, a) => sum + a.quality_score, 0) / mockAssets.length);

  const categories = [...new Set(mockAssets.map((a) => a.category))];

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 10, color: '#86909C' } },
    series: [{
      type: 'pie',
      radius: ['50%', '78%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: categories.map((cat) => ({
        name: cat,
        value: mockAssets.filter((a) => a.category === cat).length,
        itemStyle: { color: categoryColors[cat] || '#86909C' },
      })),
    }],
  };

  const barOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 95, right: 20, top: 5, bottom: 5 },
    xAxis: { show: false },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: '#4E5969' },
    },
    series: [{
      type: 'bar',
      data: categories.map((cat) => mockAssets.filter((a) => a.category === cat).length),
      barWidth: 14,
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const colors = Object.values(categoryColors);
          return colors[params.dataIndex] || '#86909C';
        },
        borderRadius: [0, 6, 6, 0],
      },
      label: {
        show: true, position: 'right', fontSize: 10, color: '#86909C',
        formatter: '{c} 个',
      },
    }],
  };

  const kpiCards = [
    { label: '数据资产总数', value: totalAssets, suffix: '项', icon: <GoldOutlined />, bg: '#E8F3FF', color: '#0052D9' },
    { label: '数据表/库', value: tableCount, suffix: '项', icon: <DatabaseOutlined />, bg: '#E8F8F2', color: '#52C41A' },
    { label: '文档文件', value: fileCount, suffix: '项', icon: <FileOutlined />, bg: '#F2F3FF', color: '#7B61FF' },
    { label: '平均质量分', value: avgQuality, suffix: '分', icon: <SafetyCertificateOutlined />, bg: '#F0FBE6', color: '#52C41A' },
  ];

  const columns: ColumnsType<DataAsset> = [
    {
      title: '分类', dataIndex: 'category', key: 'category', width: 100,
      render: (category: string) => (
        <Tag color={categoryColors[category]} style={{ margin: 0 }}>
          {category}
        </Tag>
      ),
    },
    {
      title: '资产名称', dataIndex: 'name', key: 'name', width: 170, ellipsis: true,
      render: (name: string, rec: DataAsset) => (
        <Space size={4}>
          {rec.type === '文件' ? <FileOutlined style={{ color: '#7B61FF' }} /> : <TableOutlined style={{ color: '#0052D9' }} />}
          <Tooltip title={rec.description}>
            <a style={{ fontSize: 13 }}>{name}</a>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 80,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '数据表': 'blue', '时序表': 'cyan', '配置表': 'purple', '索引表': 'geekblue', '空间库': 'green', '文件': 'orange',
        };
        return <Tag color={colorMap[type] || 'default'} style={{ margin: 0, fontSize: 11 }}>{type}</Tag>;
      },
    },
    { title: '大小', dataIndex: 'size', key: 'size', width: 90, render: (s: string) => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{s}</Text> },
    { title: '更新时间', dataIndex: 'update_time', key: 'update_time', width: 135 },
    {
      title: '质量评分', dataIndex: 'quality_score', key: 'quality_score', width: 115,
      render: (score: number) => {
        const color = score >= 95 ? '#52C41A' : score >= 85 ? '#1677FF' : score >= 70 ? '#FAAD14' : '#F5222D';
        return (
          <div className="da-quality-bar">
            <Progress
              percent={score}
              size="small"
              strokeColor={color}
              format={() => `${score}`}
              style={{ width: 60, margin: 0 }}
            />
            <StarFilled style={{ color, fontSize: 11 }} />
          </div>
        );
      },
    },
    { title: '所属系统', dataIndex: 'owner', key: 'owner', width: 90, ellipsis: true },
    {
      title: '操作', dataIndex: 'key', key: 'action', width: 100, fixed: 'right',
      render: () => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          <a style={{ fontSize: 12 }}>详情</a>
          <a style={{ fontSize: 12 }}>血缘</a>
        </Space>
      ),
    },
  ];

  const segOptions = [
    { label: '全部', value: '全部' },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ];

  return (
    <>
      <style>{DataAssetCSS}</style>
      <div className="da-root">
        <Row gutter={[12, 12]}>
          {kpiCards.map((card) => (
            <Col span={6} key={card.label}>
              <Card className="da-kpi-card" bodyStyle={{ padding: '10px 14px 6px' }}>
                <div className="da-kpi-inner">
                  <div className="da-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="da-kpi-body">
                    <div className="da-kpi-label">{card.label}</div>
                    <div className="da-kpi-value" style={{ color: card.color }}>
                      {card.value}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> {card.suffix}</span>
                    </div>
                    <div className="da-kpi-sub">
                      <span style={{ color: '#52C41A' }}>●</span> 健康状态: 优秀
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[12, 12]} className="da-charts-row">
          <Col span={12}>
            <Card
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>数据分类分布</span>}
              className="da-chart-card"
              styles={{ body: { padding: '2px 0' } }}
            >
              <div className="da-chart-wrapper">
                <ReactECharts option={pieOption} style={{ height: 220 }} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>各类别资产数量</span>}
              className="da-chart-card"
              styles={{ body: { padding: '2px 0' } }}
            >
              <div className="da-chart-wrapper">
                <ReactECharts option={barOption} style={{ height: 220 }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>资产目录</span>}
          extra={
            <Segmented
              size="small"
              value={viewMode}
              onChange={(v) => setViewMode(v as string)}
              options={segOptions}
            />
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table<DataAsset>
            columns={columns}
            dataSource={filteredAssets}
            size="small"
            rowKey="key"
            scroll={{ x: 880 }}
            pagination={{
              size: 'small',
              pageSize: 10,
              showTotal: (t: number) => `共 ${t} 项资产`,
            }}
          />
        </Card>
      </div>
    </>
  );
}
