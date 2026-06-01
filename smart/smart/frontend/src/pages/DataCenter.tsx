import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Statistic, Button, Space, Tooltip, Segmented, Progress, Tabs,
  DatePicker, Typography, Divider, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import {
  CloudSyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  LoadingOutlined, ReloadOutlined, ThunderboltOutlined,
  CloudDownloadOutlined, CloudUploadOutlined, ExclamationCircleOutlined,
  WarningOutlined, SettingOutlined,
  GoldOutlined, TableOutlined, FileOutlined,
  DatabaseOutlined, StarFilled, SafetyCertificateOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  HddOutlined, RiseOutlined, TrophyOutlined, FilterOutlined, DownloadOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* ======================== DataSync CSS ======================== */
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

/* ======================== DataAsset CSS ======================== */
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

/* ======================== DataAnalysis CSS ======================== */
const DataAnalysisCSS = `
.da-kpi-card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1D2129;
  line-height: 1.2;
}
.da-kpi-card-title {
  font-size: 12px;
  color: #86909C;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.da-kpi-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.da-trend-inline {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  margin-top: 4px;
}
.da-card-header {
  font-size: 13px;
  font-weight: 600;
}
`;

/* ======================== DataSync Types & Mock Data ======================== */
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

/* ======================== DataAsset Types & Mock Data ======================== */
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

/* ======================== DataAnalysis Mock Data ======================== */
const analysisKpiCards = [
  {
    title: '平台数据总量', value: '12.68', suffix: 'TB',
    trend: '↑ 8.6%', up: true,
    icon: <DatabaseOutlined />, color: '#0052D9', bg: '#E6F0FF',
  },
  {
    title: '数据接入量', value: '1.26', suffix: 'TB',
    trend: '↑ 12.3%', up: true,
    icon: <CloudUploadOutlined />, color: '#2BA471', bg: '#E8F8F2',
  },
  {
    title: '存储容量', value: '9.42', suffix: 'TB',
    trend: '↑ 6.7%', up: true,
    icon: <HddOutlined />, color: '#E37318', bg: '#FFF3E8',
  },
  {
    title: '数据使用量', value: '3.28', suffix: 'TB',
    trend: '↑ 15.2%', up: true,
    icon: <RiseOutlined />, color: '#8B5CF6', bg: '#F3F0FF',
  },
  {
    title: '同步成功率', value: '99.23', suffix: '%',
    trend: '↑ 0.8%', up: true,
    icon: <CheckCircleOutlined />, color: '#2BA471', bg: '#E8F8F2',
  },
  {
    title: '数据质量评分', value: '93.7', suffix: '分',
    trend: '↑ 2.1%', up: true,
    icon: <TrophyOutlined />, color: '#0052D9', bg: '#E6F0FF',
  },
];

const days = ['05-14', '05-15', '05-16', '05-17', '05-18', '05-19', '05-20'];

const dataIngestionTrendOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    formatter: (params: { seriesName: string; value: number }[]) => {
      const total = params.reduce((s, p) => s + p.value, 0);
      let html = `<div style="font-weight:600;margin-bottom:4px">数据接入</div>`;
      params.forEach((p) => {
        html += `<div style="display:flex;justify-content:space-between;gap:24px;line-height:20px"><span>${p.seriesName}</span><b>${p.value} GB</b></div>`;
      });
      html += `<div style="border-top:1px solid #E5E6EB;margin-top:4px;padding-top:4px;display:flex;justify-content:space-between"><span>合计</span><b>${total} GB</b></div>`;
      return html;
    },
  },
  legend: {
    data: ['设备数据', '视频数据', '报警数据', '人员数据'],
    bottom: 0,
    textStyle: { fontSize: 11, color: '#4E5969' },
    itemWidth: 12,
    itemHeight: 8,
  },
  grid: { top: 18, right: 24, bottom: 36, left: 52 },
  xAxis: {
    type: 'category',
    data: days,
    axisLabel: { fontSize: 10, color: '#86909C' },
    axisLine: { lineStyle: { color: '#E5E6EB' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    name: 'GB',
    nameTextStyle: { fontSize: 10, color: '#86909C' },
    axisLabel: { fontSize: 10, color: '#86909C' },
    splitLine: { lineStyle: { color: '#F0F2F5' } },
  },
  series: [
    {
      name: '设备数据', type: 'line',
      data: [320, 345, 338, 365, 372, 358, 382],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#0052D9', width: 2 },
      itemStyle: { color: '#0052D9' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(0,82,217,0.15)' }, { offset: 1, color: 'rgba(0,82,217,0.02)' }],
        },
      },
    },
    {
      name: '视频数据', type: 'line',
      data: [420, 455, 438, 480, 465, 472, 498],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#0ABFEF', width: 2 },
      itemStyle: { color: '#0ABFEF' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(10,191,239,0.12)' }, { offset: 1, color: 'rgba(10,191,239,0.02)' }],
        },
      },
    },
    {
      name: '报警数据', type: 'line',
      data: [85, 92, 88, 95, 102, 98, 105],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#E37318', width: 2 },
      itemStyle: { color: '#E37318' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(227,115,24,0.12)' }, { offset: 1, color: 'rgba(227,115,24,0.02)' }],
        },
      },
    },
    {
      name: '人员数据', type: 'line',
      data: [156, 162, 158, 172, 168, 175, 182],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#2BA471', width: 2 },
      itemStyle: { color: '#2BA471' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(43,164,113,0.12)' }, { offset: 1, color: 'rgba(43,164,113,0.02)' }],
        },
      },
    },
  ],
};

const dataTypeDonutOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} TB ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  legend: {
    bottom: 0,
    textStyle: { fontSize: 10, color: '#4E5969' },
    itemWidth: 8, itemHeight: 8,
  },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: '34%',
    style: {
      text: '12.68 TB',
      textAlign: 'center' as const,
      fill: '#1D2129',
      fontSize: 16,
      fontWeight: 'bold' as const,
    },
  }, {
    type: 'text' as const,
    left: 'center',
    top: '44%',
    style: {
      text: '数据总量',
      textAlign: 'center' as const,
      fill: '#86909C',
      fontSize: 11,
    },
  }],
  series: [{
    type: 'pie',
    radius: ['55%', '78%'],
    center: ['50%', '43%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 14, fontWeight: 'bold' as const },
      scaleSize: 8,
    },
    data: [
      { value: 5.41, name: '设备数据', itemStyle: { color: '#0052D9' } },
      { value: 4.37, name: '视频数据', itemStyle: { color: '#2BA471' } },
      { value: 1.56, name: '报警数据', itemStyle: { color: '#E37318' } },
      { value: 0.86, name: '人员数据', itemStyle: { color: '#8B5CF6' } },
      { value: 0.47, name: '其他', itemStyle: { color: '#C9CDD4' } },
    ],
  }],
};

const qualityDistDonutOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}% ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  legend: {
    bottom: 0,
    textStyle: { fontSize: 10, color: '#4E5969' },
    itemWidth: 8, itemHeight: 8,
  },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: '34%',
    style: {
      text: '93.7 分',
      textAlign: 'center' as const,
      fill: '#1D2129',
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
  }, {
    type: 'text' as const,
    left: 'center',
    top: '45%',
    style: {
      text: '综合评分',
      textAlign: 'center' as const,
      fill: '#86909C',
      fontSize: 11,
    },
  }],
  series: [{
    type: 'pie',
    radius: ['55%', '78%'],
    center: ['50%', '43%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 13, fontWeight: 'bold' as const },
      scaleSize: 6,
    },
    data: [
      { value: 68.2, name: '优秀', itemStyle: { color: '#2BA471' } },
      { value: 22.7, name: '良好', itemStyle: { color: '#0052D9' } },
      { value: 7.1, name: '一般', itemStyle: { color: '#E37318' } },
      { value: 2.0, name: '较差', itemStyle: { color: '#D54941' } },
    ],
  }],
};

const sourceStatusRingOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} 个 ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  legend: {
    bottom: 0,
    textStyle: { fontSize: 10, color: '#4E5969' },
    itemWidth: 8, itemHeight: 8,
  },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: '36%',
    style: {
      text: '28',
      textAlign: 'center' as const,
      fill: '#1D2129',
      fontSize: 22,
      fontWeight: 'bold' as const,
    },
  }, {
    type: 'text' as const,
    left: 'center',
    top: '48%',
    style: {
      text: '数据源总数',
      textAlign: 'center' as const,
      fill: '#86909C',
      fontSize: 10,
    },
  }],
  series: [{
    type: 'pie',
    radius: ['58%', '82%'],
    center: ['50%', '44%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 13, fontWeight: 'bold' as const },
      scaleSize: 6,
    },
    data: [
      { value: 24, name: '正常', itemStyle: { color: '#2BA471' } },
      { value: 2, name: '异常', itemStyle: { color: '#D54941' } },
      { value: 2, name: '未连接', itemStyle: { color: '#C9CDD4' } },
    ],
  }],
};

