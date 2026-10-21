# Rift · Restaurant ERP — Comprehensive Requirements & Target Specification

## 1. Executive Summary & Architecture Paradigm

This document specifies the technical and operational requirements for transforming the **Rift Restaurant ERP** from a monolithic prototype into a production-grade, enterprise-ready, modular system consisting of two decoupled sub-applications:
- `backend/`: A TypeScript REST API engine following Django's "plug-and-play battery" modular architecture (`INSTALLED_APPS` pattern).
- `frontend/`: A Next.js (TypeScript) enterprise application structured with feature-sliced, domain-driven "apps" corresponding 1:1 with backend apps.

### 1.1 The "Django Battery" Pattern in TypeScript
In traditional Django, each domain feature is an isolated, reusable application containing its own models, views/controllers, serializers/schemas, admin hooks, and URL routing. In Rift, each module is an independent app registered in an application registry:
```
backend/
├── src/
│   ├── apps/
│   │   ├── auth/              # Authentication & Session app
│   │   ├── pos/               # Quick Point of Sale checkout app
│   │   ├── orders/            # Order management & status lifecycle app
│   │   ├── kitchen/           # Kitchen Display System (KDS) & KOT routing app
│   │   ├── tables/            # Floor plan & table turnover app
│   │   ├── reservations/      # Booking & guest waitlist app
│   │   ├── delivery/          # Delivery dispatch & driver tracking app
│   │   ├── menu/              # Menu, modifiers, combos & allergens app
│   │   ├── recipes/           # Recipe BOM & theoretical food cost app
│   │   ├── inventory/         # Stock, batches & reorder alerts app
│   │   ├── suppliers/         # Vendor management & purchase orders (PO) app
│   │   ├── stock_movements/   # Waste, spoilage & transfers app
│   │   ├── customers/         # Guest CRM & loyalty tracking app
│   │   ├── loyalty/           # Offers, coupons & tier rewards app
│   │   ├── feedback/          # Guest ratings & escalation app
│   │   ├── staff/             # Shifts, attendance & payroll app
│   │   ├── tasks/             # Hygiene, safety checks & checklists app
│   │   ├── equipment/         # Asset tracking & preventive maintenance app
│   │   ├── finance/           # Invoicing, dues, reconciliation & taxes app
│   │   ├── reports/           # Analytics, forecasts & export app
│   │   ├── branches/          # Multi-outlet management app
│   │   ├── users/             # RBAC & staff permissions app
│   │   ├── audit/             # Immutable audit trail app
│   │   └── settings/          # System configuration & integrations app
│   ├── core/                  # App registry, db adapters, middleware, errors
│   └── app.ts                 # Instantiates registry & mounts REST routes
```

---

## 2. Global Non-Functional & Structural Standards

### 2.1 Communication Protocol
- All frontend and backend communication is strictly conducted through **REST APIs** over HTTP/JSON.
- Standard JSON envelope format:
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": { "total": 100, "page": 1, "pageSize": 20 },
    "error": null
  }
  ```
- Error response format:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Specific human-readable message",
      "details": [ { "field": "price", "issue": "Must be greater than 0" } ]
    }
  }
  ```

### 2.2 Multi-Tenancy and Branch Scoping
- Every business record belongs to a `restaurant_id` (tenant) and optionally a `branch_id`.
- Tenant context is extracted from the authenticated user's session token and enforced automatically via middleware or database row-level security.

### 2.3 Authentication and Role-Based Access Control (RBAC)
Supported 7 core roles:
1. `OWNER`: Full administrative access to all branches, financial ledgers, and configurations.
2. `MANAGER`: Operational branch management, approvals, staff rosters, and inventory reconciliation.
3. `CASHIER`: POS operations, order settlement, cash drawer reconciliation.
4. `CHEF`: Kitchen display system, recipe view, prep status, inventory decrement.
5. `SERVER`: Table taking, POS dine-in tickets, order status monitoring.
6. `DRIVER`: Delivery dispatch queue, delivery status updates.
7. `ACCOUNTANT`: Finance ledger, purchase invoices, tax and reconciliation views.

---

## 3. Detailed Functional Modules & API Specifications

