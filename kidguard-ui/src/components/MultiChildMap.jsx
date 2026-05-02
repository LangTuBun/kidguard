import { Circle, MapContainer, Marker, Popup, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'

const childIcon = (color = '#2A5BF5') =>
  new L.DivIcon({
    className: 'kidguard-div-icon',
    html: `<div style="width:14px;height:14px;border:2px solid #0D0D0D;background:${color};box-shadow:2px 2px 0 #0D0D0D"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

const zoneColors = ['#2A5BF5', '#E8631A', '#1A8C4E', '#D92B2B']

function zoneColor(zone, fallbackIndex = 0) {
  const id = Number(zone?.id)
  return zoneColors[(Number.isFinite(id) ? id : fallbackIndex) % zoneColors.length]
}

function FitBounds({ locations = [] }) {
  const map = useMap()
  const fittedRef = useRef(false)
  const lastCountRef = useRef(0)

  useEffect(() => {
    if (!Array.isArray(locations) || locations.length === 0) return

    // Do not force-fit every refresh tick, otherwise user cannot zoom/pan manually.
    // Auto-fit only first time (or when number of tracked children changes).
    const shouldAutoFit = !fittedRef.current || lastCountRef.current !== locations.length
    if (!shouldAutoFit) return

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15, { animate: false })
    } else {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]))
      map.fitBounds(bounds, { padding: [50, 50], animate: false, maxZoom: 15 })
    }

    fittedRef.current = true
    lastCountRef.current = locations.length
  }, [map, locations])
  return null
}

function InteractiveMarker({ loc, color }) {
  const map = useMap()
  return (
    <Marker
      position={[loc.lat, loc.lng]}
      icon={childIcon(color)}
      eventHandlers={{
        click: () => {
          map.flyTo([loc.lat, loc.lng], 18, { animate: true, duration: 1.5 })
        }
      }}
    >
      <Popup>
        <div style={{ fontFamily: 'var(--font-body)', minWidth: '160px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '6px' }}>
            {loc.displayName || loc.childId}
          </div>
          <div style={{ fontSize: '13px', color: '#444' }}>
            Lat: {loc.lat.toFixed(6)}<br />
            Lng: {loc.lng.toFixed(6)}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            Last seen: {new Date(loc.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function InteractiveRectangle({ zone, color }) {
  const map = useMap()
  const bounds = [
    [Math.min(zone.cornerALat, zone.cornerCLat), Math.min(zone.cornerALng, zone.cornerCLng)],
    [Math.max(zone.cornerALat, zone.cornerCLat), Math.max(zone.cornerALng, zone.cornerCLng)],
  ]
  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{ color, fillOpacity: 0.12, weight: 2 }}
      eventHandlers={{
        click: (e) => {
          map.flyToBounds(e.target.getBounds(), { animate: true, duration: 1.5, padding: [50, 50], maxZoom: 17 })
        }
      }}
    >
      <Tooltip direction="top" sticky>
        {zone.zoneName} (rectangle)
      </Tooltip>
    </Rectangle>
  )
}

function InteractiveCircle({ zone, color }) {
  const map = useMap()
  return (
    <Circle
      center={[zone.centerLat, zone.centerLng]}
      radius={zone.radiusMeters}
      pathOptions={{ color, fillOpacity: 0.12, weight: 2 }}
      eventHandlers={{
        click: (e) => {
          map.flyToBounds(e.target.getBounds(), { animate: true, duration: 1.5, padding: [50, 50], maxZoom: 17 })
        }
      }}
    >
      <Tooltip direction="top" sticky>
        {zone.zoneName} ({Math.round(zone.radiusMeters)}m)
      </Tooltip>
    </Circle>
  )
}

export default function MultiChildMap({ locations = [], zonesByChild = {}, height = '100%', center }) {
  const fallbackCenter = center || (locations[0] ? [locations[0].lat, locations[0].lng] : [10.928, 106.702])

  return (
    <MapContainer center={fallbackCenter} zoom={15} style={{ width: '100%', height }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds locations={locations} />

      {Object.entries(zonesByChild).flatMap(([childId, zones]) =>
        (Array.isArray(zones) ? zones : []).map((zone, idx) => {
          const color = zoneColor(zone, idx)
          if (
            zone.shapeType === 'rectangle'
            && Number.isFinite(zone.cornerALat)
            && Number.isFinite(zone.cornerALng)
            && Number.isFinite(zone.cornerCLat)
            && Number.isFinite(zone.cornerCLng)
          ) {
            return <InteractiveRectangle key={`zone-${childId}-${zone.id ?? idx}`} zone={zone} color={color} />
          }
          return <InteractiveCircle key={`zone-${childId}-${zone.id ?? idx}`} zone={zone} color={color} />
        }),
      )}

      {locations.map((loc, idx) => (
        <InteractiveMarker 
          key={`child-${loc.childId}`}
          loc={loc}
          color={zoneColors[idx % zoneColors.length]}
        />
      ))}
    </MapContainer>
  )
}
