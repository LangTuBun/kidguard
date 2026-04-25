/**
 * Arduino IoT Cloud REST API (OAuth2 client_credentials).
 * @see https://docs.arduino.cc/cloud-api/
 */

import { tryExtractLatLngFromGpsJsonValue } from './gpsParse.js'

const TOKEN_URL = 'https://api2.arduino.cc/iot/v1/clients/token'
const AUDIENCE = 'https://api2.arduino.cc/iot'
const API_V2 = 'https://api2.arduino.cc/iot/v2'

let tokenCacheMap = new Map()

export async function getArduinoAccessToken(clientId, clientSecret) {
  const now = Date.now()
  
  const actualClientId = clientId || process.env.ARDUINO_CLIENT_ID
  const actualClientSecret = clientSecret || process.env.ARDUINO_CLIENT_SECRET

  if (!actualClientId || !actualClientSecret) {
    throw new Error('Missing Arduino API credentials (no params and no env fallback).')
  }

  const cache = tokenCacheMap.get(actualClientId)
  if (cache && now < cache.expiresAt - 60_000) {
    return cache.token
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: actualClientId,
    client_secret: actualClientSecret,
    audience: AUDIENCE,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Arduino token HTTP ${res.status}: ${text.slice(0, 400)}`)
  }

  const json = JSON.parse(text)
  if (!json.access_token) {
    throw new Error('Arduino token response missing access_token')
  }

  const expSec = Number(json.expires_in) || 3600
  const newCache = {
    token: json.access_token,
    expiresAt: now + expSec * 1000,
  }
  tokenCacheMap.set(actualClientId, newCache)
  return newCache.token
}

export async function fetchThingPropertiesRaw(thingId, clientId, clientSecret) {
  const token = await getArduinoAccessToken(clientId, clientSecret)
  const url = `${API_V2}/things/${encodeURIComponent(thingId)}/properties`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Arduino properties HTTP ${res.status}: ${text.slice(0, 400)}`)
  }
  return JSON.parse(text)
}

/**
 * Arduino IoT REST may return `last_value` as a plain number/string, or wrapped like
 * `{ value: { payload: "{\"lat\":\"…\",\"lon\":\"…\"}" } }` (see iot-client-go models).
 */
function normalizeArduinoPropertyValue(val) {
  if (val == null) return val
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val
  if (typeof val !== 'object') return val

  const directPayload = val.payload
  if (typeof directPayload === 'string') return directPayload

  const inner = val.value
  if (inner != null && typeof inner === 'object') {
    const p = inner.payload
    if (typeof p === 'string') return p
    if (typeof inner === 'string' || typeof inner === 'number') return inner
  }

  return val
}

/**
 * Parse IoT Cloud property list into lat/lng (degrees).
 * Supports lat/lng variables, latitude/longitude, and a single JSON variable (e.g. Gps).
 *
 * Composite variables (gps / location / position) take precedence over plain lat & lng
 * so stale scalar lat/lng on a Thing do not mask an updated `Gps` JSON payload.
 */
export function pickLatLngFromPropertiesPayload(payload) {
  const rows = Array.isArray(payload)
    ? payload
    : payload.properties ?? payload.data ?? payload.items ?? []

  const vars = {}
  for (const row of rows) {
    const rawName =
      row.variable_name ??
      row.variableName ??
      row.name ??
      row.variable?.name ??
      row.id
    if (rawName == null || rawName === '') continue
    const key = String(rawName).toLowerCase()
    const rawVal =
      row.last_value ??
      row.lastValue ??
      row.value ??
      row.variable_value ??
      row.variableValue ??
      (typeof row.variable === 'object' && row.variable != null ? row.variable.last_value : undefined)

    if (rawVal === undefined || rawVal === null) continue
    const val = normalizeArduinoPropertyValue(rawVal)

    if (val === undefined || val === null) continue
    const num = typeof val === 'number' ? val : Number(val)
    if (Number.isFinite(num)) {
      vars[key] = num
    } else if (typeof val === 'string' && val.trim().startsWith('{')) {
      vars[key] = val
    } else if (typeof val === 'object') {
      const pair = tryExtractLatLngFromGpsJsonValue(val)
      if (pair) {
        vars[`${key}_lat`] = pair.lat
        vars[`${key}_lng`] = pair.lng
      }
    }
  }

  const pick = (keys) => {
    for (const k of keys) {
      if (vars[k] !== undefined && typeof vars[k] === 'number') return vars[k]
    }
    return undefined
  }

  let lat
  let lng

  for (const k of ['gps', 'location', 'position']) {
    const pair = tryExtractLatLngFromGpsJsonValue(vars[k])
    if (pair) {
      lat = pair.lat
      lng = pair.lng
      break
    }
    const la = vars[`${k}_lat`]
    const lo = vars[`${k}_lng`]
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      lat = la
      lng = lo
      break
    }
  }

  if (lat === undefined || lng === undefined) {
    lat = pick(['lat', 'latitude'])
    lng = pick(['lng', 'lon', 'longitude'])
  }
  return { lat, lng, vars }
}
