import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Avatar, Dropdown, Badge, Space,
  Breadcrumb, Input, Select, Typography, Modal, Button,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  SafetyCertificateOutlined,
  VideoCameraOutlined,
  ToolOutlined,
  BarChartOutlined,
  SettingOutlined,
  HomeOutlined,
  SearchOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  AimOutlined,
  AlertOutlined,
  IdcardOutlined,
  PlaySquareOutlined,
  FileProtectOutlined,
  ScheduleOutlined,
  AuditOutlined,
  SwapOutlined,
  DatabaseOutlined,
  CloudSyncOutlined,
  GoldOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  FieldTimeOutlined,
  SafetyOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return { label, key, icon, children, type } as MenuItem;
}

const topNavItems: { key: string; label: string; path: string }[] = [
  { key: 'home', label: '首页', path: '/dashboard' },
  { key: 'dispatch', label: '指挥调度', path: '/global-position' },
  { key: 'inspect', label: '智能巡检', path: '/inspection-tasks' },
  { key: 'disposal', label: '联动处置', path: '/alarm-disposal' },
  { key: 'data', label: '数据治理', path: '/data-analysis' },
  { key: 'system', label: '系统管理', path: '/employee-management' },
];

const pathToTopNav: Record<string, string> = {
  '/dashboard': 'home',
  '/global-position': 'dispatch',
  '/track-replay': 'dispatch',
  '/geo-fence': 'dispatch',
  '/eeg-monitor': 'dispatch',
  '/realtime-monitor': 'dispatch',
  '/playback-manage': 'dispatch',
  '/video-manage': 'dispatch',
  '/inspection-tasks': 'inspect',
  '/device-manage': 'inspect',
  '/work-orders': 'inspect',
  '/alarm-disposal': 'disposal',
  '/event-linkage': 'disposal',
  '/emergency-plan': 'disposal',
  '/disposal-record': 'disposal',
  '/shift-manage': 'disposal',
  '/data-analysis': 'data',
  '/data-sync': 'data',
  '/data-asset': 'data',
  '/employee-management': 'system',
  '/system-integration': 'system',
  '/reports': 'system',
};

const pathToSelectedKeys: Record<string, string[]> = {
  '/dashboard': ['/dashboard'],
  '/eeg-monitor': ['safety-helmet'],
  '/employee-management': ['sub-system'],
  '/global-position': ['safety-position'],
  '/track-replay': ['safety-track'],
  '/geo-fence': ['safety-fence'],
  '/alarm-disposal': ['safety-alarm'],
  '/realtime-monitor': ['video-live'],
  '/playback-manage': ['video-replay'],
  '/video-manage': ['video-manage'],
  '/device-manage': ['device-manage'],
  '/work-orders': ['device-order'],
  '/inspection-tasks': ['device-patrol'],
  '/data-sync': ['data-sync'],
  '/data-analysis': ['data-quality'],
  '/data-asset': ['data-asset'],
  '/event-linkage': ['disposal-event'],
  '/emergency-plan': ['disposal-plan'],
  '/disposal-record': ['disposal-record'],
  '/shift-manage': ['disposal-shift'],
  '/system-integration': ['system-services'],
  '/reports': ['reports'],
};

const pathToOpenKeys: Record<string, string[]> = {
  '/global-position': ['safety'],
  '/track-replay': ['safety'],
  '/geo-fence': ['safety'],
  '/eeg-monitor': ['safety'],
  '/alarm-disposal': ['safety'],
  '/realtime-monitor': ['video'],
  '/playback-manage': ['video'],
  '/video-manage': ['video'],
  '/device-manage': ['device'],
  '/work-orders': ['device'],
  '/inspection-tasks': ['device'],
  '/data-sync': ['data-gov'],
  '/data-analysis': ['data-gov'],
  '/data-asset': ['data-gov'],
  '/event-linkage': ['disposal'],
  '/emergency-plan': ['disposal'],
  '/disposal-record': ['disposal'],
  '/shift-manage': ['disposal'],
  '/system-integration': ['sub-system'],
  '/reports': ['report-group'],
};

