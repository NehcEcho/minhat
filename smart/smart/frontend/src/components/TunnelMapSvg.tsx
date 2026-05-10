import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const CENTER: [number, number] = [113.3013, 40.0768];
const CAMERA_MARKERS: AmapMarker[] = [
  { lng: 113.298, lat: 40.074, title: 'MHK-1001', color: '#2BA471', size: 12 },
  { lng: 113.302, lat: 40.077, title: 'MHK-1002', color: '#2BA471', size: 12 },
  { lng: 113.305, lat: 40.075, title: 'MHK-1003', color: '#2BA471', size: 12 },
  { lng: 113.300, lat: 40.080, title: 'MHK-1007', color: '#D54941', size: 12 },
  { lng: 113.307, lat: 40.078, title: 'MHK-1008', color: '#2BA471', size: 12 },
  { lng: 113.310, lat: 40.076, title: 'MHK-1010', color: '#2BA471', size: 12 },
  { lng: 113.312, lat: 40.080, title: 'MHK-1003', color: '#D54941', size: 12 },
];

export default function TunnelMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const { ready } = useAmap('tunnel-map-container', {
    zoom: 15,
    center: CENTER,
    markers: CAMERA_MARKERS,
  });

  return (
    <div style={{ width, height, position: 'relative', background: '#f0f5f0' }}>
      <div id="tunnel-map-container" style={{ width: '100%', height: '100%' }} />
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
