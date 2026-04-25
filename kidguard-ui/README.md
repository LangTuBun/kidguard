# KidGuard — Children's Location Monitoring System UI

A complete, production-ready React single-page application for **KidGuard**, a mobile safety app for parents to monitor their children's GPS location in real time.

---

## Overview

KidGuard is a **19-screen React UI prototype** built for two user roles:

| Role   | Screens | Description                                      |
|--------|---------|--------------------------------------------------|
| Parent | 14      | Monitor child location, manage zones, get alerts |
| Child  | 5       | Share location, trigger SOS emergency alert      |

Most parent/child flows use **mock/static data**. **Live Map** (`/map`) loads the child’s latest position from the **CLMS backend** when `VITE_BACKEND_API_URL` (and `VITE_CHILD_ID`) are set in `.env`.

---

## Tech Stack

| Tool             | Version | Purpose                     |
|------------------|---------|-----------------------------|
| React            | 18      | UI framework                |
| Vite             | Latest  | Build tool & dev server     |
| React Router DOM | v6      | Client-side routing (SPA)   |
| Tailwind CSS     | v4      | Utility styling             |
| Lucide React     | Latest  | Icon library                |

All components are built from scratch — no external UI component libraries.

---

## Design System — Brutalist Collage Aesthetic

KidGuard uses a **brutalist editorial** design language inspired by anti-design/collage aesthetics:

- **Background**: Warm beige canvas `#E8E4DC` — feels like old newsprint
- **Zero border radius** — every element is sharp-cornered, enforced globally via CSS
- **Thick black borders** — `2px–3px solid #0D0D0D` throughout
- **Color-slab highlights** — key words sit inside solid colored rectangles (electric blue or orange) like a highlighter/ransom-note effect
- **Typography**: Syne (display/headlines) + DM Sans (body) + JetBrains Mono (timestamps/IDs)
- **Color palette**: Beige + Near-black + Electric blue `#2A5BF5` + Orange `#E8631A` + Red `#D92B2B` + Green `#1A8C4E`
- **ALL CAPS** for buttons, labels, nav tabs
- **Brutalist offset shadows**: `4px 4px 0 #0D0D0D` on cards — no blur, raw

Every screen renders inside a `390×844px` phone bezel, centered on the beige canvas.

---

## Project Structure

```
kidguard-ui/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Router with all 19 routes
│   ├── index.css                   # CSS variables + global styles + Google Fonts
│   ├── components/
│   │   ├── MobileFrame.jsx         # 390x844px phone bezel wrapper
│   │   ├── Button.jsx              # primary / ghost / danger / dark variants
│   │   ├── Input.jsx               # Label + field + error, focus ring
│   │   ├── Card.jsx                # White card with offset shadow
│   │   ├── StatusChip.jsx          # Sharp-rectangle status badge (8 variants)
│   │   ├── BottomNav.jsx           # 4-tab nav: MAP / HISTORY / ZONES / ALERTS
│   │   ├── OTPInput.jsx            # 6-box OTP input with auto-advance
│   │   ├── NotificationCard.jsx    # Geofence/SOS notification cards
│   │   ├── ZoneCard.jsx            # Safe zone card with toggle switch
│   │   ├── MapMock.jsx             # Static SVG map with pin + zone overlay
│   │   └── OfflineBanner.jsx       # Orange "No Internet" sticky banner
│   ├── screens/
│   │   ├── NavIndex.jsx            # /nav - clickable screen index grid
│   │   ├── parent/
│   │   │   ├── Splash.jsx          # P1 - /
│   │   │   ├── Register.jsx        # P2 - /register
│   │   │   ├── Login.jsx           # P3 - /login
│   │   │   ├── MFAVerify.jsx       # P4 - /mfa
│   │   │   ├── Dashboard.jsx       # P5 - /dashboard
│   │   │   ├── LiveMap.jsx         # P6 - /map
│   │   │   ├── History.jsx         # P7 - /history
│   │   │   ├── SafeZones.jsx       # P8 - /zones
│   │   │   ├── AddZone.jsx         # P9 - /zones/add
│   │   │   ├── Notifications.jsx   # P10 - /notifications
│   │   │   ├── SOSModal.jsx        # P11 - /sos-alert
│   │   │   ├── ChildProfile.jsx    # P12 - /child-profile
│   │   │   ├── Settings.jsx        # P13 - /settings
│   │   │   └── Offline.jsx         # P14 - /offline
│   │   └── child/
│   │       ├── ChildLogin.jsx      # C1 - /child/login
│   │       ├── ChildHome.jsx       # C2 - /child
│   │       ├── SOSConfirm.jsx      # C3 - /child/sos-confirm
│   │       ├── SOSSent.jsx         # C4 - /child/sos-sent
│   │       └── SOSQueued.jsx       # C5 - /child/sos-queued
│   └── data/
│       └── mock.js                 # All mock data (parent, child, zones, notifications, history)
├── index.html
├── vite.config.js
└── package.json
```

