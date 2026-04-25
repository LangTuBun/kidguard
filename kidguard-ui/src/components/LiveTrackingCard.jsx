import { Navigation, MapPin, Clock } from 'lucide-react'

/** Returns 'moving' if the last two history points are >20 m apart, else 'stationary'. */
function deriveMovementStatus(historyPoints = []) {
  if (!historyPoints || historyPoints.length < 2) return 'stationary'
  const [a, b] = [historyPoints[0], historyPoints[1]]
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  const dist = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return dist > 20 ? 'moving' : 'stationary'
}

function fmtTs(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return '—'
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {string} address
 * @param {string} lastUpdate
 * @param {number|null} distanceFromCenter  meters
 * @param {Array<{lat,lng,timestamp}>} historyPoints  newest first
 */
export default function LiveTrackingCard({
  lat,
  lng,
  address,
  lastUpdate,
  distanceFromCenter,
  historyPoints = [],
}) {
  const movement = deriveMovementStatus(historyPoints)
  const crumbs = historyPoints.slice(0, 4)

  return (
    <div style={{
      background: '#fff',
      border: '3px solid var(--border)',
      boxShadow: '4px 4px 0 #0D0D0D',
      overflow: 'hidden',
    }}>
      {/* Header slab */}
      <div style={{
        background: 'var(--slab-blue)',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-body)',
        }}>
          📍 LIVE TRACKING
        </span>
        <span style={{
          background: movement === 'moving'
            ? 'var(--slab-orange)'
            : 'rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          padding: '2px 8px',
          fontFamily: 'var(--font-body)',
          border: '1.5px solid rgba(255,255,255,0.4)',
        }}>
          {movement === 'moving' ? '▶ MOVING' : '■ STATIONARY'}
        </span>
      </div>

      <div style={{ padding: '14px' }}>
        {/* Coords row */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-primary)',
          fontWeight: 600,
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Navigation size={12} style={{ color: 'var(--slab-blue)', flexShrink: 0 }} />
          {lat != null && lng != null
            ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : '—'}
        </div>

        {/* Address */}
        {address && (
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            display: 'flex',
            gap: '5px',
            alignItems: 'flex-start',
          }}>
            <MapPin size={11} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{address}</span>
          </div>
        )}

        {/* Distance from zone center */}
        {distanceFromCenter != null && (
          <div style={{
            background: 'var(--bg-base)',
            border: '1.5px solid var(--border)',
            padding: '5px 10px',
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(distanceFromCenter)} m
            </span>
            from nearest zone center
          </div>
        )}

        {/* Trajectory breadcrumb */}
        {crumbs.length > 0 && (
          <>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <Clock size={10} />
              RECENT TRAJECTORY
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {crumbs.map((pt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    background: i === 0 ? 'var(--slab-blue)' : 'var(--bg-base)',
                    border: '1.5px solid var(--border)',
                    padding: '3px 7px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: i === 0 ? 700 : 400,
                    color: i === 0 ? '#fff' : 'var(--text-muted)',
                  }}>
                    {fmtTs(pt.timestamp)}
                  </div>
                  {i < crumbs.length - 1 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Updated at */}
        <div style={{
          marginTop: '10px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          borderTop: '1.5px solid var(--bg-base)',
          paddingTop: '8px',
        }}>
          Last GPS ping: {lastUpdate}
        </div>
      </div>
    </div>
  )
}
