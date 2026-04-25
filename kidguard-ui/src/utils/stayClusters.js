/**
 * Group raw GPS samples into "stays" when many consecutive points fall within ~same place.
 * "Trên 5 lần liên tiếp" → strictly more than 5 → at least 6 consecutive readings.
 */

export const DEFAULT_STAY_RADIUS_M = 80
/** Minimum consecutive in-range samples to count as one stay ( > 5 ) */
export const MIN_CONSECUTIVE_FOR_STAY = 6

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

function centroid(points) {
  const n = points.length
  if (n === 0) return { lat: 0, lng: 0 }
  let slat = 0
  let slng = 0
  for (const p of points) {
    slat += p.lat
    slng += p.lng
  }
  return { lat: slat / n, lng: slng / n }
}

/**
 * @param {Array<{ lat: number, lng: number, timestamp: number }>} raw
 * @param {{ radiusMeters?: number, minConsecutive?: number }} opts
 * @returns {{ stays: Array<{ startTs: number, endTs: number, lat: number, lng: number, sampleCount: number }>, shortClusters: Array<{ startTs: number, endTs: number, sampleCount: number }> }}
 */
export function buildStaysFromHistory(raw, opts = {}) {
  const radiusMeters = opts.radiusMeters ?? DEFAULT_STAY_RADIUS_M
  const minConsecutive = opts.minConsecutive ?? MIN_CONSECUTIVE_FOR_STAY

  const points = [...raw]
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp)

  const stays = []
  const shortClusters = []

  let run = []

  const flush = () => {
    if (run.length === 0) return
    const c = centroid(run)
    const startTs = run[0].timestamp
    const endTs = run[run.length - 1].timestamp
    const sampleCount = run.length
    if (sampleCount >= minConsecutive) {
      stays.push({ startTs, endTs, lat: c.lat, lng: c.lng, sampleCount })
    } else {
      shortClusters.push({ startTs, endTs, sampleCount })
    }
    run = []
  }

  for (const p of points) {
    if (run.length === 0) {
      run.push(p)
      continue
    }
    const { lat, lng } = centroid(run)
    if (haversineMeters(p.lat, p.lng, lat, lng) <= radiusMeters) {
      run.push(p)
    } else {
      flush()
      run.push(p)
    }
  }
  flush()

  stays.sort((a, b) => b.startTs - a.startTs)
  return { stays, shortClusters }
}

export function formatDurationMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function sameLocalDay(ts, dayStartMs) {
  const d = new Date(ts)
  const start = new Date(dayStartMs)
  return (
    d.getFullYear() === start.getFullYear() &&
    d.getMonth() === start.getMonth() &&
    d.getDate() === start.getDate()
  )
}

export function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}
