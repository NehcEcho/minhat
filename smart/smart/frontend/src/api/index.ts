import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth (matches doc: POST /login, GET /v1/user, PUT /v1/users/{username}/password)
export const loginApi = (username: string, password: string) =>
  api.post('/login', null, {
    headers: { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
  });
export const getUserInfo = () => api.get('/v1/user');
export const changePassword = (username: string, password: string) =>
  api.put(`/v1/users/${username}/password`, { password });

// Dashboard
export const getDashboardStats = () => api.get('/v1/dashboard/stats');

// Devices (matches doc exactly)
export const getUserDevices = () => api.get('/v1/user/devices');
export const getDeviceList = (params?: Record<string, unknown>) =>
  api.get('/v1/devices', { params });
export const getDevice = (id: number) => api.get(`/v1/devices/${id}`);
export const updateDevice = (id: number, data: Record<string, unknown>) =>
  api.put(`/v1/devices/${id}`, data);
export const getDeviceFiles = (params?: Record<string, unknown>) =>
  api.get('/v1/device/file', { params });
export const deleteFile = (path: string) =>
  api.post('/v1/device/file/delete', { path });

// Employees
export const getEmployeeList = (params?: Record<string, unknown>) =>
  api.get('/v1/employees', { params });
export const getEmployee = (id: number) => api.get(`/v1/employees/${id}`);
export const createEmployee = (data: Record<string, unknown>) =>
  api.post('/v1/employees', data);
export const updateEmployee = (id: number, data: Record<string, unknown>) =>
  api.put(`/v1/employees/${id}`, data);
export const getEmployeeStats = () => api.get('/v1/employees/stats');

// Alarms (matches doc: GET /v1/alarms, GET /v1/alarms/{id}, PUT /v1/alarms/{id})
export const getAlarmList = (params?: Record<string, unknown>) =>
  api.get('/v1/alarms', { params });
export const getAlarm = (id: number) => api.get(`/v1/alarms/${id}`);
export const updateAlarm = (id: number, data: Record<string, unknown>) =>
  api.put(`/v1/alarms/${id}`, data);
export const disposeAlarm = (id: number, data?: Record<string, unknown>) =>
  api.post(`/v1/alarms/${id}/dispose`, data);

// EEG
export const getEEGDataList = (params?: Record<string, unknown>) =>
  api.get('/v1/eeg/data', { params });
export const getEEGStats = () => api.get('/v1/eeg/stats');
export const getEmployeeEEG = (employeeId: number) =>
  api.get(`/v1/eeg/employee/${employeeId}`);

// Fences (matches doc exactly)
export const getFenceList = (params?: Record<string, unknown>) =>
  api.get('/v1/fences', { params });
export const getFence = (id: number) => api.get(`/v1/fences/${id}`);
export const createFence = (data: Record<string, unknown>) =>
  api.post('/v1/fences', data);
export const updateFence = (id: number, data: Record<string, unknown>) =>
  api.put(`/v1/fences/${id}`, data);
export const deleteFence = (id: number) => api.delete(`/v1/fences/${id}`);

// Inspections
export const getInspectionList = (params?: Record<string, unknown>) =>
  api.get('/v1/inspections', { params });
export const getInspectionStats = () => api.get('/v1/inspections/stats');
export const getInspection = (id: number) => api.get(`/v1/inspections/${id}`);

// Tracks / Locations (matches doc: GET /v1/locations)
export const getTrackHistory = (params: Record<string, unknown>) =>
  api.get('/v1/locations', { params });

// Talk Groups (matches doc: /v1/talkgroups, /v1/send-talkgroup-command)
export const createTalkGroup = (data: Record<string, unknown>) =>
  api.post('/v1/talkgroups', data);
export const deleteTalkGroup = (id: number) =>
  api.delete(`/v1/talkgroups/${id}`);
export const updateTalkGroup = (id: number, data: Record<string, unknown>) =>
  api.put(`/v1/talkgroups/${id}`, data);
export const findTalkGroups = (groupName: string) =>
  api.get('/v1/talkgroups', { params: { group_name: groupName } });
export const sendTalkCommand = (data: Record<string, unknown>) =>
  api.post('/v1/send-talkgroup-command', data);

// Stream (matches doc: GET /api/v1/stream/start, /api/v1/stream/stop)
export const streamStart = (params: Record<string, unknown>) =>
  api.get('/api/v1/stream/start', { params });
export const streamStop = (params: Record<string, unknown>) =>
  api.get('/api/v1/stream/stop', { params });

// Playback (matches doc: all GET except control)
export const getRecordList = (params: Record<string, unknown>) =>
  api.get('/api/v1/playback/recordlist', { params });
export const playbackStart = (params: Record<string, unknown>) =>
  api.get('/api/v1/playback/start', { params });
export const playbackStop = (params: Record<string, unknown>) =>
  api.get('/api/v1/playback/stop', { params });
export const playbackControl = (params: Record<string, unknown>) =>
  api.get('/api/v1/playback/control', { params });
export const playbackStreamInfo = (params: Record<string, unknown>) =>
  api.get('/api/v1/playback/streaminfo', { params });

// RTC / BVCSP (matches doc)
export const getPuInfo = (puid: string) =>
  api.get(`/bvcsp/v1/pu/info/${puid}`);
export const dialogWebrtc = (data: Record<string, unknown>) =>
  api.post('/bvcsp/v1/dialog/device/webrtc', data);
export const dialogBvrtc = (data: Record<string, unknown>) =>
  api.post('/bvcsp/v1/dialog/device/bvrtc', data);
export const dialogClose = (dialogid: string) =>
  api.post(`/bvcsp/v1/dialog/close/${dialogid}`);
export const recordFileFilter = (data: Record<string, unknown>) =>
  api.post('/bvcsp/v1/recordfile/filter', data);
export const puRecordFileFilter = (puid: string, data: Record<string, unknown>) =>
  api.post(`/bvcsp/v1/pu/recordfile/filter/${puid}`, data);
export const downloadFile = (fileid: string) =>
  api.get(`/bvnru/v1/download/${fileid}`, { responseType: 'blob' });
export const puDownloadFile = (puid: string, fileid: string) =>
  api.get(`/bvnru/v1/pu/download/${puid}/${fileid}`, { responseType: 'blob' });

// LiveKit (matches doc: POST /webrtc/token)
export const getWebrtcToken = (data: Record<string, unknown>) =>
  api.post('/webrtc/token', data);

// EEG Analysis (local service)
export const getEegAnalysisRecords = (params?: Record<string, unknown>) =>
  api.get('/api/eeg-analysis/records', { params });
export const createEegAnalysisTask = (data: Record<string, unknown>) =>
  api.post('/api/eeg-analysis/tasks', data);

// Intelligence / Jarvis AI Briefing
export const generateBriefing = (data: Record<string, unknown>) =>
  api.post('/api/intelligence/briefing', data);
export const getIntelligenceStatus = () =>
  api.get('/api/intelligence/status');

// Platform Cache
export const syncPlatformCache = (data?: Record<string, unknown>) =>
  api.post('/api/platform-cache/sync', data);
export const getPlatformCacheSummary = () =>
  api.get('/api/platform-cache/summary');
export const getCachedUserDevices = (params?: Record<string, unknown>) =>
  api.get('/api/platform-cache/user/devices', { params });
export const getCachedDevices = (params?: Record<string, unknown>) =>
  api.get('/api/platform-cache/devices', { params });
export const getCachedAlarms = (params?: Record<string, unknown>) =>
  api.get('/api/platform-cache/alarms', { params });
export const getCachedLocations = (params?: Record<string, unknown>) =>
  api.get('/api/platform-cache/locations', { params });

// Talk relay URL builder
export const getTalkWsUrl = (params: Record<string, unknown>) =>
  api.get('/api/v1/control/ws-talk-url', { params });

// System health
export const getSystemHealth = () => api.get('/api/system/health');

export default api;
