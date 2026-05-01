import { Shield, ShieldAlert, Edit3 } from 'lucide-react'

export default function GeofenceStateCard({ zoneName = null, geofenceViolated = false, distanceMeters = null, onEditZones }) {
  const inside = !geofenceViolated && zoneName
  const label = inside ? `Inside ${zoneName} Zone` : 'Outside All Zones'
  const slabBg = inside ? 'var(--slab-green)' : 'var(--slab-red)'
  const Icon = inside ? Shield : ShieldAlert

  return (
    <div style={{ background: '#fff', border: '3px solid var(--border)', boxShadow: '4px 4px 0 #0D0D0D', overflow: 'hidden' }}>
      <div style={{ background: slabBg, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon size={22} color="#fff" strokeWidth={2.5} />
          <div>
            <div style={{ color: '#fff', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', opacity: 0.8, marginBottom: '2px' }}>
              GEOFENCE STATUS
            </div>
            <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {inside ? '✓' : '⚠'} {label}
            </div>
          </div>
        </div>
        {onEditZones && (
          <button onClick={onEditZones} title="Edit safe zones" style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', fontFamily: 'var(--font-body)', textTransform: 'uppercase' }}>
            <Edit3 size={12} /> EDIT
          </button>
        )}
      </div>
      {distanceMeters != null && (
        <div style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', borderTop: '1.5px solid var(--bg-base)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{Math.round(distanceMeters)} m</span>
          from {inside ? 'zone center' : 'nearest zone center'}
        </div>
      )}
      {zoneName === null && !geofenceViolated && (
        <div style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', borderTop: '1.5px solid var(--bg-base)' }}>
          No safe zones configured.{' '}{onEditZones && <span onClick={onEditZones} style={{ color: 'var(--slab-blue)', cursor: 'pointer', fontWeight: 600 }}>Add one →</span>}
        </div>
      )}
    </div>
  )
}
