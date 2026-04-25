# CLMS Node Backend

Node.js REST backend for **KidGuard**: stores GPS from **Arduino IoT Cloud** (poll or optional webhooks), MySQL `child_latest_location` + `location_history`, geofence flags.

## Arduino IoT Cloud (recommended: server poll)

1. In [Arduino IoT Cloud](https://app.arduino.cc/) create **API credentials** (Integrations → API) and copy **Client ID** + **Client Secret**.
2. Edit **`clms-backend/.env`** in the repo (tracked file — use placeholders in git; fill real values only on machines you trust, never push live secrets to a public remote):
   - `ARDUINO_CLIENT_ID`, `ARDUINO_CLIENT_SECRET`
   - `ARDUINO_THING_ID` or `ARDUINO_CHILD_ID` — Thing UUID (same as `child_id` / KidGuard `VITE_CHILD_ID`)
3. On the Thing, publish GPS in a Cloud variable **`Gps`** as JSON, e.g. `{"lat":"10.928","lon":"106.702"}`. Separate **`lat`** / **`lng`** variables are supported as a fallback (if both exist, **`Gps` is preferred** so stale scalars do not mask updates).
4. With valid env, the server **polls** the Cloud API every **`ARDUINO_POLL_INTERVAL_MS`** (default **60000**). Set **`ARDUINO_POLL_INTERVAL_MS=0`** to disable.

Optional manual pull (same write path as poll):

```bash
curl -X POST http://localhost:8080/api/sync/arduino-cloud -H "Content-Type: application/json" -d "{}"
```

If **`ARDUINO_SYNC_TOKEN`** is set in `.env`, add header `x-arduino-sync-token: <token>` (or JSON `syncToken`).

Uses OAuth2 `client_credentials` against `https://api2.arduino.cc/iot` ([Cloud API](https://docs.arduino.cc/cloud-api/)).

### Optional: Data forwarding webhooks

If you use **Arduino IoT Cloud → Data forwarding** instead of or in addition to poll:

- `POST /api/webhooks/arduino/cloud` — body often `{ "values": [ { "name": "Gps", "value": "..." }, ... ] }`. Pass **`childId`** (Thing ID) as `?childId=...` or in JSON (`childId` / `thing_id`).
- `POST /api/webhooks/arduino/cloud/:childId` — same, Thing ID in the path.
- `POST /w` — short URL; set **`ARDUINO_CHILD_ID`** in `.env` so `childId` is not required in the URL.

First validation `POST` may contain no GPS yet; the server responds **200**. Successful saves return **202**.

### Optional: direct GPS POST (testing / custom clients)

`POST /api/webhooks/arduino/gps` with JSON `childId`, `lat`, `lng`, optional `timestamp` (epoch ms). Non-decimal encodings may be normalized (see `validateGpsForStorage` in `server.js`).

**Security:** if `clms-backend/.env` is committed, use **placeholder** values in git and keep real secrets only locally, or use a **private** remote. Rotate Arduino keys if they were ever exposed (e.g. in an old `.env.example`).

## Geofence

`POST /api/geofences` with `childId`, `centerLat`, `centerLng`, `radiusMeters`.

## Environment & run

Configure **`clms-backend/.env`** (see variables there). Defaults assume local MySQL `clms`.

```bash
cd clms-backend
npm install
npm run dev
```

Backend listens on **`PORT`** (default **8080**).

## `location_history` snapshot

If **`LOCATION_SNAPSHOT_INTERVAL_MS`** > 0, the server periodically copies `child_latest_location` → `location_history` (then trims to 100 rows per child). Default in code is **60000** ms if unset.

- **Arduino poll only:** set **`LOCATION_SNAPSHOT_INTERVAL_MS=0`** to avoid duplicate history rows every minute (poll already inserts history on each update).
- **Disable poll:** `ARDUINO_POLL_INTERVAL_MS=0`.

Snapshots do not invent GPS: if `child_latest_location` is empty, only an occasional log line explains that.
