import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Shield, Lock } from 'lucide-react'
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
        navigate('/complete-profile', {
          state: {
            email: data.email,
            name: data.name,
            googleSub: data.googleSub,
          },
        })
      } else {
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
        background: '#fff',
        borderBottom: '2px solid var(--border)',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Shield size={16} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          KidGuard
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        padding: '32px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>

        {/* Headline block */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '36px',
            lineHeight: 1.05,
            marginBottom: '10px',
          }}>
            PARENT<br />
            <span style={{
              background: 'var(--slab-blue)',
              color: '#fff',
              padding: '2px 10px',
              display: 'inline-block',
            }}>
              SIGN IN
            </span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
          }}>
            Sign in with your Google account. A 6-digit verification code will be sent to your email.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', background: 'var(--border)' }} />

        {/* Google sign-in block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
          }}>
            Continue with
          </div>

          <div style={{
            border: '2px solid var(--border)',
            background: '#fff',
            padding: '20px',
            boxShadow: '4px 4px 0 var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            {loading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: '40px',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--slab-blue)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
                AUTHENTICATING...
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
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#fff0f0',
            border: '2px solid var(--slab-red)',
            borderLeft: '5px solid var(--slab-red)',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--slab-red)',
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        {/* Info strip */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '2px solid var(--border)',
          padding: '10px 14px',
          background: 'var(--bg-base)',
          boxShadow: '3px 3px 0 var(--border)',
        }}>
          <Lock size={12} color="var(--text-muted)" strokeWidth={2.5} />
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Two-factor auth is enforced on every sign-in.
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MobileFrame>
  )
}