### App 1: `auth` (Authentication & Sessions) DONE
* **Entities**: `User`, `Session`, `RestaurantMembership`, `Role`
* **Features**:
  * Secure sign-in with email/password.
  * Multi-branch session context switching.
  * Token refresh / HTTP-only secure cookie sessions.
* **REST APIs**:
  * `POST /api/v1/auth/login`
  * `POST /api/v1/auth/logout`
  * `GET  /api/v1/auth/me`
  * `POST /api/v1/auth/refresh`
  * `POST /api/v1/auth/switch-branch`

---
### App 2: `pos` (Point of Sale)
* **Entities**: `PosCart`, `PosTicket`, `PosDiscount`, `PosPaymentMethod`
* **Features**:
  * Fast touch-optimized cart management.
  * Instant category navigation and text search.
  * Real-time calculation of subtotal, percentage/fixed discounts, and GST (CGST/SGST/IGST).
  * Direct one-click kitchen dispatch generating a Kitchen Order Ticket (KOT).
  * Split bills by items or equal portions; combine multiple checks.
* **REST APIs**:
  * `POST /api/v1/pos/calculate` (Calculates taxes, promotions, and totals for draft carts)
  * `POST /api/v1/pos/tickets` (Submits order directly to kitchen and register)
  * `POST /api/v1/pos/tickets/:id/pay` (Processes partial or full settlement)
  * `POST /api/v1/pos/tickets/:id/split` (Splits ticket into multiple sub-tickets)

---


### App 3: `orders` (Order Management Lifecycle)
* **Entities**: `Order`, `OrderItem`, `OrderStatusHistory`, `OrderPayment`
* **Features**:
  * Real-time order registry spanning Dine-in, Takeaway, Delivery, and QR ordering.
  * State lifecycle: `New` → `Accepted` → `Preparing` → `Ready` → `Served`/`Dispatched` → `Completed` (or `Cancelled`).
  * Order timeline and audit history.
* **REST APIs**:
  * `GET    /api/v1/orders` (Filtered by status, date range, branch, type)
  * `GET    /api/v1/orders/:id`
  * `POST   /api/v1/orders`
  * `PATCH  /api/v1/orders/:id/status` (Transitions status with validation)
  * `POST   /api/v1/orders/:id/cancel`
  * `POST   /api/v1/orders/merge`

---

### App 4: `kitchen` (Kitchen Display System - KDS / KOT)
* **Entities**: `KitchenTicket`, `KitchenStation`, `TicketItemStatus`
* **Features**:
  * Station routing: routes order items automatically to Hot line, Cold prep, Bar, or Dessert.
  * Elapsed time tracking with dynamic color alerts for delayed tickets (>15 mins).
  * Priority queuing (`Normal`, `Rush`, `Allergy`).
  * Sound/visual notifications on new incoming tickets.
* **REST APIs**:
  * `GET    /api/v1/kitchen/tickets` (Filter by station, active status)
  * `PATCH  /api/v1/kitchen/tickets/:id/status`
  * `PATCH  /api/v1/kitchen/tickets/:id/items/:itemId/bump` (Mark individual dish prepared)
  * `GET    /api/v1/kitchen/stations`

---

### App 5: `tables` (Floor & Table Management)
* **Entities**: `FloorZone`, `DiningTable`, `TableSession`, `WaitlistEntry`
* **Features**:
  * Visual floor plan representation across zones (`Main Room`, `Patio`, `Counter`, `Private Dining`).
  * Live status: `Available`, `Reserved`, `Seated`, `Ordering`, `Dining`, `Needs Cleaning`.
  * Real-time table turn duration metrics.
  * Waitlist queue management with estimated wait times and SMS/call notifications.
* **REST APIs**:
  * `GET    /api/v1/tables`
  * `POST   /api/v1/tables`
  * `PATCH  /api/v1/tables/:id/status`
  * `POST   /api/v1/tables/:id/seat`
  * `POST   /api/v1/tables/:id/clear`
  * `GET    /api/v1/tables/zones`

---

