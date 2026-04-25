import { RefreshCw } from 'lucide-react'

/** Derives a three-way status from live telemetry. Pure — no side-effects. */
export function deriveSafetyStatus({ online, geofenceViolated, hasSOS }) {
  if (!online) return 'unknown'
  if (geofenceViolated || hasSOS) return 'danger'
  return 'safe'
}

const STATUS_CONFIG = {
  safe: {
    bg: 'var(--slab-green)',
    color: '#fff',
    badge: '✓ SAFE',
    label: 'Child is within a safe zone',
  },
  danger: {
    bg: 'var(--slab-red)',
    color: '#fff',
    badge: '⚠ DANGER',
    label: 'Attention required — check alerts',
  },
  unknown: {
    bg: 'var(--bg-dark)',
    color: '#fff',
    badge: '? UNKNOWN',
    label: 'Device offline or no data',
  },
}

/**
 * Top-of-dashboard full-width safety status bar.
 *
 * @param {'safe'|'danger'|'unknown'} status
 * @param {string} childName
 * @param {string} lastUpdate  - human-readable, e.g. "2 min ago"
 * @param {boolean} deviceOnline
 * @param {boolean} refreshing
 * @param {function} onRefresh
 */
export default function SafetyStatusBar({
  status = 'unknown',
  childName = 'Child',
  lastUpdate = '—',
  deviceOnline = false,
  refreshing = false,
  onRefresh,
}) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unknown

  return (
    <div style={{
      background: cfg.bg,
      borderBottom: '3px solid var(--border)',
      padding: '0 28px',
      height: '56px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 0 #0D0D0D',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Left — badge + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{
          background: 'rgba(255,255,255,0.18)',
          border: '2px solid rgba(255,255,255,0.5)',
          color: cfg.color,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '4px 12px',
          fontFamily: 'var(--font-display)',
          ...(status === 'danger' ? {
            animation: 'dangerFlash 1.2s ease-in-out infinite alternate',
          } : {}),
        }}>
          {cfg.badge}
        </span>
        <span style={{
          color: cfg.color,
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 500,
          opacity: 0.9,
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Right — meta info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Device status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px',
            background: deviceOnline ? '#4eff91' : '#aaa',
            border: '1.5px solid rgba(255,255,255,0.4)',
          }} />
          <span style={{ color: cfg.color, fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>
            {deviceOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Last update */}
        <span style={{ color: cfg.color, fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
          Updated {lastUpdate}
        </span>

        {/* Child name */}
        <span style={{
          color: cfg.color,
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          borderLeft: '2px solid rgba(255,255,255,0.3)',
          paddingLeft: '16px',
        }}>
          {childName.toUpperCase()}
        </span>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh data"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.4)',
              color: cfg.color,
              cursor: refreshing ? 'wait' : 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        )}
      </div>

      <style>{`
        @keyframes dangerFlash {
          from { background: rgba(255,255,255,0.18); }
          to   { background: rgba(255,255,255,0.35); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
