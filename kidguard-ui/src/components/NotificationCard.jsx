export default function NotificationCard({ notification }) {
  const isSOS = notification.type === 'sos'
  return (
    <div style={{
      background: isSOS ? '#FAF0F0' : '#fff',
      border: '2px solid var(--border)',
      borderLeft: isSOS ? '4px solid var(--slab-red)' : '4px solid var(--slab-blue)',
      boxShadow: '3px 3px 0 #0D0D0D',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      {isSOS && (
        <span style={{
          background: 'var(--slab-red)', color: '#fff',
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', padding: '2px 6px',
          display: 'inline-block', width: 'fit-content',
          fontFamily: 'var(--font-body)',
        }}>
          SOS ALERT
        </span>
      )}
      <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
        <strong>{notification.childName}</strong> {notification.message}
      </span>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {notification.timestamp}
      </span>
    </div>
  )
}
