import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Mail, RefreshCw } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import OTPInput from '../../components/OTPInput'
import { setToken, setUser } from '../../utils/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
const RESEND_COOLDOWN = 60

export default function MFAVerify() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email || ''

  const [otp,       setOtp]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)
  const [cooldown,  setCooldown]  = useState(RESEND_COOLDOWN)
  const timerRef = useRef(null)

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Redirect if arrived without email (direct URL access)
  useEffect(() => {
    if (!email) navigate('/login')
  }, [email, navigate])

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP')
      setToken(data.token)
      setUser({ email: data.email, name: data.name })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to resend OTP')
      }
      startCooldown()
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email
    ? email.replace(/^(.{2})(.+)(@.+)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : ''

  return (
    <MobileFrame>
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 16px', height: '56px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <ChevronLeft size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/login')} />
        <span style={{
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontFamily: 'var(--font-body)',
        }}>
          VERIFY YOUR IDENTITY
        </span>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, padding: '40px 20px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '28px', textAlign: 'center', marginBottom: '12px',
        }}>
          <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>
            TWO-FACTOR
          </span>
          {' '}AUTH
        </div>

        {/* Email pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          border: '2px solid var(--border)', padding: '6px 12px',
          marginBottom: '32px', background: 'var(--bg-base)',
        }}>
          <Mail size={13} color="var(--text-muted)" />
          <span style={{
            fontSize: '12px', fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
          }}>
            {maskedEmail || 'your email'}
          </span>
        </div>

        <p style={{
          fontSize: '13px', color: 'var(--text-muted)',
          textAlign: 'center', fontFamily: 'var(--font-body)', margin: '0 0 32px',
        }}>
          Enter the 6-digit code sent to your email.
        </p>

        {/* OTP Input */}
        <OTPInput length={6} onChange={setOtp} />

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px', width: '100%', padding: '10px 12px',
            background: '#fff0f0', border: '2px solid var(--slab-red)',
            fontSize: '12px', fontFamily: 'var(--font-body)',
            color: 'var(--slab-red)', fontWeight: 600, textAlign: 'center',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Success flash */}
        {success && (
          <div style={{
            marginTop: '16px', width: '100%', padding: '10px 12px',
            background: '#f0fff4', border: '2px solid var(--slab-green)',
            fontSize: '12px', fontFamily: 'var(--font-body)',
            color: 'var(--slab-green)', fontWeight: 700, textAlign: 'center',
          }}>
            ✓ VERIFIED — REDIRECTING…
          </div>
        )}

        {/* Resend */}
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          style={{
            marginTop: '14px',
            background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontFamily: 'var(--font-mono)',
            color: cooldown > 0 ? 'var(--text-muted)' : 'var(--slab-blue)',
            fontWeight: 600,
          }}
        >
          {resending
            ? <><RefreshCw size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> RESENDING…</>
            : cooldown > 0
              ? `Resend code in 0:${String(cooldown).padStart(2, '0')}`
              : 'Resend code'}
        </button>

        {/* Verify button */}
        <div style={{ marginTop: '32px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Button
            fullWidth
            variant="primary"
            onClick={handleVerify}
            disabled={loading || success}
          >
            {loading ? 'VERIFYING…' : 'VERIFY →'}
          </Button>
          <p
            style={{
              textAlign: 'center', fontSize: '12px',
              color: 'var(--slab-blue)', cursor: 'pointer',
              margin: 0, fontFamily: 'var(--font-body)',
            }}
            onClick={() => navigate('/login')}
          >
            Wrong account? <strong>GO BACK</strong>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MobileFrame>
  )
}
