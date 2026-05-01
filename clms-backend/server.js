import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mysql from 'mysql2/promise'
import { OAuth2Client } from 'google-auth-library'
import nodemailer from 'nodemailer'
import jwt from 'jsonwebtoken'

import { fetchThingPropertiesRaw, pickLatLngFromPropertiesPayload } from './arduinoCloud.js'
import { tryExtractLatLngFromGpsJsonValue } from './gpsParse.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 8080)

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME || 'clms_user',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'clms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

app.use(cors())
app.use(express.json())

function haversineMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isWgs84(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
}

function parseCsvIds(raw) {
  if (typeof raw !== 'string') return []
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * Some clients (e.g. Shortcuts) send lat/lng as huge integers. Try lat/10^a, lng/10^b
 * until WGS84 fits. Same power for both (e.g. /1e14) rarely works for lng vs lat magnitude.
 */
function tryDenormalizeScaledIntegerGps(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (isWgs84(lat, lng)) return { lat, lng, scaled: false }
  const scales = []
  for (let e = 5; e <= 16; e++) scales.push(10 ** e)
  for (const slat of scales) {
    for (const slng of scales) {
      const la = lat / slat
      const lo = lng / slng
      if (isWgs84(la, lo)) return { lat: la, lng: lo, scaled: true }
    }
  }
  return null
}

/** Accept seconds or ms; return epoch ms or null if out of plausible range */
function normalizeEpochMs(raw) {
  let ts = raw
  if (typeof ts === 'string' && ts.trim() !== '') ts = Number(ts)
  if (!Number.isFinite(ts)) return null
  let ms = Math.trunc(ts)
  if (ms > 0 && ms < 1e12) ms *= 1000
  const min = 946684800000
  const max = Date.now() + 86400000 * 365 * 2
  if (ms < min || ms > max) return null
  return ms
}

function validateGpsForStorage({ lat, lng, timestamp }) {
  const decoded = tryDenormalizeScaledIntegerGps(lat, lng)
  if (!decoded) {
    return {
      ok: false,
      message:
        'lat/lng must be WGS84 decimal degrees, or huge integers that decode after dividing by powers of ten (e.g. Shortcuts). Example degrees: lat 10.773, lng 106.66.',
    }
  }
  const ms = normalizeEpochMs(timestamp)
  if (ms == null) {
    return {
      ok: false,
      message:
        'timestamp must be Unix time in milliseconds (about 13 digits). In Shortcuts use Current Date → Format as epoch ms, or multiply seconds by 1000.',
    }
  }
  return {
    ok: true,
    lat: decoded.lat,
    lng: decoded.lng,
    timestamp: ms,
    integerScaled: decoded.scaled,
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS children (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id VARCHAR(128) NOT NULL UNIQUE,
      display_name VARCHAR(128) NOT NULL,
      thing_id VARCHAR(128) NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS safe_zones (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id VARCHAR(128) NOT NULL,
      zone_name VARCHAR(128) NOT NULL,
      shape_type VARCHAR(16) NOT NULL DEFAULT 'circle',
      center_lat DOUBLE NOT NULL,
      center_lng DOUBLE NOT NULL,
      radius_meters DOUBLE NOT NULL,
      corner_a_lat DOUBLE NULL,
      corner_a_lng DOUBLE NULL,
      corner_c_lat DOUBLE NULL,
      corner_c_lng DOUBLE NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_safe_zones_child (child_id, active)
    )
  `)

  // Backfill new rectangle columns for existing deployments (compatible with MySQL versions
  // that do not support `ADD COLUMN IF NOT EXISTS`).
  const ensureColumn = async (tableName, columnName, ddl) => {
    const [rows] = await pool.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = ?
         AND column_name = ?
       LIMIT 1`,
      [tableName, columnName],
    )
    if (Array.isArray(rows) && rows.length > 0) return
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`)
  }

  await ensureColumn('safe_zones', 'shape_type', "shape_type VARCHAR(16) NOT NULL DEFAULT 'circle'")
  await ensureColumn('safe_zones', 'corner_a_lat', 'corner_a_lat DOUBLE NULL')
  await ensureColumn('safe_zones', 'corner_a_lng', 'corner_a_lng DOUBLE NULL')
  await ensureColumn('safe_zones', 'corner_c_lat', 'corner_c_lat DOUBLE NULL')
  await ensureColumn('safe_zones', 'corner_c_lng', 'corner_c_lng DOUBLE NULL')

  await ensureColumn('children', 'arduino_client_id', 'arduino_client_id VARCHAR(128) NULL')
  await ensureColumn('children', 'arduino_client_secret', 'arduino_client_secret VARCHAR(256) NULL')

  // Many-to-many: a zone can apply to several children.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS safe_zone_children (
      zone_id BIGINT NOT NULL,
      child_id VARCHAR(128) NOT NULL,
      PRIMARY KEY (zone_id, child_id),
      INDEX idx_szc_child (child_id),
      CONSTRAINT fk_szc_zone FOREIGN KEY (zone_id) REFERENCES safe_zones(id) ON DELETE CASCADE,
      CONSTRAINT fk_szc_child FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE
    )
  `)
  // Backfill from the legacy single-child column for any zone not yet linked.
  await pool.query(`
    INSERT IGNORE INTO safe_zone_children (zone_id, child_id)
    SELECT z.id, z.child_id
    FROM safe_zones z
    INNER JOIN children c ON c.child_id = z.child_id
    LEFT JOIN safe_zone_children szc ON szc.zone_id = z.id
    WHERE szc.zone_id IS NULL
  `)
  // Allow new zones to be inserted without writing the legacy column.
  await pool.query(`ALTER TABLE safe_zones MODIFY COLUMN child_id VARCHAR(128) NULL`)

  // Per-(child, zone) current state for O(1) transition detection.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS child_zone_state (
      child_id   VARCHAR(128) NOT NULL,
      zone_id    BIGINT       NOT NULL,
      inside     BOOLEAN      NOT NULL,
      updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (child_id, zone_id),
      INDEX idx_czs_zone (zone_id),
      CONSTRAINT fk_czs_child FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
      CONSTRAINT fk_czs_zone  FOREIGN KEY (zone_id)  REFERENCES safe_zones(id)    ON DELETE CASCADE
    )
  `)
  // Append-only event log for zone enter/leave transitions.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS zone_events (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id    VARCHAR(128) NOT NULL,
      zone_id     BIGINT       NOT NULL,
      kind        ENUM('enter','leave') NOT NULL,
      occurred_at BIGINT       NOT NULL,
      lat         DOUBLE       NULL,
      lng         DOUBLE       NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ze_child_time (child_id, occurred_at DESC),
      INDEX idx_ze_zone (zone_id),
      CONSTRAINT fk_ze_child FOREIGN KEY (child_id) REFERENCES children(child_id) ON DELETE CASCADE,
      CONSTRAINT fk_ze_zone  FOREIGN KEY (zone_id)  REFERENCES safe_zones(id)    ON DELETE CASCADE
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS geofence (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id VARCHAR(128) NOT NULL UNIQUE,
      center_lat DOUBLE NOT NULL,
      center_lng DOUBLE NOT NULL,
      radius_meters DOUBLE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS child_latest_location (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id VARCHAR(128) NOT NULL UNIQUE,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      captured_at BIGINT NOT NULL,
      geofence_violated BOOLEAN NOT NULL DEFAULT FALSE,
      distance_from_center_meters DOUBLE NULL,
      battery INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS location_history (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      child_id VARCHAR(128) NOT NULL,
      lat DOUBLE NOT NULL,
      lng DOUBLE NOT NULL,
      captured_at BIGINT NOT NULL,
      geofence_violated BOOLEAN NOT NULL DEFAULT FALSE,
      distance_from_center_meters DOUBLE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_location_history_child_time (child_id, captured_at DESC)
    )
  `)

  await ensureColumn('child_latest_location', 'battery', 'battery INT NULL')

  // ── Auth / Users table ──────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            BIGINT AUTO_INCREMENT PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      name          VARCHAR(255),
      google_sub    VARCHAR(255),
      password_hash VARCHAR(255) NULL,
      otp_code      VARCHAR(6),
      otp_expiry    BIGINT,
      settings      JSON,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Defensive migrations for older dev DBs.
  const ensureUserColumn = async (col, ddl) => {
    const [cols] = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='users' AND column_name=? LIMIT 1`,
      [col]
    )
    if (Array.isArray(cols) && cols.length > 0) return
    await pool.query(`ALTER TABLE users ADD COLUMN ${ddl}`)
  }
  await ensureUserColumn('password_hash', 'password_hash VARCHAR(255) NULL')
  await ensureUserColumn('date_of_birth', 'date_of_birth DATE NULL')
}

async function listPollTargets() {
  const [rows] = await pool.query(
    `SELECT child_id, thing_id, arduino_client_id, arduino_client_secret
     FROM children
     WHERE active = TRUE`,
  )

  const targets = []
  if (Array.isArray(rows) && rows.length > 0) {
    for (const row of rows) {
      const childId = typeof row.child_id === 'string' ? row.child_id : ''
      const thingId = typeof row.thing_id === 'string' && row.thing_id ? row.thing_id : childId
      const clientId = row.arduino_client_id
      const clientSecret = row.arduino_client_secret
      if (childId && thingId) targets.push({ childId, thingId, clientId, clientSecret })
    }
  }

  if (targets.length > 0) return targets

  const envChildIds = parseCsvIds(process.env.ARDUINO_CHILD_IDS || process.env.ARDUINO_CHILD_ID || '')
  const envThingIds = parseCsvIds(process.env.ARDUINO_THING_IDS || process.env.ARDUINO_THING_ID || '')
  const envClientIds = parseCsvIds(process.env.ARDUINO_CLIENT_IDS || '')
  const envClientSecrets = parseCsvIds(process.env.ARDUINO_CLIENT_SECRETS || '')

  const fallbackTargets = []
  const max = Math.max(envChildIds.length, envThingIds.length)
  for (let i = 0; i < max; i += 1) {
    const childId = envChildIds[i] || envThingIds[i]
    const thingId = envThingIds[i] || envChildIds[i]
    const clientId = envClientIds[i]
    const clientSecret = envClientSecrets[i]
    if (childId && thingId) fallbackTargets.push({ childId, thingId, clientId, clientSecret })
  }
  return fallbackTargets
}

async function pickZoneStatusForChild(childId, lat, lng) {
  const [rows] = await pool.query(
    `SELECT z.id, z.zone_name, z.shape_type, z.center_lat, z.center_lng, z.radius_meters,
            z.corner_a_lat, z.corner_a_lng, z.corner_c_lat, z.corner_c_lng
     FROM safe_zones z
     INNER JOIN safe_zone_children szc ON szc.zone_id = z.id
     WHERE szc.child_id = ? AND z.active = TRUE`,
    [childId],
  )

  if (Array.isArray(rows) && rows.length > 0) {
    let insideAny = false
    let minDistance = Number.POSITIVE_INFINITY
    let matchedZone = null
    const zoneStates = []
    for (const zone of rows) {
      const shapeType = zone.shape_type === 'rectangle' ? 'rectangle' : 'circle'
      const distance = haversineMeters(lat, lng, zone.center_lat, zone.center_lng)
      let isInside = false
      if (shapeType === 'rectangle'
        && Number.isFinite(zone.corner_a_lat)
        && Number.isFinite(zone.corner_a_lng)
        && Number.isFinite(zone.corner_c_lat)
        && Number.isFinite(zone.corner_c_lng)) {
        const minLat = Math.min(zone.corner_a_lat, zone.corner_c_lat)
        const maxLat = Math.max(zone.corner_a_lat, zone.corner_c_lat)
        const minLng = Math.min(zone.corner_a_lng, zone.corner_c_lng)
        const maxLng = Math.max(zone.corner_a_lng, zone.corner_c_lng)
        isInside = lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
      } else {
        isInside = distance <= zone.radius_meters
      }
      if (distance < minDistance) {
        minDistance = distance
      }
      if (isInside) {
        insideAny = true
        if (!matchedZone) matchedZone = zone
      }
      zoneStates.push({
        zoneId: zone.id,
        zoneName: zone.zone_name,
        inside: isInside,
        distanceMeters: distance,
      })
    }
    return {
      zoneStates,
      geofenceViolated: !insideAny,
      distanceFromCenterMeters: Number.isFinite(minDistance) ? minDistance : null,
      matchedZoneName: matchedZone?.zone_name ?? null,
    }
  }

  // Backward compatibility with old single-zone table.
  const [legacyRows] = await pool.query(
    'SELECT center_lat, center_lng, radius_meters FROM geofence WHERE child_id = ? LIMIT 1',
    [childId],
  )
  if (!Array.isArray(legacyRows) || legacyRows.length === 0) {
    return { zoneStates: [], geofenceViolated: false, distanceFromCenterMeters: null, matchedZoneName: null }
  }
  const geofence = legacyRows[0]
  const distanceFromCenterMeters = haversineMeters(lat, lng, geofence.center_lat, geofence.center_lng)
  return {
    zoneStates: [],
    geofenceViolated: distanceFromCenterMeters > geofence.radius_meters,
    distanceFromCenterMeters,
    matchedZoneName: null,
  }
}

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true, service: 'clms-node-backend' })
})

// Some webhook providers validate URL with GET/HEAD before saving.
app.get('/api/webhooks/arduino/gps', (_req, res) => {
  res.json({ ok: true, message: 'Webhook endpoint is reachable. Use POST to send GPS payload.' })
})

app.head('/api/webhooks/arduino/gps', (_req, res) => {
  res.status(200).end()
})

app.get('/api/children', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT child_id AS childId, display_name AS displayName, thing_id AS thingId, arduino_client_id AS arduinoClientId, arduino_client_secret AS arduinoClientSecret, active, created_at AS createdAt
     FROM children
     ORDER BY created_at ASC`,
  )
  return res.json(rows)
})

