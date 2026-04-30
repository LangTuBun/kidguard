import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import MobileFrame from '../../components/MobileFrame'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { setToken, setUser } from '../../utils/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      setToken(data.token)
      setUser({ email: data.email, name: data.name })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Authentication failed')
      navigate('/mfa', { state: { email: data.email, idToken: credentialResponse.credential } })
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
        <span style={{
          border: '2px solid var(--border)', background: '#fff',
          fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '4px 10px', fontFamily: 'var(--font-body)',
        }}>
          PARENT LOGIN
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: '0',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', marginBottom: '8px' }}>
          WELCOME BACK.
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 24px' }}>
          Sign in with your email or continue with Google.
        </p>

        {/* Email/password form */}
        <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button fullWidth variant="primary" onClick={handlePasswordLogin}>
            {loading ? 'SIGNING IN…' : 'SIGN IN →'}
          </Button>
        </form>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '20px 0' }}>
          <div style={{ height: '2px', background: 'var(--border)' }} />
          <span style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-base)', padding: '0 8px',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontFamily: 'var(--font-body)',
          }}>
            OR
          </span>
        </div>

        {/* Google Sign-In */}
        <div style={{
          border: '2px solid var(--border)',
          padding: '20px',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '4px 4px 0 #0D0D0D',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            CONTINUE WITH
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600 }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--slab-blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              AUTHENTICATING…
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed. Please try again.')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="280"
            />
          )}
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 12px',
            background: '#fff0f0', border: '2px solid var(--slab-red)',
            fontSize: '12px', fontFamily: 'var(--font-body)',
            color: 'var(--slab-red)', fontWeight: 600,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Sign-up link */}
        <p
          style={{ textAlign: 'center', fontSize: '12px', color: 'var(--slab-blue)', cursor: 'pointer', margin: '20px 0 0', fontFamily: 'var(--font-body)' }}
          onClick={() => navigate('/register')}
        >
          New here? <strong>CREATE ACCOUNT</strong>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MobileFrame>
  )
}
