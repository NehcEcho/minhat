import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const CENTER: [number, number] = [113.3013, 40.0768];
const ZOOM = 14;

const EQUIPMENT_MARKERS: AmapMarker[] = [
  { lng: 113.296, lat: 40.075, title: '设备', color: '#0052D9', size: 10 },
  { lng: 113.302, lat: 40.075, title: '设备', color: '#0052D9', size: 10 },
  { lng: 113.307, lat: 40.075, title: '设备', color: '#0052D9', size: 10 },
  { lng: 113.312, lat: 40.075, title: '设备', color: '#0052D9', size: 10 },
  { lng: 113.298, lat: 40.080, title: '设备', color: '#0052D9', size: 10 },
  { lng: 113.298, lat: 40.083, title: '设备', color: '#0052D9', size: 10 },
];

const ENV_MARKERS: AmapMarker[] = [
  { lng: 113.300, lat: 40.078, title: '环境监测', color: '#FAAD14', size: 10 },
  { lng: 113.308, lat: 40.078, title: '环境监测', color: '#FAAD14', size: 10 },
  { lng: 113.313, lat: 40.076, title: '环境监测', color: '#FAAD14', size: 10 },
  { lng: 113.304, lat: 40.073, title: '环境监测', color: '#FAAD14', size: 10 },
  { lng: 113.304, lat: 40.071, title: '环境监测', color: '#FAAD14', size: 10 },
];

const VIDEO_MARKERS: AmapMarker[] = [
  { lng: 113.295, lat: 40.076, title: '视频', color: '#8B8B8B', size: 8 },
  { lng: 113.311, lat: 40.076, title: '视频', color: '#8B8B8B', size: 8 },
  { lng: 113.306, lat: 40.072, title: '视频', color: '#8B8B8B', size: 8 },
];

const RESOLVED_MARKERS: AmapMarker[] = [
  { lng: 113.301, lat: 40.076, title: '已处置', color: '#52C41A', size: 8 },
  { lng: 113.310, lat: 40.076, title: '已处置', color: '#52C41A', size: 8 },
  { lng: 113.298, lat: 40.079, title: '已处置', color: '#52C41A', size: 8 },
  { lng: 113.298, lat: 40.082, title: '已处置', color: '#52C41A', size: 8 },
];

const PERSON_ALARM_MARKERS: AmapMarker[] = [
  { lng: 113.304, lat: 40.075, title: '人员告警 !', color: '#FF4D4F', size: 14, label: '!' },
  { lng: 113.302, lat: 40.076, title: '人员告警', color: '#FF4D4F', size: 12 },
  { lng: 113.307, lat: 40.076, title: '人员告警', color: '#FF4D4F', size: 12 },
  { lng: 113.310, lat: 40.076, title: '人员告警', color: '#FF4D4F', size: 12 },
];

export default function AlarmMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const allMarkers: AmapMarker[] = [
    ...EQUIPMENT_MARKERS,
    ...ENV_MARKERS,
    ...VIDEO_MARKERS,
    ...RESOLVED_MARKERS,
    ...PERSON_ALARM_MARKERS,
  ];
  const { ready } = useAmap('alarm-map-container', {
    zoom: ZOOM,
    center: CENTER,
    markers: allMarkers,
  });

  return (
    <div style={{ width, height, position: 'relative', background: '#F5F7FA' }}>
      <div id="alarm-map-container" style={{ width: '100%', height: '100%' }} />
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
