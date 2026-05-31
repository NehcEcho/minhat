import { useEffect, useRef, useState } from 'react';
import { Button, Spin, Typography } from 'antd';
import { ReloadOutlined, ExpandOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CSS = `
.eet-root { display: flex; flex-direction: column; height: calc(100vh - 64px - 48px); }
.eet-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; gap: 8px; }
.eet-toolbar-left { display: flex; align-items: center; gap: 8px; }
.eet-iframe-wrap { flex: 1; border-radius: 8px; overflow: hidden; border: 1px solid #E5E6EB; background: #fff; }
.eet-iframe-wrap iframe { width: 100%; height: 100%; border: none; }
.eet-loading { display: flex; align-items: center; justify-content: center; height: 100%; }
`;

export default function EegEmotionTool() {
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const flaskUrl = 'http://127.0.0.1:5000';

  const handleReload = () => {
    setLoading(true);
    setIframeError(false);
    if (iframeRef.current) {
      iframeRef.current.src = flaskUrl;
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="eet-root">
        <div className="eet-toolbar">
          <div className="eet-toolbar-left">
            <Text strong style={{ fontSize: 14 }}>EEG 情绪识别</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Neeuro SenzeBand 2 / Multi-Task EEGNet</Text>
          </div>
          <div>
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReload}>重载</Button>
            <Button size="small" icon={<ExpandOutlined />} onClick={handleFullscreen} style={{ marginLeft: 8 }}>全屏</Button>
          </div>
        </div>
        <div className="eet-iframe-wrap">
          {loading && !iframeError && (
            <div className="eet-loading">
              <Spin tip="正在连接 EEG 服务 (端口 5000)..." />
            </div>
          )}
          {iframeError && (
            <div className="eet-loading" style={{ flexDirection: 'column', gap: 12 }}>
              <Text type="danger">无法连接到 EEG 服务 (127.0.0.1:5000)</Text>
              <Text type="secondary">请确保 frist/app.py 已启动</Text>
              <Button onClick={handleReload}>重试</Button>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={flaskUrl}
            onLoad={() => { setLoading(false); setIframeError(false); }}
            onError={() => { setLoading(false); setIframeError(true); }}
            title="EEG Emotion Recognition"
          />
        </div>
      </div>
    </>
  );
}
