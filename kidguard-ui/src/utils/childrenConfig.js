const STORAGE_KEY = 'kidguard_children_v1'

function parseIds(raw) {
  return String(raw ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function normalizeActive(value) {
  if (value === undefined || value === null) return true
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value !== '0' && value.toLowerCase() !== 'false'
  return value !== false
}

export function defaultChildrenFromEnv() {
  const ids = [
    ...parseIds(import.meta.env.VITE_CHILD_IDS),
    ...parseIds(import.meta.env.VITE_CHILD_ID),
  ].filter((id, idx, arr) => arr.indexOf(id) === idx)
  return ids.map((id, idx) => ({
    childId: id,
    thingId: id,
    displayName: `Child ${idx + 1}`,
    active: true,
  }))
}

export function loadChildrenConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultChildrenFromEnv()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultChildrenFromEnv()
    const cleaned = parsed
      .filter((x) => x && typeof x.childId === 'string' && x.childId.trim())
      .map((x, idx) => ({
        childId: x.childId.trim(),
        thingId: typeof x.thingId === 'string' && x.thingId.trim() ? x.thingId.trim() : x.childId.trim(),
        displayName:
          typeof x.displayName === 'string' && x.displayName.trim()
            ? x.displayName.trim()
            : `Child ${idx + 1}`,
        active: normalizeActive(x.active),
      }))
    return cleaned
  } catch {
    return defaultChildrenFromEnv()
  }
}

export function saveChildrenConfig(children) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(children))
}

export function mergeChildren(localChildren, remoteChildren) {
  const map = new Map()
  for (const child of Array.isArray(localChildren) ? localChildren : []) {
    map.set(child.childId, child)
  }
  for (const row of Array.isArray(remoteChildren) ? remoteChildren : []) {
    const childId = typeof row.childId === 'string' ? row.childId.trim() : ''
    if (!childId) continue
    const prev = map.get(childId) || {}
    map.set(childId, {
      childId,
      thingId: (typeof row.thingId === 'string' && row.thingId.trim()) || prev.thingId || childId,
      displayName: (typeof row.displayName === 'string' && row.displayName.trim()) || prev.displayName || childId,
      active: normalizeActive(row.active),
    })
  }
  return [...map.values()]
}
