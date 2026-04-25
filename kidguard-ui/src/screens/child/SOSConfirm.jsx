import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileFrame from '../../components/MobileFrame'
import Button from '../../components/Button'

export default function SOSConfirm() {
  const [count, setCount] = useState(3)
  const navigate = useNavigate()

  useEffect(() => {
    if (count === 0) {
      navigate('/child/sos-sent')
      return
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, navigate])

  const progress = ((3 - count) / 3) * 100

  return (
    <MobileFrame>
      <div style={{
        flex: 1, padding: '24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '24px',
      }}>
        <span style={{ background: 'var(--slab-red)', color: '#fff', fontSize: '12px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '3px 10px', fontFamily: 'var(--font-body)' }}>
          SENDING SOS
        </span>

        {/* Square countdown */}
        <div style={{ width: '160px', height: '160px', border: '3px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
            <rect
              x="4" y="4" width="152" height="152"
              fill="none" stroke="var(--slab-red)" strokeWidth="4"
              strokeDasharray={608}
              strokeDashoffset={608 - (608 * progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '48px', color: 'var(--slab-red)' }}>
            {count}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: '8px' }}>
            KEEP HOLDING TO SEND SOS
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Release to cancel
          </div>
        </div>

        <Button fullWidth variant="ghost" onClick={() => navigate('/child')}
          style={{ border: '2px solid var(--slab-red)', color: 'var(--slab-red)' }}>
          CANCEL
        </Button>
      </div>
    </MobileFrame>
  )
}
