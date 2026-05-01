import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, RefreshCw, MapPin, ChevronDown } from 'lucide-react'

import WebLayout from '../../components/WebLayout'
import MultiChildMap from '../../components/MultiChildMap'
import StatusChip from '../../components/StatusChip'
import SafetyStatusBar, { deriveSafetyStatus } from '../../components/SafetyStatusBar'
import GeofenceStateCard from '../../components/GeofenceStateCard'
import AlertEventPanel from '../../components/AlertEventPanel'

import { mockChild as fallbackMock, mockNotifications } from '../../data/mock'
import { authHeaders } from '../../utils/auth'

const API_BASE = 'http://localhost:8080'
const AUTO_REFRESH_MS = 30_000

// Fetch the full list of registered children
async function fetchChildren() {
  const res = await fetch(`${API_BASE}/api/children`)
  if (!res.ok) return []
  const rows = await res.json()
  return Array.isArray(rows) ? rows.filter((c) => c.active) : []
}

// Fetch per-child data (dashboard + history + zones) in parallel
async function fetchChildData(childId) {
  const [dashRes, histRes, zonesRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/dashboard/${childId}`).then((r) => r.ok ? r.json() : null),
    fetch(`${API_BASE}/api/location/history/${childId}`).then((r) => r.ok ? r.json() : []),
    fetch(`${API_BASE}/api/safezones/${childId}`).then((r) => r.ok ? r.json() : []),
  ])
  return {
    dashboard: dashRes.status === 'fulfilled' ? dashRes.value : null,
    history:   histRes.status === 'fulfilled'  ? (histRes.value ?? []) : [],
    zones:     zonesRes.status === 'fulfilled' ? (zonesRes.value ?? []) : [],
  }
}

// Child selector tab strip
function ChildTabs({ children, selectedId, onSelect }) {
  if (!children.length) return null
  return (
    <div style={{
      display: 'flex',
      borderBottom: '3px solid var(--border)',
      background: 'var(--bg-base)',
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {children.map((c) => {
        const active = c.childId === selectedId
        return (
          <button
            key={c.childId}
            onClick={() => onSelect(c.childId)}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRight: '2px solid var(--border)',
              borderBottom: active ? '3px solid var(--slab-blue)' : '3px solid transparent',
              background: active ? '#fff' : 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontWeight: active ? 700 : 500,
              fontSize: '12px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: active ? 'var(--slab-blue)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              whiteSpace: 'nowrap',
              marginBottom: '-3px',
              transition: 'background 0.1s',
            }}
          >
            <div style={{
              width: '20px', height: '20px',
              background: active ? 'var(--slab-blue)' : 'var(--text-muted)',
              color: '#fff',
              fontSize: '10px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
            }}>
              {c.displayName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {c.displayName}
          </button>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  // ── Children list ───────────────────────────────────────────────────────────
  const [children, setChildren]   = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // ── Selected child data ─────────────────────────────────────────────────────
  const [data, setData]       = useState(null)
  const [history, setHistory] = useState([])
  const [zones, setZones]     = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetch, setLastFetch]   = useState(null)
  const [toastAlert, setToastAlert] = useState(null)
  const [settings, setSettings] = useState({ geofenceAlerts: true })
  const timerRef = useRef(null)
  const prevAlertsRef = useRef([])

  // ── Boot: load children list, pick first ───────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/settings`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSettings({ geofenceAlerts: data.geofenceAlerts !== false }) })
      .catch(() => {})

    fetchChildren()
      .then((list) => {
        setChildren(list)
        if (list.length > 0) setSelectedId(list[0].childId)
        else setLoading(false)         // no children registered
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Load data for selected child ───────────────────────────────────────────
  const load = useCallback(async (isManual = false) => {
    if (!selectedId) return
    if (isManual) setRefreshing(true)
    try {
      const result = await fetchChildData(selectedId)
      setData(result.dashboard ?? { child: fallbackMock, notifications: mockNotifications })
      setHistory(Array.isArray(result.history) ? result.history : [])
      setZones(Array.isArray(result.zones) ? result.zones.filter((z) => z.active) : [])
      setLastFetch(Date.now())
    } catch {
      setData({ child: fallbackMock, notifications: mockNotifications })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedId])

  // Re-fetch whenever selected child changes or on auto-refresh timer
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setData(null)
    setHistory([])
    setZones([])
    load()
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => load(), AUTO_REFRESH_MS)
    return () => clearInterval(timerRef.current)
  }, [load, selectedId])

  // ── Derived values ──────────────────────────────────────────────────────────
  const child   = data?.child ?? fallbackMock
  // Only show geofence-type alerts (no SOS — feature doesn't exist yet)
  const alerts  = (data?.notifications?.length ? data.notifications : mockNotifications)
    .filter((a) => a.type !== 'sos')

  useEffect(() => {
    let timer;
    if (alerts && alerts.length > 0) {
      const prevIds = new Set(prevAlertsRef.current.map(a => a.id))
      const newAlerts = alerts.filter(a => !prevIds.has(a.id))

      if (newAlerts.length > 0 && prevAlertsRef.current.length > 0 && settings.geofenceAlerts) {
        setToastAlert(newAlerts[0])
        timer = setTimeout(() => setToastAlert(null), 5000)
      }
      prevAlertsRef.current = alerts
    } else {
      prevAlertsRef.current = alerts || []
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [alerts, settings.geofenceAlerts])

  const geofenceViolated = child.currentZone === 'Outside' || child.currentZone == null
  const safetyStatus = deriveSafetyStatus({ online: child.online, geofenceViolated, hasSOS: false })

  const mapLocations = (child.location?.lat && child.location?.lng) ? [{
    childId:     selectedId ?? 'unknown',
    displayName: child.name,
    lat:         child.location.lat,
    lng:         child.location.lng,
    timestamp:   lastFetch ?? Date.now(),
  }] : []

  const zonesByChild = zones.length ? { [selectedId]: zones } : {}
  const lastUpdateLabel = child.lastSeen ?? '—'
  const unreadCount = alerts.filter((a) => !a.read).length

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefresh   = () => load(true)
  const handleEditZones = () => navigate('/zones')
  const handleSelectChild = (id) => { if (id !== selectedId) setSelectedId(id) }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <WebLayout active="map">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--text-muted)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--slab-blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            LOADING KIDGUARD...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </WebLayout>
    )
  }

  // ── No children registered ──────────────────────────────────────────────────
  if (!loading && children.length === 0) {
    return (
      <WebLayout active="map">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px' }}>👶</div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>No children registered yet.</div>
          <button onClick={() => navigate('/child-profile')} style={{ background: 'var(--slab-blue)', color: '#fff', border: '2px solid var(--border)', padding: '8px 20px', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ADD CHILD →
          </button>
        </div>
      </WebLayout>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <WebLayout active="map">
      {/* Safety Status Bar */}
      <SafetyStatusBar
        status={safetyStatus}
        childName={child.name}
        lastUpdate={lastUpdateLabel}
        deviceOnline={child.online}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Child tab strip — only shows when >1 child */}
      {children.length > 1 && (
        <ChildTabs
          children={children}
          selectedId={selectedId}
          onSelect={handleSelectChild}
        />
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{
          width: '340px', flexShrink: 0,
          borderRight: '3px solid var(--border)',
          overflowY: 'auto', padding: '18px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          background: 'var(--bg-base)',
        }}>
          {/* Child identity row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-display)', boxShadow: '2px 2px 0 #0D0D0D' }}>
                {child.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{child.name}</div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {lastFetch ? new Date(lastFetch).toLocaleTimeString('vi-VN') : '—'}
                </div>
              </div>
            </div>

            {/* Icon action row */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <StatusChip label={child.online ? 'ONLINE' : 'OFFLINE'} variant={child.online ? 'online' : 'offline'} />

              <button onClick={handleRefresh} disabled={refreshing} title="Refresh"
                style={{ background: '#fff', border: '2px solid var(--border)', padding: '6px', cursor: refreshing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #0D0D0D' }}>
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>

              <button onClick={handleEditZones} title="Edit safe zones"
                style={{ background: '#fff', border: '2px solid var(--border)', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 #0D0D0D' }}>
                <MapPin size={14} />
              </button>

              <button onClick={() => navigate('/notifications')} title="Alerts"
                style={{ background: '#fff', border: '2px solid var(--border)', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '2px 2px 0 #0D0D0D' }}>
                <Bell size={14} />
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '11px', height: '11px', background: 'var(--slab-orange)', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '7px', color: '#fff', fontWeight: 700 }}>{unreadCount}</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Geofence State */}
          <GeofenceStateCard
            zoneName={child.currentZone !== 'Outside' ? child.currentZone : null}
            geofenceViolated={geofenceViolated}
            distanceMeters={history[0]?.distanceFromCenterMeters ?? null}
            onEditZones={handleEditZones}
          />

          {/* Alert / Event Panel — geofence events only */}
          <AlertEventPanel
            alerts={alerts}
            onViewAll={() => navigate('/notifications')}
          />

          {/* GPS coords strip */}
          {child.location?.lat && (
            <div style={{ background: 'var(--bg-dark)', border: '2px solid var(--border)', padding: '10px 12px', boxShadow: '3px 3px 0 #0D0D0D' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
                LAST GPS FIX
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                {child.location.lat.toFixed(5)}, {child.location.lng.toFixed(5)}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#666', marginTop: '2px' }}>
                {lastUpdateLabel}
              </div>
            </div>
          )}

          {/* If only 1 child but want to show they can add more */}
          {children.length === 1 && (
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4px' }}>
              Monitoring <strong>1 child</strong> · Add more via{' '}
              <span onClick={() => navigate('/child-profile')} style={{ color: 'var(--slab-blue)', cursor: 'pointer', fontWeight: 600 }}>
                Child Profile
              </span>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Real Leaflet Map ────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MultiChildMap
            locations={mapLocations}
            zonesByChild={zonesByChild}
            height="100%"
          />

          {/* Floating bottom bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff', borderTop: '3px solid var(--border)',
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 -2px 0 #0D0D0D',
            zIndex: 1000,
          }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {child.location?.address || '—'}
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Updated {lastUpdateLabel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <StatusChip label="GPS LIVE" variant={child.online ? 'info' : 'offline'} />
              <button
                onClick={() => navigate('/map')}
                style={{ background: 'var(--slab-blue)', color: '#fff', border: '2.5px solid var(--border)', padding: '6px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '2px 2px 0 #0D0D0D' }}
              >
                OPEN FULL MAP →
              </button>
            </div>
          </div>
        </div>
      </div>

      {toastAlert && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastAlert.isArrival ? '#F0FFF4' : '#FFF8F0',
          border: '2px solid var(--border)',
          borderLeft: toastAlert.isArrival ? '5px solid var(--slab-green)' : '5px solid var(--slab-orange)',
          boxShadow: '4px 4px 0 #0D0D0D',
          padding: '12px 16px',
          width: '320px',
          display: 'flex', flexDirection: 'column', gap: '6px',
          animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ background: toastAlert.isArrival ? 'var(--slab-green)' : 'var(--slab-orange)', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', fontFamily: 'var(--font-body)' }}>
              {toastAlert.isArrival ? '✓ ARRIVED' : '⚠ GEOFENCE'}
            </span>
            <button 
              onClick={() => setToastAlert(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0, fontWeight: 700, color: 'var(--text-muted)' }}
            >×</button>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-primary)', marginTop: '4px' }}>
            <strong>{toastAlert.childName}</strong> {toastAlert.message}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {toastAlert.timestamp}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </WebLayout>
  )
}
