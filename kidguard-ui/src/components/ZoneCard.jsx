import { useEffect, useState } from 'react'

const colors = ['#2A5BF5', '#E8631A', '#1A8C4E', '#D92B2B']

export default function ZoneCard({ zone, onToggle, onDelete, onEdit }) {
  const [active, setActive] = useState(zone.active)
  const color = colors[zone.id % colors.length]

  useEffect(() => {
    setActive(zone.active)
  }, [zone.active])

  return (
    <div style={{
      background: '#fff', border: '2px solid var(--border)',
      boxShadow: '3px 3px 0 #0D0D0D',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ width: '12px', height: '12px', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
          {zone.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          {zone.type} · {zone.radius}
        </div>
      </div>
      <div
        onClick={() => {
          const next = !active
          setActive(next)
          onToggle?.(next)
        }}
        style={{
          width: '44px', height: '24px',
          background: active ? 'var(--slab-blue)' : 'var(--text-muted)',
          border: '2px solid var(--border)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '2px',
          left: active ? '22px' : '2px',
          width: '16px', height: '16px',
          background: '#fff',
          border: '1px solid var(--border)',
          transition: 'left 0.2s',
        }} />
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              border: '2px solid var(--border)',
              color: 'var(--text-primary)',
              background: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '4px 8px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            EDIT
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              border: '2px solid var(--slab-red)',
              color: 'var(--slab-red)',
              background: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '4px 8px',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            DEL
          </button>
        )}
      </div>
    </div>
  )
}
