# Rift · Restaurant ERP — Transformation & Implementation Plan

## 1. Overview & Strategy

This plan outlines the end-to-end technical transformation of the Rift Restaurant ERP from a monolithic prototype into a decoupled, battery-packed **TypeScript Backend** and **Next.js Frontend** architecture.

The architecture adopts the Django philosophy:
- **Batteries-included**: Standardized logging, error handling, validation, auth middleware, and app lifecycle.
- **Plug-and-Play Apps**: Modules operate as standalone, self-contained apps (`backend/src/apps/<module>` and `frontend/src/apps/<module>`) managed via a centralized registry (`INSTALLED_APPS`).

---

## 2. Structural Transformation Blueprint

### Directory Layout
```
ERP/
├── backend/                    # TypeScript REST API Server
│   ├── src/
│   │   ├── apps/               # Plug-and-play domain apps
│   │   │   ├── auth/
│   │   │   ├── pos/
│   │   │   ├── orders/
│   │   │   ├── kitchen/
│   │   │   ├── tables/
│   │   │   ├── reservations/
│   │   │   ├── delivery/
│   │   │   ├── menu/
│   │   │   ├── recipes/
│   │   │   ├── inventory/
│   │   │   ├── suppliers/
│   │   │   ├── stock_movements/
│   │   │   ├── customers/
│   │   │   ├── loyalty/
│   │   │   ├── feedback/
│   │   │   ├── staff/
│   │   │   ├── tasks/
│   │   │   ├── equipment/
│   │   │   ├── finance/
│   │   │   ├── reports/
│   │   │   ├── branches/
│   │   │   ├── users/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   ├── core/               # Application registry, base controller, db, middleware
│   │   │   ├── app-registry.ts # Django-like INSTALLED_APPS loader
│   │   │   ├── base-app.ts     # Base interface for pluggable apps
│   │   │   ├── config.ts       # Environment & server config
│   │   │   ├── errors.ts       # Uniform error response hierarchy
│   │   │   ├── middleware.ts   # Auth, RBAC, tenant context, request logging
│   │   │   └── response.ts     # Standardized JSON response envelope
│   │   ├── server.ts           # Server entry point
│   │   └── app.ts              # Express/REST app bootstrapping
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Next.js & TypeScript Application
│   ├── src/
│   │   ├── app/                # Next.js App Router (Thin route wrappers)
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pos/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── kitchen/page.tsx
│   │   │   │   ├── tables/page.tsx
│   │   │   │   ├── reservations/page.tsx
│   │   │   │   ├── delivery/page.tsx
│   │   │   │   ├── menu/page.tsx
│   │   │   │   ├── inventory/page.tsx
│   │   │   │   ├── staff/page.tsx
│   │   │   │   ├── finance/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   ├── apps/               # Feature-sliced domain apps matching backend 1:1
│   │   │   ├── pos/
│   │   │   │   ├── components/
│   │   │   │   ├── api/
│   │   │   │   ├── types/
│   │   │   │   └── hooks/
│   │   │   ├── orders/
│   │   │   ├── kitchen/
│   │   │   ├── tables/
│   │   │   ├── menu/
│   │   │   ├── inventory/
│   │   │   └── ...
│   │   ├── core/               # Layout, API client, toast notifications, auth provider
│   │   └── styles/
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── legacy/                     # Preserved legacy prototype files & schemas
├── requirement-target.md       # Target domain & technical requirements
└── plan.md                     # This plan
```

---

## 3. Phased Execution Roadmap

### Phase 1: Environment & Scaffolding (Current Step)
- [x] Author comprehensive `requirement-target.md`.
- [x] Author `plan.md`.
- [ ] Migrate legacy monolithic prototype files into `legacy/` directory to maintain reference code without cluttering new workspaces.
- [ ] Initialize `backend/` directory with:
  - `package.json` (TypeScript, Express, CORS, tsx / ts-node, dotenv).
  - `tsconfig.json`.
  - Core Django-style infrastructure: `AppRegistry`, `BaseApp`, error handling, and response standardizer.
  - Core installed apps: `auth`, `pos`, `orders`, `kitchen`, `menu`, `inventory`, `tables`.
- [ ] Initialize `frontend/` directory with:
  - `package.json` (Next.js, React, React-DOM, TypeScript, Lucide-react/icons).
  - `tsconfig.json` with path aliases (`@/apps/*`, `@/core/*`).
  - Next.js configuration and root layout.
  - Centralized REST API client (`frontend/src/core/api-client.ts`).
  - Corresponding frontend apps (`pos`, `orders`, `kitchen`, `tables`, `menu`, `inventory`).

---

### Phase 2: Backend Plug-and-Play Architecture Implementation
1. **The Registry Pattern (`backend/src/core/app-registry.ts`)**:
   - Implements a singleton registry where `INSTALLED_APPS` is configured.
   - Each app exposes:
     - `name`: Unique identifier (e.g. `pos`, `orders`).
     - `routePrefix`: Base URL (e.g. `/api/v1/pos`).
     - `router`: Express Router with encapsulated controllers.
     - `init(context)`: Optional startup hook for database migrations, background workers, or cache warming.
2. **Standardized Response Envelope**:
   - `sendSuccess(res, data, meta)`
   - `sendError(res, error, statusCode)`
3. **App Scaffolding Contract**:
   Each app must follow the exact structure:
   ```
   apps/<module>/
   ├── controller.ts   # Express request handlers & validation
   ├── service.ts      # Pure business logic & calculations
   ├── routes.ts       # Route definitions & middleware binding
   ├── models.ts       # TypeScript interfaces / DB schemas
   └── types.ts        # Request/Response DTO types
   ```

---

### Phase 3: Frontend App-Matching Architecture Implementation
1. **REST Client (`frontend/src/core/api-client.ts`)**:
   - Base HTTP client with automatic error mapping, bearer token injection, and tenant context header (`X-Restaurant-ID`, `X-Branch-ID`).
2. **Domain Matching**:
   - For every backend app, create a mirror directory in `frontend/src/apps/<module>`.
   - Export typed fetchers that call the backend REST API.
   - Implement state management using React hooks.
3. **App Router Pages**:
   - App router files in `frontend/src/app/` act purely as page coordinators:
     ```tsx
     // frontend/src/app/(dashboard)/pos/page.tsx
     import { PosWorkspace } from '@/apps/pos/components/pos-workspace';
     export default function PosPage() {
       return <PosWorkspace />;
     }
     ```

---

### Phase 4: Core Domain Porting (Batteries Included)
Migrate the existing prototype functionalities into the new architecture across the priority modules:
1. **Authentication & Session**:
   - Implement login, session state, and user context.
2. **Point of Sale (POS)**:
   - Port menu display, real-time GST tax calculation, discount handling, and order dispatching.
3. **Orders & Kitchen Display (KDS)**:
   - Port real-time order lifecycle changes (`New` -> `Preparing` -> `Ready` -> `Served`).
   - Implement station-based filtering in the KDS.
4. **Tables & Floor Management**:
   - Port floor zones, table status toggling, and seating allocations.
5. **Inventory & Menu**:
   - Port dish catalogs, batch/expiry alerts, and stock adjustments.

---

### Phase 5: Verification & Developer Ergonomics
1. Verify both servers run concurrently or independently:
   - Backend: `npm run dev` running on `http://localhost:5000/api/v1`
   - Frontend: `npm run dev` running on `http://localhost:3000`
2. Test end-to-end communication via REST APIs.
3. Document plug-and-play developer guide: "How to add a new app in 3 steps".

