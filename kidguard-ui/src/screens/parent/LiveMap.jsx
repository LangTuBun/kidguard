import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebLayout from '../../components/WebLayout'
import StatusChip from '../../components/StatusChip'
import Button from '../../components/Button'
import MultiChildMap from '../../components/MultiChildMap'
import { loadChildrenConfig, mergeChildren, saveChildrenConfig } from '../../utils/childrenConfig'

function isActive(value) {
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value !== '0' && value.toLowerCase() !== 'false'
  return value !== false
}

export default function LiveMap() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [zonesByChild, setZonesByChild] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080'
  const [children, setChildren] = useState(() => loadChildrenConfig().filter((x) => x.active !== false))
  const childIds = useMemo(() => children.map((c) => c.childId), [children])

  const refreshLocation = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (childIds.length === 0) {
        const childRes = await fetch(`${apiBase}/api/children`)
        if (childRes.ok) {
          const childRows = await childRes.json().catch(() => [])
          const merged = mergeChildren(loadChildrenConfig(), childRows).filter((x) => x.active !== false)
          setChildren(prev => {
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev
            saveChildrenConfig(merged)
            return merged
          })
        }
        setLocations([])
        setLoading(false)
        return
      }

      const childRes = await fetch(`${apiBase}/api/children`)
      if (childRes.ok) {
        const childRows = await childRes.json().catch(() => [])
        const mergedChildren = mergeChildren(loadChildrenConfig(), childRows).filter((x) => x.active !== false)
        setChildren(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mergedChildren)) return prev
          saveChildrenConfig(mergedChildren)
          return mergedChildren
        })
      }

      const idsParam = encodeURIComponent(childIds.join(','))
      const response = await fetch(`${apiBase}/api/location/latest?childIds=${idsParam}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Khong lay duoc du lieu vi tri.')
      }
      const data = await response.json()
      const rows = Array.isArray(data) ? data : []
      const byId = new Map(children.map((c) => [c.childId, c]))
      const merged = rows
        .filter((row) => Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng)))
        .map((row) => ({
          ...row,
          lat: Number(row.lat),
          lng: Number(row.lng),
          timestamp: Number(row.timestamp),
          displayName: byId.get(row.childId)?.displayName || row.childId,
        }))
      setLocations(merged)

      const zoneRes = await fetch(`${apiBase}/api/safezones`)
      if (zoneRes.ok) {
        const zoneRows = await zoneRes.json().catch(() => [])
        const grouped = (Array.isArray(zoneRows) ? zoneRows : [])
          .filter((z) => isActive(z.active))
          .reduce((acc, z) => {
            const key = (Array.isArray(z.childIds) && z.childIds[0]) || '_unassigned'
            if (!acc[key]) acc[key] = []
            acc[key].push(z)
            return acc
          }, {})
        setZonesByChild(grouped)
      } else {
        setZonesByChild({})
      }
    } catch (apiError) {
      setLocations([])
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }, [apiBase, childIds, children])

  useEffect(() => {
    refreshLocation()
    const intervalId = setInterval(refreshLocation, 5000)
    return () => clearInterval(intervalId)
  }, [refreshLocation])

  const newest = useMemo(() => {
    if (locations.length === 0) return null
    return [...locations].sort((a, b) => b.timestamp - a.timestamp)[0]
  }, [locations])

  const updatedText = newest ? new Date(newest.timestamp).toLocaleString() : '--'

  return (
    <WebLayout active="map">
      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
            <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>LIVE</span>
            {' '}LOCATION
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusChip label={locations.length > 0 ? 'LIVE' : 'WAITING'} variant={locations.length > 0 ? 'online' : 'warning'} />
          <Button variant="ghost" onClick={refreshLocation}>REFRESH</Button>
        </div>
      </div>

      {/* Map + info panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Full-height map */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', zIndex: 0 }}>
          {locations.length > 0 ? (
            <MultiChildMap locations={locations} zonesByChild={zonesByChild} />
          ) : (
            <div style={{ padding: '20px', background: '#fff', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {loading ? 'Dang tai vi tri hien tai...' : 'Chua co du lieu GPS. Kiem tra backend (poll Arduino Cloud) va child_id.'}
            </div>
          )}
        </div>

        {/* Right info panel */}
        <div style={{
          width: '320px', flexShrink: 0,
          borderLeft: '2px solid var(--border)',
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Child header */}
          <div style={{ padding: '24px', borderBottom: '2px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', marginBottom: '8px' }}>
              {locations.length > 1 ? `${locations.length} CHILDREN` : (locations[0]?.displayName || 'NO CHILD')}
              </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
              {newest ? `${newest.lat.toFixed(6)}, ${newest.lng.toFixed(6)}` : '--'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {locations.length > 0 ? locations.map(loc => {
                const sortedZones = Array.isArray(loc.zoneStates)
                  ? [...loc.zoneStates].sort((a, b) => String(a.zoneName).localeCompare(String(b.zoneName)))
                  : []
                return (
                  <div
                    key={loc.childId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 16px',
                      backgroundColor: '#fff',
                      border: '2px solid #000',
                      boxShadow: '4px 4px 0px #000',
                      transition: 'all 0.15s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translate(2px, 2px)';
                      e.currentTarget.style.boxShadow = '2px 2px 0px #000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate(0px, 0px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px #000';
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
                      {loc.displayName || loc.childId}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {sortedZones.length === 0 ? (
                        <StatusChip label="NO ZONES" variant="offline" />
                      ) : sortedZones.map((z) => (
                        <StatusChip
                          key={z.zoneId}
                          label={z.zoneName}
                          variant={z.inside ? 'inside' : 'outside'}
                        />
                      ))}
                    </div>
                  </div>
                )
              }) : (
                <StatusChip label="WAITING FOR DATA" variant="warning" />
              )}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Updated {updatedText}
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--bg-base)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>DISTANCE</span>
              <span style={{ fontSize: '14px', color: 'var(--slab-orange)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                {newest?.distanceFromCenterMeters ? `${Math.round(newest.distanceFromCenterMeters)} m` : '--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--bg-base)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>STATUS</span>
              <StatusChip label={locations.length > 0 ? `${locations.length} ONLINE` : 'WAITING'} variant={locations.length > 0 ? 'online' : 'warning'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>TRACKING</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{childIds.length} child IDs</span>
            </div>
            {error && <div style={{ color: 'var(--slab-red)', fontSize: '12px' }}>{error}</div>}
          </div>

          {/* Actions */}
          <div style={{ padding: '20px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '2px solid var(--border)' }}>
            <Button fullWidth variant="ghost" onClick={() => navigate('/history')}>VIEW HISTORY →</Button>
            <Button fullWidth variant="primary" onClick={() => navigate('/zones')}>MANAGE ZONES →</Button>
          </div>
        </div>
      </div>
    </WebLayout>
  )
}
