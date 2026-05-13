import { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Select, Tag, Typography, message } from 'antd';
import {
  AlertOutlined, VideoCameraOutlined, StopOutlined,
  ThunderboltOutlined, ReloadOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';
import { getDeviceList, triggerSOS as apiTriggerSOS, demoStreamStart, demoStreamStop } from '../api';

const { Text, Title } = Typography;

const CSS = `
.demo-panel {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1040 50%, #0d1b2a 100%);
  padding: 24px;
  color: #e0e0e0;
}
.demo-panel .sos-btn {
  width: 100%;
  height: 80px;
  font-size: 24px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #ff4d4f, #cf1322);
  border: none;
  color: #fff;
  text-shadow: 0 0 10px rgba(255,0,0,0.5);
  box-shadow: 0 0 30px rgba(255,0,0,0.3);
  animation: sos-pulse 1.5s ease-in-out infinite;
}
.demo-panel .sos-btn:hover {
  background: linear-gradient(135deg, #ff7875, #ff4d4f) !important;
  box-shadow: 0 0 50px rgba(255,0,0,0.5) !important;
}
@keyframes sos-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(255,0,0,0.3); }
  50% { box-shadow: 0 0 60px rgba(255,0,0,0.6); }
}
.demo-panel .ant-card {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 12px;
}
.demo-panel .ant-card-head {
  color: #e0e0e0 !important;
  border-bottom: 1px solid rgba(255,255,255,0.1) !important;
}
.demo-panel .ant-select {
  color: #e0e0e0;
}
.demo-panel .ant-select-selector {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.15) !important;
  color: #e0e0e0 !important;
}
.demo-panel .ant-statistic-title { color: rgba(255,255,255,0.45) !important; }
.demo-panel .ant-statistic-content { color: #e0e0e0 !important; }
`;

export default function DemoControl() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const loadDevices = async () => {
    try {
      const r = await getDeviceList({ is_page: true, page_index: 1, page_size: 50 });
      setDevices(r.data?.data?.items || []);
    } catch { message.error('加载设备失败'); }
  };

  useEffect(() => { loadDevices(); }, []);

  const devOptions = devices.map((d: any) => ({
    value: d.deviceId,
    label: `${d.deviceId} (${d.deviceName})`,
  }));

  const handleSOS = async () => {
    const devId = selectedDevice || 'D-1001';
    try {
      await apiTriggerSOS(devId);
      message.success(`SOS 已触发 → 设备 ${devId}`);
    } catch { message.error('SOS 触发失败'); }
  };

  const handleStreamStart = async () => {
    const devId = selectedDevice;
    if (!devId) return message.warning('请先选择设备');
    try {
      const r = await demoStreamStart(devId);
      const info = r.data?.data || r.data;
      setStreamInfo(info);
      setStreaming(true);
      message.success('拉流中');
    } catch { message.error('拉流失败'); }
  };

  const handleStreamStop = () => {
    const devId = selectedDevice;
    if (devId) demoStreamStop(devId).catch(() => {});
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setStreaming(false);
    setStreamInfo(null);
  };

  useEffect(() => {
    if (streaming && streamInfo?.HLS && videoRef.current) {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamInfo.HLS);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamInfo.HLS;
        video.play().catch(() => {});
      }
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [streaming, streamInfo?.HLS]);

  return (
    <>
      <style>{CSS}</style>
      <div className="demo-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <ThunderboltOutlined style={{ fontSize: 32, color: '#1890FF' }} />
          <Title level={3} style={{ color: '#e0e0e0', margin: 0 }}>演示操控台</Title>
          <Tag color="blue">Demo Control</Tag>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="设备选择" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  placeholder="选择演示设备"
                  value={selectedDevice || undefined}
                  onChange={setSelectedDevice}
                  style={{ width: '100%' }}
                  options={devOptions}
                  showSearch
                  filterOption={(inp: string, opt: any) => (opt?.label || '').toLowerCase().includes(inp.toLowerCase())}
                />
                <Button icon={<ReloadOutlined />} onClick={loadDevices} size="small">刷新设备</Button>
              </Space>
            </Card>

            <Card title="应急操控" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  className="sos-btn"
                  icon={<AlertOutlined />}
                  onClick={handleSOS}
                  block
                >
                  🚨 SOS 紧急告警
                </Button>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', display: 'block' }}>
                  点击后，演示端将弹出全屏紧急告警窗口
                </Text>
              </Space>
            </Card>

            <Card title="视频拉流" size="small">
              <Space style={{ width: '100%' }}>
                {!streaming ? (
                  <Button
                    type="primary"
                    icon={<VideoCameraOutlined />}
                    onClick={handleStreamStart}
                    block
                    style={{ background: '#1890FF', border: 'none' }}
                  >
                    开始拉流
                  </Button>
                ) : (
                  <Button danger icon={<StopOutlined />} onClick={handleStreamStop} block>
                    停止拉流
                  </Button>
                )}
              </Space>
              {streamInfo && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="green" style={{ fontSize: 11 }}>{streamInfo.Transport || 'TCP'}</Tag>
                  <Text copyable style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'block', marginTop: 4 }}>
                    {streamInfo.HLS || streamInfo.StreamID}
                  </Text>
                </div>
              )}
            </Card>
          </div>

          <Card
            title="视频预览"
            styles={{ body: { padding: 0 } }}
          >
            {streaming ? (
              <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', minHeight: 480 }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: 480, background: '#000' }}
                  controls
                  autoPlay
                  muted
                />
              </div>
            ) : (
              <div style={{
                height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.25)', flexDirection: 'column', gap: 12,
              }}>
                <VideoCameraOutlined style={{ fontSize: 64 }} />
                <Text style={{ color: 'rgba(255,255,255,0.35)' }}>选择设备并开始拉流</Text>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
