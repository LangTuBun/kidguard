# KidGuard UI

React frontend for the KidGuard Children's Location Monitoring System. Handles the parent-facing web app and a lightweight child-side page for SOS dispatch.

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tooling |
| React Router v6 | Client-side routing |
| @react-oauth/google | Google Sign-In button and ID token |
| Leaflet + react-leaflet | Interactive map on Live Map and Add Zone screens |
| Lucide React | Icons |

Styled entirely with vanilla CSS and inline styles. No component library, no Tailwind.

## Design Language

The app uses a brutalist editorial aesthetic:

- Warm beige canvas `#E8E4DC` as the base background
- Zero border radius on everything, enforced globally in CSS
- Thick black borders (`2-3px solid #0D0D0D`) throughout
- Color-slab highlights: electric blue `#2A5BF5`, orange `#E8631A`, red `#D92B2B`, green `#1A8C4E`
- Fonts: **Syne** for headings, **DM Sans** for body text, **JetBrains Mono** for timestamps and IDs
- Offset box shadows: `4px 4px 0 #0D0D0D` — no blur, just the raw block
- ALL CAPS for buttons, labels, and nav tabs

Every screen renders inside a `390px` wide phone frame centered on the canvas.

## Project Structure

```
kidguard-ui/
├── src/
│   ├── main.jsx                     Entry point
│   ├── App.jsx                      Router with all routes
│   ├── index.css                    CSS variables, global resets, Google Fonts
│   ├── components/
│   │   ├── MobileFrame.jsx          Phone frame wrapper
│   │   ├── Button.jsx               primary / ghost / danger variants
│   │   ├── Input.jsx                Labeled field with error state
│   │   ├── Card.jsx                 White card with offset shadow
│   │   ├── StatusChip.jsx           Inline status badge (online/offline/warning etc.)
│   │   ├── BottomNav.jsx            4-tab bottom nav: MAP / HISTORY / ZONES / ALERTS
│   │   ├── SideNav.jsx              Sidebar nav for wider layouts
│   │   ├── WebLayout.jsx            Wraps screens that use the sidebar
│   │   ├── OTPInput.jsx             6-box OTP input with auto-advance
│   │   ├── NotificationCard.jsx     Zone event notification row
│   │   ├── ZoneCard.jsx             Safe zone card with active toggle
│   │   ├── MapMock.jsx              Static SVG fallback map
│   │   ├── ZonePickerMap.jsx        Leaflet map for drawing safe zones
│   │   ├── MultiChildMap.jsx        Leaflet map showing multiple children
│   │   ├── LiveTrackingCard.jsx     Child location card on dashboard
│   │   ├── GeofenceStateCard.jsx    Zone status card per child
│   │   ├── SafetyStatusBar.jsx      Overall safety status ribbon
│   │   ├── AlertEventPanel.jsx      Recent zone events list panel
│   │   ├── AnalyticsMiniBar.jsx     Mini stats bar on dashboard
│   │   ├── QuickActions.jsx         Quick action button row
│   │   ├── ProtectedRoute.jsx       JWT auth guard for protected routes
│   │   └── OfflineBanner.jsx        Sticky orange offline notice
│   ├── screens/
│   │   ├── NavIndex.jsx             /nav — clickable grid of all screens
│   │   ├── parent/
│   │   │   ├── Splash.jsx           /
│   │   │   ├── CompleteProfile.jsx  /register and /complete-profile
│   │   │   ├── Login.jsx            /login
│   │   │   ├── MFAVerify.jsx        /mfa
│   │   │   ├── Dashboard.jsx        /dashboard
│   │   │   ├── LiveMap.jsx          /map
│   │   │   ├── History.jsx          /history
│   │   │   ├── SafeZones.jsx        /zones
│   │   │   ├── AddZone.jsx          /zones/add and /zones/edit/:zoneId
│   │   │   ├── Notifications.jsx    /notifications
│   │   │   ├── ChildProfile.jsx     /child-profile
│   │   │   ├── Settings.jsx         /settings
│   │   │   └── Offline.jsx          /offline
│   │   └── child/
│   │       ├── ChildLogin.jsx       /child/login
│   │       └── ChildHome.jsx        /child
│   └── utils/
│       └── childrenConfig.js        Reads child IDs from env for child-side page
├── index.html
├── vite.config.js
└── package.json
```

## Screens

### Parent App

| Route | Screen | Description |
|---|---|---|
| `/` | Splash | Hero landing with sign-in CTA |
| `/register` or `/complete-profile` | Complete Profile | New user profile form (name, date of birth) shown after first Google login |
| `/login` | Login | Google sign-in button only, no password |
| `/mfa` | MFA Verify | 6-box OTP input with resend and countdown |
| `/dashboard` | Dashboard | Live child status cards, zone state, recent alerts |
| `/map` | Live Map | Full-screen Leaflet map with child position and safe zone overlays |
| `/history` | Location History | Date-filtered breadcrumb trail of past positions |
| `/zones` | Safe Zones | List of zones with active toggles |
| `/zones/add` | Add Zone | Draw a circle or rectangle on the map and save |
| `/zones/edit/:zoneId` | Edit Zone | Same screen as Add Zone, loaded with existing zone data |
| `/notifications` | Notifications | All zone enter/exit events, filterable by type |
| `/child-profile` | Child Profile | Edit child display name, linked Arduino Thing ID |
| `/settings` | Settings | Notification preferences, account info, logout |
| `/offline` | Offline | Stale-data warning shown when backend is unreachable |

### Child App

| Route | Screen | Description |
|---|---|---|
| `/child/login` | Child Login | Simple login page for the child-side view |
| `/child` | Child Home | Shows "location sharing active" status and an SOS button |

The child SOS button posts to `POST /api/sos` on the backend which records the alert with the child's last known GPS position.

## Authentication Flow

1. Parent clicks "Sign in with Google" on `/login`
2. Frontend sends the Google ID token to `POST /auth/google`
3. If the account is new, the backend returns `isNewUser: true` and the frontend redirects to `/complete-profile`
4. After profile completion (`POST /auth/google/complete`), the backend creates the user and sends a 6-digit OTP to their email
5. Returning users go directly to `/mfa` where they enter the OTP
6. On success (`POST /auth/verify-otp`), a JWT is stored in `localStorage` and the parent lands on `/dashboard`

Protected routes (`/dashboard`, `/map`, `/history`, `/zones`, `/notifications`, `/settings`, `/child-profile`) check for a valid JWT via the `ProtectedRoute` component and redirect to `/login` if it's missing.

## Environment Variables

Create a `.env` file in `kidguard-ui/`:

```env
VITE_API_BASE=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Go to `/nav` for a clickable grid of all screens — useful for jumping straight into any screen during development.

```bash
npm run build
```

Produces a static build in `dist/`.
