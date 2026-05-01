import { useNavigate } from 'react-router-dom'
import { Asterisk } from 'lucide-react'
import Button from '../../components/Button'

export default function Splash() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav bar */}
      <div style={{
        padding: '0 40px', height: '64px', borderBottom: '2px solid var(--border)',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ border: '2px solid var(--border)', padding: '8px 14px', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Asterisk size={16} />
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
            KidGuard
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="ghost" onClick={() => navigate('/login')}>SIGN IN</Button>
          <Button variant="primary" onClick={() => navigate('/login')}>GET STARTED →</Button>
        </div>
      </div>

      {/* Hero content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative' }}>
        <div style={{ maxWidth: '760px', width: '100%', display: 'flex', gap: '60px', alignItems: 'center' }}>

          {/* Left: headline */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '56px', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: '8px' }}>
                ALWAYS KNOW
              </div>
              <div>
                <span style={{
                  background: 'var(--slab-orange)', color: '#fff',
                  padding: '4px 14px', display: 'inline',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '56px', lineHeight: 1.1,
                }}>
                  WHERE THEY ARE.
                </span>
              </div>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 36px', lineHeight: 1.6, maxWidth: '400px' }}>
              Real-time location monitoring for parents who care. Know your child is safe — wherever they are.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="primary" onClick={() => navigate('/login')}>GET STARTED →</Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>SIGN IN</Button>
            </div>
          </div>

          {/* Right: feature callouts */}
          <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'REAL-TIME TRACKING', desc: 'See their location live on a map', color: 'var(--slab-blue)' },
              { label: 'SAFE ZONES', desc: 'Get alerts when they leave an area', color: 'var(--slab-orange)' },
            ].map(f => (
              <div key={f.label} style={{ background: '#fff', border: '2px solid var(--border)', padding: '16px', boxShadow: '3px 3px 0 #0D0D0D' }}>
                <span style={{ background: f.color, color: '#fff', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px', fontFamily: 'var(--font-body)' }}>
                  {f.label}
                </span>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '8px' }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corner decorations */}
        <div style={{ position: 'absolute', bottom: '40px', right: '80px', width: '20px', height: '20px', background: 'var(--slab-blue)' }} />
        <div style={{ position: 'absolute', bottom: '64px', right: '108px', width: '12px', height: '12px', background: 'var(--slab-orange)' }} />
      </div>

      {/* Footer bar */}
      <div style={{ padding: '16px 40px', borderTop: '2px solid var(--border)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          CO3065 Advanced Software Engineering · HCMUT · Group 1
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          v1.0.0
        </span>
      </div>
    </div>
  )
}
