import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import Input from '../../components/Input'

export default function Register() {
  const navigate = useNavigate()
  return (
    <MobileFrame>
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 16px', height: '56px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <ChevronLeft size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
          <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>CREATE ACCOUNT</span>
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          Set up your parent account.
        </p>
        <Input label="Full Name" placeholder="Minh Khang" />
        <Input label="Email" type="email" placeholder="minhkhang@example.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <Input label="Confirm Password" type="password" placeholder="••••••••" />

        {/* Divider */}
        <div style={{ position: 'relative', margin: '8px 0' }}>
          <div style={{ height: '2px', background: 'var(--border)' }} />
          <span style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-base)', padding: '0 8px',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontFamily: 'var(--font-body)',
          }}>
            YOUR CHILD
          </span>
        </div>

        <Input label="Child's Name" placeholder="Bon" />
        <Input label="Device Pairing Code" placeholder="KG-XXXX-XXXX" />

        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button fullWidth variant="primary" onClick={() => navigate('/mfa')}>CREATE ACCOUNT →</Button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--slab-blue)', cursor: 'pointer', margin: 0, fontFamily: 'var(--font-body)' }}
            onClick={() => navigate('/login')}>
            Already registered? <strong>SIGN IN</strong>
          </p>
        </div>
      </div>
    </MobileFrame>
  )
}
