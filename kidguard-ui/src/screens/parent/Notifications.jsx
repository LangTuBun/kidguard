import { useCallback, useEffect, useMemo, useState } from 'react'
import WebLayout from '../../components/WebLayout'
import NotificationCard from '../../components/NotificationCard'
import Button from '../../components/Button'
import { loadChildrenConfig } from '../../utils/childrenConfig'

const filters = ['ALL', 'GEOFENCE']

export default function Notifications() {
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080'
  const children = useMemo(() => loadChildrenConfig().filter((c) => c.active !== false), [])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState(0)

  const loadAlerts = useCallback(async () => {
    setError('')
    try {
      if (children.length === 0) {
        setAlerts([])
        setLoading(false)
        return
      }
      const idsParam = encodeURIComponent(children.map((c) => c.childId).join(','))
      const res = await fetch(`${apiBase}/api/location/latest?childIds=${idsParam}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Cannot load alerts.')
      }
      const rows = await res.json()
      const now = Date.now()
      const byId = new Map(children.map((c) => [c.childId, c]))
      const dynamicAlerts = (Array.isArray(rows) ? rows : [])
        .filter((row) => row.geofenceViolated === true || row.geofenceViolated === 1)
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .map((row, i) => {
          const child = byId.get(row.childId)
          const ts = Number(row.timestamp)
          const ageMin = Number.isFinite(ts) ? Math.max(0, Math.floor((now - ts) / 60000)) : null
          return {
            id: `outside-${row.childId}-${ts || i}`,
            type: 'geofence',
            childName: child?.displayName || row.childId,
            message: 'is outside the safe zone',
            timestamp: Number.isFinite(ts) ? new Date(ts).toLocaleString() : 'Unknown time',
            ageMin,
            read: false,
          }
        })
      setAlerts(dynamicAlerts)
    } catch (e) {
      setError(e.message || 'Cannot load alerts.')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [apiBase, children])

  useEffect(() => {
    loadAlerts()
    const id = setInterval(loadAlerts, 10000)
    return () => clearInterval(id)
  }, [loadAlerts])

  const unreadCount = alerts.filter((n) => !n.read).length

  const filtered = activeFilter === 0
    ? alerts
    : alerts.filter(n => n.type === filters[activeFilter].toLowerCase())

  return (
    <WebLayout active="alerts">
      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>ALERTS</span>
          <div style={{
            width: '22px', height: '22px', background: 'var(--slab-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{unreadCount}</span>
          </div>
        </div>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {loading ? 'Loading...' : `${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{
        padding: '0 32px', borderBottom: '2px solid var(--border)',
        background: '#fff', flexShrink: 0,
        display: 'flex',
      }}>
        {filters.map((f, i) => (
          <button key={f} onClick={() => setActiveFilter(i)} style={{
            height: '44px', padding: '0 24px',
            background: 'transparent',
            color: activeFilter === i ? 'var(--slab-blue)' : 'var(--text-muted)',
            border: 'none',
            borderBottom: activeFilter === i ? '3px solid var(--slab-blue)' : '3px solid transparent',
            fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {error && (
            <div style={{ color: 'var(--slab-red)', fontSize: '12px', marginBottom: '8px' }}>
              {error}
            </div>
          )}
          {filtered.map(n => <NotificationCard key={n.id} notification={n} />)}
          {!loading && filtered.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No alerts right now. Children are inside configured zones.
            </div>
          )}
        </div>

        {/* Right summary panel */}
        <div style={{
          width: '260px', flexShrink: 0,
          borderLeft: '2px solid var(--border)',
          background: '#fff', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
            OVERVIEW
          </div>
          {[
            { label: 'UNREAD', value: unreadCount, color: 'var(--slab-red)' },
            { label: 'GEOFENCE', value: alerts.filter(n => n.type === 'geofence').length, color: 'var(--slab-blue)' },
            { label: 'TOTAL ACTIVE', value: alerts.length, color: 'var(--text-primary)' },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--bg-base)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
                {stat.label}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
          <Button variant="ghost" fullWidth onClick={loadAlerts}>REFRESH ALERTS</Button>
        </div>
      </div>
    </WebLayout>
  )
}
