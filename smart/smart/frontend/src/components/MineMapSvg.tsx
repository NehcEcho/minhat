/** Mine tunnel map SVG for Dashboard */
export default function MineMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  return (
    <svg viewBox="0 0 600 400" width={width} height={height} style={{ background: '#e8f2e8' }}>
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#d0e0d0" strokeWidth={0.5} />
        </pattern>
        <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff0000" stopOpacity={0.6}>
            <animate attributeName="stop-opacity" values="0.6;0.0;0.6" dur="1.5s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#ff0000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="600" height="400" fill="url(#grid)" />

      {/* Main tunnel network */}
      <g stroke="#5a8a5a" strokeWidth={3} fill="none" opacity={0.6}>
        <path d="M 50,200 L 200,180 L 350,160 L 500,140" />
        <path d="M 200,180 L 250,250 L 350,280" />
        <path d="M 350,160 L 400,100 L 500,80" />
        <path d="M 250,250 L 200,320 L 300,350" />
        <path d="M 100,250 L 200,250" />
      </g>

      {/* Personnel dots */}
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={`p${i}`} cx={30 + i * 42 + Math.random() * 20} cy={100 + Math.random() * 250} r={5}
          fill="#0052D9" opacity={0.8}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur={2 + Math.random()} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Device markers */}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`d${i}`}>
          <rect x={80 + i * 60 + Math.random() * 30} y={60 + Math.random() * 280} width={14} height={14} rx={3}
            fill="#2BA471" opacity={i < 6 ? 0.9 : 0.5} />
          <text x={87 + i * 60 + Math.random() * 30} y={72 + Math.random() * 280}
            fontSize={6} fill="white" textAnchor="middle" fontWeight="bold">D</text>
        </g>
      ))}

      {/* Alarm markers with pulse */}
      {[[150, 220], [380, 130], [450, 300]].map(([cx, cy], i) => (
        <g key={`a${i}`}>
          <circle cx={cx} cy={cy} r={18} fill="url(#pulse)" />
          <circle cx={cx} cy={cy} r={6} fill="#D54941" />
          <text x={cx} y={cy - 10} fontSize={8} fill="#D54941" textAnchor="middle" fontWeight="bold">▲</text>
        </g>
      ))}

      {/* Cluster labels */}
      {[[320, 170, '48'], [250, 250, '32'], [100, 250, '18']].map(([cx, cy, label]) => (
        <g key={`c${label}`}>
          <circle cx={Number(cx)} cy={Number(cy)} r={16} fill="rgba(0,82,217,0.15)" stroke="#0052D9" strokeWidth={2} />
          <text x={Number(cx)} y={Number(cy) + 4} fontSize={10} fill="#0052D9" textAnchor="middle" fontWeight="bold">{label}</text>
        </g>
      ))}

      {/* Labels */}
      {[
        [80, 170, '采掘工作面A'],
        [200, 160, '采掘工作面B'],
        [300, 235, '运输大巷'],
        [160, 305, '通风巷道'],
        [330, 340, '水泵房'],
      ].map(([x, y, label]) => (
        <text key={`l${label}`} x={Number(x)} y={Number(y)} fontSize={9} fill="#4a7a4a" textAnchor="middle">{label}</text>
      ))}

      {/* Legend */}
      <g transform="translate(460, 350)">
        <rect width={120} height={40} rx={4} fill="white" fillOpacity={0.9} stroke="#ccc" />
        <circle cx={10} cy={12} r={4} fill="#0052D9" /><text x={18} y={15} fontSize={8} fill="#333">人员</text>
        <rect x={50} y={8} width={8} height={8} rx={2} fill="#2BA471" /><text x={62} y={15} fontSize={8} fill="#333">设备</text>
        <circle cx={10} cy={28} r={4} fill="#D54941" /><text x={18} y={31} fontSize={8} fill="#333">报警</text>
        <rect x={50} y={24} width={8} height={8} rx={2} fill="none" stroke="#0052D9" /><text x={62} y={31} fontSize={8} fill="#333">聚集</text>
      </g>
    </svg>
  );
}
