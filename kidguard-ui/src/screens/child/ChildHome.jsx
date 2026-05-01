import { useNavigate } from 'react-router-dom'
import MobileFrame from '../../components/MobileFrame'
import StatusChip from '../../components/StatusChip'

export default function ChildHome() {
  const navigate = useNavigate()
  return (
    <MobileFrame maxWidth="480px">
      {/* Top strip */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 20px', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
          KIDGUARD
        </span>
        <StatusChip label="YOU'RE SAFE" variant="online" />
      </div>

      <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status card */}
        <div style={{
          background: '#fff', border: '3px solid var(--border)',
          boxShadow: '4px 4px 0 #0D0D0D', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <span style={{ background: 'var(--slab-green)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', display: 'inline-block', width: 'fit-content', fontFamily: 'var(--font-body)' }}>
            LOCATION SHARING ACTIVE
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>📍 Sharing with</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}>Dad</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Minh Khang</span>
          </div>
        </div>

        {/* Need help label */}
        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.12em', fontFamily: 'var(--font-body)' }}>
          NEED HELP?
        </div>
      </div>
    </MobileFrame>
  )
}
