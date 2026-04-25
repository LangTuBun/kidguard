const variants = {
  online:  { background: 'var(--slab-green)', color: '#fff' },
  offline: { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' },
  inside:  { background: 'var(--slab-green)', color: '#fff' },
  outside: { background: 'var(--slab-orange)', color: '#fff' },
  warning: { background: 'var(--slab-orange)', color: '#fff' },
  danger:  { background: 'var(--slab-red)', color: '#fff' },
  info:    { background: 'var(--slab-blue)', color: '#fff' },
  white:   { background: '#fff', color: 'var(--text-muted)', border: '1.5px solid var(--border)' },
}

export default function StatusChip({ label, variant = 'info' }) {
  const v = variants[variant] || variants.info
  return (
    <span style={{
      ...v,
      border: v.border || '1.5px solid var(--border)',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '3px 8px',
      fontFamily: 'var(--font-body)',
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}