app.post('/api/children', async (req, res) => {
  const { childId, displayName, thingId, arduinoClientId, arduinoClientSecret } = req.body ?? {}
  if (!childId || typeof childId !== 'string') {
    return res.status(400).json({ message: 'childId is required.' })
  }
  const safeDisplayName = typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : `Child ${childId.slice(0, 6)}`
  const safeThingId = typeof thingId === 'string' && thingId.trim() ? thingId.trim() : childId
  const safeClientId = typeof arduinoClientId === 'string' && arduinoClientId.trim() ? arduinoClientId.trim() : null
  const safeClientSecret = typeof arduinoClientSecret === 'string' && arduinoClientSecret.trim() ? arduinoClientSecret.trim() : null

  await pool.query(
    `INSERT INTO children (child_id, display_name, thing_id, arduino_client_id, arduino_client_secret, active)
     VALUES (?, ?, ?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       thing_id = VALUES(thing_id),
       arduino_client_id = COALESCE(VALUES(arduino_client_id), arduino_client_id),
       arduino_client_secret = COALESCE(VALUES(arduino_client_secret), arduino_client_secret),
       active = TRUE`,
    [childId.trim(), safeDisplayName, safeThingId, safeClientId, safeClientSecret],
  )
  return res.status(201).json({ childId: childId.trim(), displayName: safeDisplayName, thingId: safeThingId })
})

