import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store';
import { loginApi } from '../api';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUsername } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginApi(values.username, values.password);
      if (res.data.token) {
        setToken(res.data.token);
        setUsername(res.data.username || values.username);
        message.success('登录成功');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      message.error(err.response?.data?.detail || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #13233f 30%, #1a2a4a 60%, #0d1f3c 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes loginFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.06; }
          25% { transform: translate(40px, -30px) scale(1.15); opacity: 0.09; }
          50% { transform: translate(20px, -50px) scale(1.05); opacity: 0.07; }
          75% { transform: translate(-10px, -20px) scale(1.1); opacity: 0.08; }
        }
        @keyframes loginFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.04; }
          33% { transform: translate(-50px, -40px) scale(1.2); opacity: 0.08; }
          66% { transform: translate(-20px, -60px) scale(1.1); opacity: 0.05; }
        }
        @keyframes loginFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(60px, 20px) scale(1.25); opacity: 0.1; }
        }
        @keyframes loginPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .login-bg-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-bg-blob:nth-child(1) {
          top: 8%;
          right: 12%;
          width: 420px; height: 420px;
          background: radial-gradient(circle at center, rgba(0,82,217,0.18) 0%, transparent 70%);
          animation: loginFloat1 12s ease-in-out infinite;
        }
        .login-bg-blob:nth-child(2) {
          bottom: 5%;
          left: 8%;
          width: 380px; height: 380px;
          background: radial-gradient(circle at center, rgba(43,164,113,0.12) 0%, transparent 70%);
          animation: loginFloat2 15s ease-in-out infinite;
        }
        .login-bg-blob:nth-child(3) {
          top: 40%;
          left: 40%;
          width: 320px; height: 320px;
          background: radial-gradient(circle at center, rgba(24,144,255,0.1) 0%, transparent 70%);
          animation: loginFloat3 10s ease-in-out infinite;
        }
        .login-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 80px 80px;
          pointer-events: none;
        }
        .login-card {
          width: 420px;
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
          backdrop-filter: blur(4px);
          position: relative;
          z-index: 1;
        }
        .login-logo-hex {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #1890FF 0%, #0050B3 50%, #2BA471 100%);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          animation: loginPulse 3s ease-in-out infinite;
        }
        .login-input-affix .ant-input-prefix {
          color: #86909C;
          margin-right: 8px;
        }
      `}</style>

      <div className="login-bg-blob" />
      <div className="login-bg-blob" />
      <div className="login-bg-blob" />
      <div className="login-grid-overlay" />

      <Card className="login-card" styles={{ body: { padding: '40px 44px' } }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="login-logo-hex">
            <SafetyCertificateOutlined style={{ fontSize: 30, color: '#fff' }} />
          </div>

          <Title level={2} style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#1D2129',
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
            letterSpacing: 1,
          }}>
            辰尧智算·矿域云控
          </Title>

          <Text style={{
            fontSize: 13,
            color: '#86909C',
            display: 'block',
            marginTop: 6,
            letterSpacing: 2,
          }}>
            矿山安全智能管理平台
          </Text>

          <div style={{
            marginTop: 20,
            height: 3,
            width: 48,
            margin: '20px auto 0',
            borderRadius: 2,
            background: 'linear-gradient(90deg, #1890FF, #2BA471)',
          }} />
        </div>

        <Form
          onFinish={onFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#BFBFBF' }} />}
              placeholder="用户名"
              style={{ height: 46, borderRadius: 8, fontSize: 14 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#BFBFBF' }} />}
              placeholder="密码"
              style={{ height: 46, borderRadius: 8, fontSize: 14 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1890FF 0%, #0050B3 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(24,144,255,0.35)',
                letterSpacing: 4,
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{
          textAlign: 'center',
          marginTop: 8,
          padding: '10px 12px',
          background: '#F5F7FA',
          borderRadius: 8,
          border: '1px solid #F0F0F0',
        }}>
          <Text style={{ fontSize: 12, color: '#86909C' }}>
            请使用已分配的上游账号登录
          </Text>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
        }}>
          {[
            { label: '安全认证', desc: 'ISO 27001' },
            { label: '数据加密', desc: 'AES-256' },
            { label: '服务保障', desc: '99.99%' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 10, color: '#BFBFBF', marginBottom: 2, letterSpacing: 1,
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: '#4E5969', fontWeight: 500 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{
        position: 'absolute',
        bottom: 24,
        textAlign: 'center',
        width: '100%',
        zIndex: 1,
      }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          &copy; 2025 辰尧智算 · 矿域云控 — 矿山安全智能管理平台 v2.0
        </Text>
      </div>
    </div>
  );
}
