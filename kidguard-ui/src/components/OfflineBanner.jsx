export default function OfflineBanner() {
  return (
    <div style={{
      background: 'var(--slab-orange)',
      color: '#fff',
      borderBottom: '2px solid var(--border)',
      height: '44px',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>
        ⚠ NO INTERNET CONNECTION
      </span>
      <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        RETRY →
      </span>
    </div>
  )
}