### App 6: `reservations` (Guest Bookings & Waitlist)
* **Entities**: `Reservation`, `GuestParty`, `Deposit`
* **Features**:
  * Reservation booking engine with date, slot, party size, occasion, and deposit tracking.
  * Calendar and timeline views.
  * Booking statuses: `Requested`, `Confirmed`, `Arrived`, `Seated`, `Completed`, `Cancelled`, `Waitlisted`.
* **REST APIs**:
  * `GET    /api/v1/reservations`
  * `POST   /api/v1/reservations`
  * `GET    /api/v1/reservations/:id`
  * `PATCH  /api/v1/reservations/:id`
  * `POST   /api/v1/reservations/:id/check-in`

---

### App 7: `delivery` (Delivery Dispatch)
* **Entities**: `DeliveryDispatch`, `DeliveryZone`, `Driver`, `DeliveryLog`
* **Features**:
  * Driver assignment and shift status.
  * Zone management with delivery fee thresholds.
  * Promised delivery time countdown and delayed dispatch warnings.
  * Real-time status transitions: `Queued` → `Preparing` → `Ready for pickup` → `Picked up` → `On the way` → `Delivered`.
* **REST APIs**:
  * `GET    /api/v1/delivery/dispatches`
  * `POST   /api/v1/delivery/dispatches/:id/assign`
  * `PATCH  /api/v1/delivery/dispatches/:id/status`
  * `GET    /api/v1/delivery/drivers`
  * `GET    /api/v1/delivery/zones`

---

### App 8: `menu` (Menu & Modifiers)
* **Entities**: `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `Allergen`
* **Features**:
  * Multi-level categories (Small plates, Mains, Sides, Desserts, Beverages).
  * Configurable modifiers (Add protein, spice level, dressing, portion sizing).
  * Allergen declarations (Gluten, Dairy, Nuts, Soy, Shellfish).
  * Instant availability switch (*Available, Sold out, Hidden*).
* **REST APIs**:
  * `GET    /api/v1/menu/items`
  * `POST   /api/v1/menu/items`
  * `PUT    /api/v1/menu/items/:id`
  * `PATCH  /api/v1/menu/items/:id/availability`
  * `GET    /api/v1/menu/categories`
  * `GET    /api/v1/menu/modifiers`

---

### App 9: `recipes` (Recipes & Food Costing)
* **Entities**: `Recipe`, `RecipeIngredient`, `TheoreticalCostVariance`
* **Features**:
  * Bill of Materials (BOM) linking menu dishes to raw inventory items with gram/milliliter precision.
  * Theoretical portion cost calculations based on latest inventory unit cost.
  * Margin and food cost percentage benchmarking against selling price.
* **REST APIs**:
  * `GET    /api/v1/recipes`
  * `POST   /api/v1/recipes`
  * `GET    /api/v1/recipes/:id`
  * `PUT    /api/v1/recipes/:id`
  * `GET    /api/v1/recipes/cost-analysis`

---

### App 10: `inventory` (Stock & Batch Management)
* **Entities**: `StockItem`, `StorageLocation`, `BatchRecord`, `StockLevel`
* **Features**:
  * Stock on hand tracking by location (*Dry store, Walk-in chiller, Produce prep, Bar*).
  * Batch tracking with production date and expiration date warnings.
  * Automatic low-stock reorder triggers.
* **REST APIs**:
  * `GET    /api/v1/inventory/items`
  * `POST   /api/v1/inventory/items`
  * `GET    /api/v1/inventory/alerts` (Low stock & expiring batches)
  * `POST   /api/v1/inventory/batches`
  * `GET    /api/v1/inventory/locations`

---
### App 11: `suppliers` (Procurement & Purchasing)
* **Entities**: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`
* **Features**:
  * Supplier registry with payment terms (Net 7, Net 15, Net 30, COD).
  * Purchase order creation, manager approvals, item delivery verification, and partial receiving.
* **REST APIs**:
  * `GET    /api/v1/suppliers`
  * `POST   /api/v1/suppliers`
  * `GET    /api/v1/suppliers/orders`
  * `POST   /api/v1/suppliers/orders`
  * `PATCH  /api/v1/suppliers/orders/:id/status` (Approve, Order, Receive)

