interface Window {
  _AMapSecurityConfig?: {
    securityJsCode?: string;
    serviceHost?: string;
  };
}

declare module '@amap/amap-jsapi-loader' {
  interface LoadOptions {
    key: string;
    version: string;
    plugins?: string[];
  }
  export function load(options: LoadOptions): Promise<typeof AMap>;
}

declare namespace AMap {
  class Map {
    constructor(container: string | HTMLDivElement, opts?: MapOptions);
    destroy(): void;
    setCenter(center: [number, number]): void;
    setZoom(zoom: number): void;
    setFitView(overlays?: unknown[]): void;
    add(overlay: unknown): void;
    remove(overlay: unknown): void;
    clearMap(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
  }

  interface MapOptions {
    zoom?: number;
    center?: [number, number];
    layers?: unknown[];
    viewMode?: '2D' | '3D';
    resizeEnable?: boolean;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(position: [number, number]): void;
    setContent(content: string | HTMLElement): void;
    setLabel(label: unknown): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    getPosition(): [number, number];
  }

  interface MarkerOptions {
    position?: [number, number];
    content?: string | HTMLElement;
    icon?: string;
    offset?: [number, number];
    title?: string;
    label?: { content?: string; offset?: [number, number]; direction?: string };
  }

  class Polyline {
    constructor(opts?: PolylineOptions);
    setPath(path: [number, number][]): void;
    setOptions(opts: Record<string, unknown>): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }

  interface PolylineOptions {
    path?: [number, number][];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
    lineJoin?: string;
    lineCap?: string;
    showDir?: boolean;
  }

  class Polygon {
    constructor(opts?: PolygonOptions);
    setPath(path: [number, number][] | [number, number][][]): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }

  interface PolygonOptions {
    path?: [number, number][] | [number, number][][];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
    fillColor?: string;
    fillOpacity?: number;
  }
}
