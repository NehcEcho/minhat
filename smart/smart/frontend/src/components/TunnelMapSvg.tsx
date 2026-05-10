/** Mine tunnel floor plan SVG for RealTime Monitor */
export default function TunnelMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  const cameras = [
    { x: 100, y: 80, status: 'online', id: 'MHK-1001' },
    { x: 180, y: 140, status: 'online', id: 'MHK-1002' },
    { x: 260, y: 100, status: 'online', id: 'MHK-1003' },
    { x: 200, y: 200, status: 'offline', id: 'MHK-1007' },
    { x: 320, y: 180, status: 'online', id: 'MHK-1008' },
    { x: 380, y: 130, status: 'online', id: 'MHK-1010' },
    { x: 400, y: 220, status: 'offline', id: 'MHK-1003' },
  ];

  return (
    <svg viewBox="0 0 500 320" width={width} height={height} style={{ background: '#f0f5f0' }}>
      {/* Grid */}
      <defs>
        <pattern id="tgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d8e8d8" strokeWidth={0.3} />
        </pattern>
      </defs>
      <rect width="500" height="320" fill="url(#tgrid)" />

      {/* Rock walls / tunnel boundaries */}
      <g fill="#d0dcd0" opacity={0.5}>
        <rect x="0" y="0" width="480" height="20" rx={2} />
        <rect x="0" y="300" width="480" height="20" rx={2} />
        <rect x="0" y="20" width="20" height="260" rx={2} />
        <rect x="460" y="20" width="20" height="260" rx={2} />
      </g>

      {/* Tunnel paths */}
      <g fill="none" strokeWidth={3} opacity={0.5}>
        <path d="M 40,100 L 460,100" stroke="#a0c8a0" />
        <path d="M 250,40 L 250,100 M 250,100 L 250,280" stroke="#a0c8a0" />
        <path d="M 150,100 L 150,200 M 150,200 L 400,200" stroke="#a0c8a0" />
        <path d="M 350,100 L 350,200" stroke="#a0c8a0" />
        <path d="M 150,270 L 400,270" stroke="#a0c8a0" />
      </g>

      {/* Tunnel labels */}
      {[
        [80, 35, '主巷道'],
        [290, 35, '辅巷道'],
        [30, 155, '采掘面A'],
        [440, 155, '采掘面B'],
        [30, 265, '运输大巷'],
        [330, 305, '水泵房'],
      ].map(([x, y, label]) => (
        <text key={label} x={Number(x)} y={Number(y)} fontSize={9} fill="#6a8a6a" fontWeight="bold">{label}</text>
      ))}

      {/* Camera markers */}
      {cameras.map((cam, i) => (
        <g key={i}>
          <rect x={cam.x - 6} y={cam.y - 6} width={12} height={12} rx={2}
            fill={cam.status === 'online' ? '#2BA471' : '#D54941'} opacity={0.9} />
          <text x={cam.x} y={cam.y + 2} fontSize={5} fill="white" textAnchor="middle">C</text>
          <text x={cam.x} y={cam.y + 16} fontSize={7} fill={cam.status === 'online' ? '#2BA471' : '#D54941'} textAnchor="middle">{cam.id}</text>
        </g>
      ))}

      {/* Online indicator dots */}
      {cameras.filter(c => c.status === 'online').map((cam, i) => (
        <circle key={`d${i}`} cx={cam.x} cy={cam.y} r={3} fill="#2BA471">
          <animate attributeName="opacity" values="1;0.3;1" dur={1.5 + i * 0.3} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Control buttons */}
      <g transform="translate(450, 10)">
        <rect x={0} y={0} width={22} height={22} rx={4} fill="white" stroke="#ccc" />
        <text x={11} y={16} fontSize={14} fill="#666" textAnchor="middle">+</text>
        <rect x={0} y={24} width={22} height={22} rx={4} fill="white" stroke="#ccc" />
        <text x={11} y={40} fontSize={14} fill="#666" textAnchor="middle">−</text>
        <rect x={0} y={48} width={22} height={22} rx={4} fill="white" stroke="#ccc" />
        <text x={11} y={64} fontSize={8} fill="#666" textAnchor="middle">◎</text>
      </g>
    </svg>
  );
}
