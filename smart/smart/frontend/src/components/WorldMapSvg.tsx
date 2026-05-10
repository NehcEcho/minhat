/** World map SVG for Global Positioning */
export default function WorldMapSvg({ width = '100%', height = '100%' }: { width?: string; height?: string }) {
  return (
    <svg viewBox="0 0 700 380" width={width} height={height} style={{ background: '#f5f8fc' }}>
      <defs>
        <pattern id="wgrid" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e8edf3" strokeWidth={0.3} />
        </pattern>
      </defs>
      <rect width="700" height="380" fill="url(#wgrid)" />

      {/* Simplified continent outlines */}
      <g fill="#e0e8f0" stroke="#c0c8d8" strokeWidth={1}>
        {/* North America */}
        <path d="M 60,60 L 180,50 L 200,70 L 210,120 L 190,180 L 160,200 L 130,190 L 80,150 L 60,110 Z" />
        {/* South America */}
        <path d="M 190,210 L 220,200 L 230,250 L 220,300 L 200,320 L 170,300 L 160,250 Z" />
        {/* Europe */}
        <path d="M 330,50 L 380,40 L 420,45 L 430,70 L 420,100 L 400,110 L 360,105 L 340,80 Z" />
        {/* Africa */}
        <path d="M 340,115 L 380,100 L 420,110 L 440,160 L 430,220 L 400,270 L 360,280 L 330,240 L 320,180 Z" />
        {/* Asia */}
        <path d="M 430,50 L 580,40 L 620,60 L 640,100 L 630,140 L 580,170 L 520,160 L 460,130 L 430,100 Z" />
        {/* Australia */}
        <path d="M 520,250 L 580,240 L 600,260 L 580,290 L 530,290 L 510,270 Z" />
        {/* Southeast Asia */}
        <path d="M 600,170 L 640,180 L 650,200 L 620,210" />
        {/* Middle East */}
        <path d="M 380,120 L 400,130 L 390,150 L 370,140 Z" />
      </g>

      {/* Clustered data points */}
      {[
        [490, 90, '128'],
        [380, 100, '56'],
        [200, 140, '89'],
        [550, 270, '43'],
        [140, 240, '201'],
      ].map(([cx, cy, label]) => (
        <g key={label}>
          <circle cx={Number(cx)} cy={Number(cy)} r={20} fill="rgba(0,82,217,0.12)" stroke="#0052D9" strokeWidth={2} />
          <text x={Number(cx)} y={Number(cy) + 5} fontSize={11} fill="#0052D9" textAnchor="middle" fontWeight="bold">{label}</text>
        </g>
      ))}

      {/* High-risk alarm markers */}
      {[
        [420, 130, '高危'],
        [320, 150, '高危'],
        [180, 190, '高危'],
      ].map(([cx, cy, label], i) => (
        <g key={`alarm${i}`}>
          <circle cx={Number(cx)} cy={Number(cy)} r={14} fill="rgba(213,73,65,0.1)">
            <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={Number(cx)} cy={Number(cy)} r={5} fill="#D54941" />
          <text x={Number(cx)} y={Number(cy) - 10} fontSize={8} fill="#D54941" textAnchor="middle" fontWeight="bold">{label}</text>
        </g>
      ))}

      {/* Region labels */}
      {[
        [120, 100, '美洲'],
        [380, 80, '欧洲'],
        [510, 80, '亚太'],
        [380, 210, '非洲'],
        [550, 270, '澳洲'],
      ].map(([x, y, label]) => (
        <text key={label} x={Number(x)} y={Number(y)} fontSize={10} fill="#86909C" textAnchor="middle" fontWeight="bold">{label}</text>
      ))}
    </svg>
  );
}
