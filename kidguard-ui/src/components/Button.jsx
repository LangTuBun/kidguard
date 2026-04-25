export default function Button({ children, variant = 'primary', size = 'default', fullWidth = false, onClick, style = {} }) {
  const variants = {
    primary: { background: 'var(--slab-blue)', color: '#fff', border: '2px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--text-primary)', border: '2px solid var(--border)' },
    danger: { background: 'var(--slab-red)', color: '#fff', border: '2px solid var(--border)' },
    dark: { background: 'var(--bg-dark)', color: '#fff', border: '2px solid var(--border)' },
  }
  const heights = { default: '48px', sm: '40px' }

  return (
    <button
      onClick={onClick}
      style={{
        ...variants[variant],
        height: heights[size],
        width: fullWidth ? '100%' : 'auto',
        padding: '0 20px',
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.1s, box-shadow 0.1s',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translate(-2px, -2px)'
        e.currentTarget.style.boxShadow = '2px 2px 0 #0D0D0D'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translate(0, 0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </button>
  )
}
