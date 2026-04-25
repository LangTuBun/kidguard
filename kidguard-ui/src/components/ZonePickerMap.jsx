import { useEffect, useState, useRef } from 'react'
import { Search } from 'lucide-react'
import { Circle, MapContainer, Marker, Rectangle, TileLayer, Tooltip, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
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

const centerIcon = new L.DivIcon({
  className: 'kidguard-center-icon',
  html: '<div style="width:14px;height:14px;background:#2A5BF5;border:2px solid #0D0D0D"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const edgeIcon = new L.DivIcon({
  className: 'kidguard-edge-icon',
  html: '<div style="width:12px;height:12px;background:#E8631A;border:2px solid #0D0D0D"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const searchResultIcon = new L.DivIcon({
  className: 'kidguard-search-icon',
  html: '<div style="width:16px;height:16px;background:#1A8C4E;border:2px solid #0D0D0D;border-radius:50%"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function ClickHandler({
  mode,
  centerPoint,
  edgePoint,
  onCenterPointChange,
  onEdgePointChange,
  cornerA,
  cornerC,
  onCornerAChange,
  onCornerCChange,
}) {
  useMapEvents({
    click(e) {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng }
      if (mode === 'rectangle') {
        if (!cornerA) {
          onCornerAChange(p)
          onCornerCChange(null)
          return
        }
        if (!cornerC) {
          onCornerCChange(p)
          return
        }
        onCornerAChange(p)
        onCornerCChange(null)
      } else {
        if (!centerPoint) {
          onCenterPointChange(p)
          return
        }
        if (!edgePoint) {
          onEdgePointChange(p)
          return
        }
        onCenterPointChange(p)
        onEdgePointChange(null)
      }
    },
  })
  return null
}

function MapSearch() {
  const map = useMap()
  const containerRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)

  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current)
      L.DomEvent.disableScrollPropagation(containerRef.current)
    }
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const bounds = map.getBounds()
        const viewbox = `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=0&limit=5`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, map])

  return (
    <>
      <div 
        ref={containerRef}
        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, width: '320px' }}
      >
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              if (selectedResult) setSelectedResult(null)
            }}
            placeholder="Search places..."
            style={{ 
              width: '100%', padding: '12px 14px 12px 42px', 
              border: '2px solid var(--border)', background: '#fff', 
              fontFamily: 'var(--font-body)', fontSize: '13px', outline: 'none',
              boxShadow: '3px 3px 0 #0D0D0D'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
        </div>
        
        {open && results.length > 0 && (
          <div style={{ 
            marginTop: '8px', background: '#fff', border: '2px solid var(--border)', 
            boxShadow: '3px 3px 0 #0D0D0D', maxHeight: '300px', overflowY: 'auto' 
          }}>
            {results.map((r, i) => (
              <div 
                key={i} 
                onClick={() => {
                  map.flyTo([parseFloat(r.lat), parseFloat(r.lon)], 16, { animate: true, duration: 1.5 })
                  setSelectedResult(r)
                  setOpen(false)
                  setQuery(r.name || r.display_name.split(',')[0])
                }}
                style={{
                  padding: '12px 14px', borderBottom: i < results.length - 1 ? '1px solid var(--bg-base)' : 'none',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-base)'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {r.name || r.display_name.split(',')[0]}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {r.display_name}
                </div>
              </div>
            ))}
          </div>
        )}
        {open && query.trim().length >= 3 && results.length === 0 && !loading && (
          <div style={{ 
            marginTop: '8px', background: '#fff', border: '2px solid var(--border)', 
            padding: '14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
            boxShadow: '3px 3px 0 #0D0D0D'
          }}>
            No matching places found near this area.
          </div>
        )}
      </div>

      {selectedResult && (
        <Marker 
          position={[parseFloat(selectedResult.lat), parseFloat(selectedResult.lon)]}
          icon={searchResultIcon}
        >
          <Tooltip direction="top" permanent className="search-tooltip">
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '12px' }}>
              {selectedResult.name || selectedResult.display_name.split(',')[0]}
            </div>
          </Tooltip>
        </Marker>
      )}
    </>
  )
}

export default function ZonePickerMap({
  mode = 'circle',
  centerPoint,
  edgePoint,
  onCenterPointChange,
  onEdgePointChange,
  cornerA,
  cornerC,
  onCornerAChange,
  onCornerCChange,
  mapCenter = [10.928, 106.702],
}) {
  const radius =
    centerPoint && edgePoint
      ? haversineMeters(centerPoint.lat, centerPoint.lng, edgePoint.lat, edgePoint.lng)
      : 0

  return (
    <MapContainer center={mapCenter} zoom={15} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapSearch />
      <ClickHandler
        mode={mode}
        centerPoint={centerPoint}
        edgePoint={edgePoint}
        onCenterPointChange={onCenterPointChange}
        onEdgePointChange={onEdgePointChange}
        cornerA={cornerA}
        cornerC={cornerC}
        onCornerAChange={onCornerAChange}
        onCornerCChange={onCornerCChange}
      />
      {mode === 'circle' && centerPoint && (
        <Marker 
          position={[centerPoint.lat, centerPoint.lng]} 
          icon={centerIcon} 
          draggable 
          eventHandlers={{ drag: (e) => onCenterPointChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }} 
        />
      )}
      {mode === 'circle' && edgePoint && (
        <Marker 
          position={[edgePoint.lat, edgePoint.lng]} 
          icon={edgeIcon} 
          draggable 
          eventHandlers={{ drag: (e) => onEdgePointChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }} 
        />
      )}
      {mode === 'rectangle' && cornerA && (
        <Marker 
          position={[cornerA.lat, cornerA.lng]} 
          icon={centerIcon} 
          draggable 
          eventHandlers={{ drag: (e) => onCornerAChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }} 
        />
      )}
      {mode === 'rectangle' && cornerC && (
        <Marker 
          position={[cornerC.lat, cornerC.lng]} 
          icon={edgeIcon} 
          draggable 
          eventHandlers={{ drag: (e) => onCornerCChange({ lat: e.target.getLatLng().lat, lng: e.target.getLatLng().lng }) }} 
        />
      )}
      {mode === 'circle' && centerPoint && edgePoint && radius > 0 && (
        <Circle
          center={[centerPoint.lat, centerPoint.lng]}
          radius={radius}
          pathOptions={{ color: '#2A5BF5', fillOpacity: 0.14, weight: 2 }}
        >
          <Tooltip direction="top">Radius ~ {Math.round(radius)}m</Tooltip>
        </Circle>
      )}
      {mode === 'rectangle' && cornerA && cornerC && (
        <Rectangle
          bounds={[
            [Math.min(cornerA.lat, cornerC.lat), Math.min(cornerA.lng, cornerC.lng)],
            [Math.max(cornerA.lat, cornerC.lat), Math.max(cornerA.lng, cornerC.lng)],
          ]}
          pathOptions={{ color: '#2A5BF5', fillOpacity: 0.14, weight: 2 }}
        >
          <Tooltip direction="top">Rectangle zone</Tooltip>
        </Rectangle>
      )}
    </MapContainer>
  )
}