---
### App 12: `stock_movements` (Waste, Transfers & Adjustments)
* **Entities**: `StockMovement`, `MovementType` (Waste, Transfer, Adjustment, CountVariance)
* **Features**:
  * Wastage logging with root cause reasons (Overripe, Spillage, Burnt, Expired).
  * Inter-branch and kitchen department inventory transfers.
  * Physical stock take reconciliation and count variance logging.
* **REST APIs**:
  * `GET    /api/v1/stock-movements`
  * `POST   /api/v1/stock-movements`
  * `GET    /api/v1/stock-movements/variance-summary`

---
### App 13: `customers` (CRM & Guest Profiles)
* **Entities**: `CustomerProfile`, `CustomerSegment`, `CustomerPreference`
* **Features**:
  * Centralized customer profiles, total orders, lifetime monetary value.
  * Guest preferences (e.g., table preference, allergies, dietary constraints).
  * Data privacy & marketing communication consent (Opt-in / Opt-out).
* **REST APIs**:
  * `GET    /api/v1/customers`
  * `POST   /api/v1/customers`
  * `GET    /api/v1/customers/:id`
  * `PUT    /api/v1/customers/:id`
  * `GET    /api/v1/customers/:id/history`

---
### App 14: `loyalty` (Promotions & Loyalty Rewards)
* **Entities**: `LoyaltyTier`, `LoyaltyAccount`, `PromoCampaign`, `CouponRedemption`
* **Features**:
  * Coupon code validation (minimum spend, validity date, usage limits).
  * Point earning and redemption rules per spend unit.
  * Tier classification (Silver, Gold, Platinum).
* **REST APIs**:
  * `GET    /api/v1/loyalty/campaigns`
  * `POST   /api/v1/loyalty/campaigns`
  * `POST   /api/v1/loyalty/validate-coupon`
  * `GET    /api/v1/loyalty/members/:id`

---
### App 15: `feedback` (Guest Ratings & Care)
* **Entities**: `GuestFeedback`, `ResolutionTicket`
* **Features**:
  * Review collection (1–5 stars) across food, ambiance, and service.
  * Automatic escalation of negative ratings (<3 stars).
  * Staff assignment for customer recovery and resolution tracking.
* **REST APIs**:
  * `GET    /api/v1/feedback`
  * `POST   /api/v1/feedback`
  * `PATCH  /api/v1/feedback/:id/assign`
  * `PATCH  /api/v1/feedback/:id/resolve`

### App 16: `staff` (Staff, Shifts & Attendance)
* **Entities**: `StaffMember`, `ShiftSchedule`, `AttendanceRecord`, `PayrollSummary`
* **Features**:
  * Staff directory with role, branch assignment, and contact details.
  * Shift scheduling and clock-in/out attendance logging.
  * Overtime and weekly hours calculation for payroll readiness.
* **REST APIs**:
  * `GET    /api/v1/staff`
  * `POST   /api/v1/staff`
  * `GET    /api/v1/staff/shifts`
  * `POST   /api/v1/staff/attendance/clock`
  * `GET    /api/v1/staff/payroll-summary`

---
# DONE TILL THIS

---

---

### App 17: `tasks` (Food Safety & Operational Checklists)
* **Entities**: `OperationalTask`, `SafetyChecklist`, `TemperatureLog`
* **Features**:
  * Daily scheduled opening, shift change, and closing checklists.
  * Temperature logs for refrigeration units (with warning thresholds).
  * Hygiene and compliance audit logs.
* **REST APIs**:
  * `GET    /api/v1/tasks`
  * `POST   /api/v1/tasks`
  * `PATCH  /api/v1/tasks/:id/complete`
  * `POST   /api/v1/tasks/temperature-log`

---

### App 18: `equipment` (Kitchen Asset Care)
* **Entities**: `EquipmentAsset`, `MaintenanceSchedule`, `BreakdownTicket`
* **Features**:
  * Asset catalog (chillers, ovens, espresso machines, dishwashers).
  * Preventive service cycles with upcoming service alerts.
  * Breakdown ticket creation and maintenance cost ledger.
* **REST APIs**:
  * `GET    /api/v1/equipment`
  * `POST   /api/v1/equipment`
  * `POST   /api/v1/equipment/:id/maintenance`
  * `PATCH  /api/v1/equipment/:id/status`

