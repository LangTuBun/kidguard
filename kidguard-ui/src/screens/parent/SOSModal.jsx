import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import MapMock from '../../components/MapMock'
import Button from '../../components/Button'

export default function SOSModal() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Red header band */}
      <div style={{
        background: 'var(--slab-red)', height: '80px',
        borderBottom: '2px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        flexShrink: 0,
      }}>
        <AlertTriangle size={36} color="#fff" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          SOS ALERT
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: alert details */}
        <div style={{
          flex: 1, background: '#fff',
          overflowY: 'auto', padding: '40px',
          display: 'flex', flexDirection: 'column', gap: '20px',
          maxWidth: '640px',
        }}>
          {/* Child info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '80px', height: '80px', border: '2px solid var(--border)',
              background: 'var(--slab-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>B</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', marginBottom: '6px' }}>
                <span style={{ background: 'var(--slab-red)', color: '#fff', padding: '2px 10px' }}>BON</span>
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                sent an emergency alert
              </div>
            </div>
          </div>

          <div style={{ fontSize: '16px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            123 Nguyen Hue Blvd, District 1, Ho Chi Minh City
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            TODAY AT 14:32
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="dark" style={{ minWidth: '200px' }}>CALL BON →</Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ minWidth: '200px' }}>DISMISS ALERT</Button>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            If unresolved, you will be re-notified in 5 minutes.
          </p>
        </div>

        {/* Right: map */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '2px solid var(--border)' }}>
          <MapMock showPin height="100%" />
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            background: 'var(--slab-red)', color: '#fff',
            padding: '6px 12px', border: '2px solid var(--border)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              CHILD LAST LOCATION
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
