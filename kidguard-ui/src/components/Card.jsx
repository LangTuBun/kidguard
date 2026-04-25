export default function Card({ children, style = {}, padding = '20px', heavy = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: heavy ? '3px solid var(--border)' : '2px solid var(--border)',
      boxShadow: '4px 4px 0 #0D0D0D',
      padding,
      ...style,
    }}>
      {children}
    </div>
  )
}
