export default function MapMock({ showPin = false, showZone = false, zoneName = 'Home', height = 200, grayscale = false }) {
  const roads = [
    { x1: 0, y1: 140, x2: 390, y2: 140 },
    { x1: 0, y1: 280, x2: 390, y2: 280 },
    { x1: 0, y1: 420, x2: 390, y2: 420 },
    { x1: 90, y1: 0, x2: 90, y2: 600 },
    { x1: 210, y1: 0, x2: 210, y2: 600 },
    { x1: 320, y1: 0, x2: 320, y2: 600 },
  ]

  return (
    <div style={{
      background: '#F5F0E8',
      border: '2px solid var(--border)',
      width: '100%',
      height: typeof height === 'number' ? `${height}px` : height,
      position: 'relative',
      overflow: 'hidden',
      filter: grayscale ? 'grayscale(0.8) opacity(0.7)' : 'none',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {roads.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
            stroke="#C8C0B0" strokeWidth="18" />
        ))}
        {roads.map((r, i) => (
          <line key={`c${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
            stroke="#D8D0C0" strokeWidth="14" />
        ))}
        {showZone && (
          <>
            <rect x="100" y="80" width="180" height="140"
              fill="rgba(42,91,245,0.08)"
              stroke="#2A5BF5" strokeWidth="2" strokeDasharray="8,4" />
            <foreignObject x="110" y="88" width="80" height="20">
              <div style={{
                background: '#fff', border: '1px solid #0D0D0D',
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                padding: '1px 4px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
              }}>
                {zoneName}
              </div>
            </foreignObject>
          </>
        )}
        {showPin && (
          <>
            <rect x="180" y="130" width="14" height="14" fill="#2A5BF5" />
            <rect x="171" y="121" width="32" height="32"
              fill="none" stroke="#2A5BF5" strokeWidth="2"
              strokeDasharray="4,2"
              style={{ animation: 'brutalPulse 1.5s ease-out infinite' }} />
          </>
        )}
      </svg>
    </div>
  )
}
