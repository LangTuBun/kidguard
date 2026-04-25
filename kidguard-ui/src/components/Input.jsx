import { useState } from 'react'

export default function Input({ label, type = 'text', placeholder, error, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: '#fff',
          border: error ? '3px solid var(--slab-red)' : focused ? '3px solid var(--slab-blue)' : '2px solid var(--border)',
          padding: '12px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          outline: 'none',
          width: '100%',
        }}
      />
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--slab-red)', fontFamily: 'var(--font-body)' }}>{error}</span>
      )}
    </div>
  )
}
