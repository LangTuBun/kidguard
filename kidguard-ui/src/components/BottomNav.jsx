import { useNavigate } from 'react-router-dom'
import { Map, Clock, Shield, Bell } from 'lucide-react'

const tabs = [
  { key: 'map',     label: 'MAP',     icon: Map,    path: '/map' },
  { key: 'history', label: 'HISTORY', icon: Clock,  path: '/history' },
  { key: 'zones',   label: 'ZONES',   icon: Shield, path: '/zones' },
  { key: 'alerts',  label: 'ALERTS',  icon: Bell,   path: '/notifications' },
]

export default function BottomNav({ active }) {
  const navigate = useNavigate()
  return (
    <div style={{
      background: '#fff',
      borderTop: '2px solid var(--border)',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      marginTop: 'auto',
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--slab-blue)' : 'var(--text-muted)',
            }}
          >
            <Icon size={18} />
            <span style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em',
              textTransform: 'uppercase', fontFamily: 'var(--font-body)',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
