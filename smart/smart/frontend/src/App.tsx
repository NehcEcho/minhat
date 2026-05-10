import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './layouts/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GlobalPosition from './pages/GlobalPosition';
import RealTimeMonitor from './pages/RealTimeMonitor';
import EEGMonitor from './pages/EEGMonitor';
import DataAnalysis from './pages/DataAnalysis';
import InspectionTasks from './pages/InspectionTasks';
import EmployeeManagement from './pages/EmployeeManagement';
import AlarmDisposal from './pages/AlarmDisposal';
import TrackReplay from './pages/TrackReplay';
import GeoFence from './pages/GeoFence';
import PlaybackManage from './pages/PlaybackManage';
import VideoManage from './pages/VideoManage';
import DeviceManage from './pages/DeviceManage';
import WorkOrders from './pages/WorkOrders';
import DataSync from './pages/DataSync';
import DataAsset from './pages/DataAsset';
import EventLinkage from './pages/EventLinkage';
import EmergencyPlan from './pages/EmergencyPlan';
import DisposalRecord from './pages/DisposalRecord';
import ShiftManage from './pages/ShiftManage';
import SystemIntegration from './pages/SystemIntegration';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/system-integration" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="global-position" element={<GlobalPosition />} />
          <Route path="realtime-monitor" element={<RealTimeMonitor />} />
          <Route path="eeg-monitor" element={<EEGMonitor />} />
          <Route path="data-analysis" element={<DataAnalysis />} />
          <Route path="inspection-tasks" element={<InspectionTasks />} />
          <Route path="employee-management" element={<EmployeeManagement />} />
          <Route path="alarm-disposal" element={<AlarmDisposal />} />
          <Route path="track-replay" element={<TrackReplay />} />
          <Route path="geo-fence" element={<GeoFence />} />
          <Route path="playback-manage" element={<PlaybackManage />} />
          <Route path="video-manage" element={<VideoManage />} />
          <Route path="device-manage" element={<DeviceManage />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="data-sync" element={<DataSync />} />
          <Route path="data-asset" element={<DataAsset />} />
          <Route path="event-linkage" element={<EventLinkage />} />
          <Route path="emergency-plan" element={<EmergencyPlan />} />
          <Route path="disposal-record" element={<DisposalRecord />} />
          <Route path="shift-manage" element={<ShiftManage />} />
          <Route path="system-integration" element={<SystemIntegration />} />
        </Route>
      </Route>
    </Routes>
  );
}
