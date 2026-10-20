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

*Default password for all seed accounts:* `password123`

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
