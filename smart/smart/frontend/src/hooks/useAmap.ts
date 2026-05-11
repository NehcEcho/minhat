import { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

let amapPromise: Promise<typeof AMap> | null = null;

function loadAMap(): Promise<typeof AMap> {
  if (!amapPromise) {
    const key = import.meta.env.VITE_AMAP_KEY as string || '480d04d806198ffcbfd8621fc45c3877';
    const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE as string || '9ec51d36d0171631dc885ffca452441e';

    if (securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode };
    }

    amapPromise = AMapLoader.load({
      key,
      version: '2.0',
      plugins: [
        'AMap.Marker',
        'AMap.MarkerCluster',
        'AMap.Polygon',
        'AMap.Polyline',
        'AMap.Circle',
      ],
    });
  }
  return amapPromise;
}

const AMAP_CSS_ID = 'amap-marker-style';

function ensureMarkerStyle() {
  if (document.getElementById(AMAP_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = AMAP_CSS_ID;
  style.textContent = `
    .amap-marker-content { display:none; }
    .smart-marker { border-radius:50%; box-shadow:0 1px 4px rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:700; }
  `;
  document.head.appendChild(style);
}

export interface AmapMarker {
  lng: number;
  lat: number;
  title?: string;
  content?: string;
  color?: string;
  size?: number;
  label?: string;
}

export function useAmap(
  containerId: string,
  options?: { zoom?: number; center?: [number, number]; markers?: AmapMarker[] },
) {
  const mapRef = useRef<AMap.Map | null>(null);
  const markersRef = useRef<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map: AMap.Map | null = null;
    let cancelled = false;

    const zoom = options?.zoom ?? 12;
    const center = options?.center ?? [116.397428, 39.90923];

    loadAMap()
      .then(() => {
        if (cancelled) return;
        const container = document.getElementById(containerId);
        if (!container) return;

        ensureMarkerStyle();
        map = new AMap.Map(containerId, {
          zoom,
          center,
          resizeEnable: true,
          viewMode: '2D',
        });
        mapRef.current = map;
        setReady(true);
      })
      .catch((err) => {
        console.error('[Amap] 加载失败:', err);
      });

    return () => {
      cancelled = true;
      if (map) {
        map.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const addMarker = useCallback(
    (marker: AmapMarker) => {
      if (!mapRef.current) return null;
      const color = marker.color ?? '#0052D9';
      const size = marker.size ?? 12;
      const html = marker.content ?? `<div class="smart-marker" style="width:${size}px;height:${size}px;background:${color};">${marker.label ?? ''}</div>`;
      const m = new AMap.Marker({
        position: [marker.lng, marker.lat],
        content: html,
        offset: [-(size / 2 + 1), -(size / 2 + 1)],
        title: marker.title,
      });
      mapRef.current.add(m);
      return m;
    },
    [],
  );

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const key = JSON.stringify(options?.markers ?? []);
    if (key === markersRef.current) return;
    markersRef.current = key;
    mapRef.current.clearMap();
    if (options?.markers) {
      for (const m of options.markers) {
        addMarker(m);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(options?.markers)]);

  return { mapRef, ready, addMarker };
}
