import { BarChart2 } from 'lucide-react'

function pct(n, d) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}

function hoursLabel(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/**
 * Client-side analytics derived from location_history.
 * Zero new API calls — uses historyPoints from the existing /api/location/history/:childId
 *
 * @param {Array<{lat,lng,timestamp,geofenceViolated}>} historyPoints  newest first
 */
export default function AnalyticsMiniBar({ historyPoints = [] }) {
  if (!historyPoints.length) return null

  const now = Date.now()
  const oneDayAgo = now - 86400000

  const todayPoints = historyPoints.filter((p) => p.timestamp >= oneDayAgo)
  const breachesToday = todayPoints.filter((p) => p.geofenceViolated).length
  const safePoints = todayPoints.filter((p) => !p.geofenceViolated).length
  const safePercent = pct(safePoints, todayPoints.length)

  const sorted = [...historyPoints].sort((a, b) => a.timestamp - b.timestamp)
  const first = sorted[0]?.timestamp
  const last = sorted[sorted.length - 1]?.timestamp
  const activeMs = first && last ? last - first : 0

  const stats = [
    { label: 'SAFE TIME', value: `${safePercent}%`, color: safePercent >= 80 ? 'var(--slab-green)' : safePercent >= 50 ? 'var(--slab-orange)' : 'var(--slab-red)' },
    { label: 'BREACHES TODAY', value: `${breachesToday}`, color: breachesToday === 0 ? 'var(--slab-green)' : 'var(--slab-red)' },
    { label: 'ACTIVE SPAN', value: activeMs ? hoursLabel(activeMs) : '—', color: 'var(--slab-blue)' },
    { label: 'DATA POINTS', value: `${historyPoints.length}`, color: 'var(--text-muted)' },
  ]

  return (
    <div style={{ background: '#fff', border: '3px solid var(--border)', boxShadow: '4px 4px 0 #0D0D0D', overflow: 'hidden' }}>
      <div style={{ background: 'var(--bg-dark)', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <BarChart2 size={13} color="#fff" />
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
          LOCATION ANALYTICS · TODAY
        </span>
      </div>
      <div style={{ display: 'flex' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '12px 10px', borderRight: i < stats.length - 1 ? '2px solid var(--bg-base)' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '4px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
