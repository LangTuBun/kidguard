import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebLayout from '../../components/WebLayout'
import Input from '../../components/Input'
import Button from '../../components/Button'
import ZonePickerMap from '../../components/ZonePickerMap'

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

export default function AddZone() {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080'
  const [zoneName, setZoneName] = useState('')
  const [shapeType, setShapeType] = useState('circle')
  const [centerPoint, setCenterPoint] = useState(null)
  const [edgePoint, setEdgePoint] = useState(null)
  const [cornerA, setCornerA] = useState(null)
  const [cornerC, setCornerC] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const radius = centerPoint && edgePoint
    ? haversineMeters(centerPoint.lat, centerPoint.lng, edgePoint.lat, edgePoint.lng)
    : 0
  const circleArea = Math.PI * radius * radius

  const rectangleReady = cornerA && cornerC && Math.abs(cornerA.lat - cornerC.lat) > 0.00001 && Math.abs(cornerA.lng - cornerC.lng) > 0.00001
  const rectWidth = rectangleReady 
    ? haversineMeters(cornerA.lat, cornerA.lng, cornerA.lat, cornerC.lng) 
    : 0
  const rectHeight = rectangleReady 
    ? haversineMeters(cornerA.lat, cornerA.lng, cornerC.lat, cornerA.lng) 
    : 0
  const rectArea = rectWidth * rectHeight
  const canSave = zoneName.trim()
    && (
      (shapeType === 'circle' && centerPoint && edgePoint && radius >= 10)
      || (shapeType === 'rectangle' && rectangleReady)
    )

  async function saveZone() {
    if (!canSave || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}/api/safezones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: zoneName.trim(),
          shapeType,
          centerLat: shapeType === 'circle' ? centerPoint.lat : (cornerA.lat + cornerC.lat) / 2,
          centerLng: shapeType === 'circle' ? centerPoint.lng : (cornerA.lng + cornerC.lng) / 2,
          edgeLat: shapeType === 'circle' ? edgePoint.lat : undefined,
          edgeLng: shapeType === 'circle' ? edgePoint.lng : undefined,
          cornerALat: shapeType === 'rectangle' ? cornerA.lat : undefined,
          cornerALng: shapeType === 'rectangle' ? cornerA.lng : undefined,
          cornerCLat: shapeType === 'rectangle' ? cornerC.lat : undefined,
          cornerCLng: shapeType === 'rectangle' ? cornerC.lng : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Save zone failed.')
      }
      navigate('/zones')
    } catch (e) {
      setError(e.message || 'Save zone failed.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (shapeType === 'circle') {
      setCornerA(null)
      setCornerC(null)
    } else {
      setCenterPoint(null)
      setEdgePoint(null)
    }
  }, [shapeType])

  return (
    <WebLayout active="zones">
      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '2px solid var(--border)',
        padding: '0 32px', height: '64px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <button
          onClick={() => navigate('/zones')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ fontSize: '20px', color: 'var(--text-primary)' }}>←</span>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
          ADD <span style={{ background: 'var(--slab-blue)', color: '#fff', padding: '2px 8px' }}>SAFE ZONE</span>
        </span>
      </div>

      {/* Side-by-side layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <ZonePickerMap
            mode={shapeType}
            centerPoint={centerPoint}
            edgePoint={edgePoint}
            onCenterPointChange={setCenterPoint}
            onEdgePointChange={setEdgePoint}
            cornerA={cornerA}
            cornerC={cornerC}
            onCornerAChange={setCornerA}
            onCornerCChange={setCornerC}
          />
          {/* Floating hint */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff', border: '2px solid var(--border)',
            padding: '8px 16px', boxShadow: '3px 3px 0 #0D0D0D',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
              {shapeType === 'circle'
                ? 'Click #1 set center · click #2 set radius'
                : 'Click #1 set corner A · click #2 set corner C'}
            </span>
          </div>
        </div>

        {/* Right: form panel */}
        <div style={{
          width: '360px', flexShrink: 0,
          borderLeft: '2px solid var(--border)',
          background: '#fff',
          overflowY: 'auto',
          padding: '28px 24px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            ZONE DETAILS
          </span>

          <Input
            label="Zone Name"
            placeholder="e.g. Home, School"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={shapeType === 'circle' ? 'primary' : 'ghost'}
              onClick={() => setShapeType('circle')}
            >
              Circle
            </Button>
            <Button
              variant={shapeType === 'rectangle' ? 'primary' : 'ghost'}
              onClick={() => setShapeType('rectangle')}
            >
              Rectangle
            </Button>
          </div>

          {/* Dimensions & Area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                {shapeType === 'circle' ? 'RADIUS' : 'DIMENSIONS'}
              </span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {shapeType === 'circle' 
                  ? `${Math.round(radius)}m` 
                  : (rectangleReady ? `${Math.round(rectWidth)}m × ${Math.round(rectHeight)}m` : 'SET A→C')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                ESTIMATED AREA
              </span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {shapeType === 'circle' 
                  ? (radius > 0 ? `${Math.round(circleArea).toLocaleString()} m²` : '--')
                  : (rectangleReady ? `${Math.round(rectArea).toLocaleString()} m²` : '--')}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {shapeType === 'circle'
                ? 'Radius is auto-computed from center point to second point.'
                : 'Rectangle is created from two opposite corners A and C.'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-base)', border: '2px solid var(--border)', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
              COORDINATES
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              C: {shapeType === 'circle'
                ? (centerPoint ? `${centerPoint.lat.toFixed(6)}, ${centerPoint.lng.toFixed(6)}` : '--')
                : (cornerA ? `${cornerA.lat.toFixed(6)}, ${cornerA.lng.toFixed(6)}` : '--')}
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
              R: {shapeType === 'circle'
                ? (edgePoint ? `${edgePoint.lat.toFixed(6)}, ${edgePoint.lng.toFixed(6)}` : '--')
                : (cornerC ? `${cornerC.lat.toFixed(6)}, ${cornerC.lng.toFixed(6)}` : '--')}
            </div>
          </div>

          {/* Zone type info */}
          <div style={{ background: 'var(--bg-base)', border: '2px solid var(--border)', padding: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
              ALERT TYPE
            </div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
              Notify when any tracked child leaves all active global zones.
            </div>
          </div>

          {error && <div style={{ color: 'var(--slab-red)', fontSize: '12px' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <Button fullWidth variant="primary" onClick={saveZone} style={{ opacity: canSave ? 1 : 0.6 }}>
              {saving ? 'SAVING...' : 'SAVE ZONE →'}
            </Button>
            <Button fullWidth variant="ghost" onClick={() => navigate('/zones')}>CANCEL</Button>
          </div>
        </div>
      </div>
    </WebLayout>
  )
}