---

## Screens — Parent App (14 screens)

| Code | Route            | Screen            | Description                                              |
|------|------------------|-------------------|----------------------------------------------------------|
| P1   | `/`              | Splash            | Onboarding with hero tagline + CTA buttons               |
| P2   | `/register`      | Register          | Parent + child account creation form                     |
| P3   | `/login`         | Login             | Email/password login with MFA notice                     |
| P4   | `/mfa`           | MFA Verify        | 6-box OTP input, auto-advance, countdown timer           |
| P5   | `/dashboard`     | Dashboard         | Child status card, map preview, recent alerts            |
| P6   | `/map`           | Live Map          | Full-screen map with floating info card + BottomNav      |
| P7   | `/history`       | Location History  | Date-filtered timeline of location entries               |
| P8   | `/zones`         | Safe Zones        | List of geofence zones with toggles                      |
| P9   | `/zones/add`     | Add Zone          | Split-screen map + zone detail form with radius slider   |
| P10  | `/notifications` | Notifications     | Segmented ALL/GEOFENCE/SOS filter, unread badges         |
| P11  | `/sos-alert`     | SOS Alert Modal   | Critical full-takeover: red header, map, call button     |
| P12  | `/child-profile` | Child Profile     | Edit child info, device ID, location sharing toggle      |
| P13  | `/settings`      | Settings          | Profile card + settings rows + logout                    |
| P14  | `/offline`       | Offline State     | Stale data warning, battery alert, offline banner        |

## Screens — Child App (5 screens)

| Code | Route                  | Screen       | Description                                                 |
|------|------------------------|--------------|-------------------------------------------------------------|
| C1   | `/child/login`         | Child Login  | Friendly login with shield icon                             |
| C2   | `/child`               | Child Home   | Location sharing status + massive red SOS button            |
| C3   | `/child/sos-confirm`   | SOS Confirm  | Animated square countdown (3-2-1), auto-navigates to Sent   |
| C4   | `/child/sos-sent`      | SOS Sent     | Confirmation screen with green check, call parent button    |
| C5   | `/child/sos-queued`    | SOS Queued   | Offline SOS queued screen, pulsing waiting indicator        |

---

## Mock Data

Placeholder names used in the UI:
- **Parent**: `Minh Khang` — `minhkhang@example.com`
- **Child**: `Bon` — Device ID `KG-2024-A7F3`

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

**Recommended starting point**: navigate to `/nav` for a clickable grid of all 19 screens.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. The build produces ~288 kB JS (84 kB gzipped).

---

## Key Design Decisions

1. **Zero border-radius** enforced globally with `* { border-radius: 0 !important }` in CSS
2. **All inline styles** — avoids Tailwind conflicts for complex brutalist values like offset shadows and CSS variables
3. **Static SVG map** — `MapMock.jsx` renders a pure SVG/CSS street grid with animated pin — no map API needed
4. **SOS auto-countdown** — `SOSConfirm.jsx` uses `useEffect` with a 1s interval; automatically navigates to Sent at 0
5. **OTP auto-advance** — `OTPInput.jsx` moves focus to next box on digit entry, returns on Backspace
6. **Brutalist pulse animation** — the SOS button on Child Home uses a CSS `brutalPulse` keyframe for a square (not circular) ring effect

---

## All Routes

```
/                    Splash (P1)
/register            Register (P2)
/login               Login (P3)
/mfa                 MFA Verify (P4)
/dashboard           Dashboard (P5)
/map                 Live Map (P6)
/history             History (P7)
/zones               Safe Zones (P8)
/zones/add           Add Zone (P9)
/notifications       Notifications (P10)
/sos-alert           SOS Alert Modal (P11)
/child-profile       Child Profile (P12)
/settings            Settings (P13)
/offline             Offline (P14)
/child/login         Child Login (C1)
/child               Child Home (C2)
/child/sos-confirm   SOS Confirm (C3)
/child/sos-sent      SOS Sent (C4)
/child/sos-queued    SOS Queued (C5)
/nav                 Navigation Index (all screens)
```