app.patch('/api/children/:childId', async (req, res) => {
  const { childId } = req.params
  const { displayName, thingId, arduinoClientId, arduinoClientSecret, active } = req.body ?? {}
  const fields = []
  const values = []
  if (typeof displayName === 'string' && displayName.trim()) {
    fields.push('display_name = ?')
    values.push(displayName.trim())
  }
  if (typeof thingId === 'string' && thingId.trim()) {
    fields.push('thing_id = ?')
    values.push(thingId.trim())
  }
  if (typeof arduinoClientId === 'string') {
    fields.push('arduino_client_id = ?')
    values.push(arduinoClientId.trim() || null)
  }
  if (typeof arduinoClientSecret === 'string') {
    fields.push('arduino_client_secret = ?')
    values.push(arduinoClientSecret.trim() || null)
  }
  if (typeof active === 'boolean') {
    fields.push('active = ?')
    values.push(active)
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No updatable fields.' })
  }
  values.push(childId)
  await pool.query(`UPDATE children SET ${fields.join(', ')} WHERE child_id = ?`, values)
  return res.json({ ok: true, childId })
})

async function normalizeChildIds(rawChildIds) {
  if (!Array.isArray(rawChildIds)) {
    return { error: 'childIds must be an array of strings.' }
  }
  const trimmed = [...new Set(
    rawChildIds
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean),
  )]
  if (trimmed.length === 0) {
    return { error: 'At least one childId is required.' }
  }
  const [knownRows] = await pool.query(
    'SELECT child_id AS childId FROM children WHERE child_id IN (?)',
    [trimmed],
  )
  const knownSet = new Set(knownRows.map((r) => r.childId))
  const unknown = trimmed.filter((id) => !knownSet.has(id))
  if (unknown.length > 0) {
    return { error: `Unknown childId(s): ${unknown.join(', ')}` }
  }
  return { childIds: trimmed }
}

async function replaceZoneChildren(zoneId, childIds) {
  await pool.query('DELETE FROM safe_zone_children WHERE zone_id = ?', [zoneId])
  if (childIds.length === 0) return
  const values = childIds.map((cid) => [zoneId, cid])
  await pool.query('INSERT INTO safe_zone_children (zone_id, child_id) VALUES ?', [values])
}

async function loadZonesByIds(zoneIds) {
  if (!Array.isArray(zoneIds) || zoneIds.length === 0) return []
  const [zoneRows] = await pool.query(
    `SELECT id, zone_name AS zoneName, shape_type AS shapeType,
            center_lat AS centerLat, center_lng AS centerLng, radius_meters AS radiusMeters,
            corner_a_lat AS cornerALat, corner_a_lng AS cornerALng,
            corner_c_lat AS cornerCLat, corner_c_lng AS cornerCLng,
            active, created_at AS createdAt
     FROM safe_zones
     WHERE id IN (?)
     ORDER BY created_at DESC`,
    [zoneIds],
  )
  const [memberRows] = await pool.query(
    `SELECT szc.zone_id AS zoneId, szc.child_id AS childId, c.display_name AS displayName
     FROM safe_zone_children szc
     INNER JOIN children c ON c.child_id = szc.child_id
     WHERE szc.zone_id IN (?)`,
    [zoneIds],
  )
  const membersByZone = new Map()
  for (const row of memberRows) {
    if (!membersByZone.has(row.zoneId)) membersByZone.set(row.zoneId, [])
    membersByZone.get(row.zoneId).push({ childId: row.childId, displayName: row.displayName })
  }
  return zoneRows.map((z) => {
    const members = membersByZone.get(z.id) || []
    return {
      ...z,
      childIds: members.map((m) => m.childId),
      childDisplayNames: members.map((m) => m.displayName),
    }
  })
}

app.get('/api/safezones/:childId', async (req, res) => {
  const { childId } = req.params
  const [idRows] = await pool.query(
    `SELECT zone_id AS id FROM safe_zone_children WHERE child_id = ?`,
    [childId],
  )
  const zones = await loadZonesByIds(idRows.map((r) => r.id))
  return res.json(zones)
})

app.get('/api/safezones', async (_req, res) => {
  const [idRows] = await pool.query(`SELECT id FROM safe_zones ORDER BY created_at DESC`)
  const zones = await loadZonesByIds(idRows.map((r) => r.id))
  return res.json(zones)
})

