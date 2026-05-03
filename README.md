# KidGuard — Children's Location Monitoring System (CLMS)

> **CO3065 — Advanced Software Engineering**
> CC01 — Group 1, Semester 252
> Ho Chi Minh City University of Technology (HCMUT)

KidGuard is a real-time child safety platform that lets parents track their children's GPS location, define safe zones on a map, and get notified whenever a child enters or leaves one of those areas. The system connects to an embedded Arduino GPS tracker through Arduino IoT Cloud and surfaces everything through a clean parent-facing web app.

---

## What's in this Repo

```
kidguard/
├── clms-backend/        Node.js REST API + Arduino Cloud poller
├── kidguard-ui/         React frontend (parent web app + child page)
├── database.sql         Full MySQL schema dump
└── kidguard_assignment_ASE_CC01_documentation.docx.pdf
```

---

## How the System Works

1. A GPS tracker running on Arduino hardware publishes coordinates to **Arduino IoT Cloud** as Thing properties.
2. The **CLMS backend** polls Arduino Cloud every 60 seconds (configurable), validates the incoming GPS coordinates, and writes them to MySQL.
3. The backend continuously checks each new location against all active safe zones for that child and logs `enter` or `leave` events.
4. Parents open the **KidGuard web app**, sign in with Google and a 6-digit OTP sent to their email, then see their child's live position on the map, browse location history, manage safe zones, and review zone event notifications.

---

## Architecture

The system follows a layered architecture:

| Layer | What it does |
|---|---|
| Presentation | Parent React web app + lightweight child-side page |
| Service | Express REST API, Arduino Cloud poller, Google OAuth + email OTP |
| Business | Geofence evaluation (circle and rectangle), zone-transition diffing |
| Data | MySQL database, Gmail SMTP for OTP, OpenStreetMap tiles client-side |

---

## Running the Full Stack Locally

You need **Node.js 18+** and a running **MySQL** instance.

### 1. Start the backend

```bash
cd clms-backend
npm install
# Edit .env with your DB credentials, Google OAuth client, Gmail app password,
# and Arduino Cloud client ID/secret + Thing ID
npm run dev
```

The API starts on `http://localhost:8080`.

### 2. Start the frontend

```bash
cd kidguard-ui
npm install
# Edit .env with VITE_API_BASE and VITE_GOOGLE_CLIENT_ID
npm run dev
```

The UI starts on `http://localhost:5173`.

---

## Key Features

**Location tracking**
- Periodic GPS polling from Arduino IoT Cloud (OAuth2 client credentials)
- GPS validation before storage: WGS84 range check, scaled-integer normalisation, epoch timestamp normalisation
- Rolling location history (last 100 entries per child)

**Geofencing**
- Supports both circle and rectangle safe zone shapes
- O(1) zone state tracking using a `child_zone_state` table so only real transitions get logged
- Zone enter/exit events shown in the parent notification feed

**Authentication**
- Google OAuth sign-in only (no password)
- Mandatory 6-digit OTP sent to the parent's email as a second factor
- JWT issued after OTP verification, used on protected endpoints

**Multi-child support**
- Each child has their own `childId` and Arduino Thing
- The dashboard lets parents switch between children

---

## Team

| Name | Student ID | Role |
|---|---|---|
| Nguyen Trinh Tien Dat | 2252147 | Backend REST API, MySQL schema, GPS pipeline |
| Arsyad Ghudzamir AFIF | 2560139 | Report: system description and dependability analysis |
| Cao Que Phuong | 2252652 | Report: use-case and architecture diagrams |
| Dang Minh Khang | 2252287 | Arduino hardware, IoT Cloud integration, frontend UI/UX |
| Dang Ngoc Phu | 2252617 | Auth module, geofencing engine, security analysis, demo video |

---

## A Note on the SOS Feature

The assignment report describes an SOS (emergency alert) feature where a child can send a manual distress signal to their parent. We did build this on the backend side:

- `POST /api/sos` stores an SOS event stamped with the child's last known location
- `GET /api/sos` retrieves SOS history for any set of children
- The `sos_events` table is part of the live schema

The child-facing page (`/child`) also has a working SOS button that calls the endpoint directly.

However, we stripped the SOS alert display from the parent dashboard and notifications screen. The reason is that our Arduino hardware setup has no way to trigger an SOS signal on its own. The tracker is a passive GPS device, so there is no physical SOS button or sensor input that could initiate the call. Without a way to realistically demonstrate the end-to-end flow during testing, keeping the parent-side UI would have been misleading. The backend infrastructure is fully in place if a future version of the hardware (or a companion mobile app) adds SOS input support.
