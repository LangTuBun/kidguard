# KidGuard — Implementation Walkthrough

## Summary of Changes

This session implemented three scoped features and one routing fix across the `kidguard-ui` (React/Vite) and `clms-backend` (Node.js/Express/MySQL) projects.

---

## 1. Battery Feature — Removed

Battery data was a partially-wired mock that showed inaccurate `0%` values when no battery telemetry was present. It has been removed cleanly from all layers.

| File | Change |
|---|---|
| `src/components/SafetyStatusBar.jsx` | Removed `battery` prop, `batteryColor` variable, and the entire battery widget from the status bar render |
| `src/screens/parent/Dashboard.jsx` | Removed `battery={child.battery ?? 0}` prop passed to `SafetyStatusBar` |
| `src/data/mock.js` | Removed `battery: 78` from `mockChild` |
| `clms-backend/server.js` | Removed `battery: latest.battery ?? 0` from `GET /api/dashboard/:childId` response |

---

## 2. Google Login + Email OTP Authentication

Replaced the static email/password mock form with a real 2-step auth flow.

### Auth Flow
```
User clicks "Continue with Google"
  → Google OAuth popup (via @react-oauth/google)
  → Frontend receives Google ID token
  → POST /auth/google (backend verifies token with google-auth-library)
  → Backend upserts user in users table
  → Backend generates 6-digit OTP, stores with 5-min expiry
  → Backend sends OTP via Gmail SMTP (nodemailer)
  → Frontend navigates to /mfa with { email, idToken } state
  → User enters OTP
  → POST /auth/verify-otp
  → Backend validates OTP + expiry, clears it, returns JWT (7-day)
  → Frontend stores JWT + user in localStorage
  → Redirect to /dashboard
```

### New npm packages installed

| Package | Side | Purpose |
|---|---|---|
| `google-auth-library` | Backend | Verify Google ID tokens |
| `nodemailer` | Backend | Send OTP via Gmail SMTP |
| `jsonwebtoken` | Backend | Sign and verify JWTs |
| `@react-oauth/google` | Frontend | Google Sign-In button + OAuth popup |

### Backend changes (`clms-backend/server.js`)

- **New DB table** — `users` (auto-created on boot):
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    google_sub VARCHAR(255),
    otp_code VARCHAR(6),
    otp_expiry BIGINT,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
  ```
- **`POST /auth/google`** — verifies Google ID token, upserts user, generates + emails OTP, returns `{ requiresOtp: true, email }`
- **`POST /auth/verify-otp`** — validates OTP + expiry, clears OTP fields, returns `{ token, email, name }`
- **`requireAuth` middleware** — reads `Authorization: Bearer <jwt>` header, attaches `req.user`
- **`GET /api/settings`** — returns user preferences (auth-gated)
- **`PUT /api/settings`** — saves user preferences to `users.settings` JSON column (auth-gated)

### Backend env (`clms-backend/.env`)


### Frontend changes

| File | Change |
|---|---|
| `src/App.jsx` | Wrapped app in `<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>` |
| `src/screens/parent/Login.jsx` | Full rewrite — Google Sign-In button, loading state, error display, 2FA notice badge |
| `src/screens/parent/MFAVerify.jsx` | Full rewrite — reads `email`/`idToken` from router state, wired OTP verify, 60s countdown resend, masked email display, success flash |
| `src/components/OTPInput.jsx` | Added `onChange` prop + `inputMode="numeric"` for mobile |
| `src/utils/auth.js` | **[NEW]** — `getToken / setToken / clearToken / isLoggedIn / authHeaders / getUser / setUser / decodeToken` |
| `kidguard-ui/.env` | **[NEW]** — `VITE_GOOGLE_CLIENT_ID`, `VITE_API_BASE` |

---

## 3. Settings Page — Overhauled

Replaced the static mock list with three functional sections.

| Section | What it does |
|---|---|
| **Account Info** | Displays name + email read from `getUser()` (populated from JWT on login), Google account badge |
| **Security** | Static "2FA via Email OTP — ENABLED" `StatusChip` (always on by design) |
| **Notifications** | SOS Alerts toggle + Geofence Alerts toggle. Loaded from `GET /api/settings` on mount, persisted on change via `PUT /api/settings`. Shows "SAVED" confirmation badge. |

### File changed
`src/screens/parent/Settings.jsx` — full rewrite. Removed `mockParent` dependency.

---

## 4. Safe Zones Routing Fix

The "Edit Safe Zones" button (map pin icon) in Dashboard was calling `navigate('/safe-zones')` — a route that doesn't exist. Fixed to navigate to `/zones`, which matches the `<Route path="/zones" element={<SafeZones />} />` entry in `App.jsx`.

| File | Line | Change |
|---|---|---|
| `src/screens/parent/Dashboard.jsx` | 176 | `navigate('/safe-zones')` → `navigate('/zones')` |

---

## Verification Checklist

- [ ] Set `GMAIL_USER` in `clms-backend/.env` ✅ (set to `minhkhangdang26@gmail.com`)
- [ ] Restart backend → check console for `CLMS backend running on http://localhost:8080`
- [ ] Open `http://localhost:5173/login` → Google button renders
- [ ] Complete Google login → check Gmail inbox for OTP code
- [ ] Enter OTP on `/mfa` → redirects to `/dashboard`
- [ ] Navigate to `/settings` → name + email visible, toggles work, reload preserves state
- [ ] Dashboard status bar → no battery widget visible
- [ ] Dashboard map pin button → navigates to `/zones`
