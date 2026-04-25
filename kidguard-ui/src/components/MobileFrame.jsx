/**
 * Centered auth / focused layout.
 * Used for login, register, MFA, and child app screens.
 * No sidebar — full-page beige canvas with a centered content panel.
 */
export default function MobileFrame({ children, maxWidth = '520px' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth,
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '560px',
      }}>
        {children}
      </div>
    </div>
  )
}