type BreadcrumbMap = Record<string, { parent: string; parentIcon?: React.ReactNode; current: string }>;

const breadcrumbMap: BreadcrumbMap = {
  '/dashboard': { parent: '首页', parentIcon: <HomeOutlined />, current: '首页概览' },
  '/eeg-monitor': { parent: '安全监管', current: '智能矿帽' },
  '/global-position': { parent: '安全监管', current: '实时定位' },
  '/track-replay': { parent: '安全监管', current: '轨迹回放' },
  '/geo-fence': { parent: '安全监管', current: '电子围栏' },
  '/alarm-disposal': { parent: '安全监管', current: '告警管理' },
  '/realtime-monitor': { parent: '视频监控', current: '实时监控' },
  '/playback-manage': { parent: '视频监控', current: '录像回放' },
  '/video-manage': { parent: '视频监控', current: '视频管理' },
  '/device-manage': { parent: '设备运维', current: '设备管理' },
  '/work-orders': { parent: '设备运维', current: '运维工单' },
  '/inspection-tasks': { parent: '设备运维', current: '设备巡检' },
  '/data-sync': { parent: '数据治理', current: '数据同步' },
  '/data-analysis': { parent: '数据治理', current: '数据质量' },
  '/data-asset': { parent: '数据治理', current: '数据资产' },
  '/event-linkage': { parent: '联动处置', current: '事件联动' },
  '/emergency-plan': { parent: '联动处置', current: '应急预案' },
  '/disposal-record': { parent: '联动处置', current: '处置记录' },
  '/shift-manage': { parent: '联动处置', current: '值班管理' },
  '/employee-management': { parent: '系统管理', current: '人员管理' },
  '/system-integration': { parent: '系统管理', current: '智能服务' },
  '/reports': { parent: '工作作业', parentIcon: <CheckSquareOutlined />, current: '作业报告' },
};

