import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const CENTER: [number, number] = [113.3013, 40.0768]; // 大同矿区
const DEVICE_MARKERS: AmapMarker[] = [
  { lng: 113.295, lat: 40.073, title: '监控-001', color: '#2BA471', size: 12 },
  { lng: 113.302, lat: 40.078, title: '监控-002', color: '#2BA471', size: 12 },
  { lng: 113.308, lat: 40.075, title: '传感器-003', color: '#2BA471', size: 12 },
  { lng: 113.298, lat: 40.081, title: '传感器-004', color: '#2BA471', size: 12 },
  { lng: 113.305, lat: 40.080, title: '基站-005', color: '#2BA471', size: 12 },
  { lng: 113.310, lat: 40.072, title: '基站-006', color: '#2BA471', size: 12 },
  { lng: 113.292, lat: 40.079, title: '摄像头-007', color: '#aaa', size: 12 },
  { lng: 113.312, lat: 40.082, title: '摄像头-008', color: '#aaa', size: 12 },
];

const PERSON_MARKERS: AmapMarker[] = Array.from({ length: 12 }, (_, i) => ({
  lng: 113.295 + Math.random() * 0.02,
  lat: 40.072 + Math.random() * 0.012,
  title: `人员-${String(i + 1).padStart(2, '0')}`,
  color: '#0052D9',
  size: 10,
}));

const ALARM_MARKERS: AmapMarker[] = [
  { lng: 113.300, lat: 40.076, title: '瓦斯超限告警', color: '#D54941', size: 14 },
  { lng: 113.306, lat: 40.079, title: '设备故障告警', color: '#D54941', size: 14 },
  { lng: 113.296, lat: 40.082, title: '人员越界告警', color: '#D54941', size: 14 },
];

export default function MineMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const allMarkers: AmapMarker[] = [...DEVICE_MARKERS, ...PERSON_MARKERS, ...ALARM_MARKERS];
  const { ready } = useAmap('mine-map-container', {
    zoom: 14,
    center: CENTER,
    markers: allMarkers,
  });

  return (
    <div style={{ width, height, position: 'relative', background: '#e8f2e8' }}>
      <div id="mine-map-container" style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#86909C', fontSize: 14,
        }}>
          地图加载中...
        </div>
      )}
    </div>
  );
}
