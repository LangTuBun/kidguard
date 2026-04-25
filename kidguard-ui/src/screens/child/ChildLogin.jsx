import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import Input from '../../components/Input'

export default function ChildLogin() {
  const navigate = useNavigate()
  return (
    <MobileFrame>
      <div style={{
        flex: 1, padding: '24px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: '0',
      }}>
        <Shield size={40} color="var(--slab-blue)" style={{ marginBottom: '16px' }} />
        <div style={{ marginBottom: '8px' }}>
          <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px' }}>
            HI THERE 👋
          </span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '240px', fontFamily: 'var(--font-body)', margin: '0 0 32px' }}>
          Sign in so your parents know you're safe.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <Input label="Email" type="email" placeholder="bon@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Button fullWidth variant="primary" onClick={() => navigate('/child')}>SIGN IN →</Button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--slab-blue)', cursor: 'pointer', margin: 0, fontFamily: 'var(--font-body)' }}
            onClick={() => navigate('/login')}>
            Parent account? <strong>SIGN IN HERE →</strong>
          </p>
        </div>
      </div>
    </MobileFrame>
  )
}