const syncStatusTrendOption = {
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  legend: {
    data: ['同步成功', '同步失败'],
    bottom: 0,
    textStyle: { fontSize: 11, color: '#4E5969' },
    itemWidth: 12,
    itemHeight: 8,
  },
  grid: { top: 18, right: 24, bottom: 36, left: 48 },
  xAxis: {
    type: 'category',
    data: days,
    axisLabel: { fontSize: 10, color: '#86909C' },
    axisLine: { lineStyle: { color: '#E5E6EB' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    name: '次',
    nameTextStyle: { fontSize: 10, color: '#86909C' },
    axisLabel: { fontSize: 10, color: '#86909C' },
    splitLine: { lineStyle: { color: '#F0F2F5' } },
  },
  series: [
    {
      name: '同步成功', type: 'line',
      data: [1234, 1345, 1289, 1456, 1398, 1523, 1487],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#0052D9', width: 2 },
      itemStyle: { color: '#0052D9' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(0,82,217,0.12)' }, { offset: 1, color: 'rgba(0,82,217,0.02)' }],
        },
      },
    },
    {
      name: '同步失败', type: 'line',
      data: [45, 38, 52, 41, 35, 48, 42],
      smooth: true, symbol: 'circle', symbolSize: 5,
      lineStyle: { color: '#2BA471', width: 2 },
      itemStyle: { color: '#2BA471' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(43,164,113,0.10)' }, { offset: 1, color: 'rgba(43,164,113,0.02)' }],
        },
      },
    },
  ],
};

const usageTop10Categories = [
  '视频回放', '轨迹回放', '设备日志', '人员轨迹', '报警记录',
  '环境监测', '生产报表', '通讯记录', '考勤数据', '门禁记录',
];
const usageTop10Values = [1246.8, 986.3, 784.2, 652.8, 528.4, 426.7, 358.3, 286.5, 198.2, 145.6];

const usageTop10Option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
    formatter: (params: { name: string; value: number }[]) => {
      const p = params[0];
      return `${p.name}<br/>使用量: <b>${p.value.toFixed(1)} GB</b>`;
    },
  },
  grid: { top: 8, right: 36, bottom: 8, left: 90 },
  xAxis: {
    type: 'value',
    name: 'GB',
    nameTextStyle: { fontSize: 10, color: '#86909C' },
    axisLabel: { fontSize: 10, color: '#86909C' },
    splitLine: { lineStyle: { color: '#F0F2F5' } },
  },
  yAxis: {
    type: 'category',
    data: [...usageTop10Categories].reverse(),
    axisLabel: { fontSize: 10, color: '#4E5969' },
    axisTick: { show: false },
    axisLine: { show: false },
  },
  series: [{
    type: 'bar',
    barWidth: 14,
    data: [...usageTop10Values].reverse(),
    itemStyle: {
      borderRadius: [0, 6, 6, 0],
      color: {
        type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: '#0052D9' },
          { offset: 0.5, color: '#4E8CFF' },
          { offset: 1, color: '#A8C8FF' },
        ],
      },
    },
    label: {
      show: true,
      position: 'right',
      fontSize: 10,
      color: '#86909C',
      formatter: '{c} GB',
    },
    emphasis: {
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#003DB8' },
            { offset: 0.5, color: '#2970FF' },
            { offset: 1, color: '#8CB8FF' },
          ],
        },
      },
    },
  }],
};

const storageRingOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} TB ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  graphic: [
    {
      type: 'text' as const,
      left: 'center',
      top: '32%',
      style: {
        text: '68.4%',
        textAlign: 'center' as const,
        fill: '#E37318',
        fontSize: 20,
        fontWeight: 'bold' as const,
      },
    },
    {
      type: 'text' as const,
      left: 'center',
      top: '44%',
      style: {
        text: '存储使用率',
        textAlign: 'center' as const,
        fill: '#86909C',
        fontSize: 10,
      },
    },
    {
      type: 'text' as const,
      left: 'center',
      top: '80%',
      style: {
        text: '已用 9.42 TB | 可用 4.38 TB',
        textAlign: 'center' as const,
        fill: '#4E5969',
        fontSize: 10,
      },
    },
    {
      type: 'text' as const,
      left: 'center',
      top: '89%',
      style: {
        text: '总量 13.80 TB',
        textAlign: 'center' as const,
        fill: '#86909C',
        fontSize: 10,
      },
    },
  ],
  series: [{
    type: 'pie',
    radius: ['62%', '84%'],
    center: ['50%', '43%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 13, fontWeight: 'bold' as const },
      scaleSize: 4,
    },
    data: [
      { value: 9.42, name: '已使用', itemStyle: { color: '#E37318' } },
      { value: 4.38, name: '可用', itemStyle: { color: '#E8F0FE' } },
    ],
  }],
};

const syncIssuesDonutOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} 项 ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: 'center',
    style: {
      text: '674',
      textAlign: 'center' as const,
      fill: '#1D2129',
      fontSize: 20,
      fontWeight: 'bold' as const,
    },
  }],
  series: [{
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 12, fontWeight: 'bold' as const },
      scaleSize: 6,
    },
    data: [
      { value: 236, name: '数据缺失', itemStyle: { color: '#D54941' } },
      { value: 160, name: '重复数据', itemStyle: { color: '#E37318' } },
      { value: 126, name: '格式异常', itemStyle: { color: '#E8B339' } },
      { value: 96, name: '逻辑错误', itemStyle: { color: '#0052D9' } },
      { value: 56, name: '其他', itemStyle: { color: '#C9CDD4' } },
    ],
  }],
};

const lifecycleDonutOption = {
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} TB ({d}%)',
    backgroundColor: '#fff',
    borderColor: '#E5E6EB',
    textStyle: { fontSize: 12, color: '#1D2129' },
  },
  legend: {
    bottom: 0,
    textStyle: { fontSize: 10, color: '#4E5969' },
    itemWidth: 8, itemHeight: 8,
  },
  graphic: [{
    type: 'text' as const,
    left: 'center',
    top: '34%',
    style: {
      text: '12.68 TB',
      textAlign: 'center' as const,
      fill: '#1D2129',
      fontSize: 16,
      fontWeight: 'bold' as const,
    },
  }, {
    type: 'text' as const,
    left: 'center',
    top: '44%',
    style: {
      text: '全生命周期',
      textAlign: 'center' as const,
      fill: '#86909C',
      fontSize: 11,
    },
  }],
  series: [{
    type: 'pie',
    radius: ['55%', '78%'],
    center: ['50%', '43%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 13, fontWeight: 'bold' as const },
      scaleSize: 6,
    },
    data: [
      { value: 2.45, name: '热数据', itemStyle: { color: '#D54941' } },
      { value: 4.32, name: '温数据', itemStyle: { color: '#E37318' } },
      { value: 3.85, name: '冷数据', itemStyle: { color: '#0052D9' } },
      { value: 2.05, name: '归档数据', itemStyle: { color: '#C9CDD4' } },
    ],
  }],
};

