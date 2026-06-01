import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Row, Col, Card, Table, Tag, Button, Space, Typography, Form, Input, InputNumber,
  message, Statistic, Empty, Tabs, Modal, Popconfirm, Select, Descriptions, Image, TimePicker, Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import Hls from 'hls.js';
import {
  ApiOutlined, SyncOutlined, ReloadOutlined, PlayCircleOutlined,
  SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  VideoCameraOutlined, HistoryOutlined, EnvironmentOutlined,
  StopOutlined, PhoneOutlined, SoundOutlined, LinkOutlined, CameraOutlined,
  EyeOutlined, RightOutlined,
} from '@ant-design/icons';
import {
  getDeviceList, getDevice, updateDevice, getDeviceFiles, deleteFile,
  getAlarmList, updateAlarm, getFenceList, createFence, updateFence, deleteFence,
  getTrackHistory, createTalkGroup, deleteTalkGroup, findTalkGroups, sendTalkCommand,
  streamStart, streamStop, getTalkWsUrl,
  getUserInfo, changePassword, getUserDevices,
} from '../api';
import TrackMapSvg from '../components/TrackMapSvg';

const { Text } = Typography;

const CSS = `
.svc-root { display: flex; flex-direction: column; gap: 0; }
.svc-root .ant-tabs-nav { margin-bottom: 12px; background: #fff; padding: 0 16px; border-radius: 8px; }
.svc-card { border-radius: 8px; }
.svc-section-desc { color: #86909C; font-size: 13px; margin-bottom: 12px; }
.svc-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; flex-wrap: wrap; gap: 8px; }
.svc-photo-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; }
.svc-photo-item { width: 120px; cursor: pointer; }
.svc-photo-item img { width: 120px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #F0F0F0; }
.svc-photo-item:hover img { border-color: #1890FF; }
`;

