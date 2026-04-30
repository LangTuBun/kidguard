const TOKEN_KEY = 'kg_jwt'
const USER_KEY  = 'kg_user'

export function getToken()    { return localStorage.getItem(TOKEN_KEY) }
export function setToken(t)   { localStorage.setItem(TOKEN_KEY, t) }
export function clearToken()  {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
export function isLoggedIn()  { return !!getToken() }
export function authHeaders() { return { Authorization: `Bearer ${getToken()}` } }

export function setUser(u)    { localStorage.setItem(USER_KEY, JSON.stringify(u)) }
export function getUser()     {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

/** Decode JWT payload (no signature verification — frontend only). */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch { return null }
}

/** True if a token exists and its `exp` claim is still in the future. */
export function isTokenValid() {
  const t = getToken()
  if (!t) return false
  const payload = decodeToken(t)
  if (!payload?.exp) return false
  return payload.exp * 1000 > Date.now()
}
