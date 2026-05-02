export default function NotificationCard({ notification }) {
  const accent = notification.type === 'geofence'
    ? (notification.isArrival ? 'var(--slab-green, #1A8C4E)' : 'var(--slab-orange, #E8631A)')
    : notification.type === 'sos'
      ? 'var(--slab-red, #E14B3A)'
      : 'var(--slab-blue)'
  return (
    <div style={{
      background: '#fff',
      border: '2px solid var(--border)',
      borderLeft: `4px solid ${accent}`,
      boxShadow: '3px 3px 0 #0D0D0D',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
        <strong>{notification.childName}</strong> {notification.message}
      </span>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {notification.timestamp}
      </span>
    </div>
  )
}
