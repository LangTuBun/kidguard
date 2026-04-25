import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'

export default function SOSSent() {
  const navigate = useNavigate()
  return (
    <MobileFrame>
      <div style={{
        flex: 1, padding: '24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0',
      }}>
        <CheckCircle size={72} color="var(--slab-green)" strokeWidth={1.5} style={{ marginBottom: '16px' }} />

        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'var(--slab-green)', color: '#fff', padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', textAlign: 'center' }}>
            ALERT SENT!
          </div>
        </div>

        <p style={{ fontSize: '15px', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-body)', margin: '8px 0 4px' }}>
          Your parents have been notified.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--slab-green)', textAlign: 'center', fontFamily: 'var(--font-body)', margin: '0 0 48px' }}>
          Help is on the way.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button fullWidth variant="ghost" onClick={() => navigate('/child')}>RETURN HOME</Button>
          <Button fullWidth variant="primary">CALL DAD →</Button>
        </div>
      </div>
    </MobileFrame>
  )
}
