import { useMemo, useState } from 'react'
import MobileFrame from '../../components/MobileFrame'
import StatusChip from '../../components/StatusChip'
import Button from '../../components/Button'
import { loadChildrenConfig } from '../../utils/childrenConfig'

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export default function ChildHome() {
  const child = useMemo(() => loadChildrenConfig().find((c) => c.active !== false) || null, [])
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')

  const handleSos = async () => {
    if (!child?.childId) {
      setStatus('No child profile is linked to this device yet.')
      return
    }
    if (!window.confirm('Send an SOS alert to your parents?')) return
    setSending(true)
    setStatus('')
    try {
      const res = await fetch(`${API_BASE}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.childId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send SOS.')
      }
      setStatus('SOS sent — your parents have been alerted.')
    } catch (e) {
      setStatus(e.message || 'Failed to send SOS.')
    } finally {
      setSending(false)
    }
  }

  return (
    <MobileFrame maxWidth="480px">
      {/* Top strip */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 20px', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}>
          KIDGUARD
        </span>
        <StatusChip label="YOU'RE SAFE" variant="online" />
      </div>

      <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status card */}
        <div style={{
          background: '#fff', border: '3px solid var(--border)',
          boxShadow: '4px 4px 0 #0D0D0D', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <span style={{ background: 'var(--slab-green)', color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', display: 'inline-block', width: 'fit-content', fontFamily: 'var(--font-body)' }}>
            LOCATION SHARING ACTIVE
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>📍 Sharing with</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}>Dad</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{child?.displayName || 'Child'}</span>
          </div>
        </div>

        {/* SOS section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.12em', fontFamily: 'var(--font-body)' }}>
            NEED HELP?
          </div>
          <Button fullWidth variant="primary" onClick={handleSos} disabled={sending}>
            {sending ? 'SENDING…' : '🚨 SEND SOS'}
          </Button>
          {status && (
            <span style={{ fontSize: '12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: status.startsWith('SOS sent') ? 'var(--slab-green)' : 'var(--slab-red)' }}>
              {status}
            </span>
          )}
        </div>
      </div>
    </MobileFrame>
  )
}
