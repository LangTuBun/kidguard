import { useNavigate } from 'react-router-dom'
import { Map, Clock, Shield, Bell, Settings, User, Asterisk } from 'lucide-react'

const navItems = [
  { key: 'map',      label: 'LIVE MAP',  icon: Map,      path: '/map' },
  { key: 'history',  label: 'HISTORY',   icon: Clock,    path: '/history' },
  { key: 'zones',    label: 'ZONES',     icon: Shield,   path: '/zones' },
  { key: 'alerts',   label: 'ALERTS',    icon: Bell,     path: '/notifications' },
]

const bottomItems = [
  { key: 'profile',  label: 'CHILD',     icon: User,     path: '/child-profile' },
  { key: 'settings', label: 'SETTINGS',  icon: Settings, path: '/settings' },
]

const NavBtn = ({ item, active, navigate }) => {
  const Icon = item.icon
  const isActive = item.key === active
  return (
    <button
      onClick={() => navigate(item.path)}
      style={{
        width: '100%', height: '48px',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '0 20px',
        background: isActive ? 'var(--bg-base)' : 'transparent',
        border: 'none',
        borderLeft: isActive ? '3px solid var(--slab-blue)' : '3px solid transparent',
        cursor: 'pointer',
        color: isActive ? 'var(--slab-blue)' : 'var(--text-muted)',
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F5F3EF' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={17} />
      <span style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', fontFamily: 'var(--font-body)',
      }}>
        {item.label}
      </span>
    </button>
  )
}

export default function SideNav({ active }) {
  const navigate = useNavigate()

  return (
    <div style={{
      width: '220px',
      minWidth: '220px',
      maxWidth: '220px',
      height: '100vh',
      background: '#fff',
      borderRight: '2px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
      pointerEvents: 'auto',
      userSelect: 'none',
    }}>
      {/* Logo */}
      <div style={{
        height: '64px', padding: '0 20px',
        borderBottom: '2px solid var(--border)',
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          border: '2px solid var(--border)', padding: '6px 12px',
          background: 'var(--bg-base)',
          display: 'flex', alignItems: 'center', gap: '6px',
          cursor: 'pointer',
        }} onClick={() => navigate('/dashboard')}>
          <Asterisk size={14} />
          <span style={{
            fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'var(--font-body)',
          }}>
            KidGuard
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '4px', padding: '8px 20px 4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0AA9F', fontFamily: 'var(--font-body)' }}>
            MONITORING
          </span>
        </div>
        {navItems.map(item => <NavBtn key={item.key} item={item} active={active} navigate={navigate} />)}

        <div style={{ margin: '12px 20px', height: '2px', background: 'var(--border)', opacity: 0.15 }} />

        <div style={{ marginBottom: '4px', padding: '4px 20px 4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B0AA9F', fontFamily: 'var(--font-body)' }}>
            MANAGE
          </span>
        </div>
        {bottomItems.map(item => <NavBtn key={item.key} item={item} active={active} navigate={navigate} />)}
      </nav>

      {/* Log out */}
      <div style={{ padding: '16px 20px', borderTop: '2px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '10px 0',
            background: 'transparent',
            border: '2px solid var(--slab-red)',
            color: 'var(--slab-red)',
            fontSize: '11px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          LOG OUT
        </button>
      </div>
    </div>
  )
}
