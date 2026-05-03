# CLMS Backend

Node.js REST API for KidGuard. Handles GPS ingest from Arduino IoT Cloud, geofence evaluation, zone event logging, authentication, and all data the parent dashboard needs.

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js 18+ / Express | HTTP server and REST API |
| mysql2 | MySQL connection pool (promise API) |
| google-auth-library | Verifying Google ID tokens |
| nodemailer | Sending OTP verification emails via Gmail |
| jsonwebtoken | Issuing and verifying JWTs for parent sessions |
| dotenv | Loading environment variables from `.env` |

## Running Locally

```bash
cd clms-backend
npm install
# Fill in .env (see section below)
npm run dev
```

The server starts on port `8080` by default. On startup it runs `ensureSchema()` which creates all required tables if they don't exist yet, so you don't need to run any migration scripts manually.

## Environment Variables

Create a `.env` file in `clms-backend/`:

```env
# Server
PORT=8080

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=clms_user
DB_PASSWORD=yourpassword
DB_NAME=clms

# Google OAuth (same client ID used in the frontend)
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# JWT signing secret — change this to something random in production
JWT_SECRET=some-long-random-string

# Gmail SMTP for OTP emails
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Arduino IoT Cloud polling
ARDUINO_CLIENT_ID=your_arduino_client_id
ARDUINO_CLIENT_SECRET=your_arduino_client_secret
ARDUINO_THING_ID=your_thing_uuid
ARDUINO_CHILD_ID=same_as_thing_uuid_unless_different
ARDUINO_POLL_INTERVAL_MS=60000
ARDUINO_POLL_BOOT_DELAY_MS=5000

# Optional: token to protect the manual /api/sync/arduino-cloud endpoint
ARDUINO_SYNC_TOKEN=

# Location history snapshot interval in ms (0 to disable)
LOCATION_SNAPSHOT_INTERVAL_MS=0
```

## How GPS Gets into the Database

The backend supports three ingest paths. In practice we use the **Arduino Cloud poll**.

### 1. Arduino Cloud poll (what we use)

The server calls the Arduino IoT Cloud API every `ARDUINO_POLL_INTERVAL_MS` milliseconds using OAuth2 `client_credentials`. It reads the `Gps` Thing property (JSON string like `{"lat":"10.928","lon":"106.702"}`) and writes it to the database if valid.

You can also trigger a one-off manual pull:

```bash
curl -X POST http://localhost:8080/api/sync/arduino-cloud \
  -H "Content-Type: application/json" \
  -d "{}"
```

### 2. Arduino Cloud webhook (optional)

If you use Arduino Cloud's "Data forwarding" feature instead, point it at:

```
POST /api/webhooks/arduino/cloud?childId=<thing_uuid>
POST /api/webhooks/arduino/cloud/<thing_uuid>
```

The server accepts the `{ "values": [ { "name": "Gps", "value": "..." } ] }` format that Arduino Cloud sends.

### 3. Direct POST (testing)

```bash
curl -X POST http://localhost:8080/api/webhooks/arduino/gps \
  -H "Content-Type: application/json" \
  -d '{"childId":"your-child-id","lat":10.773,"lng":106.66}'
```

### GPS validation

Every incoming GPS payload goes through `validateGpsForStorage()` before touching the database. It handles:

- **WGS84 range check** — lat must be -90 to 90, lng -180 to 180
- **Scaled integer normalisation** — some clients send coords like `1077300000` instead of `10.773`; the server tries dividing by powers of 10 until the result fits WGS84
- **Timestamp normalisation** — accepts seconds or milliseconds epoch, rejects anything outside a plausible range

## Authentication Flow

| Step | Endpoint | What happens |
|---|---|---|
| 1 | `POST /auth/google` | Verifies Google ID token. New users get `isNewUser: true`. Existing users get an OTP emailed to them. |
| 2 | `POST /auth/google/complete` | Creates a new user record with profile info (name, date of birth), then sends OTP. |
| 3 | `POST /auth/verify-otp` | Checks the 6-digit code against the stored hash and expiry (5-minute window). Returns a JWT on success. |
| 4 | `POST /auth/resend-otp` | Regenerates and resends the OTP for any existing user. |

The JWT is passed as `Authorization: Bearer <token>` on protected endpoints. Currently only `/api/settings` (GET and PUT) require auth. The dashboard and location read endpoints are intentionally left open for the scope of this project, which is discussed as a known vulnerability in the report.

## Database Schema

All tables are auto-created on startup. Here is a summary:

