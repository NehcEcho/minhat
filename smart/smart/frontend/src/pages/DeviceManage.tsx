import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Row, Col, Card, Table, Tag, Input, Segmented, Statistic, Badge, Tooltip, Progress, Space, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DatabaseOutlined, WifiOutlined, DisconnectOutlined, AlertOutlined,
  SearchOutlined, SignalFilled, ThunderboltOutlined, AimOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDeviceList } from '../api';

const { Text, Title } = Typography;

const DeviceManageCSS = `
.dm-root { display: flex; flex-direction: column; gap: 12px; }
.dm-kpi-card { border-radius: 8px; }
.dm-kpi-card .ant-card-body { padding: 10px 14px 6px; }
.dm-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.dm-kpi-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; }
.dm-kpi-body { flex: 1; min-width: 0; }
.dm-kpi-label { font-size: 11px; color: #86909C; }
.dm-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.dm-kpi-sub { font-size: 11px; color: #86909C; }
.dm-filter-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.dm-signal-wrap { display: flex; gap: 2px; align-items: flex-end; }
.dm-signal-bar { width: 4px; border-radius: 1px; }
.dm-battery-bar { display: flex; align-items: center; gap: 6px; }
.dm-battery-outer { width: 48px; height: 12px; border: 1px solid #D9D9D9; border-radius: 3px; padding: 1px; }
.dm-battery-inner { height: 8px; border-radius: 2px; transition: width 0.3s; }
`;

interface DeviceRow {
  key: number;
  id: number;
  deviceId: string;
  device_name: string;
  product_name: string;
  status: string;
  battery: number;
  signal: number;
  area: string;
  online_time: string;
  isReal: boolean;
}

const mockDevices: DeviceRow[] = [
  { key: -1, id: -1, deviceId: '', device_name: '智能矿帽-MKH-00234', product_name: 'MKH-1000', status: '在线', battery: 62, signal: 85, area: '主运输巷道', online_time: '12h15m', isReal: false },
  { key: -2, id: -2, deviceId: '', device_name: '智能矿帽-MKH-00345', product_name: 'MKH-1000', status: '在线', battery: 91, signal: 95, area: '回风巷道', online_time: '20h08m', isReal: false },
  { key: -3, id: -3, deviceId: '', device_name: '智能矿帽-MKH-00456', product_name: 'MKH-1000', status: '离线', battery: 5, signal: 0, area: '采掘工作面B', online_time: '-', isReal: false },
  { key: -4, id: -4, deviceId: '', device_name: '定位基站-LB-200', product_name: 'LB-200', status: '在线', battery: 100, signal: 88, area: '主运输巷道', online_time: '10d2h', isReal: false },
  { key: -5, id: -5, deviceId: '', device_name: '定位基站-LB-201', product_name: 'LB-200', status: '在线', battery: 100, signal: 90, area: '回风巷道', online_time: '12d8h', isReal: false },
  { key: -6, id: -6, deviceId: '', device_name: '摄像头-CAM-01', product_name: 'IPC-HF862', status: '在线', battery: 100, signal: 78, area: '采掘工作面A', online_time: '15d6h', isReal: false },
  { key: -7, id: -7, deviceId: '', device_name: '摄像头-CAM-02', product_name: 'IPC-HF862', status: '离线', battery: 100, signal: 0, area: '主斜井', online_time: '-', isReal: false },
  { key: -8, id: -8, deviceId: '', device_name: '气体传感器-GS-400', product_name: 'GS-400', status: '在线', battery: 100, signal: 82, area: '回风巷道', online_time: '22d10h', isReal: false },
  { key: -9, id: -9, deviceId: '', device_name: '气体传感器-GS-401', product_name: 'GS-400', status: '在线', battery: 100, signal: 74, area: '采掘工作面B', online_time: '18d6h', isReal: false },
  { key: -10, id: -10, deviceId: '', device_name: '广播终端-PA-300', product_name: 'PA-300', status: '在线', battery: 100, signal: 72, area: '主斜井', online_time: '23d18h', isReal: false },
  { key: -11, id: -11, deviceId: '', device_name: '广播终端-PA-301', product_name: 'PA-300', status: '离线', battery: 100, signal: 0, area: '采掘工作面A', online_time: '-', isReal: false },
  { key: -12, id: -12, deviceId: '', device_name: '环境监测仪-EM-100', product_name: 'EM-100', status: '离线', battery: 100, signal: 0, area: '回风巷道', online_time: '-', isReal: false },
  { key: -13, id: -13, deviceId: '', device_name: '智能矿帽-MKH-00567', product_name: 'MKH-1000', status: '报警', battery: 45, signal: 60, area: '机电硐室K7', online_time: '3h05m', isReal: false },
  { key: -14, id: -14, deviceId: '', device_name: '粉尘传感器-DS-500', product_name: 'DS-500', status: '在线', battery: 100, signal: 67, area: '主运输巷道', online_time: '16d4h', isReal: false },
];