const qualityTableData = [
  { key: 1, table: 'device_data', name: '设备数据表', records: '2,845,231', integrity: '99.2%', accuracy: '98.5%', consistency: '97.8%', completeness: '98.2%', score: 97.8, trend: 'up' },
  { key: 2, table: 'alarm_records', name: '报警记录表', records: '456,782', integrity: '98.8%', accuracy: '97.2%', consistency: '96.5%', completeness: '99.1%', score: 96.4, trend: 'up' },
  { key: 3, table: 'employee_info', name: '员工信息表', records: '2,568', integrity: '100%', accuracy: '99.8%', consistency: '100%', completeness: '98.5%', score: 99.6, trend: 'up' },
  { key: 4, table: 'inspection_log', name: '巡检日志表', records: '128,945', integrity: '95.6%', accuracy: '94.2%', consistency: '93.8%', completeness: '91.5%', score: 92.1, trend: 'down' },
  { key: 5, table: 'video_archive', name: '视频归档表', records: '985,632', integrity: '97.3%', accuracy: '96.8%', consistency: '95.4%', completeness: '93.2%', score: 94.5, trend: 'up' },
  { key: 6, table: 'position_log', name: '定位日志表', records: '6,542,180', integrity: '98.1%', accuracy: '97.5%', consistency: '96.2%', completeness: '97.8%', score: 96.8, trend: 'up' },
  { key: 7, table: 'env_monitor', name: '环境监测表', records: '1,256,340', integrity: '96.8%', accuracy: '95.4%', consistency: '94.6%', completeness: '92.8%', score: 93.2, trend: 'down' },
  { key: 8, table: 'production_data', name: '生产数据表', records: '3,125,800', integrity: '98.5%', accuracy: '97.8%', consistency: '96.9%', completeness: '94.5%', score: 95.8, trend: 'up' },
  { key: 9, table: 'personnel_track', name: '人员轨迹表', records: '8,120,450', integrity: '97.2%', accuracy: '96.1%', consistency: '95.3%', completeness: '98.8%', score: 95.5, trend: 'up' },
  { key: 10, table: 'system_log', name: '系统日志表', records: '15,680,200', integrity: '94.5%', accuracy: '93.8%', consistency: '92.7%', completeness: '89.5%', score: 90.8, trend: 'down' },
];

const syncIssuesTableData = [
  { key: 1, type: '数据缺失', count: 236, pct: '35.0%', color: '#D54941' },
  { key: 2, type: '重复数据', count: 160, pct: '23.8%', color: '#E37318' },
  { key: 3, type: '格式异常', count: 126, pct: '18.7%', color: '#E8B339' },
  { key: 4, type: '逻辑错误', count: 96, pct: '14.2%', color: '#0052D9' },
  { key: 5, type: '其他', count: 56, pct: '8.3%', color: '#C9CDD4' },
];

const analysisTabItems = [
  { key: 'overview', label: '综合分析' },
  { key: 'personnel', label: '人员分析' },
  { key: 'device', label: '设备分析' },
  { key: 'alarm', label: '报警分析' },
];