| Table | Purpose |
|---|---|
| `users` | Parent accounts: email, Google sub, OTP code/expiry, JWT settings |
| `children` | Child records: display name, Arduino Thing ID, client credentials |
| `safe_zones` | Zone definitions: circle (center + radius) or rectangle (two corner points) |
| `safe_zone_children` | Many-to-many link between zones and children |
| `child_zone_state` | Current inside/outside state per child per zone (used for transition detection) |
| `zone_events` | Append-only log of zone enter/leave transitions |
| `child_latest_location` | The most recent GPS fix per child |
| `location_history` | Rolling history (capped at 100 rows per child) |
| `sos_events` | SOS alerts triggered from the child-side app |
| `geofence` | Legacy single-zone table kept for backward compatibility |

## API Endpoints

### Children

| Method | Path | Description |
|---|---|---|
| GET | `/api/children` | List all children |
| POST | `/api/children` | Register a new child |
| PATCH | `/api/children/:childId` | Update a child's name, Thing ID, or active status |

### Safe Zones

| Method | Path | Description |
|---|---|---|
| GET | `/api/safezones` | List all zones |
| GET | `/api/safezones/:childId` | List zones for a specific child |
| POST | `/api/safezones` | Create a zone (circle or rectangle) |
| PUT | `/api/safezones/:zoneId` | Full update of a zone |
| PATCH | `/api/safezones/:zoneId` | Partial update (name or active status) |
| DELETE | `/api/safezones/:zoneId` | Delete a zone |

### Location

| Method | Path | Description |
|---|---|---|
| GET | `/api/location/latest/:childId` | Latest GPS fix for one child, with zone states |
| GET | `/api/location/latest?childIds=a,b` | Latest GPS for multiple children |
| GET | `/api/location/history/:childId` | Historical locations with optional `from`, `to`, `limit` query params |

### Dashboard and Events

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/:childId` | Full dashboard payload: child info, zone status, recent zone events |
| GET | `/api/zone-events?childIds=a,b` | Zone enter/leave events, newest first |
| GET | `/api/sos?childIds=a,b` | SOS events (see SOS section below) |

### Auth

| Method | Path | Auth required |
|---|---|---|
| POST | `/auth/google` | No |
| POST | `/auth/google/complete` | No |
| POST | `/auth/verify-otp` | No |
| POST | `/auth/resend-otp` | No |
| GET | `/api/settings` | Yes (JWT) |
| PUT | `/api/settings` | Yes (JWT) |

### Ingest

| Method | Path | Description |
|---|---|---|
| POST | `/api/webhooks/arduino/gps` | Direct GPS POST for testing |
| POST | `/api/webhooks/arduino/cloud` | Arduino Cloud data-forwarding webhook |
| POST | `/api/webhooks/arduino/cloud/:childId` | Same, Thing ID in path |
| POST | `/api/sync/arduino-cloud` | Manual one-off Arduino Cloud pull |
| GET | `/health` | Health check |

## Zone Transition Detection

Every time a GPS fix arrives, the backend:

1. Loads all active safe zones for that child
2. Checks whether the new coordinate is inside each zone (haversine distance for circles, bounding-box comparison for rectangles)
3. Compares the result against the last known state in `child_zone_state`
4. If the state changed (outside to inside = `enter`, inside to outside = `leave`), it writes a row to `zone_events` and updates `child_zone_state`

This means a child being inside a zone continuously only generates one `enter` event, not one per poll cycle.

## Location History

The `location_history` table is capped at 100 rows per child. Every time a new GPS fix is written, the oldest rows beyond 100 are deleted automatically by `trimLocationHistoryForChild()`.

There is also an optional snapshot scheduler (`LOCATION_SNAPSHOT_INTERVAL_MS`) that copies `child_latest_location` to history on a timer. This is disabled by default when you are using the Arduino poll, because the poll already writes to history on each update.

## A Note on SOS

The report describes an SOS feature where a child sends a manual distress signal to their parent. We built the backend side of this fully:

- `POST /api/sos` stores an SOS event with the child's last known GPS position
- `GET /api/sos` retrieves SOS history for any set of children
- `sos_events` is a live, indexed table in the schema

The child-facing page in the frontend also has a working SOS button that calls the endpoint.

We stripped SOS from the parent dashboard and notifications UI because our Arduino hardware has no way to trigger an SOS natively. The tracker is a passive GPS device with no buttons or input that could initiate the request. Without a realistic end-to-end demo path, keeping the parent-side display would have been misleading. The backend is fully ready to support it if a future version of the hardware adds SOS input, or if a companion mobile app is built for the child.
