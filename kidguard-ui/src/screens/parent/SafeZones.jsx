import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebLayout from '../../components/WebLayout'
import Button from '../../components/Button'
import ZoneCard from '../../components/ZoneCard'
import MultiChildMap from '../../components/MultiChildMap'
import { loadChildrenConfig } from '../../utils/childrenConfig'

export default function SafeZones() {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080'
  const children = useMemo(() => loadChildrenConfig(), [])
  const [zones, setZones] = useState([])
  const [latest, setLatest] = useState([])
  const [error, setError] = useState('')

  const activeCount = zones.filter((z) => Boolean(z.active)).length

  const loadData = useCallback(async () => {
    setError('')
    try {
      const allChildIds = children.map((c) => c.childId).filter(Boolean)
      if (allChildIds.length === 0) {
        setZones([])
        setLatest([])
        return
      }
      const [zoneRes, locRes] = await Promise.all([
        fetch(`${apiBase}/api/safezones`),
        fetch(`${apiBase}/api/location/latest?childIds=${encodeURIComponent(allChildIds.join(','))}`),
      ])
      if (!zoneRes.ok) {
        const data = await zoneRes.json().catch(() => ({}))
        throw new Error(data.message || 'Cannot load zones.')
      }
      const zoneRows = await zoneRes.json()
      setZones(Array.isArray(zoneRows) ? zoneRows : [])
      if (locRes.ok) {
        const locRows = await locRes.json().catch(() => [])
        setLatest(Array.isArray(locRows) ? locRows : [])
      } else {
        setLatest([])
      }
    } catch (e) {
      setError(e.message || 'Cannot load zones.')
      setZones([])
    }
  }, [apiBase, children])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function toggleZone(zone) {
    await fetch(`${apiBase}/api/safezones/${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !Boolean(zone.active) }),
    })
    loadData()
  }

  async function deleteZone(zoneId) {
    await fetch(`${apiBase}/api/safezones/${zoneId}`, { method: 'DELETE' })
    loadData()
  }

  return (
    <WebLayout active="zones">
      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>SAFE ZONES</span>
          <span style={{ background: 'var(--slab-blue)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', fontFamily: 'var(--font-body)' }}>
            {activeCount} ACTIVE
          </span>
        </div>
        <Button variant="primary" onClick={() => navigate('/zones/add')}>＋ ADD NEW ZONE</Button>
      </div>

      {/* Content: zones list + map */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: zones list */}
        <div style={{
          width: '400px', flexShrink: 0,
          borderRight: '2px solid var(--border)',
          overflowY: 'auto', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            Each safe zone is assigned to a specific child.
          </p>
          {error && <div style={{ color: 'var(--slab-red)', fontSize: '12px' }}>{error}</div>}
          {zones.map((zone) => {
            const ids = Array.isArray(zone.childIds) ? zone.childIds : []
            const names = Array.isArray(zone.childDisplayNames) && zone.childDisplayNames.length === ids.length
              ? zone.childDisplayNames
              : ids.map((id) => children.find((c) => c.childId === id)?.displayName || id)
            return (
              <ZoneCard
                key={zone.id}
                zone={{
                  id: zone.id,
                  name: zone.zoneName,
                  type: zone.shapeType || 'circle',
                  radius: `${Math.round(zone.radiusMeters)}m`,
                  active: Boolean(zone.active),
                  childNames: names,
                }}
                onToggle={() => toggleZone(zone)}
                onDelete={() => deleteZone(zone.id)}
                onEdit={() => navigate(`/zones/edit/${zone.id}`)}
              />
            )
          })}
          <div style={{ marginTop: '8px' }}>
            <Button fullWidth variant="ghost" onClick={() => navigate('/zones/add')}>＋ ADD NEW ZONE</Button>
          </div>
        </div>

        {/* Right: zone map preview */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MultiChildMap
            locations={(Array.isArray(latest) ? latest : []).map((row) => ({
              ...row,
              lat: Number(row.lat),
              lng: Number(row.lng),
              timestamp: Number(row.timestamp),
              displayName: children.find((c) => c.childId === row.childId)?.displayName || row.childId,
            }))}
            zonesByChild={zones
              .filter((z) => Boolean(z.active))
              .reduce((acc, z) => {
                const key = (Array.isArray(z.childIds) && z.childIds[0]) || '_unassigned'
                if (!acc[key]) acc[key] = []
                acc[key].push({ ...z, shapeType: z.shapeType || 'circle' })
                return acc
              }, {})}
          />
          <div style={{
            position: 'absolute', top: '16px', left: '16px',
            background: '#fff', border: '2px solid var(--border)',
            padding: '8px 12px', boxShadow: '3px 3px 0 #0D0D0D',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)', letterSpacing: '0.06em' }}>
              ZONE PREVIEW
            </span>
          </div>
        </div>
      </div>
    </WebLayout>
  )
}