app.post('/api/safezones', async (req, res) => {
  const {
    childIds: rawChildIds,
    zoneName,
    shapeType,
    centerLat,
    centerLng,
    edgeLat,
    edgeLng,
    radiusMeters,
    cornerALat,
    cornerALng,
    cornerCLat,
    cornerCLng,
  } = req.body ?? {}
  const validated = await normalizeChildIds(rawChildIds)
  if (validated.error) {
    return res.status(400).json({ message: validated.error })
  }
  const effectiveChildIds = validated.childIds
  if (!zoneName || typeof zoneName !== 'string' || !zoneName.trim()) {
    return res.status(400).json({ message: 'zoneName is required.' })
  }
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return res.status(400).json({ message: 'centerLat/centerLng must be numbers.' })
  }
  const normalizedShape = shapeType === 'rectangle' ? 'rectangle' : 'circle'
  let computedRadius = Number(radiusMeters)
  let safeCornerALat = null
  let safeCornerALng = null
  let safeCornerCLat = null
  let safeCornerCLng = null

  if (normalizedShape === 'rectangle') {
    safeCornerALat = Number(cornerALat)
    safeCornerALng = Number(cornerALng)
    safeCornerCLat = Number(cornerCLat)
    safeCornerCLng = Number(cornerCLng)
    if (
      !Number.isFinite(safeCornerALat)
      || !Number.isFinite(safeCornerALng)
      || !Number.isFinite(safeCornerCLat)
      || !Number.isFinite(safeCornerCLng)
    ) {
      return res.status(400).json({ message: 'Rectangle requires cornerALat/cornerALng/cornerCLat/cornerCLng.' })
    }
    const latSpan = Math.abs(safeCornerALat - safeCornerCLat)
    const lngSpan = Math.abs(safeCornerALng - safeCornerCLng)
    if (latSpan < 0.00001 || lngSpan < 0.00001) {
      return res.status(400).json({ message: 'Rectangle zone is too small.' })
    }
    const midLat = (safeCornerALat + safeCornerCLat) / 2
    const midLng = (safeCornerALng + safeCornerCLng) / 2
    computedRadius = haversineMeters(midLat, midLng, safeCornerALat, safeCornerALng)
  } else if (!Number.isFinite(computedRadius) || computedRadius <= 0) {
    if (!Number.isFinite(edgeLat) || !Number.isFinite(edgeLng)) {
      return res.status(400).json({ message: 'Provide edgeLat/edgeLng or radiusMeters.' })
    }
    computedRadius = haversineMeters(centerLat, centerLng, edgeLat, edgeLng)
  }
  if (!Number.isFinite(computedRadius) || computedRadius < 10) {
    return res.status(400).json({ message: 'radiusMeters is too small.' })
  }

  const [insertResult] = await pool.query(
    `INSERT INTO safe_zones
      (zone_name, shape_type, center_lat, center_lng, radius_meters,
       corner_a_lat, corner_a_lng, corner_c_lat, corner_c_lng, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [
      zoneName.trim(),
      normalizedShape,
      centerLat,
      centerLng,
      computedRadius,
      safeCornerALat,
      safeCornerALng,
      safeCornerCLat,
      safeCornerCLng,
    ],
  )
  await replaceZoneChildren(insertResult.insertId, effectiveChildIds)
  return res.status(201).json({
    id: insertResult.insertId,
    childIds: effectiveChildIds,
    zoneName: zoneName.trim(),
    shapeType: normalizedShape,
    centerLat,
    centerLng,
    radiusMeters: computedRadius,
    cornerALat: safeCornerALat,
    cornerALng: safeCornerALng,
    cornerCLat: safeCornerCLat,
    cornerCLng: safeCornerCLng,
    active: true,
  })
})

app.patch('/api/safezones/:zoneId', async (req, res) => {
  const zoneId = Number(req.params.zoneId)
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    return res.status(400).json({ message: 'Invalid zoneId.' })
  }
  const { zoneName, active } = req.body ?? {}
  const fields = []
  const values = []
  if (typeof zoneName === 'string' && zoneName.trim()) {
    fields.push('zone_name = ?')
    values.push(zoneName.trim())
  }
  if (typeof active === 'boolean') {
    fields.push('active = ?')
    values.push(active)
  }
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No updatable fields.' })
  }
  values.push(zoneId)
  await pool.query(`UPDATE safe_zones SET ${fields.join(', ')} WHERE id = ?`, values)
  return res.json({ ok: true, zoneId })
})

app.put('/api/safezones/:zoneId', async (req, res) => {
  const zoneId = Number(req.params.zoneId)
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    return res.status(400).json({ message: 'Invalid zoneId.' })
  }
  const {
    zoneName, shapeType, centerLat, centerLng, edgeLat, edgeLng, radiusMeters,
    cornerALat, cornerALng, cornerCLat, cornerCLng, active,
    childIds: rawChildIds,
  } = req.body ?? {}

  let validatedChildIds = null
  if (rawChildIds !== undefined) {
    const validated = await normalizeChildIds(rawChildIds)
    if (validated.error) {
      return res.status(400).json({ message: validated.error })
    }
    validatedChildIds = validated.childIds
  }

  if (!zoneName || typeof zoneName !== 'string' || !zoneName.trim()) {
    return res.status(400).json({ message: 'zoneName is required.' })
  }
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return res.status(400).json({ message: 'centerLat/centerLng must be numbers.' })
  }
  const normalizedShape = shapeType === 'rectangle' ? 'rectangle' : 'circle'
  let computedRadius = Number(radiusMeters)
  let safeCornerALat = null
  let safeCornerALng = null
  let safeCornerCLat = null
  let safeCornerCLng = null

  if (normalizedShape === 'rectangle') {
    safeCornerALat = Number(cornerALat)
    safeCornerALng = Number(cornerALng)
    safeCornerCLat = Number(cornerCLat)
    safeCornerCLng = Number(cornerCLng)
    if (!Number.isFinite(safeCornerALat) || !Number.isFinite(safeCornerALng) ||
        !Number.isFinite(safeCornerCLat) || !Number.isFinite(safeCornerCLng)) {
      return res.status(400).json({ message: 'Rectangle requires cornerALat/cornerALng/cornerCLat/cornerCLng.' })
    }
    const latSpan = Math.abs(safeCornerALat - safeCornerCLat)
    const lngSpan = Math.abs(safeCornerALng - safeCornerCLng)
    if (latSpan < 0.00001 || lngSpan < 0.00001) {
      return res.status(400).json({ message: 'Rectangle zone is too small.' })
    }
    const midLat = (safeCornerALat + safeCornerCLat) / 2
    const midLng = (safeCornerALng + safeCornerCLng) / 2
    computedRadius = haversineMeters(midLat, midLng, safeCornerALat, safeCornerALng)
  } else if (!Number.isFinite(computedRadius) || computedRadius <= 0) {
    if (!Number.isFinite(edgeLat) || !Number.isFinite(edgeLng)) {
      return res.status(400).json({ message: 'Provide edgeLat/edgeLng or radiusMeters.' })
    }
    computedRadius = haversineMeters(centerLat, centerLng, edgeLat, edgeLng)
  }
  if (!Number.isFinite(computedRadius) || computedRadius < 10) {
    return res.status(400).json({ message: 'radiusMeters is too small.' })
  }

  const effectiveActive = typeof active === 'boolean' ? active : true;

  await pool.query(
    `UPDATE safe_zones SET
       zone_name = ?, shape_type = ?, center_lat = ?, center_lng = ?, radius_meters = ?,
       corner_a_lat = ?, corner_a_lng = ?, corner_c_lat = ?, corner_c_lng = ?, active = ?
     WHERE id = ?`,
    [
      zoneName.trim(), normalizedShape, centerLat, centerLng, computedRadius,
      safeCornerALat, safeCornerALng, safeCornerCLat, safeCornerCLng, effectiveActive, zoneId
    ]
  )
  if (validatedChildIds) {
    await replaceZoneChildren(zoneId, validatedChildIds)
  }
  return res.json({ ok: true, zoneId })
})


app.delete('/api/safezones/:zoneId', async (req, res) => {
  const zoneId = Number(req.params.zoneId)
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    return res.status(400).json({ message: 'Invalid zoneId.' })
  }
  await pool.query('DELETE FROM safe_zones WHERE id = ?', [zoneId])
  return res.json({ ok: true, zoneId })
})

app.post('/api/geofences', async (req, res) => {
  const { childId, centerLat, centerLng, radiusMeters } = req.body ?? {}
  if (!childId || !Number.isFinite(centerLat) || !Number.isFinite(centerLng) || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return res.status(400).json({ message: 'Invalid geofence payload.' })
  }

  await pool.query(
    `INSERT INTO geofence (child_id, center_lat, center_lng, radius_meters)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       center_lat = VALUES(center_lat),
       center_lng = VALUES(center_lng),
       radius_meters = VALUES(radius_meters)`,
    [childId, centerLat, centerLng, radiusMeters],
  )

  return res.json({
    childId,
    zoneName: 'Legacy geofence',
    centerLat,
    centerLng,
    radiusMeters,
  })
})

let locationSnapshotEmptyHintShown = false

async function trimLocationHistoryForChild(childId) {
  await pool.query(
    `DELETE FROM location_history
     WHERE child_id = ?
       AND id NOT IN (
         SELECT id FROM (
           SELECT id
           FROM location_history
           WHERE child_id = ?
           ORDER BY captured_at DESC
           LIMIT 100
         ) AS keep_rows
       )`,
    [childId, childId],
  )
}

/** Append current `child_latest_location` rows to `location_history` (scheduled snapshot). */
async function snapshotLatestToHistory() {
  const [rows] = await pool.query(
    'SELECT child_id, lat, lng, geofence_violated, distance_from_center_meters FROM child_latest_location',
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    if (!locationSnapshotEmptyHintShown) {
      locationSnapshotEmptyHintShown = true
      console.log(
        '[location snapshot] child_latest_location is still empty — snapshots only copy existing rows. Send GPS once (Arduino poll with API credentials, POST /api/sync/arduino-cloud, or POST /api/webhooks/arduino/gps). Further empty runs are silent.',
      )
    }
    return
  }

  locationSnapshotEmptyHintShown = false

  const now = Date.now()
  for (const row of rows) {
    await pool.query(
      `INSERT INTO location_history (child_id, lat, lng, captured_at, geofence_violated, distance_from_center_meters)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        row.child_id,
        row.lat,
        row.lng,
        now,
        Boolean(row.geofence_violated),
        row.distance_from_center_meters,
      ],
    )
    await trimLocationHistoryForChild(row.child_id)
  }
  console.log(
    `[location snapshot] archived ${rows.length} child row(s) from child_latest_location → location_history`,
  )
}

