import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, User, Calendar, Phone } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import Input from '../../components/Input'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { state } = useLocation()

  const prefillEmail = state?.email || ''
  const prefillName  = state?.name  || ''
  const googleSub    = state?.googleSub || ''

  const [name,        setName]        = useState(prefillName)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone,       setPhone]       = useState('')
  const [error,       setError]       = useState(null)
  const [loading,     setLoading]     = useState(false)

  // Redirect if arrived without google state
  if (!prefillEmail) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError(null)

    if (!name.trim())       return setError('Full name is required.')
    if (!dateOfBirth)       return setError('Date of birth is required.')

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/google/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: prefillEmail,
          name: name.trim(),
          dateOfBirth,
          googleSub,
          phone: phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Profile completion failed')

      // Account created and OTP sent
      navigate('/mfa', { state: { email: prefillEmail } })
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
        <ChevronLeft size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/login')} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}>
          <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>
            COMPLETE PROFILE
          </span>
        </span>
      </div>

      {/* Body */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1, overflowY: 'auto', padding: '24px 20px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        {/* Welcome banner */}
        <div style={{
          border: '2px solid var(--border)', padding: '16px',
          background: 'var(--bg-base)', boxShadow: '3px 3px 0 #0D0D0D',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
            SIGNED IN AS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--slab-blue)', wordBreak: 'break-all' }}>
            {prefillEmail}
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
          Welcome! Since this is your first time, please fill in your profile details before continuing.
        </p>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Date of Birth */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Calendar size={12} /> DATE OF BIRTH
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              style={{
                border: '2px solid var(--border)', padding: '10px 12px',
                fontFamily: 'var(--font-body)', fontSize: '14px',
                background: '#fff', outline: 'none', width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone (optional) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Phone size={12} /> PHONE <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>&nbsp;(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 xxx xxx xxx"
              style={{
                border: '2px solid var(--border)', padding: '10px 12px',
                fontFamily: 'var(--font-body)', fontSize: '14px',
                background: '#fff', outline: 'none', width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

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

        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <Button fullWidth variant="primary" onClick={handleSubmit}>
            {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT & VERIFY EMAIL →'}
          </Button>
        </div>
      </form>
    </MobileFrame>
  )
}
