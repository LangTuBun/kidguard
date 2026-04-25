import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import MobileFrame from '../../components/MobileFrame'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      // Pass email + original idToken to OTP screen (for resend)
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
        flex: 1, padding: '40px 20px 20px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', marginBottom: '8px' }}>
          WELCOME BACK.
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 40px' }}>
          Sign in securely with your Google account.
        </p>

        {/* Google Sign-In */}
        <div style={{
          border: '2px solid var(--border)',
          padding: '24px',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
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

          {error && (
            <div style={{
              width: '100%', padding: '10px 12px',
              background: '#fff0f0', border: '2px solid var(--slab-red)',
              fontSize: '12px', fontFamily: 'var(--font-body)',
              color: 'var(--slab-red)', fontWeight: 600,
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Info notice */}
        <div style={{
          marginTop: '20px',
          background: 'var(--bg-base)', border: '2px solid var(--border)', padding: '12px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>✱</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            A 6-digit verification code will be sent to your email after Google sign-in.
          </span>
        </div>

        {/* 2FA badge */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'var(--bg-dark)', color: '#fff',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
            padding: '3px 8px', fontFamily: 'var(--font-body)',
          }}>
            2FA ENABLED
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Email OTP required every login
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MobileFrame>
  )
}
