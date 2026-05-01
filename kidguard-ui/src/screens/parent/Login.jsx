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

      if (data.isNewUser) {
        // First-time user — collect profile info
        navigate('/complete-profile', {
          state: {
            email: data.email,
            name: data.name,
            googleSub: data.googleSub,
            idToken: credentialResponse.credential,
          },
        })
      } else {
        // Existing user — OTP was sent, go verify
        navigate('/mfa', { state: { email: data.email } })
      }
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
        flex: 1, overflowY: 'auto', padding: '40px 20px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0',
      }}>
        {/* Logo / title */}
        <div style={{
          width: '64px', height: '64px',
          background: 'var(--slab-blue)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '4px 4px 0 #0D0D0D',
        }}>
          <span style={{ fontSize: '28px' }}>🛡️</span>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>
          WELCOME BACK.
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 40px', textAlign: 'center' }}>
          Sign in with your Google account to continue.
        </p>

        {/* Google Sign-In card */}
        <div style={{
          width: '100%',
          border: '2px solid var(--border)',
          padding: '28px 20px',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '4px 4px 0 #0D0D0D',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            SIGN IN WITH
          </div>

          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 0', color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600,
            }}>
              <div style={{
                width: '20px', height: '20px',
                border: '2px solid var(--slab-blue)',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
                borderRadius: '50%',
              }} />
              AUTHENTICATING…
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="280"
            />
          )}

          <p style={{
            fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center',
            fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.5,
          }}>
            A one-time verification code will be<br />sent to your email after sign-in.
          </p>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', width: '100%', padding: '10px 12px',
            background: '#fff0f0', border: '2px solid var(--slab-red)',
            fontSize: '12px', fontFamily: 'var(--font-body)',
            color: 'var(--slab-red)', fontWeight: 600,
          }}>
            ⚠ {error}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MobileFrame>
  )
}
