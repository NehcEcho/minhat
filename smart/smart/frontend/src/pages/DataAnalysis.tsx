import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Statistic, Tabs, Table, DatePicker, Typography, Tag, Space, Button,
} from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, DatabaseOutlined, CloudUploadOutlined,
  CheckCircleOutlined, SyncOutlined, HddOutlined, TableOutlined,
  ReloadOutlined, FilterOutlined, DownloadOutlined,
  RiseOutlined, TrophyOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/* ======================== KPI Cards ======================== */
const kpiCards = [
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

/* ======================== Days axis ======================== */
const days = ['05-14', '05-15', '05-16', '05-17', '05-18', '05-19', '05-20'];

/* ======================== 1. Data Ingestion Trend (multi-line) ======================== */
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

/* ======================== 2. Data Type Distribution Donut ======================== */
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

/* ======================== 3. Data Quality Distribution Donut ======================== */
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

/* ======================== 4. Source Status Ring ======================== */
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

/* ======================== 5. Sync Status Trend ======================== */
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

/* ======================== 6. Usage Top 10 Bar ======================== */
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

/* ======================== 7. Storage Resource Ring Gauge ======================== */
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

/* ======================== 8. Sync Issues Donut ======================== */
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

/* ======================== 9. Lifecycle Distribution Donut ======================== */
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

/* ======================== Table Data ======================== */

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

const tabItems = [
  { key: 'overview', label: '综合分析' },
  { key: 'personnel', label: '人员分析' },
  { key: 'device', label: '设备分析' },
  { key: 'alarm', label: '报警分析' },
];

/* ======================== Component ======================== */
export default function DataAnalysis() {
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
      <style>{`
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
      `}</style>

      {/* Date Range */}
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

      {/* ===== Row 1: 6 KPI Cards ===== */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {kpiCards.map((k, i) => (
          <Col span={4} key={i}>
            <Card size="small" styles={{ body: { padding: '14px 16px' } }}>
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

      {/* ===== Row 2: Data Ingestion Trend | Data Type Distribution | Data Quality Distribution ===== */}
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

      {/* ===== Row 3: Source Status | Sync Status Trend | Usage Top 10 | Storage Resource ===== */}
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

      {/* ===== Row 4: Quality Details Table | Sync Issues | Lifecycle Distribution ===== */}
      <Row gutter={12}>
        <Col span={10}>
          <Card
            size="small"
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              style={{ marginBottom: 10 }}
              tabBarExtraContent={
                <Space size={8}>
                  <Button size="small" icon={<FilterOutlined />} style={{ fontSize: 12 }}>筛选</Button>
                  <Button size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }}>导出</Button>
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
