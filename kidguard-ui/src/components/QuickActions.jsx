import { RefreshCw, Phone, AlertOctagon, MapPin } from 'lucide-react'

const BTN_BASE = {
  border: '2.5px solid var(--border)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '10px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  flex: 1,
  boxShadow: '3px 3px 0 #0D0D0D',
  transition: 'transform 80ms, box-shadow 80ms',
}

function QBtn({ icon: Icon, label, bg = '#fff', color = 'var(--text-primary)', onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...BTN_BASE, background: bg, color }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #0D0D0D' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #0D0D0D' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #0D0D0D' }}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

/**
 * @param {function} onRefresh
 * @param {function} onCall
 * @param {function} onSOSCheck
 * @param {function} onEditZones
 * @param {boolean}  refreshing
 */
export default function QuickActions({ onRefresh, onCall, onSOSCheck, onEditZones, refreshing = false }) {
  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
        QUICK ACTIONS
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <QBtn
          icon={RefreshCw}
          label={refreshing ? 'REFRESHING' : 'REFRESH'}
          bg="var(--slab-blue)"
          color="#fff"
          onClick={onRefresh}
          disabled={refreshing}
        />
        <QBtn
          icon={Phone}
          label="CALL"
          bg="#fff"
          onClick={onCall}
        />
        <QBtn
          icon={AlertOctagon}
          label="SOS CHECK"
          bg="var(--slab-red)"
          color="#fff"
          onClick={onSOSCheck}
        />
        <QBtn
          icon={MapPin}
          label="EDIT ZONES"
          bg="var(--slab-orange)"
          color="#fff"
          onClick={onEditZones}
        />
      </div>
    </div>
  )
}
