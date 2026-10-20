# Rift · Restaurant ERP

A decoupled, modular, enterprise-grade Restaurant ERP system built with **Next.js 14 & TypeScript** on the frontend and a **Django-inspired "pluggable battery" REST API architecture** in TypeScript on the backend.

---

## 1. Architecture Overview

Rift adopts the Django philosophy of **"batteries-included, plug-and-play apps"** across both backend and frontend:

```
ERP/
├── backend/                    # TypeScript REST API Server (Express + Pluggable Apps)
│   ├── src/
│   │   ├── apps/               # Independent domain battery apps
│   │   │   ├── auth/           # App 1: Authentication, Sessions, PIN & Roles
│   │   │   ├── pos/            # Point of Sale & Tax Calculations
│   │   │   ├── orders/         # Order Register & Lifecycle
│   │   │   ├── kitchen/        # Kitchen Display System (KDS) & KOT Routing
│   │   │   ├── tables/         # Floor Plan & Dining Statuses
│   │   │   ├── menu/           # Dishes, Categories & Availability
│   │   │   └── inventory/      # Stock Levels, Batches & Alerts
│   │   ├── core/               # AppRegistry, Database Adapter, Middleware, Errors
│   │   ├── app.ts              # Express initialization & INSTALLED_APPS registry
│   │   └── server.ts           # Server bootstrap
│   └── data/                   # Local SQLite storage (auto-created)
│
├── frontend/                   # Next.js 14 App Router & TypeScript
│   ├── src/
│   │   ├── apps/               # Feature-sliced domain apps (mirroring backend 1:1)
│   │   │   ├── auth/           # Login Portal, PIN Pad, AuthContext & Persona Switcher
│   │   │   ├── pos/            # POS workspace & cart checkout
│   │   │   ├── orders/         # Order register & status transitions
│   │   │   ├── kitchen/        # KDS screen & prep bumping
│   │   │   ├── tables/         # Visual table status & guest assignment
│   │   │   ├── menu/           # Menu listings & 1-click availability toggling
│   │   │   └── inventory/      # Stock take & low-stock alerts
│   │   ├── app/                # Next.js App Router (thin route pages)
│   │   ├── core/               # REST API Client, AppShell, Layout & Config
│   │   └── styles/             # Warm cream, olive & dark green design system
│
├── requirement-target.md       # Comprehensive requirements specification for all 24 apps
├── plan.md                     # Transformation plan & phased execution roadmap
└── legacy/                     # Preserved legacy prototype files for reference
```

---

## 2. Getting Started & Running Locally

### Prerequisites
- **Node.js**: v20.6 or newer (tested on Node v24).
- **npm**: v10 or newer.

### Installation

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Services

* **Start Backend Server** (Port `5000`):
  ```bash
  cd backend
  npm run dev
  ```
  *REST API Base URL*: `http://localhost:5000/api/v1`

* **Start Frontend Application** (Port `3000`):
  ```bash
  cd frontend
  npm run dev
  ```
  *Web App Portal*: `http://localhost:3000`

* **Root Monorepo Scripts** (from the `ERP/` root):
  ```bash
  npm run dev:backend    # Runs backend
  npm run dev:frontend   # Runs frontend
  ```

---

## 3. Pluggable Database Configuration (SQLite ⇄ PostgreSQL)

Rift ERP features a **unified database adapter** (`backend/src/core/database.ts`). You can switch between zero-config local SQLite and external cloud PostgreSQL simply by changing `DB_TYPE` in `backend/.env`.

### Option A: Local SQLite (Default)
Ideal for local development with zero setup. Database files are stored automatically in `backend/data/rift.sqlite`:
```env
DB_TYPE=sqlite
SQLITE_PATH=./data/rift.sqlite
```

