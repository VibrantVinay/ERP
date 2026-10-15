# Gelato House · Hotel ERP

A modular, browser based hotel operations app with a creamy, ice cream inspired interface. It has real URL routes, a local JSON API, and can run without installing third party packages.

## Run locally

1. Install Node.js 18 or newer if it is not already installed.
2. In this folder, run `npm start`.
3. Open `http://127.0.0.1:4173`.

The built-in server falls back to the app entry point for direct visits to module routes, so refreshing `/reservations` or `/finance` keeps you on that route.

## Local API

- `GET /api/health` — API status.
- `GET /api/snapshot` — current property records and revision.
- `GET /api/dashboard` — department counts and sample operational totals.
- `GET /api/audit?limit=100` — recent change history.
- `GET /api/modules/:module/records` — list a department’s records.
- `POST /api/modules/:module/records` — create a record from its configured `cells` array.
- `PUT /api/modules/:module/records/:id` — update a record.
- `DELETE /api/modules/:module/records/:id` — delete a record.
- `POST /api/modules/reservations/records/:id/advance` — check in, check out, or cancel a stay through the workflow.
- `POST /api/demo/reset` — restore the sample property data.

The local service is bound to loopback (`127.0.0.1`) and is intended for local development, not LAN or public hosting.

## Routes

| Path | Module |
| --- | --- |
| `/dashboard` | Hotel overview, occupancy, arrivals, revenue and housekeeping pulse |
| `/reservations` | Reservation register, booking source and stay status |
| `/reservation-calendar` | Weekly room allocation grid with editable stay blocks |
| `/front-desk` | Arrival/departure queue and guest movement |
| `/rooms` | Room inventory and room states |
| `/housekeeping` | Cleaning assignments, inspections and task status |
| `/guests` | Guest directory, preferences and loyalty tiers |
| `/guest-experience` | Guest requests, messaging channels and service recovery |
| `/restaurant-pos` | Restaurant, room-service and kitchen orders |
| `/events` | Banquets, enquiries and event bookings |
| `/channels` | OTA/channel status, inventory sync and alerts |
| `/booking-engine` | Direct booking plans, promotions and central reservations |
| `/spa` | Appointments, treatments and memberships |
| `/guest-services` | Laundry, transport and concierge tasks |
| `/inventory` | Stock, reorder points, usage and wastage |
| `/procurement` | Purchase requests, suppliers and receiving |
| `/maintenance` | Work orders, assets and preventive care |
| `/finance` | Invoices, guest folios, payments and reconciliation |
| `/people` | Team directory, shifts, attendance and payroll period |
| `/reports` | Hotel, revenue, channel and guest reporting with CSV export |
| `/audit` | Searchable local history of staff record changes |
| `/settings` | Property profile, room setup, tax and access configuration |

## Structure

```text
index.html                 App shell and entry point
server.mjs                 Dependency free local web server with route fallback
storage/hotel-data.json    Created on first run; shared local property database (git-ignored)
src/
  main.js                  App setup, navigation and shared interactions
  styles.css               Shared design system and responsive layout
  data/modules.js          Route definitions, fields and sample property records
  core/router.js           URL path routing
  core/store.js            API-backed record operations and offline browser fallback
  core/format.js           Escaping, display formatting and status styles
  core/dates.js            Hotel-timezone dates and dynamic demo dates
  components/layout.js     Shared sidebar, property picker and top bar
  components/modal.js      Shared create/edit form dialog
  pages/dashboard.js       Hotel overview route
  pages/module.js          Reusable module table and workflow renderer
  pages/audit.js           Searchable change history
  server/database.js       Validation, room-conflict rules, persistent records and audit history
```

## Demo behavior

Each department has a route, sample records, relevant summary indicators and workflow shortcuts. Module records can be created, edited, searched, status filtered, advanced through department status steps, deleted and exported as CSV. Reservation dates are checked, room conflicts are rejected, and check-in/check-out actions update room status, front-desk records and housekeeping tasks together. With the local server running, records are persisted in `storage/hotel-data.json`, shared by browser tabs, and audited at `/api/audit` and `/audit`. The client refreshes shared records every 15 seconds. Settings can download a JSON data backup. If the server is unavailable at startup, the app falls back to browser local storage.

This is a local property prototype, not a public production deployment. The local server binds to `127.0.0.1`; it does not include user authentication or multi-property data isolation. Live payments, OTA credentials and rate pushes, external messaging, payroll processing and tax filing still require property accounts and service integrations.