/* ======================== Tab: DataSync ======================== */
function DataSyncTab() {
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
          <a style={{ fontSize: 13 }} onClick={() => message.info('查看同步任务详情: ' + name)}>{name}</a>
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
    { title: '同步方式', dataIndex: 'sync_type', key: 'sync_type', width: 70, ellipsis: true, align: 'center' as const },
    { title: '频率', dataIndex: 'frequency', key: 'frequency', width: 65, align: 'center' as const },
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
      title: '同步记录数', dataIndex: 'record_count', key: 'record_count', width: 100, align: 'right' as const,
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
          <a style={{ fontSize: 12 }} onClick={() => message.info('正在加载同步日志...')}>日志</a>
          <a style={{ fontSize: 12 }} onClick={() => message.info('打开同步任务配置')}>配置</a>
        </Space>
      ),
    },
  ];

  return (
    <div className="ds-root">
      <Row gutter={[12, 12]}>
        {kpiCards.map((card) => (
          <Col span={6} key={card.label}>
            <Card className="ds-kpi-card" styles={{ body: { padding: '10px 14px 6px', minHeight: 72 } }}>
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
            <Button size="small" icon={<SettingOutlined />} onClick={() => message.info('打开全局同步配置')}>
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
  );
}

/* ======================== Tab: DataAsset ======================== */
function DataAssetTab() {
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
            <a style={{ fontSize: 13 }} onClick={() => message.info('查看资产详情: ' + name)}>{name}</a>
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
    { title: '大小', dataIndex: 'size', key: 'size', width: 90, align: 'right' as const, render: (s: string) => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{s}</Text> },
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
          <a style={{ fontSize: 12 }} onClick={() => message.info('加载资产详情...')}>详情</a>
          <a style={{ fontSize: 12 }} onClick={() => message.info('加载数据血缘图谱...')}>血缘</a>
        </Space>
      ),
    },
  ];

  const segOptions = [
    { label: '全部', value: '全部' },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ];

  return (
    <div className="da-root">
      <Row gutter={[12, 12]}>
        {kpiCards.map((card) => (
          <Col span={6} key={card.label}>
            <Card className="da-kpi-card" styles={{ body: { padding: '10px 14px 6px', minHeight: 72 } }}>
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
  );
}

/* ======================== Tab: DataAnalysis ======================== */
function DataAnalysisTab() {
  const [activeTab, setActiveTab] = useState('overview');

  const qualityColumns = useMemo(() => [
    { title: '#', dataIndex: 'key', width: 36, align: 'center' as const },
    { title: '数据表', dataIndex: 'name', width: 110, ellipsis: true },
    { title: '英文名', dataIndex: 'table', width: 120, ellipsis: true, render: (v: string) => <Text style={{ fontSize: 11, color: '#86909C' }}>{v}</Text> },
    { title: '记录数', dataIndex: 'records', width: 95 },
    {
      title: '完整性', dataIndex: 'integrity', width: 70,
      render: (v: string) => {
        const n = parseFloat(v);
        return <Text style={{ color: n >= 98 ? '#2BA471' : n >= 95 ? '#E37318' : '#D54941', fontSize: 12 }}>{v}</Text>;
      },
    },
    {
      title: '准确率', dataIndex: 'accuracy', width: 70,
      render: (v: string) => {
        const n = parseFloat(v);
        return <Text style={{ color: n >= 98 ? '#2BA471' : n >= 95 ? '#E37318' : '#D54941', fontSize: 12 }}>{v}</Text>;
      },
    },
    {
      title: '一致性', dataIndex: 'consistency', width: 70,
      render: (v: string) => {
        const n = parseFloat(v);
        return <Text style={{ color: n >= 98 ? '#2BA471' : n >= 95 ? '#E37318' : '#D54941', fontSize: 12 }}>{v}</Text>;
      },
    },
    {
      title: '完备性', dataIndex: 'completeness', width: 70,
      render: (v: string) => {
        const n = parseFloat(v);
        return <Text style={{ color: n >= 98 ? '#2BA471' : n >= 95 ? '#E37318' : '#D54941', fontSize: 12 }}>{v}</Text>;
      },
    },
    {
      title: '评分', dataIndex: 'score', width: 75,
      render: (v: number) => (
        <Space size={4}>
          <span style={{
            display: 'inline-block', width: 38, height: 6,
            borderRadius: 3, background: '#F0F2F5', verticalAlign: 'middle',
          }}>
            <span style={{
              display: 'block', height: 6, borderRadius: 3,
              width: `${v}%`,
              background: v >= 95 ? '#2BA471' : v >= 90 ? '#E37318' : '#D54941',
            }} />
          </span>
          <Text strong style={{ fontSize: 12, color: v >= 95 ? '#2BA471' : v >= 90 ? '#E37318' : '#D54941' }}>
            {v}
          </Text>
        </Space>
      ),
    },
    {
      title: '趋势', dataIndex: 'trend', width: 46, align: 'center' as const,
      render: (v: string) => v === 'up'
        ? <ArrowUpOutlined style={{ color: '#2BA471', fontSize: 14 }} />
        : <ArrowDownOutlined style={{ color: '#D54941', fontSize: 14 }} />,
    },
  ], []);

  const syncIssuesColumns = useMemo(() => [
    {
      title: '问题类型', dataIndex: 'type', width: 90,
      render: (v: string, r: { color: string }) => (
        <Space size={6}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: r.color }} />
          <Text style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ),
    },
    { title: '数量', dataIndex: 'count', width: 55, align: 'right' as const },
    {
      title: '占比', dataIndex: 'pct', width: 55, align: 'right' as const,
      render: (v: string) => <Text strong style={{ fontSize: 12, color: '#1D2129' }}>{v}</Text>,
    },
  ], []);

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }} justify="end">
        <Col>
          <RangePicker
            defaultValue={[dayjs('2025-05-14'), dayjs('2025-05-20')]}
            format="YYYY-MM-DD"
            size="small"
            allowClear={false}
          />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {analysisKpiCards.map((k, i) => (
          <Col span={4} key={i}>
            <Card size="small" styles={{ body: { padding: '14px 16px', minHeight: 72 } }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="da-kpi-card-title">{k.title}</div>
                  <Statistic
                    value={k.value}
                    suffix={<span style={{ fontSize: 15, fontWeight: 400, color: '#86909C', marginLeft: 2 }}>{k.suffix}</span>}
                    valueStyle={{ fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1.2 }}
                  />
                </div>
                <div className="da-kpi-icon-circle" style={{ background: k.bg, color: k.color }}>
                  {k.icon}
                </div>
              </div>
              <div className="da-trend-inline" style={{ color: k.up ? '#2BA471' : '#D54941' }}>
                {k.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {k.trend}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={10}>
          <Card
            size="small"
            title={<span className="da-card-header">数据接入趋势</span>}
            extra={
              <Space size={4}>
                <ReloadOutlined style={{ fontSize: 12, color: '#86909C', cursor: 'pointer' }} />
                <DownloadOutlined style={{ fontSize: 12, color: '#86909C', cursor: 'pointer' }} />
              </Space>
            }
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={dataIngestionTrendOption} style={{ height: 272 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            title={<span className="da-card-header">数据类型分布</span>}
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={dataTypeDonutOption} style={{ height: 272 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            title={<span className="da-card-header">数据质量分布</span>}
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={qualityDistDonutOption} style={{ height: 272 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Card
            size="small"
            title={<span className="da-card-header">数据源状态</span>}
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={sourceStatusRingOption} style={{ height: 264 }} />
          </Card>
        </Col>
        <Col span={7}>
          <Card
            size="small"
            title={<span className="da-card-header">同步状态趋势</span>}
            extra={
              <Space size={4}>
                <ReloadOutlined style={{ fontSize: 12, color: '#86909C', cursor: 'pointer' }} />
              </Space>
            }
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={syncStatusTrendOption} style={{ height: 264 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            size="small"
            title={<span className="da-card-header">数据使用量 Top 10</span>}
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={usageTop10Option} style={{ height: 264 }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card
            size="small"
            title={<span className="da-card-header">存储资源</span>}
            styles={{ body: { padding: '8px 4px 0' } }}
          >
            <ReactECharts option={storageRingOption} style={{ height: 272 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={10}>
          <Card
            size="small"
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={analysisTabItems}
              style={{ marginBottom: 10 }}
              tabBarExtraContent={
                <Space size={8}>
                  <Button size="small" icon={<FilterOutlined />} style={{ fontSize: 12 }} onClick={() => message.info('打开数据筛选面板')}>筛选</Button>
                  <Button size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }} onClick={() => { message.success('数据导出成功'); }}>导出</Button>
                </Space>
              }
            />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2129', marginBottom: 8 }}>数据质量详情</div>
            <Table
              columns={qualityColumns}
              dataSource={qualityTableData}
              pagination={false}
              size="small"
              scroll={{ x: 920 }}
            />
          </Card>
        </Col>
        <Col span={7}>
          <Card
            size="small"
            title={<span className="da-card-header">同步问题分析</span>}
            styles={{ body: { padding: '12px 12px 8px' } }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 160, flexShrink: 0 }}>
                <ReactECharts option={syncIssuesDonutOption} style={{ height: 196 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D2129', marginBottom: 6 }}>
                  问题总数 <span style={{ color: '#D54941', fontSize: 18 }}>674</span> 项
                </div>
                <Table
                  columns={syncIssuesColumns}
                  dataSource={syncIssuesTableData}
                  pagination={false}
                  size="small"
                  showHeader={false}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={7}>
          <Card
            size="small"
            title={<span className="da-card-header">数据生命周期分布</span>}
            styles={{ body: { padding: '12px 8px 4px' } }}
          >
            <ReactECharts option={lifecycleDonutOption} style={{ height: 310 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

/* ======================== Main: DataCenter ======================== */
export default function DataCenter() {
  return (
    <>
      <style>{DataSyncCSS}</style>
      <style>{DataAssetCSS}</style>
      <style>{DataAnalysisCSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card
          size="small"
          title={<Space><CloudSyncOutlined style={{ color: '#0052D9' }} /><span style={{ fontWeight: 600 }}>数据同步</span></Space>}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <DataSyncTab />
        </Card>
        <Card
          size="small"
          title={<Space><GoldOutlined style={{ color: '#2BA471' }} /><span style={{ fontWeight: 600 }}>数据资产</span></Space>}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <DataAssetTab />
        </Card>
        <Card
          size="small"
          title={<Space><CheckCircleOutlined style={{ color: '#7B61FF' }} /><span style={{ fontWeight: 600 }}>数据分析</span></Space>}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <DataAnalysisTab />
        </Card>
      </div>
    </>
  );
}