---

### App 19: `finance` (Finance & Accounting Ledger)
* **Entities**: `FinancialTransaction`, `Invoice`, `SupplierBill`, `TaxReconciliation`
* **Features**:
  * General ledger tracking sales, expenses, refunds, supplier payables, and taxes.
  * Payment gateway & card machine settlement reconciliation.
  * GST breakdown (5% dining, 18% alcohol/event charges).
* **REST APIs**:
  * `GET    /api/v1/finance/transactions`
  * `POST   /api/v1/finance/transactions`
  * `GET    /api/v1/finance/summary`
  * `POST   /api/v1/finance/reconcile`

---

### App 20: `reports` (Analytics & Intelligence)
* **Entities**: `ReportDefinition`, `GeneratedReport`
* **Features**:
  * Sales trends, peak hours, average ticket size.
  * Menu performance engineering (Stars, Plowhorses, Puzzles, Dogs).
  * Ingredient usage forecasts and labor productivity reports.
  * Export capabilities: CSV, Excel, PDF.
* **REST APIs**:
  * `GET    /api/v1/reports/sales-summary`
  * `GET    /api/v1/reports/menu-mix`
  * `GET    /api/v1/reports/food-cost`
  * `POST   /api/v1/reports/export`

---

### App 21: `branches` (Multi-Unit Management)
* **Entities**: `Branch`, `BranchOperatingHours`, `BranchTaxConfig`
* **Features**:
  * Multi-location management with comparative sales and order KPIs.
  * Centralized menu syncing and localized price adjustments.
* **REST APIs**:
  * `GET    /api/v1/branches`
  * `POST   /api/v1/branches`
  * `GET    /api/v1/branches/:id`
  * `PUT    /api/v1/branches/:id`

---

### App 22: `users` (Users, RBAC & Permissions)
* **Entities**: `User`, `Role`, `Permission`, `Invite`
* **Features**:
  * Role and permission mapping per branch.
  * User invitation system.
  * Deactivation and suspension controls.
* **REST APIs**:
  * `GET    /api/v1/users`
  * `POST   /api/v1/users/invite`
  * `PUT    /api/v1/users/:id/role`
  * `PATCH  /api/v1/users/:id/status`

---

### App 23: `audit` (Immutable Audit Log)
* **Entities**: `AuditEvent`
* **Features**:
  * Immutable record of all system events, status changes, manual overrides, discounts, and deletions.
  * Searchable by actor, date range, action type, and module.
* **REST APIs**:
  * `GET    /api/v1/audit/logs`

---

### App 24: `settings` (System Configuration & Hardware Integrations)
* **Entities**: `SystemSetting`, `HardwarePrinterConfig`, `PaymentTerminalConfig`
* **Features**:
  * General restaurant details and operating currency/GST format.
  * Kitchen printer routing (IP/Bluetooth thermal printer configs).
  * External webhook hooks for delivery aggregators (Swiggy, Zomato).
* **REST APIs**:
  * `GET    /api/v1/settings`
  * `PUT    /api/v1/settings`
  * `POST   /api/v1/settings/test-printer`

---

## 4. Frontend App Structure (Next.js & TypeScript)

Each frontend feature app lives in `src/apps/<appName>` and contains:
- `components/`: UI components scoped strictly to this feature.
- `api/`: Type-safe REST API client functions for backend calls.
- `types/`: Domain TypeScript interfaces matching backend DTOs.
- `hooks/`: Feature-specific React hooks and state management.

Routes in `src/app/` serve as lean page wrappers that invoke the corresponding app components.

---

## 5. Verification & Acceptance Criteria
1. **Separation of Concerns**: Both `backend/` and `frontend/` compile independently without shared code leaking outside typed API contracts.
2. **Pluggable Architecture**: Disabling or adding an app in `INSTALLED_APPS` registers or unregisters its REST endpoints without breaking unrelated apps.
3. **Type Safety**: Full end-to-end TypeScript types for all request bodies and response DTOs.
4. **Resilient Error Handling**: Standardized error responses with validation details and HTTP status codes.