### Option B: Cloud PostgreSQL (Supabase / Neon / AWS RDS / Render)
To connect to an external PostgreSQL database, update `backend/.env`:
```env
DB_TYPE=postgres
DATABASE_URL=postgresql://user:password@your-postgres-host:5432/dbname?sslmode=require
```
*(Or specify individual host parameters: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`).*

---

## 4. App 1: Auth & Login Portal (`/login`)

The authentication module (`backend/src/apps/auth` & `frontend/src/apps/auth`) is customized for restaurant operations:

### Key Features
1. **Dual Login Modes**:
   - **Email & Password**: For management, owners, and accountants.
   - **⚡ Staff Quick PIN Pad (4-Digit)**: Optimized for touch POS/KDS terminals during busy service hours.
2. **Multi-Location / Branch Selector**:
   - `Panaji Main (Fontainhas)`
   - `Candolim Beach`
   - `Margao Town`
3. **1-Click Test Persona Switcher (Development & Testing)**:
   The login portal footer includes one-click shortcuts to test each restaurant role:

| Role | Name | Email | Default PIN | Operational Scope |
|---|---|---|---|---|
| **Owner** | Aarav Mehta | `aarav@rift.example` | `1111` | Full administrative control, all branches, settings |
| **Manager** | Mina D’Souza | `mina@rift.example` | `2222` | Floor supervision, staff shifts, purchase approvals |
| **Cashier** | Neha Verma | `neha@rift.example` | `3333` | Quick POS billing, payments, drawer settlement |
| **Chef** | Samira Khan | `samira@rift.example` | `4444` | Kitchen Display System (KDS), line station routing |
| **Server** | Ravi Naik | `ravi@rift.example` | `5555` | Table order taking, dining statuses, guest service |
| **Driver** | Kabir Shah | `kabir@rift.example` | `6666` | Delivery dispatch queue, driver routing |
| **Accountant** | Devendra Rao | `dev@rift.example` | `7777` | General ledger, supplier bills, tax reconciliation |
| **Cleaner / Busser** | Manoj Kumar | `manoj@rift.example` | `8888` | Table sanitation queue, dirty table reset & turnover |

*Default password for all seed accounts:* `password123`

---

## 5. App 2: Point of Sale (POS) & Billing (`/pos`)

The POS module (`backend/src/apps/pos` & `frontend/src/apps/pos`) provides a high-speed counter and tableside checkout:

### Key Features
* **Persistent Database Tickets (`pos_tickets`)**: Every ticket is written to the active database (SQLite/PostgreSQL) with item details, table number, server name, and financial totals.
* **Dish Search & Fast Categories**: Instant text search by dish or ingredient note, with category filtering (*Small plates, Mains, Sides, Desserts, Drinks*).
* **Cooking Notes**: Per-item kitchen instruction notes (*"Less spicy", "No onion"*).
* **Indian Restaurant GST Calculation**: Accurate 5% GST calculated and split dynamically into **CGST (2.5%)** and **SGST (2.5%)**, with percentage discount handling.
* **Payment Settlement Modal**: Settle orders via Cash (with **automatic cash change calculator**), Card, UPI (with QR code simulator), or Online.
* **Equal Bill Splitter**: Split a check equally between 2 to 5 guests with sub-ticket generation (`GH-1048-A`, `GH-1048-B`).
* **Printable Thermal Receipt**: Realistic monospace receipt layout with restaurant GSTIN, date/time, table number, itemized totals, and one-click `window.print()`.
* **Active Service Tickets Drawer**: Slide-over queue of all open/unpaid tables for quick table recall and payment settlement.

---

## 6. Everything Implemented Till Now (Progress Summary)

| Milestone | Component | What Was Built |
|---|---|---|
| **Architecture Conversion** | Decoupled Core | Split monolithic prototype into decoupled `backend/` (TypeScript REST API) and `frontend/` (Next.js 14 App Router & TypeScript) communicating via REST APIs. |
| **Pluggable Architecture** | Django Pattern | Django-inspired `INSTALLED_APPS` and `AppRegistry` allowing self-contained apps to plug and play without cross-dependency breakage. |
| **Pluggable Database** | Unified DB Adapter | Built `backend/src/core/database.ts` supporting **Local SQLite** (`better-sqlite3`) and **Cloud PostgreSQL** (`pg`) switchable via `DB_TYPE` in `.env`. |
| **App 1: Auth Portal** | Authentication | Dual login (Email/Password & 4-digit PIN pad), multi-branch switcher, 8 restaurant staff personas, and token injection. |
| **RBAC Portal Scoping** | Route Security | Dynamic sidebar navigation and `403 Restricted Access` route guards strictly scoping portals to Chef, Server, Cashier, Cleaner, Driver, and Manager/Owner. |
| **App 2: POS & Billing** | Point of Sale | Touch cart, item notes, 5% GST (CGST+SGST), cash change calculator, UPI simulator, bill splitting, active tickets drawer, and printable receipts. |
| **Table Cleaner Portal** | Floor Sanitation | Added dedicated **Table Cleaner / Busser (`cleaner`)** role with one-click table sanitation and dirty table turnover tracking. |
| **Developer Ergonomics** | Concurrency & Cleaners | Single-command full-stack runner (`npm run dev`), cache cleaner (`npm run clean`), and database user reset script (`npm run clean:users`). |

---

## 5. How to Add a New Pluggable App (Django Pattern)

Adding a new ERP feature follows a 3-step plug-and-play process:

### Step 1: Create the Backend App (`backend/src/apps/<my_app>/`)
Create a self-contained directory with:
- `types.ts`: DTOs and database models.
- `service.ts`: Core business logic and database queries via `getDb()`.
- `controller.ts`: Express request/response handlers.
- `routes.ts`: Express router defining REST endpoints.
- `index.ts`: Exposes the `PluggableApp` definition.

### Step 2: Register in `INSTALLED_APPS` (`backend/src/app.ts`)
```typescript
import { myNewApp } from './apps/my_new_app';

export const INSTALLED_APPS = [
  authApp,
  posApp,
  ordersApp,
  kitchenApp,
  tablesApp,
  menuApp,
  inventoryApp,
  myNewApp, // <-- Plug in here!
];
```
The server will automatically mount `/api/v1/my-new-app/*` on restart.

### Step 3: Create the Frontend App (`frontend/src/apps/<my_app>/`)
- `types.ts`: TypeScript interfaces matching backend DTOs.
- `api.ts`: API client functions using `restClient()`.
- `components/MyWorkspace.tsx`: Feature UI component.
- `frontend/src/app/my-new-app/page.tsx`: Thin Next.js page wrapper mounting `<MyWorkspace />`.

---

## 6. Project Roadmap & Documentation
- **[`requirement-target.md`](requirement-target.md)**: Full requirements and specifications for all 24 domain modules.
- **[`plan.md`](plan.md)**: Multi-phase technical implementation plan.
