import WebLayout from '../../components/WebLayout'
import OfflineBanner from '../../components/OfflineBanner'
import MapMock from '../../components/MapMock'
import Button from '../../components/Button'

export default function Offline() {
  return (
    <WebLayout active="map">
      <OfflineBanner />

      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '60px', flexShrink: 0,
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}>
          <span style={{ background: 'var(--slab-orange)', color: '#fff', padding: '2px 8px' }}>OFFLINE</span>
          {' '}— STALE DATA
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: stale map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ filter: 'grayscale(0.8) opacity(0.7)', height: '100%' }}>
            <MapMock height="100%" grayscale />
          </div>
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'var(--slab-orange)', color: '#fff',
            padding: '6px 12px', border: '2px solid var(--border)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              ⚠ LAST KNOWN LOCATION — 8 MIN AGO
            </span>
          </div>
        </div>

        {/* Right: status cards */}
        <div style={{
          width: '340px', flexShrink: 0,
          borderLeft: '2px solid var(--border)',
          overflowY: 'auto', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          {/* Stale data card */}
          <div style={{
            background: '#fff', border: '3px solid var(--border)',
            borderLeft: '4px solid var(--slab-orange)',
            boxShadow: '4px 4px 0 #0D0D0D', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <span style={{ background: 'var(--slab-orange)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', display: 'inline-block', width: 'fit-content', fontFamily: 'var(--font-body)' }}>
              STALE DATA
            </span>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              Last location recorded 8 min ago
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Reconnect to get live updates.
            </div>
            <Button variant="ghost" style={{ marginTop: '8px' }}>RETRY CONNECTION →</Button>
          </div>

          {/* Battery warning */}
          <div style={{
            background: 'var(--slab-orange)', border: '2px solid var(--border)',
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-body)' }}>
              ⚡ BATTERY AT 12%
            </div>
            <div style={{ fontSize: '12px', color: '#fff', opacity: 0.85, fontFamily: 'var(--font-body)' }}>
              Device may lose connection soon.
            </div>
          </div>

          {/* Connection info */}
          <div style={{
            background: '#fff', border: '2px solid var(--border)',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
              CONNECTION STATUS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--slab-orange)', border: '2px solid var(--border)', animation: 'pulse-scale 1.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
                SEARCHING FOR DEVICE...
              </span>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  )
}
