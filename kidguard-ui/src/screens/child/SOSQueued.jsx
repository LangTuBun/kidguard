import { useNavigate } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'

export default function SOSQueued() {
  const navigate = useNavigate()
  return (
    <MobileFrame>
      <div style={{
        flex: 1, padding: '24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0',
      }}>
        <WifiOff size={64} color="var(--slab-orange)" strokeWidth={1.5} style={{ marginBottom: '20px' }} />

        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <span style={{ background: 'var(--slab-orange)', color: '#fff', padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '26px' }}>
            NO CONNECTION
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '3px solid var(--border)',
          borderLeft: '4px solid var(--slab-orange)',
          boxShadow: '4px 4px 0 #0D0D0D', padding: '20px',
          width: '100%', textAlign: 'center',
          display: 'flex', flexDirection: 'column', gap: '8px',
          margin: '0 0 32px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            YOUR SOS IS SAVED.
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            It will send automatically as soon as you're back online. Stay calm.
          </div>
        </div>

        {/* Pulsing indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{
            width: '8px', height: '8px', background: 'var(--slab-orange)',
            border: '2px solid var(--border)',
            animation: 'pulse-scale 1.2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
            WAITING FOR CONNECTION...
          </span>
        </div>

        <Button fullWidth variant="primary" onClick={() => navigate('/child/sos-confirm')}>TRY AGAIN →</Button>
      </div>
    </MobileFrame>
  )
}