/** Pull Thing properties from Arduino IoT Cloud and upsert GPS (uses Gps JSON or lat/lng variables). */
async function pollArduinoCloudGpsToDb(target) {
  const clientId = target?.clientId || process.env.ARDUINO_CLIENT_ID
  const clientSecret = target?.clientSecret || process.env.ARDUINO_CLIENT_SECRET
  const thingId = target?.thingId
  const childId = target?.childId

  if (!clientId || !clientSecret || !thingId) {
    return
  }

  const payload = await fetchThingPropertiesRaw(thingId, clientId, clientSecret)
  const { lat, lng, vars } = pickLatLngFromPropertiesPayload(payload)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.log('[arduino poll] no lat/lng in Thing properties', Object.keys(vars))
    return
  }

  const v = validateGpsForStorage({ lat, lng, timestamp: Date.now() })
  if (!v.ok) {
    console.warn('[arduino poll]', v.message)
    return
  }

  await upsertGpsLocation({
    childId,
    lat: v.lat,
    lng: v.lng,
    timestamp: v.timestamp,
    battery: vars.battery !== undefined ? vars.battery : null,
  })
  console.log('[arduino poll] saved', childId, v.lat, v.lng)
}

function startArduinoCloudPollScheduler() {
  const pollMs = Number(process.env.ARDUINO_POLL_INTERVAL_MS ?? 60_000)
  if (!Number.isFinite(pollMs) || pollMs <= 0) {
    return
  }

  const run = async () => {
    try {
      const targets = await listPollTargets()
      for (const target of targets) {
        // eslint-disable-next-line no-await-in-loop
        await pollArduinoCloudGpsToDb(target).catch((err) => {
          console.error('[arduino poll]', target.childId, err.message)
        })
      }
    } catch (err) {
      console.error('[arduino poll] scheduler', err.message)
    }
  }

  const bootDelay = Number(process.env.ARDUINO_POLL_BOOT_DELAY_MS ?? 5_000)
  if (Number.isFinite(bootDelay) && bootDelay >= 0) {
    setTimeout(run, bootDelay)
  }
  setInterval(run, pollMs)

  const label = pollMs >= 60_000 ? `${Math.round(pollMs / 60_000)} min` : `${Math.round(pollMs / 1000)} s`
  console.log(`Arduino Cloud GPS poll every ${label} (targets from children table or env fallback)`)
}

async function recordZoneTransitions({ childId, zoneStates, lat, lng, occurredAt }) {
  if (!Array.isArray(zoneStates) || zoneStates.length === 0) return
  const [priorRows] = await pool.query(
    'SELECT zone_id AS zoneId, inside FROM child_zone_state WHERE child_id = ?',
    [childId],
  )
  const prior = new Map(priorRows.map((r) => [Number(r.zoneId), Boolean(r.inside)]))

  const eventValues = []
  const stateValues = []
  for (const z of zoneStates) {
    const zoneIdNum = Number(z.zoneId)
    const currentInside = Boolean(z.inside)
    const hadPrior = prior.has(zoneIdNum)
    const priorInside = hadPrior ? prior.get(zoneIdNum) : false
    if (hadPrior && priorInside !== currentInside) {
      eventValues.push([childId, zoneIdNum, currentInside ? 'enter' : 'leave', occurredAt, lat, lng])
    } else if (!hadPrior && currentInside) {
      // First-ever observation and the child is already inside — log as enter.
      eventValues.push([childId, zoneIdNum, 'enter', occurredAt, lat, lng])
    }
    stateValues.push([childId, zoneIdNum, currentInside])
  }

  if (eventValues.length > 0) {
    await pool.query(
      'INSERT INTO zone_events (child_id, zone_id, kind, occurred_at, lat, lng) VALUES ?',
      [eventValues],
    )
  }
  if (stateValues.length > 0) {
    await pool.query(
      `INSERT INTO child_zone_state (child_id, zone_id, inside) VALUES ?
       ON DUPLICATE KEY UPDATE inside = VALUES(inside)`,
      [stateValues],
    )
  }
}

