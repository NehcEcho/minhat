import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const CENTER: [number, number] = [104.1954, 35.8617]; // 中国中心
const CLUSTER_MARKERS: AmapMarker[] = [
  { lng: 113.30, lat: 40.08, title: '大同矿区 (128台)', color: '#0052D9', size: 22 },
  { lng: 117.20, lat: 39.13, title: '天津港区 (56台)', color: '#0052D9', size: 18 },
  { lng: 121.47, lat: 31.23, title: '上海基地 (89台)', color: '#0052D9', size: 20 },
  { lng: 106.55, lat: 29.57, title: '重庆基地 (43台)', color: '#0052D9', size: 16 },
  { lng: 126.53, lat: 45.80, title: '哈尔滨基地 (201台)', color: '#0052D9', size: 24 },
];

const ALARM_MARKERS: AmapMarker[] = [
  { lng: 114.30, lat: 37.50, title: '河北矿区-高危', color: '#D54941', size: 16 },
  { lng: 109.50, lat: 33.50, title: '陕西矿区-高危', color: '#D54941', size: 16 },
  { lng: 103.80, lat: 36.10, title: '甘肃矿区-高危', color: '#D54941', size: 16 },
];

const REGION_LABELS: AmapMarker[] = [
  { lng: 104.20, lat: 35.86, title: '中国区总部', color: '#FF7D00', size: 14 },
  { lng: 30.00, lat: 0.00, title: '非洲矿区', color: '#00B42A', size: 12 },
  { lng: 50.00, lat: 28.00, title: '中东基地', color: '#00B42A', size: 12 },
  { lng: -70.00, lat: 0.00, title: '南美矿区', color: '#00B42A', size: 12 },
  { lng: 135.00, lat: -25.00, title: '澳洲基地', color: '#00B42A', size: 12 },
];

export default function WorldMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const allMarkers: AmapMarker[] = [...CLUSTER_MARKERS, ...ALARM_MARKERS, ...REGION_LABELS];
  const { ready } = useAmap('world-map-container', {
    zoom: 4,
    center: CENTER,
    markers: allMarkers,
  });

  return (
    <div style={{ width, height, position: 'relative', background: '#f5f8fc' }}>
      <div id="world-map-container" style={{ width: '100%', height: '100%' }} />
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
