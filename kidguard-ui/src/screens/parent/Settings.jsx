import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, User, CheckCircle } from 'lucide-react'
import WebLayout from '../../components/WebLayout'
import Card from '../../components/Card'
import StatusChip from '../../components/StatusChip'
import { getToken, getUser, clearToken, authHeaders } from '../../utils/auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

/** Toggle switch (brutalist style) */
function Toggle({ value, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', padding: 0,
        background: value ? 'var(--slab-blue)' : 'var(--bg-dark)',
        border: '2px solid var(--border)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        boxShadow: '2px 2px 0 #0D0D0D',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: value ? 'calc(100% - 18px)' : '2px',
        width: '16px', height: '16px',
        background: '#fff',
        border: '1.5px solid var(--border)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

/** Section header */
function SectionLabel({ icon: Icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.1em', color: 'var(--text-muted)',
      fontFamily: 'var(--font-body)', marginBottom: '8px',
    }}>
      <Icon size={12} />
      {label}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const user = getUser() || { name: 'Parent', email: '—' }

  const [prefs, setPrefs]     = useState({ sosAlerts: true, geofenceAlerts: true })
  const [saving, setSaving]   = useState(false)
  const [loadErr, setLoadErr] = useState(null)
  const [saved,  setSaved]    = useState(false)

  // Load settings from backend on mount
  useEffect(() => {
    if (!getToken()) return
    fetch(`${API_BASE}/api/settings`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPrefs({ sosAlerts: !!data.sosAlerts, geofenceAlerts: !!data.geofenceAlerts })
      })
      .catch(() => setLoadErr('Could not load settings.'))
  }, [])

  const handleToggle = async (key, val) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(next),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // revert on error
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    clearToken()
    navigate('/')
  }

  const initials = (user.name || 'P').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <WebLayout active="settings">
      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
          SETTINGS
        </span>
        {saved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
            color: 'var(--slab-green)', fontFamily: 'var(--font-body)',
          }}>
            <CheckCircle size={13} /> SAVED
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ── Account Info ───────────────────────────────────────── */}
          <div>
            <SectionLabel icon={User} label="Account" />
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px',
                  border: '3px solid var(--border)',
                  background: 'var(--slab-blue)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  flexShrink: 0,
                  boxShadow: '3px 3px 0 #0D0D0D',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    {user.name || 'Parent'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {user.email}
                  </div>
                  <div style={{
                    marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
                    color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
                    border: '1.5px solid var(--border)', padding: '2px 7px', background: 'var(--bg-base)',
                  }}>
                    🔵 GOOGLE ACCOUNT
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Security ───────────────────────────────────────────── */}
          <div>
            <SectionLabel icon={Shield} label="Security" />
            <Card padding="0">
              <div style={{
                padding: '0 20px', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.04em', fontFamily: 'var(--font-body)',
                  }}>
                    Two-Factor Auth
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                    Email OTP required every sign-in
                  </div>
                </div>
                <StatusChip label="ENABLED" variant="online" />
              </div>
            </Card>
          </div>

          {/* ── Notifications ──────────────────────────────────────── */}
          <div>
            <SectionLabel icon={Bell} label="Notifications" />
            <Card padding="0">
              {/* SOS Alerts toggle */}
              <div style={{
                padding: '0 20px', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '2px solid var(--border)',
              }}>
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.04em', fontFamily: 'var(--font-body)',
                  }}>
                    SOS Alerts
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                    Notify when child triggers SOS
                  </div>
                </div>
                <Toggle
                  id="toggle-sos"
                  value={prefs.sosAlerts}
                  onChange={(val) => handleToggle('sosAlerts', val)}
                />
              </div>

              {/* Geofence Alerts toggle */}
              <div style={{
                padding: '0 20px', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.04em', fontFamily: 'var(--font-body)',
                  }}>
                    Geofence Alerts
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                    Notify when child leaves a safe zone
                  </div>
                </div>
                <Toggle
                  id="toggle-geofence"
                  value={prefs.geofenceAlerts}
                  onChange={(val) => handleToggle('geofenceAlerts', val)}
                />
              </div>
            </Card>
            {saving && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '6px', letterSpacing: '0.05em' }}>
                Saving…
              </div>
            )}
            {loadErr && (
              <div style={{ fontSize: '10px', color: 'var(--slab-orange)', fontFamily: 'var(--font-body)', marginTop: '6px' }}>
                {loadErr}
              </div>
            )}
          </div>

          {/* ── Log out ────────────────────────────────────────────── */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            style={{
              border: '2px solid var(--slab-red)', background: 'transparent',
              color: 'var(--slab-red)', padding: '14px', width: '100%',
              fontSize: '13px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'var(--font-body)',
              boxShadow: '3px 3px 0 #0D0D0D',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--slab-red)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slab-red)' }}
          >
            LOG OUT
          </button>

        </div>
      </div>
    </WebLayout>
  )
}