async function upsertGpsLocation({ childId, lat, lng, timestamp, battery }) {
  await pool.query(
    `INSERT INTO children (child_id, display_name, thing_id, active)
     VALUES (?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE
       thing_id = COALESCE(thing_id, VALUES(thing_id))`,
    [childId, `Child ${String(childId).slice(0, 6)}`, childId],
  )

  const zoneStatus = await pickZoneStatusForChild(childId, lat, lng)
  const geofenceViolated = zoneStatus.geofenceViolated
  const distanceFromCenterMeters = zoneStatus.distanceFromCenterMeters

  const capturedAt = Math.trunc(timestamp)

  await recordZoneTransitions({
    childId,
    zoneStates: zoneStatus.zoneStates,
    lat,
    lng,
    occurredAt: capturedAt,
  })

  await pool.query(
    `INSERT INTO child_latest_location (child_id, lat, lng, captured_at, geofence_violated, distance_from_center_meters, battery)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       lat = VALUES(lat),
       lng = VALUES(lng),
       captured_at = VALUES(captured_at),
       geofence_violated = VALUES(geofence_violated),
       distance_from_center_meters = VALUES(distance_from_center_meters),
       battery = COALESCE(VALUES(battery), battery)`,
    [childId, lat, lng, capturedAt, geofenceViolated, distanceFromCenterMeters, battery ?? null],
  )

  await pool.query(
    `INSERT INTO location_history (child_id, lat, lng, captured_at, geofence_violated, distance_from_center_meters)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [childId, lat, lng, capturedAt, geofenceViolated, distanceFromCenterMeters],
  )

  await trimLocationHistoryForChild(childId)

  return {
    childId,
    lat,
    lng,
    timestamp: capturedAt,
    geofenceViolated,
    distanceFromCenterMeters,
    zoneName: zoneStatus.matchedZoneName,
  }
}

/** Arduino IoT Cloud "Data forwarding (Webhook)" often sends `{ values: [{ name, value }] }`. */
function parseLatLngFromArduinoCloudBody(body) {
  const vars = {}
  const values = body?.values
  if (Array.isArray(values)) {
    for (const entry of values) {
      const n = entry?.name
      if (typeof n === 'string' && n.length > 0) {
        vars[n.toLowerCase()] = entry.value
      }
    }
  }
  const pickNumber = (keys) => {
    for (const k of keys) {
      const v = vars[k.toLowerCase()]
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
    }
    return null
  }
  let lat = null
  let lng = null
  for (const k of ['gps', 'location', 'position']) {
    const v = vars[k]
    const pair = tryExtractLatLngFromGpsJsonValue(v)
    if (pair) {
      lat = pair.lat
      lng = pair.lng
      break
    }
  }
  if (lat == null || lng == null) {
    lat = pickNumber(['lat', 'latitude'])
    lng = pickNumber(['lng', 'lon', 'longitude'])
  }
  if (lat == null && Number.isFinite(body?.lat)) lat = body.lat
  if (lng == null && Number.isFinite(body?.lng)) lng = body.lng
  if (lat == null && Number.isFinite(body?.latitude)) lat = body.latitude
  if (lng == null && Number.isFinite(body?.longitude)) lng = body.longitude

  let ts = body?.timestamp ?? body?.time
  if (typeof ts === 'string' && ts.trim() !== '') ts = Number(ts)
  if (!Number.isFinite(ts)) ts = Date.now()
  if (ts < 1e12) ts *= 1000

  let battery = pickNumber(['battery', 'bat', 'batt'])

  return { lat, lng, timestamp: ts, battery }
}

app.post('/api/webhooks/arduino/gps', async (req, res) => {
  const { childId, lat, lng, timestamp, battery } = req.body ?? {}
  if (!childId || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      message: 'Payload must include childId(string), lat(number), lng(number). Optional: timestamp(epoch ms); if omitted, server time is used.',
    })
  }
  const ts = Number.isFinite(timestamp) ? timestamp : Date.now()
  const v = validateGpsForStorage({ lat, lng, timestamp: ts })
  if (!v.ok) {
    return res.status(400).json({ message: v.message })
  }
  const result = await upsertGpsLocation({ childId, lat: v.lat, lng: v.lng, timestamp: v.timestamp, battery })
  return res.status(202).json({ ...result, integerScaled: Boolean(v.integerScaled) })
})

app.get('/api/webhooks/arduino/cloud', (_req, res) => {
  res.json({
    ok: true,
    message: 'Arduino Cloud webhook target. Use POST. Pass childId as query (?childId=...) matching your Thing ID.',
  })
})

app.head('/api/webhooks/arduino/cloud', (_req, res) => {
  res.status(200).end()
})

/**
 * Receives Arduino IoT Cloud "Data forwarding" payloads.
 * Configure URL (HTTPS, publicly reachable), e.g.:
 *   https://YOUR_HOST/api/webhooks/arduino/cloud?childId=dcdfbea3-8fea-48ce-a45c-423b0f6057e8
 * Cloud variables should include lat and lng (or latitude/longitude).
 */
app.post('/api/webhooks/arduino/cloud', async (req, res) => {
  const childId =
    (typeof req.query.childId === 'string' && req.query.childId) ||
    (typeof req.body?.childId === 'string' && req.body.childId) ||
    (typeof req.body?.thing_id === 'string' && req.body.thing_id) ||
    (typeof req.body?.thingId === 'string' && req.body.thingId) ||
    ''

  const { lat, lng, timestamp, battery } = parseLatLngFromArduinoCloudBody(req.body ?? {})
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)

  if (!childId) {
    if (!hasCoords) {
      return res.status(200).json({
        ok: true,
        message:
          'Webhook reachable. Add ?childId=<THING_ID> to the URL, or use /api/webhooks/arduino/cloud/<THING_ID>.',
      })
    }
    return res.status(400).json({
      message:
        'Missing childId. Add ?childId=<your-thing-id> to the webhook URL in Arduino Cloud, or send childId/thing_id in JSON.',
    })
  }

  if (!hasCoords) {
    return res.status(200).json({
      ok: true,
      childId,
      message: 'Webhook ready; no lat/lng in this request (Arduino Cloud URL check).',
    })
  }

  const v = validateGpsForStorage({ lat, lng, timestamp })
  if (!v.ok) {
    return res.status(400).json({ message: v.message })
  }
  const result = await upsertGpsLocation({ childId, lat: v.lat, lng: v.lng, timestamp: v.timestamp, battery })
  return res.status(202).json({ ...result, integerScaled: Boolean(v.integerScaled) })
})

/** Shorter URL for Arduino Cloud (no query string): .../cloud/<THING_ID> */
app.get('/api/webhooks/arduino/cloud/:childId', (req, res) => {
  res.json({
    ok: true,
    childId: req.params.childId,
    message:
      'Arduino Cloud webhook target. Use POST with JSON body; Cloud variables lat and lng (or latitude/longitude).',
  })
})

app.head('/api/webhooks/arduino/cloud/:childId', (_req, res) => {
  res.status(200).end()
})

app.post('/api/webhooks/arduino/cloud/:childId', async (req, res) => {
  const { childId } = req.params
  if (!childId || childId.length < 8) {
    return res.status(400).json({ message: 'Invalid childId in path.' })
  }
  const { lat, lng, timestamp, battery } = parseLatLngFromArduinoCloudBody(req.body ?? {})
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(200).json({
      ok: true,
      childId,
      message: 'Webhook ready; no lat/lng in this request (Arduino Cloud URL check).',
    })
  }
  const v = validateGpsForStorage({ lat, lng, timestamp })
  if (!v.ok) {
    return res.status(400).json({ message: v.message })
  }
  const result = await upsertGpsLocation({ childId, lat: v.lat, lng: v.lng, timestamp: v.timestamp, battery })
  return res.status(202).json({ ...result, integerScaled: Boolean(v.integerScaled) })
})

/**
 * Ultra-short webhook URL for providers with strict URL validation.
 * Configure ARDUINO_CHILD_ID in env to avoid passing childId in URL/query.
 */
app.get('/w', (_req, res) => {
  res.json({
    ok: true,
    message:
      'Short Arduino webhook target. Use POST with lat/lng values. Configure ARDUINO_CHILD_ID on server.',
  })
})

app.head('/w', (_req, res) => {
  res.status(200).end()
})

app.post('/w', async (req, res) => {
  const childId =
    (typeof process.env.ARDUINO_CHILD_ID === 'string' && process.env.ARDUINO_CHILD_ID) ||
    (typeof req.body?.childId === 'string' && req.body.childId) ||
    (typeof req.body?.thing_id === 'string' && req.body.thing_id) ||
    ''

  if (!childId) {
    return res.status(200).json({
      ok: true,
      message: 'Webhook reachable. Set ARDUINO_CHILD_ID on server to save GPS data.',
    })
  }

  const { lat, lng, timestamp, battery } = parseLatLngFromArduinoCloudBody(req.body ?? {})
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(200).json({
      ok: true,
      childId,
      message: 'Webhook ready; no lat/lng in this request.',
    })
  }

  const v = validateGpsForStorage({ lat, lng, timestamp })
  if (!v.ok) {
    return res.status(400).json({ message: v.message })
  }
  const result = await upsertGpsLocation({ childId, lat: v.lat, lng: v.lng, timestamp: v.timestamp, battery })
  return res.status(202).json({ ...result, integerScaled: Boolean(v.integerScaled) })
})

/**
 * Pull latest lat/lng from Arduino IoT Cloud Thing properties and save to DB.
 * Requires ARDUINO_CLIENT_ID + ARDUINO_CLIENT_SECRET.
 * Optional: ARDUINO_THING_ID (defaults to ARDUINO_CHILD_ID), ARDUINO_SYNC_TOKEN (required header if set).
 */
app.post('/api/sync/arduino-cloud', async (req, res) => {
  const syncToken = process.env.ARDUINO_SYNC_TOKEN
  if (syncToken) {
    const provided = req.headers['x-arduino-sync-token'] ?? req.body?.syncToken
    if (provided !== syncToken) {
      return res.status(401).json({ message: 'Invalid or missing x-arduino-sync-token / syncToken.' })
    }
  }

  const thingId =
    (typeof req.body?.thingId === 'string' && req.body.thingId) ||
    (typeof process.env.ARDUINO_THING_ID === 'string' && process.env.ARDUINO_THING_ID) ||
    (typeof process.env.ARDUINO_CHILD_ID === 'string' && process.env.ARDUINO_CHILD_ID) ||
    ''

  const childId =
    (typeof req.body?.childId === 'string' && req.body.childId) ||
    (typeof process.env.ARDUINO_CHILD_ID === 'string' && process.env.ARDUINO_CHILD_ID) ||
    thingId

  if (!thingId) {
    return res.status(400).json({
      message: 'Set ARDUINO_THING_ID or ARDUINO_CHILD_ID, or pass thingId in JSON body.',
    })
  }

  try {
    const payload = await fetchThingPropertiesRaw(thingId)
    const { lat, lng, vars } = pickLatLngFromPropertiesPayload(payload)
    const ts = Date.now()

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(404).json({
        message:
          'No lat/lng on this Thing. Create Cloud variables named lat and lng (or latitude/longitude) and publish values.',
        propertyNames: Object.keys(vars),
      })
    }

    const v = validateGpsForStorage({ lat, lng, timestamp: ts })
    if (!v.ok) {
      return res.status(400).json({ message: v.message })
    }

    const result = await upsertGpsLocation({
      childId,
      lat: v.lat,
      lng: v.lng,
      timestamp: v.timestamp,
      battery: vars.battery !== undefined ? vars.battery : null,
    })

    return res.status(202).json({
      ...result,
      source: 'arduino-cloud-api',
      thingId,
      integerScaled: Boolean(v.integerScaled),
      propertyNames: Object.keys(vars),
    })
  } catch (err) {
    console.error('Arduino Cloud sync:', err)
    return res.status(502).json({
      message: err?.message || 'Arduino Cloud sync failed.',
    })
  }
})

app.get('/api/location/latest/:childId', async (req, res) => {
  const { childId } = req.params
  const [rows] = await pool.query(
    `SELECT child_id AS childId, lat, lng, captured_at AS timestamp
     FROM child_latest_location WHERE child_id = ? LIMIT 1`,
    [childId],
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(404).json({ message: 'No location found for child.' })
  }
  
  const row = rows[0]
  const zoneStatus = await pickZoneStatusForChild(row.childId, row.lat, row.lng)
  row.geofenceViolated = zoneStatus.geofenceViolated
  row.distanceFromCenterMeters = zoneStatus.distanceFromCenterMeters
  row.zoneStates = zoneStatus.zoneStates

  return res.json(row)
})

app.get('/api/location/latest', async (req, res) => {
  const idsRaw = typeof req.query.childIds === 'string' ? req.query.childIds : ''
  const childIds = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (childIds.length === 0) {
    return res.status(400).json({ message: 'Query childIds is required (comma-separated).' })
  }
  const placeholders = childIds.map(() => '?').join(',')
  const [rows] = await pool.query(
    `SELECT child_id AS childId, lat, lng, captured_at AS timestamp
     FROM child_latest_location
     WHERE child_id IN (${placeholders})`,
    childIds,
  )
  
  for (const row of rows) {
    const zoneStatus = await pickZoneStatusForChild(row.childId, row.lat, row.lng)
    row.geofenceViolated = zoneStatus.geofenceViolated
    row.distanceFromCenterMeters = zoneStatus.distanceFromCenterMeters
    row.zoneStates = zoneStatus.zoneStates
  }

  return res.json(rows)
})

app.get('/api/zone-events', async (req, res) => {
  const idsRaw = typeof req.query.childIds === 'string' ? req.query.childIds : ''
  const childIds = idsRaw.split(',').map((s) => s.trim()).filter(Boolean)
  const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 50))

  let sql = `
    SELECT e.id, e.child_id AS childId, c.display_name AS childDisplayName,
           e.zone_id AS zoneId, z.zone_name AS zoneName,
           e.kind, e.occurred_at AS occurredAt, e.lat, e.lng
    FROM zone_events e
    INNER JOIN children c   ON c.child_id = e.child_id
    INNER JOIN safe_zones z ON z.id       = e.zone_id
  `
  const params = []
  if (childIds.length > 0) {
    sql += ` WHERE e.child_id IN (?)`
    params.push(childIds)
  }
  sql += ` ORDER BY e.occurred_at DESC, e.id DESC LIMIT ?`
  params.push(limit)

  const [rows] = await pool.query(sql, params)
  return res.json(rows)
})

app.get('/api/dashboard/:childId', async (req, res) => {
  const { childId } = req.params

  const [latestRows] = await pool.query(
    `SELECT lat, lng, captured_at AS timestamp, battery
     FROM child_latest_location WHERE child_id = ? LIMIT 1`,
    [childId]
  )

  if (!Array.isArray(latestRows) || latestRows.length === 0) {
    return res.status(404).json({ message: 'No data found for child.' })
  }
  const latest = latestRows[0]

  const [childRows] = await pool.query(
    `SELECT display_name AS name FROM children WHERE child_id = ? LIMIT 1`,
    [childId]
  )
  const childInfo = (childRows && childRows[0]) || { name: 'Unknown' }

  const zoneStatus = await pickZoneStatusForChild(childId, latest.lat, latest.lng)

  const now = Date.now()
  const diffMinutes = Math.floor((now - latest.timestamp) / 60000)
  let lastSeenStr = diffMinutes < 1 ? 'Just now' : `${diffMinutes} min ago`
  if (diffMinutes >= 60) {
    const diffHours = Math.floor(diffMinutes / 60)
    lastSeenStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }
  const online = diffMinutes < 5

  const [eventRows] = await pool.query(
    `SELECT e.id, e.kind, e.occurred_at AS occurredAt, z.zone_name AS zoneName
     FROM zone_events e
     INNER JOIN safe_zones z ON z.id = e.zone_id
     WHERE e.child_id = ?
     ORDER BY e.occurred_at DESC, e.id DESC
     LIMIT 10`,
    [childId],
  )

  const notifications = eventRows.map((row) => ({
    id: `${childId}-${row.kind}-${row.id}`,
    type: 'geofence',
    isArrival: row.kind === 'enter',
    childName: childInfo.name,
    message: row.kind === 'enter' ? `arrived at ${row.zoneName}` : `left ${row.zoneName}`,
    timestamp: new Date(Number(row.occurredAt)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    tsValue: Number(row.occurredAt),
    read: false,
  }))

  const response = {
    child: {
      id: childId,
      name: childInfo.name,
      lastSeen: lastSeenStr,
      online: online,
      currentZone: zoneStatus.matchedZoneName || 'Outside',
      zoneStates: zoneStatus.zoneStates,
      distanceFromCenterMeters: zoneStatus.distanceFromCenterMeters,
      location: {
        lat: latest.lat,
        lng: latest.lng,
        address: `${latest.lat.toFixed(5)}, ${latest.lng.toFixed(5)}`,
        updatedAt: lastSeenStr
      }
    },
    notifications
  }

  return res.json(response)
})

app.get('/api/location/history/:childId', async (req, res) => {
  const { childId } = req.params
  const [rows] = await pool.query(
    `SELECT child_id AS childId, lat, lng, captured_at AS timestamp,
            geofence_violated AS geofenceViolated,
            distance_from_center_meters AS distanceFromCenterMeters
     FROM location_history
     WHERE child_id = ?
     ORDER BY captured_at DESC
     LIMIT 100`,
    [childId],
  )
  return res.json(rows)
})

// ── Auth helpers ─────────────────────────────────────────────────────────────

const googleClient  = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const JWT_SECRET    = process.env.JWT_SECRET || 'kidguard-demo-secret'
const OTP_EXPIRY_MS = 5 * 60 * 1000

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendOtpEmail(to, otp) {
  await mailer.sendMail({
    from: `"KidGuard" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your KidGuard verification code',
    text: `Your KidGuard verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:2px solid #0D0D0D;padding:0">
        <div style="background:#0D0D0D;padding:16px 24px">
          <span style="color:#fff;font-weight:800;font-size:18px;letter-spacing:0.05em">KIDGUARD</span>
        </div>
        <div style="padding:32px 24px">
          <p style="font-size:14px;color:#555;margin:0 0 24px">Your verification code is:</p>
          <div style="font-size:40px;font-weight:800;letter-spacing:0.15em;color:#0D0D0D;border:2px solid #0D0D0D;padding:16px;text-align:center;background:#f5f5f5">${otp}</div>
          <p style="font-size:12px;color:#888;margin:16px 0 0">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
      </div>`,
  })
}