function SignalBars({ signal }: { signal: number }) {
  const fill = signal > 75 ? '#52C41A' : signal > 40 ? '#FAAD14' : '#F5222D';
  const active = signal > 0 ? Math.ceil(signal / 25) : 0;
  return (
    <div className="dm-signal-wrap">
      {[1, 2, 3, 4].map((b) => (
        <div key={b} className="dm-signal-bar" style={{
          height: b * 5,
          background: b <= active ? fill : '#E5E6EB',
        }} />
      ))}
    </div>
  );
}

function BatteryBar({ battery }: { battery: number }) {
  const color = battery > 60 ? '#52C41A' : battery > 20 ? '#FAAD14' : '#F5222D';
  return (
    <div className="dm-battery-bar">
      <Progress
        percent={battery}
        size="small"
        strokeColor={color}
        format={() => `${battery}%`}
        style={{ width: 80, margin: 0 }}
      />
    </div>
  );
}

export default function DeviceManage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [searchText, setSearchText] = useState('');
  const [totalDevices, setTotalDevices] = useState(0);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeviceList({ is_page: true, page_index: 1, page_size: 200 });
      const data = res.data?.data || {};
      const items: any[] = data.items || [];
      const mapped: DeviceRow[] = items.map((d: any, i: number) => ({
        key: d.id || i + 1,
        id: d.id,
        deviceId: d.deviceId || d.device_id || String(d.id),
        device_name: d.deviceName || d.device_name || `设备-${d.id}`,
        product_name: d.productName || d.product_name || '-',
        status: d.status === 'Online' ? '在线' : d.status === 'Offline' ? '离线' : d.status || '离线',
        battery: d.battery ?? 0,
        signal: d.networkSignal ?? d.network_signal ?? 0,
        area: d.area || d.companyName || '-',
        online_time: d.onlineTime || '-',
        isReal: true,
      }));
      setDevices([...mapped, ...mockDevices]);
      setTotalDevices((data.total || mapped.length) + mockDevices.length);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter !== '全部' && d.status !== statusFilter) return false;
      if (searchText && !d.device_name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [devices, statusFilter, searchText]);

  const total = devices.length;
  const online = devices.filter((d) => d.status === '在线').length;
  const offline = devices.filter((d) => d.status === '离线').length;
  const alarm = devices.filter((d) => d.status === '报警').length;

  const kpiCards = [
    { label: '设备总数', value: total, suffix: '台', icon: <DatabaseOutlined />, bg: '#E8F3FF', color: '#0052D9' },
    { label: '在线设备', value: online, suffix: '台', icon: <WifiOutlined />, bg: '#E8F8F2', color: '#52C41A' },
    { label: '离线设备', value: offline, suffix: '台', icon: <DisconnectOutlined />, bg: '#FDECEE', color: '#F5222D' },
    { label: '告警设备', value: alarm, suffix: '台', icon: <AlertOutlined />, bg: '#FFF7E6', color: '#FAAD14' },
  ];

  const handleDeviceClick = (deviceId: string) => {
    navigate(`/system-integration?deviceId=${encodeURIComponent(deviceId)}`);
  };

  const columns: ColumnsType<DeviceRow> = [
    {
      title: '设备名称', dataIndex: 'device_name', key: 'device_name', width: 190, ellipsis: true,
      render: (name: string, rec: DeviceRow) => (
        <Space>
          <Badge status={rec.status === '在线' ? 'success' : rec.status === '报警' ? 'warning' : 'error'} />
          {rec.isReal ? (
            <a style={{ fontSize: 13, fontWeight: 500 }} onClick={() => handleDeviceClick(rec.deviceId)}>{name}</a>
          ) : (
            <span style={{ fontSize: 13 }}>{name}</span>
          )}
        </Space>
      ),
    },
    { title: '产品型号', dataIndex: 'product_name', key: 'product_name', width: 100, ellipsis: true },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: string) => {
        const colorMap: Record<string, string> = { '在线': 'green', '离线': 'red', '报警': 'orange' };
        const iconMap: Record<string, React.ReactNode> = {
          '在线': <WifiOutlined />,
          '离线': <DisconnectOutlined />,
          '报警': <AlertOutlined />,
        };
        return (
          <Tag color={colorMap[status] || 'default'} icon={iconMap[status]} style={{ margin: 0 }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: '电量', dataIndex: 'battery', key: 'battery', width: 110,
      render: (battery: number) => <BatteryBar battery={battery} />,
    },
    {
      title: '信号', dataIndex: 'signal', key: 'signal', width: 80,
      render: (signal: number, rec: DeviceRow) => (
        <Tooltip title={`${rec.status === '离线' ? '无信号' : signal + '%'}`}>
          <SignalBars signal={signal} />
        </Tooltip>
      ),
    },
    { title: '所属区域', dataIndex: 'area', key: 'area', width: 120, ellipsis: true },
    { title: '在线时长', dataIndex: 'online_time', key: 'online_time', width: 90 },
    {
title: '操作', dataIndex: 'deviceId', key: 'action', width: 100, fixed: 'right',
      render: (_: string, rec: DeviceRow) => (
        <Space size={0} split={<span style={{ color: '#E5E6EB', margin: '0 6px' }}>|</span>}>
          {rec.isReal ? (
            <a style={{ fontSize: 12 }} onClick={() => handleDeviceClick(rec.deviceId)}>智能服务</a>
          ) : (
            <span style={{ fontSize: 12, color: '#C0C4CC' }}>智能服务</span>
          )}
          <span style={{ fontSize: 12, color: '#C0C4CC' }}>配置</span>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{DeviceManageCSS}</style>
      <div className="dm-root">
        <Row gutter={[12, 12]}>
          {kpiCards.map((card) => (
            <Col span={6} key={card.label}>
              <Card className="dm-kpi-card" styles={{ body: { padding: '10px 14px 6px' } }}>
                <div className="dm-kpi-inner">
                  <div className="dm-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="dm-kpi-body">
                    <div className="dm-kpi-label">{card.label}</div>
                    <div className="dm-kpi-value" style={{ color: card.color }}>
                      {card.value}
                      <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> {card.suffix}</span>
                    </div>
                    <div className="dm-kpi-sub">
                      <span style={{ color: '#52C41A' }}>●</span> 在线率 {total > 0 ? ((online / total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card
          size="small"
          title={<span style={{ fontSize: 14, fontWeight: 600 }}>设备列表</span>}
          extra={
            <div className="dm-filter-bar">
              <Input
                placeholder="搜索设备名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
                size="small"
              />
              <Segmented
                size="small"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as string)}
                options={[
                  { label: '全部', value: '全部' },
                  { label: '在线', value: '在线' },
                  { label: '离线', value: '离线' },
                  { label: '报警', value: '报警' },
                ]}
              />
            </div>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table<DeviceRow>
            columns={columns}
            dataSource={filteredDevices}
            loading={loading}
            size="small"
            rowKey="id"
            scroll={{ x: 900 }}
            onRow={(rec) => ({
              style: rec.isReal ? { cursor: 'pointer' } : {},
              onClick: () => { if (rec.isReal) handleDeviceClick(rec.deviceId); },
            })}
            pagination={{
              size: 'small',
              pageSize: 10,
              showTotal: (t: number) => `共 ${t} 条`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        </Card>
      </div>
    </>
  );
}
