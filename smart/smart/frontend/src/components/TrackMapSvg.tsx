import { useEffect, useRef, useMemo } from 'react';
import { useAmap } from '../hooks/useAmap';
import type { AmapMarker } from '../hooks/useAmap';

const DEFAULT_CENTER: [number, number] = [117.20, 39.13];
const DEFAULT_ZOOM = 13;

const FALLBACK_TRACKS: [number, number][][] = [
  [[117.18, 39.10], [117.19, 39.11], [117.20, 39.12], [117.21, 39.13], [117.22, 39.13], [117.23, 39.14], [117.24, 39.14]],
  [[117.20, 39.13], [117.21, 39.12], [117.22, 39.11], [117.23, 39.12], [117.24, 39.13]],
  [[117.20, 39.14], [117.19, 39.13], [117.18, 39.12], [117.19, 39.11], [117.20, 39.12]],
];

const FALLBACK_COLORS = ['#0052D9', '#2BA471', '#7B61FF'];
const FALLBACK_LABELS = ['MKH-001', 'MKH-002', 'MKH-003'];

interface TrackPoint { longitude: number; latitude: number; }

export default function TrackMapSvg({ width = '100%', height = '100%', data }: { width?: string; height?: string; data?: TrackPoint[] }) {
  const validData: TrackPoint[] = (data || []).filter(p => {
    const lng = Number((p as any).longitude ?? (p as any).lng ?? (p as any).long);
    const lat = Number((p as any).latitude ?? (p as any).lat);
    return !isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0;
  }).map(p => ({
    longitude: Number((p as any).longitude ?? (p as any).lng ?? (p as any).long),
    latitude: Number((p as any).latitude ?? (p as any).lat),
  }));
  const hasData = validData.length > 0;

  const center: [number, number] = useMemo(() =>
    hasData
      ? [validData.reduce((s, p) => s + p.longitude, 0) / validData.length, validData.reduce((s, p) => s + p.latitude, 0) / validData.length]
      : DEFAULT_CENTER,
  [hasData ? JSON.stringify(validData) : '']);

  const zoom = hasData ? Math.max(10, Math.min(18, Math.round(16 - Math.log2(validData.length || 1)))) : DEFAULT_ZOOM;

  const { ready, mapRef } = useAmap('track-map-container', { zoom, center });

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setCenter(center);
    mapRef.current.setZoom(zoom);
    mapRef.current.clearMap();

    if (hasData && validData.length >= 2) {
      const points: [number, number][] = validData.map(p => [p.longitude, p.latitude]);
      mapRef.current.add(new AMap.Polyline({
        path: points, strokeColor: '#0052D9', strokeWeight: 4, strokeOpacity: 0.8, strokeStyle: 'solid',
      }));
      for (const p of validData) {
        mapRef.current.add(new AMap.Marker({
          position: [p.longitude, p.latitude],
          content: '<div style="width:8px;height:8px;background:#0052D9;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
          offset: [-5, -5],
        }));
      }
    } else {
      for (let i = 0; i < FALLBACK_TRACKS.length; i++) {
        mapRef.current.add(new AMap.Polyline({
          path: FALLBACK_TRACKS[i], strokeColor: FALLBACK_COLORS[i], strokeWeight: 3, strokeOpacity: 0.8, strokeStyle: 'dashed',
        }));
      }
      for (let i = 0; i < FALLBACK_TRACKS.length; i++) {
        const t = FALLBACK_TRACKS[i];
        const last = t[t.length - 1];
        mapRef.current.add(new AMap.Marker({
          position: last,
          content: `<div style="width:12px;height:12px;background:${FALLBACK_COLORS[i]};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">${i + 1}</div>`,
          offset: [-7, -7],
          title: FALLBACK_LABELS[i],
        }));
      }
    }
  }, [ready, mapRef, hasData, JSON.stringify(validData)]);

  return (
    <div style={{ width, height, position: 'relative', background: '#F5F7FA' }}>
      <div id="track-map-container" style={{ width: '100%', height: '100%' }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C', fontSize: 14 }}>
          地图加载中...
        </div>
      )}
    </div>
  );
}
