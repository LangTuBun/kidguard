import { useNavigate } from 'react-router-dom'
import { Pencil, UserPlus, Activity, Settings2, Trash2 } from 'lucide-react'
import WebLayout from '../../components/WebLayout'
import Card from '../../components/Card'
import Input from '../../components/Input'
import StatusChip from '../../components/StatusChip'
import Button from '../../components/Button'
import { useEffect, useMemo, useState } from 'react'
import { loadChildrenConfig, mergeChildren, saveChildrenConfig } from '../../utils/childrenConfig'

export default function ChildProfile() {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8080'
  const initialChildren = useMemo(() => loadChildrenConfig().filter((x) => x.active !== false), [])
  const [children, setChildren] = useState(initialChildren)
  const [sharing, setSharing] = useState(true)
  
  const [newName, setNewName] = useState('')
  const [newChildId, setNewChildId] = useState('')
  const [newThingId, setNewThingId] = useState('')
  const [newArduinoClientId, setNewArduinoClientId] = useState('')
  const [newArduinoClientSecret, setNewArduinoClientSecret] = useState('')
  
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRemoteChildren() {
      try {
        const res = await fetch(`${apiBase}/api/children`)
        if (!res.ok) return
        const rows = await res.json().catch(() => [])
        if (cancelled || !Array.isArray(rows)) return

        setChildren((current) => {
          const merged = mergeChildren(current, rows).filter((x) => x.active !== false)
          saveChildrenConfig(merged)
          return merged
        })
      } catch {
        // Keep the locally cached children when the backend is unavailable.
      }
    }

    loadRemoteChildren()
    return () => {
      cancelled = true
    }
  }, [apiBase])

  async function addChild() {
    setError('')
    const childId = newChildId.trim()
    if (!childId) {
      setError('Child ID is required.')
      return
    }
    if (children.some((c) => c.childId === childId)) {
      setError('Child ID already exists in list.')
      return
    }
    const entry = {
      childId,
      displayName: newName.trim() || `Child ${children.length + 1}`,
      thingId: newThingId.trim() || childId,
      arduinoClientId: newArduinoClientId.trim() || undefined,
      arduinoClientSecret: newArduinoClientSecret.trim() || undefined,
      active: true,
    }
    
    const next = [...children, entry]
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/api/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Cannot save child.')
      }
      setChildren(next)
      saveChildrenConfig(next)
      setNewName('')
      setNewChildId('')
      setNewThingId('')
      setNewArduinoClientId('')
      setNewArduinoClientSecret('')
    } catch (e) {
      setError(e.message || 'Cannot save child.')
    } finally {
      setSaving(false)
    }
  }

  async function removeChild(id) {
    setError('')
    const previous = children
    const next = children.filter((c) => c.childId !== id)
    setChildren(next)
    saveChildrenConfig(next)
    try {
      const res = await fetch(`${apiBase}/api/children/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Cannot remove child.')
      }
    } catch (e) {
      setChildren(previous)
      saveChildrenConfig(previous)
      setError(e.message || 'Cannot remove child.')
    }
  }

  return (
    <WebLayout active="profile">
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>←</span>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
          MANAGE <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>CHILDREN</span>
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={20} color="var(--text-primary)" />
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, letterSpacing: '0.02em' }}>
                TRACKED DEVICES ({children.length})
              </h2>
            </div>
            
            {children.length === 0 ? (
               <div style={{ padding: '32px', background: 'var(--bg-base)', border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                 No children tracked yet. Register a device below.
               </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {children.map(c => (
                  <div key={c.childId} style={{ 
                    background: '#fff', border: '2px solid var(--border)', 
                    boxShadow: '4px 4px 0 #0D0D0D', padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '16px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '64px', height: '64px', border: '2px solid var(--border)',
                        background: 'var(--slab-blue)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', fontWeight: 700, flexShrink: 0,
                        boxShadow: '2px 2px 0 #0D0D0D', fontFamily: 'var(--font-display)'
                      }}>
                        {c.displayName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.displayName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: {c.childId}
                        </div>
                      </div>
                      <StatusChip label="ONLINE" variant="online" />
                    </div>
                    
                    <div style={{ background: 'var(--bg-base)', border: '2px solid var(--border)', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>ARDUINO THING ID</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.thingId || '--'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>CUSTOM API KEYS</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.arduinoClientId ? 'CONFIGURED' : 'DEFAULT'}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeChild(c.childId)}
                      style={{ 
                        position: 'absolute', top: '-10px', right: '-10px',
                        width: '28px', height: '28px', background: '#fff',
                        border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--slab-red)', boxShadow: '2px 2px 0 #0D0D0D'
                      }}
                      title="Remove Child"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed var(--border)', margin: '0' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <UserPlus size={20} color="var(--text-primary)" />
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, letterSpacing: '0.02em' }}>
                ADD NEW DEVICE
              </h2>
            </div>
            
            <Card padding="24px">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                    BASIC INFORMATION
                  </div>
                  <Input label="Display Name" placeholder="e.g., Bon / Anna" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input label="Child ID (Required)" placeholder="Unique identifier for the child" value={newChildId} onChange={(e) => setNewChildId(e.target.value)} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>
                    ARDUINO CLOUD INTEGRATION
                  </div>
                  <Input label="Thing ID (Optional)" placeholder="Defaults to Child ID if empty" value={newThingId} onChange={(e) => setNewThingId(e.target.value)} />
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="API Client ID (Optional)" placeholder="Overrides global .env key" value={newArduinoClientId} onChange={(e) => setNewArduinoClientId(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input label="API Client Secret (Optional)" placeholder="Overrides global .env secret" value={newArduinoClientSecret} onChange={(e) => setNewArduinoClientSecret(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {error ? <span style={{ color: 'var(--slab-red)', fontWeight: 600 }}>Error: {error}</span> : 'All data is stored securely and polling starts immediately upon addition.'}
                </div>
                <Button onClick={addChild} variant="primary" style={{ minWidth: '180px' }}>
                  {saving ? 'ADDING...' : '＋ REGISTER DEVICE'}
                </Button>
              </div>
            </Card>
          </div>

          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Settings2 size={20} color="var(--text-primary)" />
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, letterSpacing: '0.02em' }}>
                GLOBAL SETTINGS
              </h2>
            </div>
            
            <Card padding="20px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', marginBottom: '4px' }}>LOCATION SHARING</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    {sharing ? 'Active — tracking is currently enabled for all devices.' : 'Disabled — location hidden from parent app.'}
                  </div>
                </div>
                <div onClick={() => setSharing(!sharing)} style={{
                  width: '56px', height: '30px',
                  background: sharing ? 'var(--slab-blue)' : 'var(--text-muted)',
                  border: '2px solid var(--border)', position: 'relative', cursor: 'pointer',
                  boxShadow: '2px 2px 0 #0D0D0D'
                }}>
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: sharing ? '27px' : '3px',
                    width: '20px', height: '20px',
                    background: '#fff', border: '2px solid var(--border)',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </WebLayout>
  )
}
