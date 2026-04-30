import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { setToken, setUser } from '../../utils/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError(null)

    if (!name.trim())                  return setError('Name is required.')
    if (!email.trim())                 return setError('Email is required.')
    if (password.length < 8)           return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword)  return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Sign-up failed')
      setToken(data.token)
      setUser({ email: data.email, name: data.name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
      <form
        onSubmit={handleSignup}
        style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
          Set up your parent account.
        </p>
        <Input
          label="Full Name"
          placeholder="Minh Khang"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          placeholder="minhkhang@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <div style={{
            padding: '10px 12px',
            background: '#fff0f0', border: '2px solid var(--slab-red)',
            fontSize: '12px', fontFamily: 'var(--font-body)',
            color: 'var(--slab-red)', fontWeight: 600,
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button fullWidth variant="primary" onClick={handleSignup}>
            {loading ? 'CREATING…' : 'CREATE ACCOUNT →'}
          </Button>
          <p
            style={{ textAlign: 'center', fontSize: '12px', color: 'var(--slab-blue)', cursor: 'pointer', margin: 0, fontFamily: 'var(--font-body)' }}
            onClick={() => navigate('/login')}
          >
            Already registered? <strong>SIGN IN</strong>
          </p>
        </div>
      </form>
    </MobileFrame>
  )
}
