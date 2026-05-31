import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Descriptions, Tag, Tabs, Button, Space, Statistic,
  Image, Modal, Form, Input, InputNumber, message, Empty, Spin, Typography, Popconfirm, Tooltip,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOutlined, WifiOutlined, DisconnectOutlined, AlertOutlined,
  ThunderboltOutlined, AimOutlined, ClockCircleOutlined, EnvironmentOutlined,
  CameraOutlined, VideoCameraOutlined, DeleteOutlined, EditOutlined,
  ReloadOutlined, DesktopOutlined, SaveOutlined, ApiOutlined,
} from '@ant-design/icons';
import { getDevice, getDeviceFiles, deleteFile, updateDevice } from '../api';

const { Text, Title } = Typography;

const CSS = `
.dd-root { display: flex; flex-direction: column; gap: 12px; }
.dd-back-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.dd-kpi-card { border-radius: 8px; }
.dd-kpi-card .ant-card-body { padding: 12px 16px; }
.dd-kpi-inner { display: flex; align-items: flex-start; gap: 10px; }
.dd-kpi-icon { width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.dd-kpi-body { flex: 1; min-width: 0; }
.dd-kpi-label { font-size: 11px; color: #86909C; }
.dd-kpi-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.dd-file-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; }
.dd-file-item { width: 160px; cursor: pointer; position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #F0F0F0; }
.dd-file-item:hover { border-color: #1890FF; }
.dd-file-item img, .dd-file-item video { width: 100%; height: 120px; object-fit: cover; display: block; }
.dd-file-item .dd-file-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.6); color: #fff; font-size: 11px; padding: 4px 8px;
  display: flex; align-items: center; justify-content: space-between;
}
.dd-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }
.dd-section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
`;

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm] = Form.useForm();
  const [preview, setPreview] = useState<{ src: string; type: string } | null>(null);
  const [fileTab, setFileTab] = useState('photo');

  const deviceId = parseInt(id || '', 10);
  const validId = id && !isNaN(deviceId) && deviceId > 0;

  const loadDevice = useCallback(async () => {
    if (!validId) return;
    setLoading(true);
    try {
      const r = await getDevice(deviceId);
      const d = r.data?.data || r.data;
      setDevice(d);
    } catch { setDevice(null); }
    finally { setLoading(false); }
  }, [deviceId]);

  const loadFiles = useCallback(async () => {
    if (!validId) return;
    setFilesLoading(true);
    try {
      const [pr, vr] = await Promise.all([
        getDeviceFiles({ device_id: String(deviceId), type: 'photo' }).catch(() => ({ data: { data: { list: [] } } })),
        getDeviceFiles({ device_id: String(deviceId), type: 'video' }).catch(() => ({ data: { data: { list: [] } } })),
      ]);
      setPhotos(pr.data?.data?.list || []);
      setVideos(vr.data?.data?.list || []);
    } catch { setPhotos([]); setVideos([]); }
    finally { setFilesLoading(false); }
  }, [deviceId]);

  useEffect(() => { loadDevice(); loadFiles(); }, [loadDevice, loadFiles]);

  const handleDeleteFile = async (path: string) => {
    try { await deleteFile(path); message.success('已删除'); loadFiles(); }
    catch { message.error('删除失败'); }
  };

  const openEdit = () => {
    editForm.setFieldsValue({
      deviceName: device?.deviceName || device?.device_name || '',
      productId: device?.productId || device?.product_id || 0,
    });
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    const v = editForm.getFieldsValue();
    try {
      await updateDevice(deviceId, v);
      message.success('已更新');
      setEditModal(false);
      loadDevice();
    } catch { message.error('更新失败'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载设备信息..." />
      </div>
    );
  }

  if (!validId || !device) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/device-manage')}>返回设备列表</Button>
        <Empty description="设备不存在或加载失败" style={{ marginTop: 60 }} />
      </div>
    );
  }

  const dn = device.deviceName || device.device_name || '未知';
  const pn = device.productName || device.product_name || '未知';
  const st = device.status || 'Offline';
  const isOnline = st === '在线' || st === 'Online';
  const lon = device.longitude || '--';
  const lat = device.latitude || '--';
  const bat = device.battery ?? device.latestData?.battery;
  const sig = device.signal ?? device.latestData?.signal;
  const area = device.groupName || device.area || device.latestData?.area || '--';
  const created = device.createdAt || device.created_at || '';
  const updated = device.updatedAt || device.updated_at || '';

  const latestData = device.latestData || {};
  const statusColor = isOnline ? '#52C41A' : st === '报警' ? '#FAAD14' : '#F5222D';

  const kpiCards = [
    { label: '设备状态', value: st, suffix: '', icon: isOnline ? <WifiOutlined /> : <DisconnectOutlined />, bg: isOnline ? '#E8F8F2' : '#FDECEE', color: statusColor, raw: true },
    { label: '电量', value: bat ?? '--', suffix: bat != null ? '%' : '', icon: <ThunderboltOutlined />, bg: '#FFF7E6', color: '#FAAD14' },
    { label: '信号', value: sig ?? '--', suffix: sig != null ? '%' : '', icon: <AimOutlined />, bg: '#E8F3FF', color: '#0052D9' },
    { label: '所属区域', value: area, suffix: '', icon: <EnvironmentOutlined />, bg: '#F5F0FF', color: '#722ED1', raw: true },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="dd-root">
        {/* Back bar */}
        <div className="dd-back-bar">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/device-manage')}>返回设备列表</Button>
          <Text type="secondary">|</Text>
          <Text type="secondary">设备运维</Text>
          <Text type="secondary">/</Text>
          <Text strong>{dn}</Text>
        </div>

        {/* KPI cards */}
        <Row gutter={[12, 12]}>
          {kpiCards.map((card) => (
            <Col span={6} key={card.label}>
              <Card className="dd-kpi-card" bodyStyle={{ padding: '12px 16px' }}>
                <div className="dd-kpi-inner">
                  <div className="dd-kpi-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="dd-kpi-body">
                    <div className="dd-kpi-label">{card.label}</div>
                    <div className="dd-kpi-value" style={{ color: card.color, fontSize: card.raw ? 16 : 22 }}>
                      {card.value}
                      {card.suffix && <span style={{ fontSize: 14, fontWeight: 400, color: '#86909C' }}> {card.suffix}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Device Info */}
        <Card
          title={<Space><DesktopOutlined />设备基本信息</Space>}
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => { loadDevice(); loadFiles(); }} size="small">刷新</Button>
              <Button type="primary" icon={<EditOutlined />} onClick={openEdit} size="small">编辑</Button>
            </Space>
          }
          className="dd-kpi-card"
        >
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600, width: 120 }}>
            <Descriptions.Item label="设备ID">{device.deviceId || device.device_id || deviceId}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{dn}</Descriptions.Item>
            <Descriptions.Item label="产品型号">{pn}</Descriptions.Item>
            <Descriptions.Item label="产品代码">{device.productCode || device.product_code || '--'}</Descriptions.Item>
            <Descriptions.Item label="通信协议">{(device.protocol || []).join(', ') || '--'}</Descriptions.Item>
            <Descriptions.Item label="经度">{lon}</Descriptions.Item>
            <Descriptions.Item label="纬度">{lat}</Descriptions.Item>
            <Descriptions.Item label="公司ID">{device.companyId || device.company_id || '--'}</Descriptions.Item>
            <Descriptions.Item label="公司名称">{device.companyName || device.company_name || '--'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{created ? new Date(created).toLocaleString() : '--'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{updated ? new Date(updated).toLocaleString() : '--'}</Descriptions.Item>
            <Descriptions.Item label="数据库ID">{device.id || deviceId}</Descriptions.Item>
          </Descriptions>

          {/* Latest data section */}
          {Object.keys(latestData).length > 0 && (
            <>
              <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
                <ApiOutlined /> 最新上报数据 (GNSS_UP)
              </Title>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} labelStyle={{ fontWeight: 600 }}>
                {Object.entries(latestData).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </>
          )}
        </Card>

        {/* Device Files */}
        <Card
          title={<Space><CameraOutlined />设备文件</Space>}
          className="dd-kpi-card"
          tabProps={{ size: 'small' }}
          tabList={[
            { key: 'photo', label: `照片 (${photos.length})` },
            { key: 'video', label: `视频 (${videos.length})` },
          ]}
          activeTabKey={fileTab}
          onTabChange={setFileTab}
        >
          {filesLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : (
            <>
              {fileTab === 'photo' && (
                photos.length > 0 ? (
                  <div className="dd-file-grid">
                    {photos.map((f: any) => (
                      <div key={f.path || f.name} className="dd-file-item" onClick={() => setPreview({ src: f.presignedURL || f.presigned_url, type: 'image' })}>
                        <img src={f.presignedURL || f.presigned_url} alt={f.name} />
                        <div className="dd-file-overlay">
                          <span className="dd-file-name">{f.name}</span>
                          <Popconfirm title="确认删除?" onConfirm={(e) => { e?.stopPropagation(); handleDeleteFile(f.path); }} onCancel={(e) => e?.stopPropagation()}>
                            <DeleteOutlined onClick={(e) => e.stopPropagation()} style={{ fontSize: 12 }} />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <Empty description="无照片" />
              )}
              {fileTab === 'video' && (
                videos.length > 0 ? (
                  <div className="dd-file-grid">
                    {videos.map((f: any) => (
                      <div key={f.path || f.name} className="dd-file-item" onClick={() => setPreview({ src: f.presignedURL || f.presigned_url, type: 'video' })}>
                        <video src={f.presignedURL || f.presigned_url} />
                        <div className="dd-file-overlay">
                          <span className="dd-file-name">{f.name}</span>
                          <Popconfirm title="确认删除?" onConfirm={(e) => { e?.stopPropagation(); handleDeleteFile(f.path); }} onCancel={(e) => e?.stopPropagation()}>
                            <DeleteOutlined onClick={(e) => e.stopPropagation()} style={{ fontSize: 12 }} />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <Empty description="无视频" />
              )}
            </>
          )}
        </Card>

        {/* Preview Modal */}
        <Modal
          open={!!preview}
          onCancel={() => setPreview(null)}
          footer={null}
          width="max(60vw, 640px)"
          title={preview?.type === 'video' ? '视频预览' : '照片预览'}
        >
          {preview?.type === 'image' && <img src={preview.src} alt="" style={{ width: '100%', borderRadius: 8 }} />}
          {preview?.type === 'video' && <video src={preview.src} controls style={{ width: '100%', borderRadius: 8 }} />}
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="编辑设备信息"
          open={editModal}
          onCancel={() => setEditModal(false)}
          onOk={handleSaveEdit}
          okText="保存"
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="deviceName" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
              <Input placeholder="输入设备名称" />
            </Form.Item>
            <Form.Item name="productId" label="产品ID">
              <InputNumber style={{ width: '100%' }} placeholder="输入产品ID" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}
