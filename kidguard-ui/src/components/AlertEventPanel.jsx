import { MapPin, WifiOff, ArrowRight } from 'lucide-react'

const PRIORITY = { geofence: 0, offline: 1 }

const ALERT_STYLES = {
  geofenceActive: {
    borderLeft: '5px solid var(--slab-red)',
    background: '#FFF0F0',
    badge: { bg: 'var(--slab-red)', label: '⛔ ACTIVE' },
  },
  geofenceLeave: {
    borderLeft: '5px solid var(--slab-orange)',
    background: '#FFF8F0',
    badge: { bg: 'var(--slab-orange)', label: '⚠ GEOFENCE' },
  },
  geofenceArrive: {
    borderLeft: '5px solid var(--slab-green)',
    background: '#F0FFF4',
    badge: { bg: 'var(--slab-green)', label: '✓ ARRIVED' },
  },
  offline: {
    borderLeft: '5px solid var(--bg-dark)',
    background: '#F8F8F8',
    badge: { bg: 'var(--bg-dark)', label: '📴 OFFLINE' },
  },
}

function AlertItem({ alert }) {
  const styleKey = alert.type === 'geofence'
    ? (alert.isActive ? 'geofenceActive' : (alert.isArrival ? 'geofenceArrive' : 'geofenceLeave'))
    : alert.type
  const style = ALERT_STYLES[styleKey] || ALERT_STYLES.offline
  return (
    <div style={{ ...style, border: '2px solid var(--border)', boxShadow: '3px 3px 0 #0D0D0D', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ background: style.badge.bg, color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', fontFamily: 'var(--font-body)' }}>
          {style.badge.label}
        </span>
        {!alert.read && (
          <div style={{ width: '7px', height: '7px', background: 'var(--slab-red)', border: '1.5px solid var(--border)' }} />
        )}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
        <strong>{alert.childName}</strong> {alert.message}
      </div>
      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {alert.timestamp}
      </div>
    </div>
  )
}

/**
 * @param {Array<{id,type:'geofence'|'offline',childName,message,timestamp,read}>} alerts
 * @param {function} onViewAll
 */
export default function AlertEventPanel({ alerts = [], onViewAll }) {
  const sorted = [...alerts]
    .filter((a) => a.type !== 'sos')   // SOS feature not implemented
    .sort((a, b) => (PRIORITY[a.type] ?? 9) - (PRIORITY[b.type] ?? 9))

  return (
    <div style={{ background: '#fff', border: '3px solid var(--border)', boxShadow: '4px 4px 0 #0D0D0D', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-dark)', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} />
          GEOFENCE EVENTS
          {sorted.length > 0 && (
            <span style={{ background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.4)', fontSize: '10px', padding: '1px 6px' }}>
              {sorted.length}
            </span>
          )}
        </span>
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--slab-green)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px' }}>
            ✓ No active alerts
          </div>
        ) : (
          sorted.slice(0, 3).map((a) => <AlertItem key={a.id} alert={a} />)
        )}

        {onViewAll && sorted.length > 0 && (
          <button
            onClick={onViewAll}
            style={{ background: 'var(--bg-base)', border: '2px solid var(--border)', padding: '8px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            VIEW ALL ALERTS <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
