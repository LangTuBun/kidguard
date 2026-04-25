import { useNavigate } from 'react-router-dom'
import { Asterisk } from 'lucide-react'
import StatusChip from '../components/StatusChip'

const screens = [
  { code: 'P1',  name: 'Splash',         path: '/',                  role: 'parent' },
  { code: 'P2',  name: 'Register',        path: '/register',          role: 'parent' },
  { code: 'P3',  name: 'Login',           path: '/login',             role: 'parent' },
  { code: 'P4',  name: 'MFA Verify',      path: '/mfa',               role: 'parent' },
  { code: 'P5',  name: 'Dashboard',       path: '/dashboard',         role: 'parent' },
  { code: 'P6',  name: 'Live Map',        path: '/map',               role: 'parent' },
  { code: 'P7',  name: 'History',         path: '/history',           role: 'parent' },
  { code: 'P8',  name: 'Safe Zones',      path: '/zones',             role: 'parent' },
  { code: 'P9',  name: 'Add Zone',        path: '/zones/add',         role: 'parent' },
  { code: 'P10', name: 'Notifications',   path: '/notifications',     role: 'parent' },
  { code: 'P11', name: 'SOS Alert',       path: '/sos-alert',         role: 'parent' },
  { code: 'P12', name: 'Child Profile',   path: '/child-profile',     role: 'parent' },
  { code: 'P13', name: 'Settings',        path: '/settings',          role: 'parent' },
  { code: 'P14', name: 'Offline',         path: '/offline',           role: 'parent' },
  { code: 'C1',  name: 'Child Login',     path: '/child/login',       role: 'child' },
  { code: 'C2',  name: 'Child Home',      path: '/child',             role: 'child' },
  { code: 'C3',  name: 'SOS Confirm',     path: '/child/sos-confirm', role: 'child' },
  { code: 'C4',  name: 'SOS Sent',        path: '/child/sos-sent',    role: 'child' },
  { code: 'C5',  name: 'SOS Queued',      path: '/child/sos-queued',  role: 'child' },
]

export default function NavIndex() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ border: '2px solid var(--border)', padding: '6px 12px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Asterisk size={14} />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>KidGuard</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>19 screens · 2 roles</span>
          <StatusChip label="WEB UI" variant="info" />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', margin: '0 0 8px' }}>
            <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 12px' }}>ALL SCREENS</span>
            {' '}INDEX
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Click any card to navigate directly to that screen.
          </p>
        </div>

        {/* Parent screens */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
            PARENT APP — 14 SCREENS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {screens.filter(s => s.role === 'parent').map(s => (
              <ScreenCard key={s.code} s={s} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* Child screens */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
            CHILD APP — 5 SCREENS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {screens.filter(s => s.role === 'child').map(s => (
              <ScreenCard key={s.code} s={s} navigate={navigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScreenCard({ s, navigate }) {
  return (
    <div
      onClick={() => navigate(s.path)}
      style={{
        background: '#fff', border: '2px solid var(--border)',
        boxShadow: '3px 3px 0 #0D0D0D', padding: '16px 20px',
        cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translate(-2px, -2px)'
        e.currentTarget.style.boxShadow = '5px 5px 0 #0D0D0D'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translate(0,0)'
        e.currentTarget.style.boxShadow = '3px 3px 0 #0D0D0D'
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', color: '#D4CFC6', lineHeight: 1, marginBottom: '6px' }}>
        {s.code}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: '8px', letterSpacing: '0.03em' }}>
        {s.name}
      </div>
      <StatusChip label={s.role.toUpperCase()} variant={s.role === 'parent' ? 'info' : 'online'} />
    </div>
  )
}
