import { useEffect, useRef } from 'react';
import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const CENTER: [number, number] = [113.3013, 40.0768];
const ZOOM = 14;

const DEVICE_MARKERS: AmapMarker[] = [
  { lng: 113.298, lat: 40.074, color: '#2BA471', title: '设备', size: 10, label: 'D' },
  { lng: 113.302, lat: 40.077, color: '#2BA471', title: '设备', size: 10, label: 'D' },
  { lng: 113.305, lat: 40.075, color: '#2BA471', title: '设备', size: 10, label: 'D' },
  { lng: 113.296, lat: 40.080, color: '#2BA471', title: '设备', size: 10, label: 'D' },
];

const FENCES: { path: [number, number][]; color: string; label: string }[] = [
  {
    path: [[113.295, 40.073], [113.299, 40.073], [113.299, 40.076], [113.295, 40.076]],
    color: '#FF4D4F', label: '一采区禁入',
  },
  {
    path: [[113.302, 40.073], [113.308, 40.073], [113.308, 40.075], [113.302, 40.075]],
    color: '#FAAD14', label: '主运输巷超时',
  },
  {
    path: [[113.296, 40.077], [113.300, 40.077], [113.300, 40.081], [113.296, 40.081]],
    color: '#1677FF', label: '回风巷预警',
  },
  {
    path: [[113.308, 40.074], [113.313, 40.074], [113.313, 40.077], [113.308, 40.077]],
    color: '#E37318', label: '采掘面安全',
  },
  {
    path: [[113.312, 40.072], [113.315, 40.072], [113.315, 40.074], [113.312, 40.074]],
    color: '#2BA471', label: '变电所',
  },
];

export default function GeoFenceMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const { ready, mapRef } = useAmap('geofence-map-container', {
    zoom: ZOOM,
    center: CENTER,
    markers: DEVICE_MARKERS,
  });
  const drawn = useRef(false);

  useEffect(() => {
    if (!ready || !mapRef.current || drawn.current) return;
    for (const f of FENCES) {
      const polygon = new AMap.Polygon({
        path: f.path,
        strokeColor: f.color,
        strokeWeight: 2,
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
        fillColor: f.color,
        fillOpacity: 0.1,
      });
      mapRef.current.add(polygon);
      const label = new AMap.Marker({
        position: [
          f.path.reduce((s, p) => s + p[0], 0) / f.path.length,
          f.path.reduce((s, p) => s + p[1], 0) / f.path.length,
        ],
        content: `<div style="color:${f.color};font-size:10px;font-weight:700;white-space:nowrap;text-shadow:0 0 4px #fff;">${f.label}</div>`,
        offset: [-30, -6],
      });
      mapRef.current.add(label);
    }
    drawn.current = true;
  }, [ready, mapRef]);

  return (
    <div style={{ width, height, position: 'relative', background: '#F5F7FA' }}>
      <div id="geofence-map-container" style={{ width: '100%', height: '100%' }} />
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