export default function SystemIntegration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDeviceId = searchParams.get('deviceId') || '';
  const [activeTab, setActiveTab] = useState(initialDeviceId ? 'devices' : 'devices');
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesTotal, setDevicesTotal] = useState(0);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devKeyword, setDevKeyword] = useState('');
  const [realDeviceIds, setRealDeviceIds] = useState<Set<string>>(new Set());
  const [deviceFiles, setDeviceFiles] = useState<any[]>([]);
  const [filesModal, setFilesModal] = useState(false);
  const [filesDevId, setFilesDevId] = useState('');
  const [filesLoading, setFilesLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [alarms, setAlarms] = useState<any[]>([]);
  const [alarmsTotal, setAlarmsTotal] = useState(0);
  const [alarmsLoading, setAlarmsLoading] = useState(false);
  const [alarmKeyword, setAlarmKeyword] = useState('');
  const [alarmLevel, setAlarmLevel] = useState<string | undefined>();
  const [fences, setFences] = useState<any[]>([]);
  const [fencesLoading, setFencesLoading] = useState(false);
  const [fenceModal, setFenceModal] = useState(false);
  const [editingFence, setEditingFence] = useState<any>(null);
  const [fenceForm] = Form.useForm();
  const [trackDeviceId, setTrackDeviceId] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [talkGroups, setTalkGroups] = useState<any[]>([]);
  const [talkLoading, setTalkLoading] = useState(false);
  const [talkSearch, setTalkSearch] = useState('');
  const [streamSerial, setStreamSerial] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamResult, setStreamResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [talkUrl, setTalkUrl] = useState<any>(null);
  const [talkConnected, setTalkConnected] = useState(false);
  const [talkConnecting, setTalkConnecting] = useState(false);
  const [talkSpeaking, setTalkSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // User info
  const [userInfo, setUserInfo] = useState<any>(null);
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdForm] = Form.useForm();
  // Device detail
  const [devDetail, setDevDetail] = useState<any>(null);
  const [devDetailModal, setDevDetailModal] = useState(false);
  const [devEditForm] = Form.useForm();

  const loadUserInfo = useCallback(async () => {
    try { const r = await getUserInfo(); setUserInfo(r.data?.data || r.data); } catch { setUserInfo(null); }
  }, []);
  const handleChangePwd = async () => {
    const v = pwdForm.getFieldsValue();
    try { await changePassword(userInfo?.username || 'mnsf', v.password); message.success('密码已修改'); setPwdModal(false); } catch { message.error('修改失败'); }
  };
  const showDeviceDetail = async (devId: string) => {
    try { const r = await getDevice(parseInt(devId) || 0); const d = r.data?.data || r.data; setDevDetail(d); devEditForm.setFieldsValue({ deviceName: d.deviceName || d.device_name }); setDevDetailModal(true); }
    catch { try { const r2 = await getDeviceList({ device_id: devId, is_page: true, page_size: 1 }); const items = r2.data?.data?.items || []; if (items[0]) { setDevDetail(items[0]); devEditForm.setFieldsValue({ deviceName: items[0].deviceName }); setDevDetailModal(true); } else { message.warning('设备不存在'); } } catch { message.error('获取失败'); } }
  };
  const handleUpdateDevice = async () => {
    const v = devEditForm.getFieldsValue();
    try { await updateDevice(devDetail.id || devDetail.deviceId, v); message.success('已更新'); setDevDetailModal(false); loadDevices(); } catch { message.error('更新失败'); }
  };

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true);
    try { const r = await getDeviceList({ is_page: true, page_index: 1, page_size: 50, device_name: devKeyword || undefined }); const d = r.data?.data || {}; setDevices(d.items || []); setDevicesTotal(d.total || 0); } catch { setDevices([]); } finally { setDevicesLoading(false); }
  }, [devKeyword]);
  const showDeviceFiles = async (devId: string) => {
    setFilesDevId(devId); setFilesModal(true); setFilesLoading(true);
    try { const r = await getDeviceFiles({ device_id: devId, type: 'photo' }); setDeviceFiles(r.data?.data?.list || []); } catch { setDeviceFiles([]); } finally { setFilesLoading(false); }
  };
  const handleDeleteFile = async (path: string) => { try { await deleteFile(path); message.success('已删除'); showDeviceFiles(filesDevId); } catch { message.error('删除失败'); } };
  const loadAlarms = useCallback(async () => {
    setAlarmsLoading(true);
    try { const r = await getAlarmList({ is_page: true, page_index: 1, page_size: 50, level: alarmLevel || undefined, device_name: alarmKeyword || undefined }); const d = r.data?.data || {}; setAlarms(d.items || []); setAlarmsTotal(d.total || 0); } catch { setAlarms([]); } finally { setAlarmsLoading(false); }
  }, [alarmKeyword, alarmLevel]);
  const handleDisposeAlarm = async (id: number) => { try { await updateAlarm(id, { handled: 'true', remark: '已处置' }); message.success('已处置'); loadAlarms(); } catch { message.error('处置失败'); } };
  const loadFences = useCallback(async () => {
    setFencesLoading(true);
    try { const r = await getFenceList({ is_page: true, page_index: 1, page_size: 50 }); const d = r.data?.data || {}; setFences(d.items || []); } catch { setFences([]); } finally { setFencesLoading(false); }
  }, []);
  const openFenceCreate = () => { setEditingFence(null); fenceForm.resetFields(); fenceForm.setFieldsValue({ fenceShape: 'Circle', eventType: 11, startTimeStr: dayjs('00:00', 'HH:mm'), endTimeStr: dayjs('23:59', 'HH:mm') }); setFenceModal(true); };
  const openFenceEdit = (f: any) => { setEditingFence(f); fenceForm.setFieldsValue({ fenceName: f.fenceName || f.fence_name, startTimeStr: dayjs(f.startTimeStr || f.start_time_str || '00:00', 'HH:mm'), endTimeStr: dayjs(f.endTimeStr || f.end_time_str || '23:59', 'HH:mm'), eventType: f.eventType || f.event_type || 11, deviceIndexIds: f.deviceIndexIds || f.device_index_ids || [], fenceShape: f.fenceShape || f.fence_shape || 'Circle' }); setFenceModal(true); };
  const handleFenceSave = async () => {
    const v = fenceForm.getFieldsValue(); const body: any = { fenceName: v.fenceName, startTimeStr: v.startTimeStr ? v.startTimeStr.format('HH:mm') : '00:00', endTimeStr: v.endTimeStr ? v.endTimeStr.format('HH:mm') : '23:59', eventType: v.eventType, deviceIndexIds: Array.isArray(v.deviceIndexIds) ? v.deviceIndexIds : (v.deviceIndexIds || '').toString().split(',').filter(Boolean).map(Number), fenceShape: v.fenceShape };
    if (v.fenceShape === 'Circle') body.circleFenceData = { radius: 100, center: { longitude: '0', latitude: '0' } }; else body.polygonFenceData = [{ longitude: '0', latitude: '0' }, { longitude: '1', latitude: '1' }];
    try { if (editingFence) { await updateFence(editingFence.id, body); message.success('已更新'); } else { await createFence(body); message.success('已创建'); } setFenceModal(false); loadFences(); } catch (e: any) { message.error(e?.response?.data?.detail || e?.response?.data?.msg || '操作失败'); }
  };
  const handleDeleteFence = async (id: number) => { try { await deleteFence(id); message.success('已删除'); loadFences(); } catch { message.error('删除失败'); } };
  const loadTracks = async () => { if (!trackDeviceId) return message.warning('请选择设备'); setTracksLoading(true); try { const now = Math.floor(Date.now() / 1000); const weekAgo = now - 7 * 86400; const r = await getTrackHistory({ device_id: trackDeviceId, start_time: weekAgo, end_time: now }); setTracks(Array.isArray(r.data?.data) ? r.data.data : r.data?.data?.items || []); } catch { setTracks([]); } finally { setTracksLoading(false); } };
  const loadTalkGroups = async () => { setTalkLoading(true); try { const r = await findTalkGroups(talkSearch || 'all'); setTalkGroups(r.data?.data || []); } catch { setTalkGroups([]); } finally { setTalkLoading(false); } };
  const handleCreateTalkGroup = async () => { try { await createTalkGroup({ groupName: `Group-${Date.now()}` }); message.success('已创建'); loadTalkGroups(); } catch { message.error('创建失败'); } };
  const handleDeleteTalkGroup = async (id: number) => { try { await deleteTalkGroup(id); message.success('已删除'); loadTalkGroups(); } catch { message.error('删除失败'); } };
  const handleSendTalkCmd = async (groupId: number, cmd: string) => { try { await sendTalkCommand({ groupId, command: cmd }); message.success('已发送'); } catch { message.error('发送失败'); } };
  const handleStreamStart = async () => { try { const r = await streamStart({ serial: streamSerial }); setStreamResult(r.data); setStreaming(true); } catch { message.error('推流失败'); } };
  const handleStreamStop = async () => {
    try { await streamStop({ serial: streamSerial }); } catch {}
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setStreaming(false);
    setStreamResult(null);
  };

  useEffect(() => {
    if (streaming && streamResult?.HLS && videoRef.current) {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamResult.HLS);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, () => {});
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamResult.HLS;
        video.play().catch(() => {});
      }
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [streaming, streamResult?.HLS]);
  const handleGetTalkUrl = async () => { try { const r = await getTalkWsUrl({ serial: streamSerial || devices[0]?.deviceId || 'D-1001', format: 'pcm' }); setTalkUrl(r.data?.data || null); } catch { message.error('获取URL失败'); } };

  const handleTalkConnect = async () => {
    if (!talkUrl) return message.warning('请先获取中继URL');
    setTalkConnecting(true);
    try {
      const tokenParam = localStorage.getItem('token') ? `&token=${encodeURIComponent(localStorage.getItem('token')!)}` : '';
      const ws = new WebSocket(`ws://${window.location.host}/ws/talk-relay?serial=${encodeURIComponent(talkUrl.serial)}&code=${encodeURIComponent(talkUrl.code)}${tokenParam}&format=${encodeURIComponent(talkUrl.format || 'pcm')}`);
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => { setTalkConnected(true); setTalkConnecting(false); message.success('已连接'); };
      ws.onclose = () => { setTalkConnected(false); setTalkConnecting(false); cleanupAudio(); };
      ws.onerror = () => { setTalkConnected(false); setTalkConnecting(false); cleanupAudio(); message.error('连接失败'); };
      ws.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer && audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          ctx.decodeAudioData(e.data.slice(0), (buf) => { const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(); }, () => {});
        }
      };
      wsRef.current = ws;
    } catch { setTalkConnecting(false); message.error('连接失败'); }
  };

  const handleTalkDisconnect = () => {
    cleanupAudio();
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setTalkConnected(false);
    setTalkSpeaking(false);
  };

  const cleanupAudio = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  };

  const procRef = useRef<ScriptProcessorNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const handleStartSpeaking = async () => {
    try {
      if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 8000, channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate: 8000 });
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      srcRef.current = source;
      const processor = ctx.createScriptProcessor(1024, 1, 1);
      procRef.current = processor;
      source.connect(processor);
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
        wsRef.current.send(pcm.buffer);
      };
      setTalkSpeaking(true);
    } catch { message.error('麦克风访问失败'); }
  };

  const handleStopSpeaking = () => {
    if (procRef.current) { try { procRef.current.disconnect(); } catch {} procRef.current = null; }
    if (srcRef.current) { try { srcRef.current.disconnect(); } catch {} srcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setTalkSpeaking(false);
  };

  const handleTtsSpeak = () => {
    if (!textInput.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return message.warning('请先连接');
    // Local preview via browser TTS
    const utterance = new SpeechSynthesisUtterance(textInput.trim());
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    speechSynthesis.speak(utterance);
    // Send text frame through WebSocket relay to device
    wsRef.current.send(JSON.stringify({ type: 'tts', text: textInput.trim() }));
    message.success('语音已发送');
    setTextInput('');
  };

  useEffect(() => { loadDevices(); loadAlarms(); loadFences(); loadRealDevices(); return () => { if (wsRef.current) wsRef.current.close(); cleanupAudio(); }; }, []);

  const devOptions = devices.map(d => ({ value: d.deviceId, label: `${d.deviceId} (${d.deviceName})` }));

  const loadRealDevices = useCallback(async () => {
    try {
      const r = await getUserDevices();
      const data = r.data?.data || r.data || {};
      const groups = data.groups || [];
      const ids = new Set<string>();
      for (const g of groups) {
        for (const d of (g.devices || [])) {
          const did = d.deviceId || d.device_id;
          if (did) ids.add(String(did));
        }
      }
      setRealDeviceIds(ids);
    } catch { setRealDeviceIds(new Set()); }
  }, []);

  const isRealDevice = useCallback((deviceId: string) => realDeviceIds.has(deviceId), [realDeviceIds]);

  const handleNavDevice = (deviceId: string) => {
    navigate(`/device-manage/${deviceId}`);
  };

  const devColumns = [
    { title: '设备ID', dataIndex: 'deviceId', width: 180, render: (v: string) => <Text copyable style={{ fontSize: 12 }}>{v}</Text> },
    { title: '名称', dataIndex: 'deviceName', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => v === 'Online' ? <Tag color="green">在线</Tag> : <Tag color="red">离线</Tag> },
    { title: '经度', dataIndex: 'longitude', width: 90 },
    { title: '纬度', dataIndex: 'latitude', width: 90 },
    { title: '来源', width: 80, render: (_: any, r: any) => isRealDevice(r.deviceId) ? <Tag color="blue">实时</Tag> : <Tag color="default">缓存</Tag> },
    { title: '操作', width: 200, render: (_: any, r: any) => (
      <Space size={0}>
        {isRealDevice(r.deviceId) ? (
          <Tooltip title="查看详情页面">
            <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => handleNavDevice(r.deviceId)}>详情</Button>
          </Tooltip>
        ) : (
          <Button size="small" onClick={() => showDeviceDetail(r.deviceId)}>详情</Button>
        )}
        <Button size="small" icon={<CameraOutlined />} onClick={() => showDeviceFiles(r.deviceId)}>照片</Button>
      </Space>
    )},
  ];
  const alarmColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '告警名称', dataIndex: 'alarmName', width: 180, render: (v: string, r: any) => v || r.alarm_name || r.alarm_type || '-' },
    { title: '设备', dataIndex: 'deviceName', width: 120, render: (v: string, r: any) => v || r.device_name || r.deviceId || '-' },
    { title: '等级', dataIndex: 'level', width: 80, render: (v: string) => <Tag color={v === 'critical' ? 'red' : v === 'warning' ? 'orange' : 'blue'}>{v || '-'}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => v === 'disposed' || v === '已处置' || v === 'Handled' ? <Tag color="green">已处置</Tag> : <Tag color="red">待处理</Tag> },
    { title: '处置', width: 80, render: (_: any, r: any) => (r.status !== 'disposed' && r.status !== '已处置' && r.status !== 'Handled') ? <Button size="small" type="primary" onClick={() => handleDisposeAlarm(r.id)}>处置</Button> : null },
  ];
  const fenceColumns = [
    { title: '名称', dataIndex: 'fenceName', width: 160, render: (v: string, r: any) => v || r.fence_name || '-' },
    { title: '形状', dataIndex: 'fenceShape', width: 80, render: (v: string, r: any) => v || r.fence_shape || '-' },
    { title: '事件', dataIndex: 'eventType', width: 100, render: (v: number, r: any) => (v || r.event_type) === 11 ? '禁止离开' : '禁止进入' },
    { title: '操作', width: 180, render: (_: any, r: any) => <Space size={0}><Button size="small" icon={<EditOutlined />} onClick={() => openFenceEdit(r)} /> <Popconfirm title="确认删除?" onConfirm={() => handleDeleteFence(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
  ];
  const trackColumns = [
    { title: '经度', dataIndex: 'longitude', width: 100 },
    { title: '纬度', dataIndex: 'latitude', width: 100 },
    { title: '时间', dataIndex: 'recordedAt', width: 170, render: (v: any) => v ? new Date(typeof v === 'string' ? v : v * 1000).toLocaleString() : '-' },
    { title: '事件', dataIndex: 'eventCode', width: 80 },
  ];
  const talkColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'groupName', width: 180, render: (v: string, r: any) => v || r.group_name || '-' },
    { title: '操作', width: 260, render: (_: any, r: any) => <Space size={0}><Button size="small" onClick={() => handleSendTalkCmd(r.id, '8010')}>广播</Button><Button size="small" onClick={() => handleSendTalkCmd(r.id, '8014')}>对讲</Button><Popconfirm title="确认删除?" onConfirm={() => handleDeleteTalkGroup(r.id)}><Button size="small" danger onClick={() => message.warning('确认删除该设备？')}>删除</Button></Popconfirm></Space> },
  ];

  const tabItems = [
    {
      key: 'devices', label: `设备 (${devicesTotal})`, children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card className="svc-card" title="设备列表" extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadDevices}>刷新</Button>}>
            <div className="svc-toolbar"><Input.Search placeholder="搜索设备" value={devKeyword} onChange={e => setDevKeyword(e.target.value)} onSearch={loadDevices} style={{ width: 240 }} allowClear /></div>
            <Table columns={devColumns} dataSource={devices} rowKey="deviceId" loading={devicesLoading} size="small" pagination={{ pageSize: 20, total: devicesTotal }} locale={{ emptyText: <Empty description="暂无设备" /> }} scroll={{ x: 660 }} rowClassName={(r) => r.deviceId === initialDeviceId ? 'ant-table-row-selected' : ''} />
          </Card>
          <Modal title={`设备照片 [${filesDevId}]`} open={filesModal} onCancel={() => setFilesModal(false)} footer={null} width={800}>
            {filesLoading ? <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div> : deviceFiles.length === 0 ? <Empty description="暂无照片" /> : (
              <div className="svc-photo-grid">
                {deviceFiles.map((f: any) => (
                  <div key={f.path} className="svc-photo-item" onClick={() => { setPreviewSrc(f.presignedURL); setPreviewVisible(true); }}>
                    <img src={f.presignedURL} alt={f.name} />
                    <div style={{ fontSize: 10, color: '#1D2129', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: 120 }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: '#86909C', textAlign: 'center' }}>{f.lastModified ? dayjs(f.lastModified).format('MM-DD HH:mm') : ''}</div>
                    <div style={{ fontSize: 10, color: '#C0C4CC', textAlign: 'center' }}>{f.size ? `${(f.size / 1024).toFixed(0)}KB` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
          <Image style={{ display: 'none' }} preview={{ open: previewVisible, src: previewSrc, onOpenChange: v => setPreviewVisible(v) }} />
          <Modal title="设备详情" open={devDetailModal} onCancel={() => setDevDetailModal(false)} footer={null} width={500}>
            {devDetail ? (
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="设备ID">{devDetail.deviceId || devDetail.device_id}</Descriptions.Item>
                <Descriptions.Item label="名称">{devDetail.deviceName || devDetail.device_name}</Descriptions.Item>
                <Descriptions.Item label="状态">{devDetail.status}</Descriptions.Item>
                <Descriptions.Item label="经度">{devDetail.longitude}</Descriptions.Item>
                <Descriptions.Item label="纬度">{devDetail.latitude}</Descriptions.Item>
                <Descriptions.Item label="产品">{devDetail.productName || devDetail.product_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="编辑"><Form form={devEditForm} layout="inline"><Form.Item name="deviceName"><Input style={{ width: 160 }} /></Form.Item><Button type="primary" size="small" onClick={handleUpdateDevice}>保存</Button></Form></Descriptions.Item>
              </Descriptions>
            ) : <Empty />}
          </Modal>
        </div>
      ),
    },
    {
      key: 'alarms', label: `告警 (${alarmsTotal})`, children: (
        <Card className="svc-card" title="告警列表" extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadAlarms}>刷新</Button>}>
          <div className="svc-toolbar"><Space><Input.Search placeholder="搜索设备" value={alarmKeyword} onChange={e => setAlarmKeyword(e.target.value)} onSearch={loadAlarms} style={{ width: 200 }} allowClear /><Select placeholder="等级" value={alarmLevel} onChange={v => setAlarmLevel(v)} allowClear style={{ width: 100 }} options={[{ value: 'critical', label: '紧急' }, { value: 'warning', label: '预警' }, { value: 'info', label: '提示' }]} /></Space></div>
          <Table columns={alarmColumns} dataSource={alarms} rowKey="id" loading={alarmsLoading} size="small" pagination={{ pageSize: 20, total: alarmsTotal }} locale={{ emptyText: <Empty description="暂无告警" /> }} scroll={{ x: 620 }} />
        </Card>
      ),
    },
    {
      key: 'fences', label: '围栏', children: (
        <Card className="svc-card" title="电子围栏" extra={<Space><Button type="primary" size="small" icon={<PlusOutlined />} onClick={openFenceCreate}>新增</Button><Button size="small" icon={<ReloadOutlined />} onClick={loadFences}>刷新</Button></Space>}>
          <Table columns={fenceColumns} dataSource={fences} rowKey="id" loading={fencesLoading} size="small" pagination={false} locale={{ emptyText: <Empty description="暂无围栏，点击新增" /> }} />
          <Modal title={editingFence ? '编辑围栏' : '新增围栏'} open={fenceModal} onOk={handleFenceSave} onCancel={() => setFenceModal(false)}>
            <Form form={fenceForm} layout="vertical"><Form.Item label="名称" name="fenceName" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="形状" name="fenceShape"><Select options={[{ value: 'Circle', label: '圆形' }, { value: 'Polygon', label: '多边形' }]} /></Form.Item><Form.Item label="事件类型" name="eventType"><Select options={[{ value: 11, label: '禁止离开' }, { value: 12, label: '禁止进入' }]} /></Form.Item><Form.Item label="开始时间" name="startTimeStr"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item><Form.Item label="结束时间" name="endTimeStr"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item><Form.Item label="关联设备" name="deviceIndexIds"><Select mode="multiple" placeholder="选择设备" options={devices.map(d => ({ value: d.id, label: `${d.deviceId} (${d.deviceName})` }))} /></Form.Item></Form>
          </Modal>
        </Card>
      ),
    },
    {
      key: 'tracks', label: '轨迹', children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card className="svc-card" title="轨迹地图" styles={{ body: { padding: 0 } }}>
            <div style={{ height: 380, position: 'relative' }}>
              {tracks.length > 0 ? (
                <TrackMapSvg width="100%" height="100%" data={tracks} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C', fontSize: 14 }}>
                  选择设备查询轨迹
                </div>
              )}
            </div>
          </Card>
          <Card className="svc-card" title="历史轨迹">
            <div className="svc-toolbar"><Space>
              <Select placeholder="选择设备" value={trackDeviceId || undefined} onChange={v => setTrackDeviceId(v)} style={{ width: 280 }} options={devOptions} showSearch filterOption={(inp, opt) => (opt?.label as string || '').toLowerCase().includes(inp.toLowerCase())} />
              <Button type="primary" icon={<SearchOutlined />} onClick={loadTracks} loading={tracksLoading}>查询</Button>
            </Space></div>
            <Table columns={trackColumns} dataSource={tracks} rowKey={(r: any, i?: number) => `${r.longitude}-${r.latitude}-${r.recordedAt ?? Date.now()}-${i ?? 0}`} loading={tracksLoading} size="small" pagination={{ pageSize: 50 }} locale={{ emptyText: <Empty description="选择设备查询" /> }} scroll={{ x: 480 }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'talk', label: '对讲', children: (
        <Card className="svc-card" title="对讲分组" extra={<Space><Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreateTalkGroup}>新增</Button><Button size="small" icon={<ReloadOutlined />} onClick={loadTalkGroups}>刷新</Button></Space>}>
          <div className="svc-toolbar"><Input.Search placeholder="搜索分组" value={talkSearch} onChange={e => setTalkSearch(e.target.value)} onSearch={loadTalkGroups} style={{ width: 240 }} allowClear /></div>
          <Table columns={talkColumns} dataSource={talkGroups} rowKey="id" loading={talkLoading} size="small" pagination={false} locale={{ emptyText: <Empty description="暂无分组" /> }} />
        </Card>
      ),
    },
    {
      key: 'stream', label: '推流', children: (
        <Card className="svc-card" title="视频推流">
          <div className="svc-section-desc">选择设备，启动/停止视频推流。设备在线时显示实时画面。</div>
          <Space style={{ marginBottom: 12 }}>
            <Select placeholder="选择设备" value={streamSerial || undefined} onChange={v => setStreamSerial(v)} style={{ width: 280 }} options={devOptions} showSearch filterOption={(inp, opt) => (opt?.label as string || '').toLowerCase().includes(inp.toLowerCase())} />
            {!streaming ? <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStreamStart}>开始推流</Button> : <Button danger icon={<StopOutlined />} onClick={handleStreamStop}>停止推流</Button>}
          </Space>
          {streaming ? (
            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
              <video ref={videoRef} style={{ width: '100%', height: 360, background: '#000' }} controls autoPlay muted />
              {streamResult && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>
                  {streamResult.StreamID} | {streamResult.Transport || 'TCP'}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 8, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C' }}>
              <Space direction="vertical" align="center">
                <VideoCameraOutlined style={{ fontSize: 48, color: '#C0C4CC' }} />
                <span>选择设备后点击「开始推流」</span>
                <Text type="secondary" style={{ fontSize: 12 }}>设备需为在线状态</Text>
              </Space>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'talkrelay', label: '语音', children: (
        <Card className="svc-card" title="WebSocket 语音喊话">
          <div className="svc-section-desc">选择设备，连接到 WebSocket 中继进行实时语音通话。</div>
          <Space style={{ marginBottom: 12 }}>
            <Select placeholder="选择设备" value={streamSerial || undefined} onChange={v => setStreamSerial(v)} style={{ width: 280 }} options={devOptions} showSearch filterOption={(inp, opt) => (opt?.label as string || '').toLowerCase().includes(inp.toLowerCase())} />
            <Button icon={<LinkOutlined />} onClick={handleGetTalkUrl}>获取URL</Button>
            {talkUrl && !talkConnected && (
              <Button type="primary" icon={<PhoneOutlined />} loading={talkConnecting} onClick={handleTalkConnect}>连接</Button>
            )}
            {talkConnected && (
              <Button danger onClick={handleTalkDisconnect}>断开</Button>
            )}
          </Space>
          <div style={{ background: talkConnected ? (talkSpeaking ? '#FFF7E6' : '#F6FFED') : '#FAFAFA', borderRadius: 8, padding: 24, textAlign: 'center', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, transition: 'all 0.3s' }}>
            {talkConnected ? (
              <>
                <div style={{ fontSize: 48, color: talkSpeaking ? '#FA8C16' : '#52C41A' }}>
                  <PhoneOutlined style={{ animation: talkSpeaking ? 'pulse 1s infinite' : 'none' }} />
                </div>
                <div>
                  <Tag color="green">已连接</Tag>
                  <Tag color={talkSpeaking ? 'orange' : 'default'}>{talkSpeaking ? '讲话中' : '就绪'}</Tag>
                </div>
                {!talkSpeaking ? (
                  <Button type="primary" size="large" icon={<SoundOutlined />} onClick={handleStartSpeaking} style={{ borderRadius: 20, height: 44, paddingInline: 32 }}>按住讲话</Button>
                ) : (
                  <Button danger size="large" onClick={handleStopSpeaking} style={{ borderRadius: 20, height: 44, paddingInline: 32 }}>松开发送</Button>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>{talkUrl?.serial} → {talkUrl?.remoteUrl?.split('/').pop()}</Text>
                <div style={{ width: '100%', maxWidth: 400, marginTop: 8 }}>
                  <Input.Search
                    placeholder="输入文字，发送语音播报..."
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onSearch={handleTtsSpeak}
                    enterButton={<Space><SoundOutlined />发送语音</Space>}
                    disabled={!talkConnected}
                  />
                </div>
              </>
            ) : talkConnecting ? (
              <Space direction="vertical" align="center">
                <SoundOutlined style={{ fontSize: 48, color: '#1890FF' }} spin />
                <Text type="secondary">连接中...</Text>
              </Space>
            ) : talkUrl ? (
              <Space direction="vertical" align="center">
                <SoundOutlined style={{ fontSize: 48, color: '#52C41A' }} />
                <Text>中继 URL 已获取</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>点击「连接」开始通话</Text>
              </Space>
            ) : (
              <Space direction="vertical" align="center">
                <SoundOutlined style={{ fontSize: 48, color: '#C0C4CC' }} />
                <Text type="secondary">选择设备后点击「获取URL」</Text>
              </Space>
            )}
          </div>
          <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
        </Card>
      ),
    },
    {
      key: 'account', label: '账户', children: (
        <Card className="svc-card" title="用户信息" extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadUserInfo}>刷新</Button>}>
          {userInfo ? (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="用户ID">{userInfo.id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{userInfo.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{userInfo.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="电话">{userInfo.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司">{userInfo.companyName || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">{userInfo.role?.roleName || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{userInfo.enable ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>}</Descriptions.Item>
              <Descriptions.Item label="操作"><Button size="small" onClick={() => { pwdForm.resetFields(); setPwdModal(true); }}>修改密码</Button></Descriptions.Item>
            </Descriptions>
          ) : <Empty description="点击刷新加载" />}
          <Modal title="修改密码" open={pwdModal} onOk={handleChangePwd} onCancel={() => setPwdModal(false)}>
            <Form form={pwdForm} layout="vertical"><Form.Item label="新密码" name="password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item></Form>
          </Modal>
        </Card>
      ),
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'devices') loadDevices();
    if (key === 'alarms') loadAlarms();
    if (key === 'fences') loadFences();
    if (key === 'talk') loadTalkGroups();
    if (key === 'account') loadUserInfo();
  };

  return (<><style>{CSS}</style><div className="svc-root"><Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} /></div></>);
}
