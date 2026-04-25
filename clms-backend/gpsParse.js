/**
 * Arduino Cloud / Shortcuts sometimes send one variable "Gps" as JSON: {"lat":"...","lon":"..."}.
 */
export function tryExtractLatLngFromGpsJsonValue(raw) {
  if (raw == null) return null
  let obj = raw
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t.startsWith('{')) return null
    try {
      obj = JSON.parse(t)
    } catch {
      return null
    }
  }
  if (typeof obj !== 'object' || obj == null) return null
  const latRaw = obj.lat ?? obj.latitude ?? obj.Lat
  const lngRaw = obj.lon ?? obj.lng ?? obj.longitude ?? obj.Lon
  const lat = latRaw != null ? Number(latRaw) : NaN
  const lng = lngRaw != null ? Number(lngRaw) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