const menuKeyToPath: Record<string, string> = {
  '/dashboard': '/dashboard',
  'safety-helmet': '/eeg-monitor',
  'safety-personnel': '/employee-management',
  'safety-position': '/global-position',
  'safety-track': '/track-replay',
  'safety-fence': '/geo-fence',
  'safety-alarm': '/alarm-disposal',
  'video-live': '/realtime-monitor',
  'video-replay': '/playback-manage',
  'video-manage': '/video-manage',
  'device-manage': '/device-manage',
  'device-order': '/work-orders',
  'device-patrol': '/inspection-tasks',
  'data-sync': '/data-sync',
  'data-quality': '/data-analysis',
  'data-asset': '/data-asset',
  'disposal-alarm': '/alarm-disposal',
  'disposal-event': '/event-linkage',
  'disposal-plan': '/emergency-plan',
  'disposal-record': '/disposal-record',
  'disposal-shift': '/shift-manage',
  '/system': '/employee-management',
  'system-services': '/system-integration',
  'reports': '/reports',
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuthStore();

  const lastClickedKeyRef = useRef<string>('');
  const sidebarNavRef = useRef(false);

  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    () => pathToSelectedKeys[location.pathname] || ['/dashboard']
  );

  // Force Menu remount (to apply defaultOpenKeys) only on non-sidebar navigation
  const [menuMountKey, setMenuMountKey] = useState(0);

  // SOS alert state
  const [sosOpen, setSosOpen] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [sosDeviceId, setSosDeviceId] = useState('');
  const sosHandledRef = useRef(false);

  // SOS alarm sound
  const sosAudioCtxRef = useRef<AudioContext | null>(null);
  const sosAlarmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playSosAlarm = () => {
    try {
      const ctx = sosAudioCtxRef.current || new AudioContext();
      sosAudioCtxRef.current = ctx;

      // Slow rising siren: gradual frequency sweep for a calmer alert
      let t = ctx.currentTime + 0.1;
        for (let i = 0; i < 6; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.linearRampToValueAtTime(780, t + 0.6);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 1.0);
          t += 1.2;
        }
    } catch {}
  };

  const stopSosAlarm = () => {
    if (sosAudioCtxRef.current) {
      sosAudioCtxRef.current.close();
      sosAudioCtxRef.current = null;
    }
  };

  useEffect(() => {
    if (sosOpen) {
      playSosAlarm();
      sosAlarmTimerRef.current = setInterval(playSosAlarm, 3000);
    } else {
      if (sosAlarmTimerRef.current) clearInterval(sosAlarmTimerRef.current);
      stopSosAlarm();
    }
    return () => {
      if (sosAlarmTimerRef.current) clearInterval(sosAlarmTimerRef.current);
      stopSosAlarm();
    };
  }, [sosOpen]);

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:9000/ws/demo`;
    let ws: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {};
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'sos') {
            setSosMessage(data.message);
            setSosDeviceId(data.device_id);
            sosHandledRef.current = false;
            setSosOpen(true);
          }
        } catch {}
      };
      ws.onclose = () => { retryTimer = setTimeout(connect, 2000); };
      ws.onerror = () => { ws.close(); };
    };
    connect();
    return () => {
      if (ws) ws.close();
      clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    const clickedKey = lastClickedKeyRef.current;
    if (clickedKey && menuKeyToPath[clickedKey] === location.pathname) {
      setSelectedKeys([clickedKey]);
    } else {
      const newSelected = pathToSelectedKeys[location.pathname] || ['/dashboard'];
      setSelectedKeys(newSelected);
    }
    // Remount Menu on non-sidebar navigation so defaultOpenKeys takes effect
    if (!sidebarNavRef.current) {
      setMenuMountKey(k => k + 1);
    }
    sidebarNavRef.current = false;
  }, [location.pathname]);

  const activeTopNav = useMemo(
    () => pathToTopNav[location.pathname] || 'home',
    [location.pathname],
  );

  const breadcrumb = useMemo(
    () => breadcrumbMap[location.pathname] || { parent: '首页', parentIcon: <HomeOutlined />, current: '首页概览' },
    [location.pathname],
  );

  const handleMenuClick: MenuProps['onClick'] = useCallback(({ key }) => {
    sidebarNavRef.current = true;
    lastClickedKeyRef.current = key;
    const path = menuKeyToPath[key] || '/dashboard';
    navigate(path);
  }, [navigate]);

  const handleTopNavClick = useCallback((path: string) => {
    sidebarNavRef.current = false;
    lastClickedKeyRef.current = '';
    navigate(path);
  }, [navigate]);

  const sidebarItems: MenuItem[] = useMemo(() => [
    getItem('首页概览', '/dashboard', <DashboardOutlined />),
    getItem('安全监管', 'safety', <SafetyOutlined />, [
      getItem('智能矿帽', 'safety-helmet', <SafetyCertificateOutlined />),
      getItem('人员管理', 'safety-personnel', <IdcardOutlined />),
      getItem('实时定位', 'safety-position', <AimOutlined />),
      getItem('轨迹回放', 'safety-track', <HistoryOutlined />),
      getItem('电子围栏', 'safety-fence', <EnvironmentOutlined />),
      getItem('告警管理', 'safety-alarm', <AlertOutlined />),
    ]),
    getItem('视频监控', 'video', <VideoCameraOutlined />, [
      getItem('实时监控', 'video-live', <PlaySquareOutlined />),
      getItem('录像回放', 'video-replay', <HistoryOutlined />),
      getItem('视频管理', 'video-manage', <SettingOutlined />),
    ]),
    getItem('设备运维', 'device', <ToolOutlined />, [
      getItem('设备管理', 'device-manage', <DatabaseOutlined />),
      getItem('运维工单', 'device-order', <FileTextOutlined />),
      getItem('设备巡检', 'device-patrol', <AuditOutlined />),
    ]),
    getItem('数据治理', 'data-gov', <BarChartOutlined />, [
      getItem('数据同步', 'data-sync', <CloudSyncOutlined />),
      getItem('数据质量', 'data-quality', <CheckCircleOutlined />),
      getItem('数据资产', 'data-asset', <GoldOutlined />),
    ]),
    getItem('联动处置', 'disposal', <ThunderboltOutlined />, [
      getItem('告警处置', 'disposal-alarm', <AlertOutlined />),
      getItem('事件联动', 'disposal-event', <SwapOutlined />),
      getItem('应急预案', 'disposal-plan', <FileProtectOutlined />),
      getItem('处置记录', 'disposal-record', <ScheduleOutlined />),
      getItem('值班管理', 'disposal-shift', <FieldTimeOutlined />),
    ]),
    getItem('系统管理', 'sub-system', <SettingOutlined />, [
      getItem('人员管理', '/system', <IdcardOutlined />),
      getItem('智能服务', 'system-services', <ThunderboltOutlined />),
    ]),
    getItem('工作作业', 'report-group', <CheckSquareOutlined />, [
      getItem('作业报告', 'reports', <FileTextOutlined />),
    ]),
  ], []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const userMenu: MenuProps = useMemo(() => ({
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { key: 'democontrol', icon: <ThunderboltOutlined />, label: '演示操控台' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') handleLogout();
      if (key === 'democontrol') window.open('/demo-control', '_blank');
    },
  }), [handleLogout]);

  return (
    <>
      <style>{`
        .main-sidebar.ant-layout-sider {
          background: #F0F2F5 !important;
        }
        .main-sidebar .ant-menu {
          background: #F0F2F5;
          border-inline-end: none !important;
        }
        .main-sidebar .ant-menu-item,
        .main-sidebar .ant-menu-submenu-title {
          margin: 1px 8px !important;
          border-radius: 6px !important;
          width: auto !important;
          height: 40px !important;
          line-height: 40px !important;
          color: #1D2129 !important;
          font-size: 13px !important;
          transition: all 0.2s;
        }
        .main-sidebar .ant-menu-submenu-title .anticon,
        .main-sidebar .ant-menu-item .anticon {
          font-size: 16px !important;
          color: #4E5969 !important;
          transition: color 0.2s;
        }
        .main-sidebar .ant-menu-item:hover,
        .main-sidebar .ant-menu-submenu-title:hover {
          background: #E5E6EB !important;
          color: #1D2129 !important;
        }
        .main-sidebar .ant-menu-item.ant-menu-item-selected,
        .main-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title {
          background: #1890FF !important;
          color: #fff !important;
          border-left: 3px solid #096DD9 !important;
          border-radius: 0 6px 6px 0 !important;
        }
        .main-sidebar .ant-menu-item.ant-menu-item-selected .anticon,
        .main-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title .anticon {
          color: #fff !important;
        }
        .main-sidebar .ant-menu-sub .ant-menu-item {
          padding-left: 52px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 12px !important;
          margin: 1px 8px !important;
          border-radius: 6px !important;
          border-left: none !important;
        }
        .main-sidebar .ant-menu-sub .ant-menu-item:hover {
          background: #E5E6EB !important;
        }
        .main-sidebar .ant-menu-sub .ant-menu-item.ant-menu-item-selected {
          background: #1890FF !important;
          color: #fff !important;
          border-left: 3px solid #096DD9 !important;
          border-radius: 0 6px 6px 0 !important;
        }
        .main-sidebar .ant-menu-sub .ant-menu-item.ant-menu-item-selected .anticon {
          color: #fff !important;
        }
        .main-sidebar .ant-menu-inline .ant-menu-submenu-arrow {
          color: #86909C !important;
          transition: color 0.2s;
        }
        .main-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #fff !important;
        }
        .main-sidebar .ant-menu-submenu-open > .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #4E5969 !important;
        }
        .main-sidebar .ant-menu-sub.ant-menu-inline {
          background: #F0F2F5 !important;
        }
        .sidebar-logo-area {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #E5E6EB;
          background: #F0F2F5;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #1890FF, #0050B3);
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          flex-shrink: 0;
        }
        .sidebar-logo-text {
          font-size: 15px;
          font-weight: 700;
          color: #1D2129;
          white-space: nowrap;
          margin-left: 10px;
          font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }
        .header-left-area {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .header-logo {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #1890FF, #0050B3);
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          flex-shrink: 0;
        }
        .header-brand {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .header-brand-name {
          font-size: 15px;
          font-weight: 700;
          color: #1D2129;
          white-space: nowrap;
          font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }
        .header-brand-sub {
          font-size: 11px;
          color: #86909C;
          white-space: nowrap;
        }
        .top-nav-item {
          cursor: pointer;
          padding: 0 14px;
          height: 64px;
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #4E5969;
          position: relative;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .top-nav-item:hover {
          color: #1890FF;
        }
        .top-nav-item.active {
          color: #1890FF;
          font-weight: 600;
        }
        .top-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 14px;
          right: 14px;
          height: 3px;
          background: #1890FF;
          border-radius: 3px 3px 0 0;
        }
        .header-right-icon {
          font-size: 18px;
          cursor: pointer;
          color: #4E5969;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .header-right-icon:hover {
          background: #F0F2F5;
          color: #1890FF;
        }
        .main-content-area {
          margin: 16px;
          padding: 16px;
          background: #F0F2F5;
          overflow: auto;
          min-height: 0;
          flex: 1;
        }
      `}</style>

      <Layout style={{ height: '100vh' }}>
        <Sider
          className="main-sidebar"
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          collapsedWidth={64}
          style={{
            borderRight: '1px solid #E5E6EB',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="sidebar-logo-area">
            {!collapsed && (
              <>
                <div className="sidebar-logo-icon">
                  <SafetyCertificateOutlined style={{ fontSize: 18, color: '#fff' }} />
                </div>
                <span className="sidebar-logo-text">辰尧智算·矿域云控</span>
              </>
            )}
            {collapsed && (
              <SafetyCertificateOutlined style={{ fontSize: 22, color: '#1890FF' }} />
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          theme="light"
          key={menuMountKey}
          selectedKeys={selectedKeys}
          defaultOpenKeys={pathToOpenKeys[location.pathname]}
          items={sidebarItems}
          onClick={handleMenuClick}
          style={{ borderInlineEnd: 'none' }}
          inlineIndent={20}
        />
          </div>
          <div style={{
            padding: collapsed ? '12px 8px' : '12px 16px',
            borderTop: '1px solid #E5E6EB',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#86909C',
            fontSize: 14,
            transition: 'color 0.2s',
          }}
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#1890FF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = '#86909C'; }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Sider>

        <Layout style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Header style={{
            background: '#fff',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            height: 64,
            borderBottom: '1px solid #E5E6EB',
            flexShrink: 0,
            gap: 0,
          }}>
            <div className="header-left-area">
              <div className="header-logo">
                <SafetyCertificateOutlined style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <div className="header-brand">
                <span className="header-brand-name">辰尧智算·矿域云控</span>
                <span className="header-brand-sub">矿山安全智能管理平台</span>
              </div>
              <Select
                defaultValue="mineA"
                size="small"
                style={{ width: 130, marginLeft: 16 }}
                options={[
                  { value: 'mineA', label: '示例矿区A' },
                  { value: 'mineB', label: '示例矿区B' },
                  { value: 'mineC', label: '示例矿区C' },
                ]}
              />
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              overflow: 'hidden',
            }}>
              {topNavItems.map((item) => (
                <div
                  key={item.key}
                  className={`top-nav-item ${activeTopNav === item.key ? 'active' : ''}`}
                  onClick={() => handleTopNavClick(item.path)}
                >
                  {item.label}
                </div>
              ))}
            </div>

            <Space size={4} style={{ flexShrink: 0, alignItems: 'center' }}>
              <div className="header-right-icon" title="搜索">
                <SearchOutlined />
              </div>
              <Badge count={12} size="small" offset={[-2, 4]}>
                <div className="header-right-icon" title="消息通知">
                  <BellOutlined />
                </div>
              </Badge>
              <div className="header-right-icon" title="帮助">
                <QuestionCircleOutlined />
              </div>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 8,
                  marginLeft: 4,
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = '#F0F2F5';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <Avatar
                    size={30}
                    icon={<UserOutlined />}
                    style={{ background: '#1890FF', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: '#1D2129', whiteSpace: 'nowrap' }}>
                    {username || 'admin'}
                  </span>
                  <DownOutlined style={{ fontSize: 10, color: '#86909C' }} />
                </Space>
              </Dropdown>
            </Space>
          </Header>

          <div style={{
            background: '#fff',
            padding: '10px 24px',
            borderBottom: '1px solid #E5E6EB',
            flexShrink: 0,
          }}>
            <Breadcrumb
              items={[
                { title: <Space size={4}>{breadcrumb.parentIcon}{breadcrumb.parent}</Space> },
                { title: breadcrumb.current },
              ]}
            />
          </div>

          <Content className="main-content-area">
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      <Modal
        title={null}
        open={sosOpen}
        closable={true}
        onCancel={() => { setSosOpen(false); sosHandledRef.current = true; }}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        styles={{
          body: {
            padding: 0,
            background: 'linear-gradient(135deg, #2d0000 0%, #8b0000 50%, #1a0000 100%)',
          },
        }}
        centered
        destroyOnClose
      >
        <style>{`
          .sos-overlay {
            padding: 60px 40px;
            text-align: center;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
          }
          .sos-icon-area {
            margin-bottom: 24px;
          }
          .sos-icon-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: radial-gradient(circle, #ff4d4f, #cf1322);
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: sos-pop 0.8s ease-in-out infinite alternate;
            box-shadow: 0 0 60px rgba(255,0,0,0.6), 0 0 120px rgba(255,0,0,0.3);
          }
          @keyframes sos-pop {
            0% { transform: scale(1); box-shadow: 0 0 60px rgba(255,0,0,0.6); }
            100% { transform: scale(1.08); box-shadow: 0 0 100px rgba(255,0,0,0.9); }
          }
          .sos-icon-text {
            font-size: 64px;
            line-height: 1;
          }
          .sos-title {
            font-size: 36px;
            font-weight: 800;
            color: #fff;
            margin-bottom: 12px;
            text-shadow: 0 0 20px rgba(255,0,0,0.6);
            animation: sos-blink 0.6s ease-in-out infinite alternate;
          }
          @keyframes sos-blink {
            0% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .sos-subtitle {
            font-size: 18px;
            color: rgba(255,255,255,0.85);
            margin-bottom: 8px;
          }
          .sos-device {
            font-size: 24px;
            font-weight: 700;
            color: #ffd666;
            margin-bottom: 32px;
            padding: 8px 24px;
            background: rgba(255,255,255,0.08);
            border-radius: 8px;
            display: inline-block;
          }
          .sos-actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .sos-btn-handle {
            height: 52px;
            padding: 0 40px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 10px;
            border: none;
          }
          .sos-btn-resolve {
            background: linear-gradient(135deg, #52c41a, #389e0d);
            color: #fff;
          }
          .sos-btn-resolve:hover {
            background: linear-gradient(135deg, #73d13d, #52c41a) !important;
          }
          .sos-btn-dismiss {
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            border: 1px solid rgba(255,255,255,0.2) !important;
          }
          .sos-btn-dismiss:hover {
            background: rgba(255,255,255,0.2) !important;
          }
        `}</style>
        <div className="sos-overlay">
          <div className="sos-icon-area">
            <div className="sos-icon-circle">
              <span className="sos-icon-text">🆘</span>
            </div>
          </div>
          <div className="sos-title">⚠ 紧急告警 ⚠</div>
          <div className="sos-subtitle">{sosMessage}</div>
          <div className="sos-device">设备：{sosDeviceId}</div>
          <div className="sos-actions">
            <Button
              className="sos-btn-handle sos-btn-resolve"
              size="large"
              onClick={() => {
                setSosOpen(false);
                sosHandledRef.current = true;
              }}
            >
              ✓ 确认处置
            </Button>
            <Button
              className="sos-btn-handle sos-btn-dismiss"
              size="large"
              onClick={() => {
                setSosOpen(false);
                sosHandledRef.current = true;
              }}
            >
              稍后处理
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CheckCircleOutlined() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
      <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z" />
      </svg>
    </span>
  );
}
