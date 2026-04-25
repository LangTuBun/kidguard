import { useRef, useState } from 'react'

/**
 * 6-box OTP input.
 * @param {number} length
 * @param {function} onChange  - called with the current full string value
 */
export default function OTPInput({ length = 6, onChange }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const [focused, setFocused] = useState(null)
  const refs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...values]
    next[i] = val
    setValues(next)
    onChange?.(next.join(''))
    if (val && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          value={v}
          maxLength={1}
          inputMode="numeric"
          pattern="\d*"
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused(null)}
          style={{
            width: '48px', height: '56px',
            textAlign: 'center',
            fontSize: '20px', fontWeight: 600,
            fontFamily: 'var(--font-body)',
            background: '#fff',
            border: focused === i ? '3px solid var(--slab-blue)' : '2px solid var(--border)',
            outline: 'none',
            color: 'var(--text-primary)',
            transition: 'border 0.1s',
          }}
        />
      ))}
    </div>
  )
}
