import { useCallback, useEffect, useMemo, useState } from 'react'
import WebLayout from '../../components/WebLayout'
import StatusChip from '../../components/StatusChip'
import Button from '../../components/Button'
import { loadChildrenConfig, mergeChildren, saveChildrenConfig } from '../../utils/childrenConfig'
import {
  buildStaysFromHistory,
  formatDurationMs,
  sameLocalDay,
  startOfLocalDay,
  MIN_CONSECUTIVE_FOR_STAY,
  DEFAULT_STAY_RADIUS_M,
} from '../../utils/stayClusters'

function formatCoordLabel(lat, lng) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(5)}°${ns}, ${Math.abs(lng).toFixed(5)}°${ew}`
}

function formatClock(ts) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(ts),
  )
}

function formatFull(ts) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(ts))
}

function dayTabMeta(offsetFromToday) {
  const d = new Date()
  d.setDate(d.getDate() - offsetFromToday)
  d.setHours(0, 0, 0, 0)
  const start = d.getTime()
  const label =
    offsetFromToday === 0
      ? 'TODAY'
      : offsetFromToday === 1
        ? 'YESTERDAY'
        : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d).toUpperCase()
  return { label, start }
}

function overlapDurationMs(startA, endA, startB, endB) {
  const start = Math.max(startA, startB)
  const end = Math.min(endA, endB)
  return Math.max(0, end - start)
}

export default function History() {
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8080'
  const initialChildren = useMemo(() => loadChildrenConfig().filter((c) => c.active !== false), [])
  const [children, setChildren] = useState(initialChildren)
  const [childId, setChildId] = useState(initialChildren[0]?.childId || '')

  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [expandedKey, setExpandedKey] = useState(null)

  const dayTabs = useMemo(() => Array.from({ length: 7 }, (_, i) => dayTabMeta(i)), [])
  const rangeStart = dayTabs[dayTabs.length - 1]?.start ?? startOfLocalDay(new Date())
  const rangeEnd = (dayTabs[0]?.start ?? startOfLocalDay(new Date())) + 24 * 60 * 60 * 1000

  const loadChildren = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/children`)
      if (!res.ok) return
      const rows = await res.json().catch(() => [])
      const merged = mergeChildren(loadChildrenConfig(), rows).filter((c) => c.active !== false)
      setChildren(merged)
      saveChildrenConfig(merged)
      setChildId((current) => (merged.some((c) => c.childId === current) ? current : (merged[0]?.childId || '')))
    } catch {
      // Keep locally cached children when backend is unavailable.
    }
  }, [apiBase])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (!childId) {
        setRaw([])
        return
      }
      const params = new URLSearchParams({
        from: String(rangeStart),
        to: String(rangeEnd),
        limit: '10000',
      })
      const res = await fetch(`${apiBase}/api/location/history/${encodeURIComponent(childId)}?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Could not load history.')
      }
      const rows = await res.json()
      const normalized = (Array.isArray(rows) ? rows : []).map((r) => ({
        lat: Number(r.lat),
        lng: Number(r.lng),
        timestamp: Number(r.timestamp),
      }))
      setRaw(normalized)
    } catch (e) {
      setError(e.message || 'Load failed')
      setRaw([])
    } finally {
      setLoading(false)
    }
  }, [apiBase, childId, rangeStart, rangeEnd])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  useEffect(() => {
    load()
  }, [load])

  const { stays, shortClusters } = useMemo(
    () => buildStaysFromHistory(raw, { radiusMeters: DEFAULT_STAY_RADIUS_M, minConsecutive: MIN_CONSECUTIVE_FOR_STAY }),
    [raw],
  )

  const activeDayStart = dayTabs[activeTab]?.start ?? startOfLocalDay(new Date())
  const activeDayEnd = activeDayStart + 24 * 60 * 60 * 1000

  const staysForDay = useMemo(
    () =>
      stays
        .filter((s) => overlapDurationMs(s.startTs, s.endTs, activeDayStart, activeDayEnd) > 0)
        .map((s) => ({
          ...s,
          dayOverlapMs: overlapDurationMs(s.startTs, s.endTs, activeDayStart, activeDayEnd),
        })),
    [stays, activeDayStart, activeDayEnd],
  )

  const summary = useMemo(() => {
    const n = staysForDay.length
    const totalMs = staysForDay.reduce((a, s) => a + (s.dayOverlapMs || 0), 0)
    return {
      locationsVisited: n,
      totalTracked: formatDurationMs(totalMs),
    }
  }, [staysForDay])

  const shortSamplesOnDay = useMemo(
    () =>
      shortClusters.filter((c) => sameLocalDay(c.startTs, activeDayStart)).reduce((a, c) => a + c.sampleCount, 0),
    [shortClusters, activeDayStart],
  )

  const rawForDay = useMemo(
    () => raw.filter((p) => sameLocalDay(p.timestamp, activeDayStart)).sort((a, b) => b.timestamp - a.timestamp),
    [raw, activeDayStart],
  )

  return (
    <WebLayout active="history">
      <div
        style={{
          background: '#fff',
          borderBottom: '2px solid var(--border)',
          padding: '0 32px',
          height: '64px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
          LOCATION <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>HISTORY</span>
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {loading ? '…' : `${staysForDay.length} place${staysForDay.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div
        style={{
          background: 'var(--bg-base)',
          padding: '12px 32px',
          borderBottom: '2px solid var(--border)',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <select
          value={childId}
          onChange={(e) => {
            setChildId(e.target.value)
            setExpandedKey(null)
          }}
          disabled={children.length === 0}
          style={{
            border: '2px solid var(--border)',
            background: '#fff',
            padding: '6px 10px',
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {children.length === 0 ? (
            <option value="">No active children</option>
          ) : (
            children.map((child) => (
              <option key={child.childId} value={child.childId}>
                {child.displayName}
              </option>
            ))
          )}
        </select>
        {dayTabs.map((tab, i) => (
          <button
            key={tab.start}
            type="button"
            onClick={() => {
              setActiveTab(i)
              setExpandedKey(null)
            }}
            style={{
              padding: '6px 16px',
              background: i === activeTab ? 'var(--slab-blue)' : '#fff',
              color: i === activeTab ? '#fff' : 'var(--text-primary)',
              border: '2px solid var(--border)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 24px' }}>
          {error && (
            <div style={{ padding: '16px 0', color: 'var(--slab-red)', fontSize: '13px' }}>
              {error}{' '}
              <Button variant="ghost" onClick={load}>
                RETRY
              </Button>
            </div>
          )}

          {!loading && !error && children.length === 0 && (
            <div style={{ padding: '24px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              No active children to show history.
            </div>
          )}

          {!loading && !error && children.length > 0 && raw.length === 0 && (
            <div style={{ padding: '24px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              No GPS history in the last 7 days for this child.
            </div>
          )}

          {!loading && staysForDay.length === 0 && raw.length > 0 && (
            <div style={{ padding: '24px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', maxWidth: '520px' }}>
              No grouped stops on this day. A place appears when there are{' '}
              <strong>{MIN_CONSECUTIVE_FOR_STAY}+</strong> consecutive readings within ~{DEFAULT_STAY_RADIUS_M}m (same
              approximate spot).
              {shortSamplesOnDay > 0 && (
                <div style={{ marginTop: '12px', fontSize: '12px' }}>
                  {shortSamplesOnDay} sample(s) on this day were shorter clusters or movement between spots.
                </div>
              )}
            </div>
          )}

          {!loading && staysForDay.length === 0 && rawForDay.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  borderBottom: '2px solid var(--border)',
                  padding: '16px 0 8px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {dayTabs[activeTab].label} · RAW GPS TIMELINE
              </div>
              {rawForDay.slice(0, 20).map((row, i) => (
                <div
                  key={`${row.timestamp}-${i}`}
                  style={{
                    display: 'flex',
                    gap: '0',
                    padding: '12px 0',
                    borderBottom: '2px solid var(--border)',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: '64px', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {formatClock(row.timestamp)}
                    </span>
                  </div>
                  <div style={{ width: '24px', flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
                    <div style={{ width: '2px', background: '#C0BAB0', height: '100%', minHeight: '30px', borderLeft: '2px dashed #C0BAB0' }} />
                  </div>
                  <div style={{ flex: 1, paddingLeft: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      {formatCoordLabel(row.lat, row.lng)}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <StatusChip label="RAW POINT" variant="white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && staysForDay.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  borderBottom: '2px solid var(--border)',
                  padding: '16px 0 8px',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {dayTabs[activeTab].label} · STOPS
              </div>

              {staysForDay.map((stay, i) => {
                const durationMs = stay.dayOverlapMs || (stay.endTs - stay.startTs)
                const durationLabel = formatDurationMs(durationMs)
                const isOngoing =
                  activeTab === 0 &&
                  i === 0 &&
                  Date.now() - stay.endTs < 3 * 60_000
                const chip = isOngoing ? 'NOW' : durationLabel.toUpperCase()
                const rowKey = `${stay.startTs}-${stay.endTs}-${i}`
                const expanded = expandedKey === rowKey

                return (
                  <div key={rowKey}>
                    <button
                      type="button"
                      onClick={() => setExpandedKey(expanded ? null : rowKey)}
                      style={{
                        display: 'flex',
                        gap: '0',
                        padding: '16px 0',
                        borderBottom: '2px solid var(--border)',
                        alignItems: 'flex-start',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderTop: 'none',
                        cursor: 'pointer',
                        font: 'inherit',
                      }}
                    >
                      <div style={{ width: '64px', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {formatClock(stay.startTs)}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '24px',
                          flexShrink: 0,
                          display: 'flex',
                          justifyContent: 'center',
                          paddingTop: '4px',
                        }}
                      >
                        <div
                          style={{
                            width: '2px',
                            background: '#C0BAB0',
                            height: '100%',
                            minHeight: '48px',
                            borderLeft: '2px dashed #C0BAB0',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, paddingLeft: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                          {formatCoordLabel(stay.lat, stay.lng)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {stay.sampleCount} GPS samples · ~{DEFAULT_STAY_RADIUS_M}m cluster
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <StatusChip label={chip} variant="white" />
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--slab-blue)', marginTop: '8px', fontWeight: 600 }}>
                          {expanded ? '▲ Hide time range' : '▼ Show time range'}
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div
                        style={{
                          margin: '0 0 12px 88px',
                          padding: '12px 16px',
                          background: 'var(--bg-base)',
                          border: '2px solid var(--border)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}>
                          Time at this place
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>From · </span>
                          {formatFull(stay.startTs)}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>To · </span>
                          {formatFull(stay.endTs)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          Duration · {durationLabel}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          style={{
            width: '280px',
            flexShrink: 0,
            borderLeft: '2px solid var(--border)',
            background: '#fff',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-body)',
            }}
          >
            SUMMARY · {dayTabs[activeTab].label}
          </div>

          {[
            { label: 'LOCATIONS VISITED', value: String(summary.locationsVisited) },
            { label: 'TOTAL TIME (STOPS)', value: summary.totalTracked },
            {
              label: 'GROUPING RULE',
              value: `≥${MIN_CONSECUTIVE_FOR_STAY} pts`,
              sub: `~${DEFAULT_STAY_RADIUS_M}m radius`,
            },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: '12px', background: 'var(--bg-base)', border: '2px solid var(--border)' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-body)',
                  marginBottom: '4px',
                }}
              >
                {stat.label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px' }}>{stat.value}</div>
              {stat.sub && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.sub}</div>
              )}
            </div>
          ))}

          <Button variant="ghost" fullWidth onClick={load}>
            REFRESH DATA
          </Button>
        </div>
      </div>
    </WebLayout>
  )
}
