import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, User, Calendar, Phone } from 'lucide-react'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'
import Input from '../../components/Input'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

function FieldLabel({ icon: Icon, text, optional }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)',
      marginBottom: '6px',
    }}>
      <Icon size={11} strokeWidth={2.5} />
      {text}
      {optional && (
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', fontSize: '10px' }}>
          — optional
        </span>
      )}
    </div>
  )
}

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

  if (!prefillEmail) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError(null)

    if (!name.trim())  return setError('Full name is required.')
    if (!dateOfBirth)  return setError('Date of birth is required.')

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
        background: '#fff',
        borderBottom: '2px solid var(--border)',
        padding: '0 20px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <ChevronLeft
          size={20}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/login')}
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          Complete Profile
        </span>
      </div>

      {/* Body */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Account strip */}
        <div style={{
          border: '2px solid var(--border)',
          background: '#fff',
          padding: '14px 16px',
          boxShadow: '3px 3px 0 var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            Google Account
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--slab-blue)',
            wordBreak: 'break-all',
          }}>
            {prefillEmail}
          </div>
        </div>

        {/* Instruction */}
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.6,
          borderLeft: '3px solid var(--slab-blue)',
          paddingLeft: '12px',
        }}>
          First time here. Please fill in your details before continuing.
        </p>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full name */}
          <div>
            <FieldLabel icon={User} text="Full Name" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              style={{
                width: '100%',
                border: '2px solid var(--border)',
                padding: '10px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '2px 2px 0 var(--border)',
              }}
            />
          </div>

          {/* Date of birth */}
          <div>
            <FieldLabel icon={Calendar} text="Date of Birth" />
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              style={{
                width: '100%',
                border: '2px solid var(--border)',
                padding: '10px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '2px 2px 0 var(--border)',
              }}
            />
          </div>

          {/* Phone (optional) */}
          <div>
            <FieldLabel icon={Phone} text="Phone" optional />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 xxx xxx xxx"
              style={{
                width: '100%',
                border: '2px solid var(--border)',
                padding: '10px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '2px 2px 0 var(--border)',
              }}
            />
          </div>
        </div>

        {/* Error */}
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

        {/* Submit */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <Button fullWidth variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & VERIFY EMAIL ->'}
          </Button>
        </div>
      </form>
    </MobileFrame>
  )
}