/** Simple JWT auth middleware. Attaches req.user = { email, name }. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// ── POST /auth/google ─────────────────────────────────────────────────────────
// Verifies the Google ID token.
// - Existing user → generates & emails OTP → { requiresOtp: true, isNewUser: false, email }
// - New user      → does NOT create account → { requiresOtp: false, isNewUser: true, email, name, googleSub }
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body ?? {}
  if (!idToken) return res.status(400).json({ message: 'idToken is required.' })
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload   = ticket.getPayload()
    const email     = payload.email
    const googleName = payload.name || payload.email
    const sub       = payload.sub

    // Check if user already exists
    const [rows] = await pool.query(
      'SELECT id, name FROM users WHERE email = ? LIMIT 1',
      [email],
    )
    const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null

    if (!existing) {
      // New user — tell the frontend to collect profile info first
      return res.json({ requiresOtp: false, isNewUser: true, email, name: googleName, googleSub: sub })
    }

    // Existing user — keep google_sub up to date, then send OTP
    await pool.query(
      'UPDATE users SET google_sub = ? WHERE email = ?',
      [sub, email],
    )

    const otp    = generateOtp()
    const expiry = Date.now() + OTP_EXPIRY_MS
    await pool.query(
      'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?',
      [otp, expiry, email],
    )
    await sendOtpEmail(email, otp)
    return res.json({ requiresOtp: true, isNewUser: false, email })
  } catch (err) {
    console.error('[auth/google]', err.message)
    return res.status(400).json({ message: err.message || 'Google token verification failed.' })
  }
})

// ── POST /auth/google/complete ────────────────────────────────────────────────
// Called after a new Google user submits their profile info.
// Creates the user record, then sends OTP.
app.post('/auth/google/complete', async (req, res) => {
  const { email, name, dateOfBirth, googleSub } = req.body ?? {}
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const cleanName  = typeof name  === 'string' ? name.trim()  : ''

  if (!cleanEmail) return res.status(400).json({ message: 'email is required.' })
  if (!cleanName)  return res.status(400).json({ message: 'name is required.' })

  try {
    // Upsert user with profile info
    await pool.query(
      `INSERT INTO users (email, name, google_sub, date_of_birth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name         = VALUES(name),
         google_sub   = VALUES(google_sub),
         date_of_birth = COALESCE(VALUES(date_of_birth), date_of_birth)`,
      [cleanEmail, cleanName, googleSub || null, dateOfBirth || null],
    )

    const otp    = generateOtp()
    const expiry = Date.now() + OTP_EXPIRY_MS
    await pool.query(
      'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?',
      [otp, expiry, cleanEmail],
    )
    await sendOtpEmail(cleanEmail, otp)
    return res.json({ requiresOtp: true, email: cleanEmail })
  } catch (err) {
    console.error('[auth/google/complete]', err.message)
    return res.status(500).json({ message: 'Profile completion failed.' })
  }
})

// ── POST /auth/resend-otp ─────────────────────────────────────────────────────
// Regenerates and resends an OTP for any existing user (used by the MFA screen).
app.post('/auth/resend-otp', async (req, res) => {
  const { email } = req.body ?? {}
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!cleanEmail) return res.status(400).json({ message: 'email is required.' })

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [cleanEmail])
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(404).json({ message: 'No account found for this email.' })
  }

  try {
    const otp    = generateOtp()
    const expiry = Date.now() + OTP_EXPIRY_MS
    await pool.query(
      'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?',
      [otp, expiry, cleanEmail],
    )
    await sendOtpEmail(cleanEmail, otp)
    return res.json({ ok: true })
  } catch (err) {
    console.error('[auth/resend-otp]', err.message)
    return res.status(500).json({ message: 'Failed to resend OTP.' })
  }
})

// ── POST /auth/verify-otp ─────────────────────────────────────────────────────
app.post('/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body ?? {}
  if (!email || !otp) return res.status(400).json({ message: 'email and otp are required.' })

  const [rows] = await pool.query(
    'SELECT id, name, otp_code, otp_expiry FROM users WHERE email = ? LIMIT 1',
    [email],
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(401).json({ message: 'Invalid OTP.' })
  }
  const user = rows[0]
  if (user.otp_code !== String(otp).trim()) {
    return res.status(401).json({ message: 'Invalid OTP.' })
  }
  if (!user.otp_expiry || Date.now() > Number(user.otp_expiry)) {
    return res.status(401).json({ message: 'OTP has expired. Please request a new one.' })
  }

  // Clear OTP
  await pool.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE email = ?', [email])

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
  return res.json({ token, email, name: user.name })
})

// ── GET /api/settings ─────────────────────────────────────────────────────────
app.get('/api/settings', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT settings FROM users WHERE email = ? LIMIT 1',
    [req.user.email],
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.json({ geofenceAlerts: true })
  }
  const s = rows[0].settings
  const parsed = (typeof s === 'string' ? JSON.parse(s) : s) || {}
  return res.json({
    geofenceAlerts:  parsed.geofenceAlerts  !== false,
  })
})

// ── PUT /api/settings ─────────────────────────────────────────────────────────
app.put('/api/settings', requireAuth, async (req, res) => {
  const { geofenceAlerts } = req.body ?? {}
  const s = JSON.stringify({
    geofenceAlerts: geofenceAlerts !== false,
  })
  await pool.query('UPDATE users SET settings = ? WHERE email = ?', [s, req.user.email])
  return res.json({ ok: true })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Internal server error' })
})

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`CLMS backend running on http://localhost:${port}`)
    })

    // Default 1 min for testing; set LOCATION_SNAPSHOT_INTERVAL_MS=3600000 in .env for 60 min production.
    const snapshotMs = Number(process.env.LOCATION_SNAPSHOT_INTERVAL_MS ?? 60 * 1000)
    if (Number.isFinite(snapshotMs) && snapshotMs > 0) {
      const runSnapshot = () => {
        snapshotLatestToHistory().catch((err) => {
          console.error('Scheduled location_history snapshot:', err.message)
        })
      }
      const bootDelay = Number(process.env.LOCATION_SNAPSHOT_BOOT_DELAY_MS ?? 10_000)
      if (Number.isFinite(bootDelay) && bootDelay >= 0) {
        setTimeout(runSnapshot, bootDelay)
      }
      setInterval(runSnapshot, snapshotMs)
      const intervalLabel =
        snapshotMs >= 60_000
          ? `${Math.round(snapshotMs / 60_000)} min`
          : `${Math.round(snapshotMs / 1000)} s`
      console.log(
        `Scheduled copy of child_latest_location → location_history every ${intervalLabel} (first run after ${bootDelay}ms)`,
      )
    }

    startArduinoCloudPollScheduler()
  })
  .catch((error) => {
    console.error('Failed to initialize DB schema:', error.message)
    process.exit(1)
  })
