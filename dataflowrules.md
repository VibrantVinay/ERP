# Rift ERP — Staff Roles, Access Control & Data Manipulation Flow Specification (v2)

> Authoritative RBAC specification for Rift ERP. Defines the 14-role model, authentication, authorization, tenant isolation, operational permissions, field-level restrictions, audit requirements, transactional integrity, real-time contracts, offline behavior, migrations, and India-specific compliance.
>
> **Scope boundary:** This document specifies the RBAC and operational access-control contract. It does not replace the entity schema, complete OpenAPI contracts, canonical error registry, or cross-cutting API contracts. Those remain separate implementation prerequisites for modules not yet implemented.
>
> **Implementation rule:** Explicit security and integrity requirements in this document are mandatory. Where this document does not define a behavior, implementations must not silently invent a conflicting contract; resolve the gap in the relevant companion specification.

## 1. Purpose and Scope

This document is authoritative for:

- Backend authentication, authorization, tenant isolation, and branch middleware in `backend/src/core/middleware.ts`.
- Field-level DTO allowlists and request validation.
- Immutable audit events and tamper-evident audit chains in `backend/src/core/audit.ts`.
- Frontend route guards and permission synchronization in `frontend/src/core/`.
- Elevation-token lifecycle and privileged operations.
- Operational state transitions and transaction integrity.
- Migration orchestration in `backend/src/core/migrations.ts`.

It defines the identity, responsibilities, access scope, permitted mutations, and audit requirements of 14 staff roles.

### 1.1 Normative language

- **MUST / MUST NOT:** Mandatory security or correctness requirement.
- **SHOULD / SHOULD NOT:** Recommended behavior unless a documented exception exists.
- **MAY:** Optional behavior.
- **Owner (OW):** The `OWNER` role, not a generic record owner.
- **Branch scope:** The set of branches the authenticated session may access.
- **Elevation:** A short-lived, single-use authorization for a specific privileged operation.
- **Training write:** A mutation isolated from production business data.

## 2. Global Access-Control Architecture

### 2.1 Authentication

| Authentication mode | Roles | Endpoint | Requirements |
|---|---|---|---|
| Email and password | OWNER, MANAGER, SHIFT_LEAD, ACCOUNTANT | `POST /auth/login` | Argon2id password hashing; email-based rate limiting of 5 attempts per 15 minutes |
| Four-digit PIN | CASHIER, CHEF, SOUS_CHEF, SERVER, HOST, DRIVER, DISPATCHER, CLEANER, BARTENDER, TRAINEE | `POST /auth/login` | Per-user, per-device lockout policy |
| Session refresh | All roles | `POST /auth/refresh` | Rotate refresh token and revoke the previous token |
| Branch switch | OWNER, MANAGER, ACCOUNTANT | `POST /auth/switch-branch` | Validate branch scope and issue an updated session |
| Privilege elevation | Eligible requestors and authorizers | `POST /auth/elevate` | Issue a 60-second, single-use, operation-bound token |
| PIN reset | OWNER, MANAGER | `POST /auth/pin-reset` | Force PIN rotation and audit the change |
| Session revocation | OWNER, MANAGER | `POST /auth/sessions/revoke` | Revoke a user's session or a session associated with a device |
| Lockout management | OWNER, MANAGER | `GET /auth/lockout-status` | View lockouts and perform authorized unlocks |
| Permission retrieval | All roles | `GET /auth/permissions` | Return effective session permissions and their version |

Authentication MUST establish the user identity before any business resource is accessed. An authenticated identity alone does not authorize a business operation.

### 2.2 Session context

```ts
type Session = {
  user_id: string;
  role: Role;
  target_role?: Role;           // TRAINEE only
  restaurant_id: string;
  branch_id: string;
  allowed_branches: string[];   // ["ALL"] for OWNER and ACCOUNTANT
  station?: Station;            // CHEF, SOUS_CHEF, BARTENDER
  zones?: string[];             // SERVER, HOST, CLEANER, DRIVER
  permissions: string[];
  pii_access: boolean;
  is_training: boolean;
  device_id: string;
  permissions_version: number;
  token_iat: number;
  token_exp: number;
};
```

The session MUST be created by trusted server-side authentication logic. Clients MUST NOT be able to change role, tenant, branch scope, PII privileges, station, zone, or training status by editing a request body, header, query parameter, or local permission cache.

`target_role` MUST be absent for non-TRAINEE sessions. For TRAINEE sessions, it MUST contain a supported operational role and MUST NOT grant the trainee any permissions that the target role does not have.

`pii_access` is an authorization attribute, not a blanket permission to read all PII. The requested entity, purpose, field allowlist, branch scope, and role permissions MUST also be checked.

### 2.3 Multi-tenancy and branch isolation

- `restaurant_id` and the active `branch_id` MUST be derived from the authenticated server-side session.
- `X-Restaurant-ID`, `X-Branch-ID`, and `X-PII-Consent` are deprecated and MUST NOT grant or alter access.
- If deprecated headers are supplied, they MUST be ignored for authorization.
- An explicit `?branch_id=` query parameter MAY select a target branch only after authorization against `allowed_branches`.
- Every tenant-owned query MUST constrain records by `restaurant_id = session.restaurant_id`.
- Branch-scoped operations MUST additionally constrain records by the authorized target branch.
- Cross-branch operations MUST validate every referenced record, including nested records and foreign keys, against the same tenant and authorized branch scope.
- `allowed_branches = ["ALL"]` removes the branch restriction only; it MUST NOT remove tenant isolation.
- A record whose tenant does not match the session MUST NOT be returned or mutated. Cross-tenant attempts MUST be rejected and security-relevant attempts audited without leaking whether another tenant's record exists.

### 2.4 Authorization pipeline

Every protected request MUST pass these stages in order:

1. **Authentication:** Validate the access token, session status, expiration, and revocation state.
2. **Session freshness:** Compare `permissions_version` with the current authoritative version. Return `401 SESSION_STALE` when the session is outdated.
3. **Tenant isolation:** Verify the tenant for every target record.
4. **Branch authorization:** Validate the active branch and any explicit target branch.
5. **Module authorization:** Confirm that `{module}:{action}` exists in the effective permission set.
6. **Elevation authorization:** Require and validate elevation when the operation exceeds the actor's self-approval limit.
7. **DTO validation:** Enforce role-specific field allowlists, required fields, and reason requirements.
8. **Business validation:** Enforce state transitions, financial rules, training isolation, and optimistic locking.
9. **Transactional persistence:** Apply mutations atomically and record required idempotency information.
10. **Audit and response:** Persist the corresponding immutable audit event and return the standard response envelope.

For successful mutations, business changes, elevation consumption, and mandatory audit writes MUST commit atomically whenever they share the same transactional datastore. If audit persistence fails, the protected mutation MUST fail closed.

The canonical HTTP status, error-code registry, and response schemas MUST be defined in `errors.registry.md` and the applicable OpenAPI specification. The error codes used here are required identifiers, not a complete error registry.

### 2.5 PIN security and privilege elevation

#### 2.5.1 PIN lockout

| Consecutive failures | Required action |
|---|---|
| 3 | 30-second cooldown for `(user_id, device_id)` |
| 5 | Five-minute lockout |
| 10 | Hard lock requiring authorized manual unlock |

The longest applicable lockout MUST take precedence. Failure counters MUST be maintained atomically and MUST NOT be reset by changing the client device identifier.

Every failed authentication attempt MUST generate an `AUTH_FAILED` security event containing the attempt count, device identifier, and available network metadata. Lockout activation MUST generate `AUTH_LOCKOUT`.

PINs MUST be stored using an appropriate salted password-hashing scheme. Plaintext PINs MUST NOT be logged, persisted, returned, or included in audit events.

Four-digit PINs have limited entropy. PIN authentication MUST therefore use the prescribed lockout controls and registered-device restrictions. PIN blocklist and history checks are required as described in §2.5.3.

#### 2.5.2 Elevation tokens

Issuance endpoint: `POST /auth/elevate`.

Request:

```json
{
  "authorizer_pin": "provided securely",
  "authorizer_email": "optional when applicable",
  "operation": "pos.discount",
  "entity_id": "target-entity-id",
  "reason": "Business justification"
}
```

The sample above is illustrative. Real requests MUST contain actual credentials over an authenticated, encrypted connection; credentials MUST never be written to application logs.

Response:

```json
{
  "elevation_token": "opaque-random-token",
  "expires_at": "ISO-8601 timestamp",
  "scope": {
    "operation": "pos.discount",
    "entity_id": "target-entity-id"
  }
}
```

Requirements:

- TTL is exactly 60 seconds from issuance. No rolling expiration is permitted.
- Each token MUST be single-use.
- The token MUST be bound to the operation type, entity identifier, requesting user, and authorizing user.
- The authorizer MUST have permission to approve the requested operation and MUST satisfy the relevant approval ceiling.
- The authorizer MUST reauthenticate using an approved credential flow. A client-provided value such as `"self"` MUST NOT bypass authentication.
- The authorizer and requestor MUST be distinguishable in the audit trail.
- Tokens MUST be stored in an appropriately protected, shared server-side store, such as Redis or a transactional database. In-memory storage is acceptable only in a single-instance deployment with no requirement for cross-instance validation or survival across process restarts.
- The token record MUST expire automatically and have an auditable lifecycle.
- The caller MUST submit `X-Elevation-Token` to the operation endpoint.
- Validation MUST confirm that the token exists, has not expired, has not been consumed or revoked, matches the operation and entity, matches the requestor's current session, and has an active authorizer session.
- Revoking the authorizer's session, disabling the authorizer, changing relevant permissions, or revoking the token MUST invalidate outstanding elevation tokens.
- Token consumption MUST be atomic and MUST occur in the same transaction as the protected mutation. Concurrent attempts to consume the same token MUST result in at most one successful operation.
- Failed protected operations MUST NOT leave a consumed token unless the contract explicitly records a committed authorization attempt. By default, validation and consumption MUST roll back with the protected transaction.
- Issuance, revocation, expiration where required, and consumption MUST be auditable without recording the bearer token itself.

An elevation token authorizes only the exact operation and entity in its scope. It does not grant a temporary general-purpose role upgrade.

#### 2.5.3 PIN reset and rotation

- OWNER and MANAGER may rotate operational-user PINs.
- Only OWNER may rotate a MANAGER's PIN.
- Self-service rotation requires the current PIN.
- New PINs MUST contain at least four digits.
- The previous three PINs MUST NOT be reused.
- The PINs `1111`, `2222`, and `3333` MUST be rejected.
- PIN reset MUST revoke applicable active sessions and elevation tokens, require rotation before the next operational login, and create an immutable audit event.
- PIN reset and lockout management MUST enforce tenant and branch authorization.

### 2.6 Session lifecycle

| Session type | Idle timeout | Absolute timeout |
|---|---:|---:|
| PIN session | 30 minutes | 12 hours |
| Email/password session | 15 minutes | 8 hours |

- At most one active session is allowed per `(user_id, device_id)`. A new login MUST revoke the prior session for that pair.
- Logout MUST revoke the refresh token and outstanding elevation tokens associated with the session.
- Expired, revoked, disabled-user, or otherwise invalid sessions MUST be rejected.
- Rotating a registered operational terminal's device identifier requires OWNER or MANAGER authorization and an audit event.
- Session revocation MUST take effect on subsequent requests and MUST invalidate relevant realtime connections.
- Refresh tokens MUST be rotated atomically; reuse of a revoked refresh token MUST trigger rejection and appropriate security handling.

### 2.7 Permission notation

| Symbol | Meaning |
|---|---|
| ✅ | Full CRUD within the explicitly defined scope |
| 📖 | Read-only |
| ✏️ | Create and read |
| 🔄 | Restricted status update |
| 🔒 | Restricted to own records, assigned zone, or authorized branch |
| ⚠️ | Approval or elevation required above the stated ceiling |
| 🚫 | No access |
| 🔐 | Field-level restriction |

These symbols are shorthand, not independent authorization rules. The detailed role specifications, DTO allowlists, transition guards, and approval limits take precedence over ambiguous matrix shorthand.

## 3. Master Role Registry and Customer-Terminal Access

Rift ERP has 14 staff roles and a separate customer-terminal access model. Customer terminals are not staff roles and MUST NOT inherit staff permissions.

### 3.1 Staff role registry

The 14 staff roles remain unchanged:

`OWNER`, `MANAGER`, `SHIFT_LEAD`, `CASHIER`, `CHEF`, `SOUS_CHEF`, `SERVER`, `HOST`, `DRIVER`, `DISPATCHER`, `ACCOUNTANT`, `CLEANER`, `BARTENDER`, `TRAINEE`.

### 3.2 Customer-facing terminal types

| Terminal type       | Route           | Access model                         | Permissions                                                                                        |
| ------------------- | --------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `KIOSK`             | `/kiosk`        | Terminal-authenticated guest session | Published menu read, cart operations, eligible coupon validation, order creation, own-order status |
| `OFFERS_BOARD`      | `/offers-board` | Read-only terminal session           | Published menu highlights, active promotions, public preparation-time estimates                    |
| `CUSTOMER_TRACKING` | Future route    | Short-lived order-scoped guest token | Own order status only                                                                              |

These terminal types are separate from staff roles and MUST NOT be represented as `TRAINEE`, `SERVER`, `CASHIER`, or another staff role.

### 3.3 Terminal identity and authentication

Introduce a separate customer-terminal authentication service under `/api/v1/customer-auth/*`.

Required endpoints:

- `POST /customer-auth/initialize` — initialize an authorized kiosk or offers-board installation.
- `POST /customer-auth/session` — issue a short-lived terminal session.
- `POST /customer-auth/refresh` — rotate terminal session credentials where supported.
- `POST /customer-auth/logout` — revoke the active terminal session.
- `GET /customer-auth/config` — return the public configuration permitted for the authenticated terminal.

Terminal initialization MUST require an authorized provisioning process. Public users MUST NOT be able to register arbitrary trusted terminals simply by calling the initialization endpoint.

Terminal sessions MUST contain a terminal identifier, terminal type, restaurant and branch scope, permission scope, issue time, expiry, and revocation status.

The server MUST validate terminal identity and scope on every protected customer-terminal request. A terminal session MUST NOT be accepted by staff authentication middleware, and a staff session MUST NOT automatically grant customer-terminal permissions.

The `/offers-board` may use a read-only public session only when its published-data endpoints are explicitly designed for anonymous access. If terminal-specific configuration or private branch data is needed, it MUST use a provisioned terminal session.

### 3.4 Terminal permission boundaries

`KIOSK` MAY:

- Read published menu items and categories.
- Read applicable public prices, tax-inclusive/exclusive display information, and available customizations.
- Maintain a local cart.
- Validate eligible promotional codes through the backend.
- Submit an order for its authorized branch.
- Read status for orders created within its own authorized session.

`KIOSK` MUST NOT:

- Access staff, finance, payroll, audit, inventory administration, or settings endpoints.
- Change server-calculated prices, tax, discounts, payment status, or order ownership.
- Read another kiosk's orders or customer records.
- Mark an order paid based on a client-side payment simulation.
- perform administrative actions or issue elevation tokens.

`OFFERS_BOARD` MAY:

- Read published menu highlights and active public promotions.
- Display branch-approved preparation-time estimates.
- Open or link to the customer kiosk.

`OFFERS_BOARD` MUST NOT:

- Create orders, process payments, validate private customer data, or mutate promotions.
- Read staff-only KDS payloads or internal dispatch data.
- Display unpublished menu items or expired promotions.

### 3.5 Customer-terminal isolation

Customer-terminal endpoints MUST enforce tenant and branch scope from the validated terminal session or explicitly authorized public configuration.

Every submitted item, price, tax amount, discount, coupon, availability state, and total MUST be recalculated or verified by the server.

Customer-terminal order creation MUST use idempotency keys. The server MUST prevent cross-terminal order access and MUST return only the minimum order information needed for the customer experience.

Customer-terminal sessions MUST have bounded lifetimes and revocation support. The kiosk MUST reset its local cart and guest-visible state after successful completion, cancellation, timeout, or session termination. Resetting the frontend MUST NOT substitute for server-side authorization or session revocation.

## 4. Detailed Role Specifications

### 4.1 OWNER

OWNER has tenant-wide administrative access across the restaurant's branches.

OWNER may manage users and roles, settings, branch configuration, audit review, menu and inventory, POS, operational modules, and financial approvals within the restaurant tenant.

OWNER is not permitted to bypass tenant isolation, delete immutable audit records, reuse consumed elevation tokens, bypass idempotency, or hard-delete protected financial records.

High-risk actions MUST be reasoned and audited. Role changes MUST follow the explicit role-change confirmation workflow when that workflow is implemented.

### 4.2 MANAGER

MANAGER is restricted to a single assigned branch.

MANAGER may manage floor operations, staff operations, approvals, branch-level reporting, maintenance, inventory movements, and permitted operational settings.

MANAGER discount self-approval ceiling is 25%. MANAGER may authorize eligible cashier discounts up to 25%, subject to the elevation contract.

MANAGER cannot access other branches unless the user is separately assigned an explicitly authorized scope by a supported administrative mechanism. The current role model does not provide that mechanism.

### 4.3 SHIFT_LEAD — Priya Rao

**Scope:** One branch; no global configuration.

**Responsibilities:** Rush-period floor leadership, eligible POS overrides, refund approval, floor escalation, waste review, and feedback resolution.

| Module | Rights | Constraints |
|---|---|---|
| `pos` | Restricted create/update and overrides | Self-approve discounts up to 15%; refunds up to ₹5,000 |
| `orders` | Read, create, restricted status update | Cancel only through `READY`; reason required |
| `tables` | Operational updates and force-clear | Reason required for force-clear |
| `stock_movements` | Create and approve within ceiling | Approval up to ₹5,000 |
| `feedback` | Read, update, resolve | Escalate ratings below 3 stars to MANAGER |
| `staff` | Read-only | Shifts and attendance only |
| `finance` | Read-only | No financial mutation |
| `suppliers` | Read-only | Cannot approve purchase orders |
| `settings` | No access | — |
| `users` | No access | — |

Discounts above 15% require MANAGER authorization, subject to the applicable higher-level ceiling. SHIFT_LEAD MUST NOT authorize an operation above their own approval limit.

### 4.4 CASHIER — Neha Verma

**Scope:** One branch.

**Responsibilities:** POS tickets, payments, permitted discounts, drawer operations, attendance clocking, and shift handover.

| Module | Rights | Constraints |
|---|---|---|
| `pos` | Create/read and permitted settlement operations | Self-approve discounts up to 10%; higher discounts require approval |
| `orders` | Read and limited creation | No unrestricted order-status changes |
| `tables` | Read and permitted operational updates | No force-clear |
| `customers` | Restricted read/create | Only fields explicitly authorized for POS |
| `finance` | Create eligible POS-sourced entries | No arbitrary manual finance entries |
| `staff` | Own attendance actions | `POST /staff/attendance/clock` |
| `reports` | Drawer reports | Own authorized branch and drawer scope |

A discount above 10% MUST trigger an approval path. CASHIER MUST NOT modify submitted item prices or payment methods after settlement.

### 4.5 CHEF — Samira Khan

**Scope:** One branch and the assigned kitchen station.

**Responsibilities:** Station KDS, preparation status, permitted menu availability, waste reporting, kitchen checklists, and equipment breakdown reporting.

| Module | Rights | Constraints |
|---|---|---|
| `kitchen` | Station-scoped status updates | Cannot mutate another station's tickets |
| `orders` | Read and permitted preparation updates | No payment mutation |
| `menu` | Restricted availability updates | Cannot change price, category, or description |
| `recipes` | Read-only | No recipe edits |
| `inventory` | Read-only | No stock adjustment |
| `stock_movements` | Create waste movements | Up to ₹2,000 auto-posted; above this requires review |
| `tasks` | Create/read and permitted completion | Temperature logs and checklists |
| `equipment` | Read and breakdown reporting | No unrestricted asset administration |

Task completion uses `PATCH /tasks/:id/complete`.

Waste movements above ₹2,000 MUST enter `PENDING_REVIEW`. Amounts above ₹10,000 require OWNER approval. The approver MUST be authorized independently of the submitter.

### 4.6 SOUS_CHEF — Arjun Patil

**Scope:** One branch, all supported kitchen stations: `HOT_LINE`, `COLD_PREP`, `BAR`, and `DESSERT`.

**Responsibilities:** Cross-station KDS, ticket bumping, queue reordering, checklists, and equipment breakdown reporting.

| Module | Rights | Constraints |
|---|---|---|
| `kitchen` | Read and restricted status updates across stations; reorder | Cannot toggle `MenuItem.available` |
| `orders` | Read and permitted preparation updates | `Preparing → Ready` where applicable |
| `recipes` | Read-only | No recipe edits |
| `inventory` | Read-only | No stock mutation |
| `stock_movements` | No access | — |
| `tasks` | Create/read and permitted completion | Checklists and temperature logs |
| `equipment` | Read and breakdown reporting | No unrestricted asset administration |

SOUS_CHEF differs from CHEF by having all-station KDS access and queue-reordering permission, but no menu-availability toggle or waste-log creation.

### 4.7 SERVER — Ravi Naik

**Scope:** One branch and assigned floor zone.

**Responsibilities:** Dine-in orders, table service, order handoff, customer interaction, and service feedback.

| Module | Rights | Constraints |
|---|---|---|
| `orders` | Create/read and permitted status updates | Cannot alter payment fields |
| `pos` | Restricted ticket creation | Cannot set discount, payment method, or total |
| `tables` | Zone-scoped operational updates | May transition `Dining → NeedsCleaning` |
| `reservations` | Read and permitted check-in support | No deposit override |
| `customers` | Restricted read | Only service-required fields |
| `feedback` | Create | Cannot administer feedback escalation |
| `finance` | No access | — |

The SERVER MUST NOT mark a table `Available` directly after dining. The table must transition through `NeedsCleaning`; CLEANER completes the cleaning handoff.

### 4.8 HOST — Aisha Shaikh

**Scope:** One branch; authorized floor access.

**Responsibilities:** Reservation book, waitlist, arrival check-in, seating, and party announcements.

| Module | Rights | Constraints |
|---|---|---|
| `reservations` | Create/read/update | Cannot override deposits |
| `tables` | Restricted status updates and seating | `Reserved ↔ Available` where valid; may seat a party |
| `tables` | Create waitlist entries | Required guest and party fields |
| `customers` | Restricted read | Name and phone only; no order history or payment data |
| `feedback` | Create | Cannot resolve administrative escalations |
| `pos` | No access | — |
| `finance` | No access | — |

Supported workflow:

```http
GET /reservations?date=<branch-local-date>
POST /reservations/:id/check-in
POST /tables/:id/seat
POST /tables/waitlist
```

Check-in, seating, and reservation transitions MUST be validated against the current state. The branch-local date MUST be interpreted using the branch timezone configured by the operational contract.

### 4.9 DRIVER — Kabir Shah

**Scope:** One branch and assigned delivery zone.

**Responsibilities:** Assigned delivery status, delivery confirmation, failure reporting, and cash-on-delivery collection.

| Module | Rights | Constraints |
|---|---|---|
| `delivery` | Read assigned dispatches and update permitted status | Cannot reassign another driver or edit fees |
| `orders` | Read assigned delivery orders | No payment or unrestricted PII access |
| `customers` | Restricted delivery fields | Minimum necessary name, address, and contact details |
| `finance` | No direct access | COD creates auditable financial side effects |
| `staff` | Own shift status | No staff administration |

Required endpoints:

```http
PATCH /delivery/drivers/me/status
POST /delivery/dispatches/:id/collect-cash
```

PII visibility MUST be based on the authenticated session and field-level authorization, never a client-supplied consent header.

A driver MUST report delivery failure with a reason. COD collection MUST be idempotent and linked to the dispatch record.

### 4.10 DISPATCHER — Rohan Mehta

**Scope:** One branch and all authorized delivery zones.

**Responsibilities:** Dispatch assignment, driver reassignment, queue monitoring, delay escalation, and delivery-zone operations.

| Module | Rights | Constraints |
|---|---|---|
| `delivery` | Dispatch, assignment, reassignment, and zone management | Cannot edit driver master records |
| `delivery` | Read driver information | Only fields needed for dispatch |
| `orders` | Delivery-only read | No payment details or unrestricted PII |
| `customers` | Restricted delivery fields | Name and masked phone only |
| `pos` | No access | — |
| `finance` | No access | — |
| `staff` | No access | — |

Workflow:

```http
GET /delivery/dispatches?status=READY_FOR_PICKUP
POST /delivery/dispatches/:id/assign
PATCH /delivery/dispatches/:id/status
```

Reassignment MUST require a reason and MUST verify that the dispatch and destination driver belong to the same authorized tenant and branch.

### 4.11 ACCOUNTANT — Devendra Rao

**Scope:** All branches belonging to one restaurant tenant; finance-scoped PII access.

**Responsibilities:** Financial transactions, reconciliation, finance reports, and authorized payroll reads.

| Module | Rights | Constraints |
|---|---|---|
| `finance` | Full finance CRUD within policy | Manual entries require `source=MANUAL` and a reason |
| `reports` | Finance reporting | Tenant-scoped and finance-authorized |
| `staff` | Payroll read | Salary and payroll access only where explicitly permitted |
| `customers` | Billing-related fields only | No unrestricted global customer search |
| `suppliers` | Read-only | No approval unless separately authorized |
| `audit` | Finance-scoped read | No mutation |
| `branches` | Read-only | Authorized tenant only |
| `menu` | No access | — |

Every financial creation or reversal MUST include an `Idempotency-Key`. Financial records MUST be corrected through immutable reversal operations, never deleted.

`allowed_branches = ["ALL"]` does not authorize unrestricted customer PII access. Cross-branch customer search MUST return only explicitly authorized billing fields and MUST be subject to audit and purpose restrictions.

### 4.12 CLEANER — Manoj Kumar

**Scope:** One branch and assigned cleaning zone.

**Responsibilities:** Sanitation queue, cleaning completion, and assigned maintenance reporting.

| Module | Rights | Constraints |
|---|---|---|
| `tables` | Restricted status update | Only `NeedsCleaning → Available` |
| `tasks` | Create/read and permitted completion | Assigned sanitation tasks |
| `equipment` | Create breakdown tickets | No unrestricted equipment mutation |
| Other modules | No access unless explicitly granted | — |

Task completion uses `PATCH /tasks/:id/complete`.

CLEANER MUST NOT modify table ownership, pricing, seating assignments, or unrelated table fields.

### 4.13 BARTENDER — Lucia Fernandes

**Scope:** One branch, station `BAR`.

**Responsibilities:** Bar KDS, bar-menu availability, spirits stock visibility, bar recipes, coupon validation, and bar waste reporting.

| Module | Rights | Constraints |
|---|---|---|
| `kitchen` | BAR-station status updates | BAR only |
| `menu` | BAR availability updates | No pricing or category edits |
| `inventory` | Read-only | `storage_location=BAR` only |
| `stock_movements` | Create waste movements | Up to ₹2,000 auto-posted; above this requires review |
| `loyalty` | Read and validate | Coupon validation only |
| `recipes` | Read-only | Bar recipes only |
| `tasks` | Create/read and permitted completion | Authorized branch tasks only |

Coupon validation MUST NOT permit unauthorized redemption, repeated redemption, or alteration of loyalty balances.

### 4.14 TRAINEE — variable

**Scope:** One branch. The `target_role` determines the read-only operational surface.

**Responsibilities:** Observe authorized workflows and optionally practice in a fully isolated training environment.

| Module | Rights | Constraints |
|---|---|---|
| Read endpoints | Read-only permissions derived from `target_role` | Training session marker required |
| Write endpoints | Denied by default | `403 TRAINING_MODE` |
| Training writes | Only when `TRAINING_WRITES_ENABLED=true` | Separate training storage; never mutate live business records |
| Elevation | Denied | TRAINEE cannot issue or consume elevation tokens |

When training writes are enabled:

- Every write MUST be marked `is_training=true`.
- Training data MUST be isolated from production tables and financial ledgers.
- Training transactions MUST NOT trigger real payments, external dispatches, production webhooks, statutory invoices, or real customer notifications.
- Trainees MUST only see the training records they are authorized to access.
- Training data MUST be purged at shift end according to the configured cleanup process.
- The isolation mechanism MUST work on both SQLite and PostgreSQL. PostgreSQL schemas MAY be used, but they are not the sole permitted implementation.
- Training mode MUST be enforced server-side and MUST NOT rely on frontend hiding or disabled controls.

## 5. Master Permission Matrix

Abbreviations: OW = OWNER, MG = MANAGER, SL = SHIFT_LEAD, CA = CASHIER, CH = CHEF, SC = SOUS_CHEF, SV = SERVER, HO = HOST, DR = DRIVER, DS = DISPATCHER, AC = ACCOUNTANT, CL = CLEANER, BT = BARTENDER, TR = TRAINEE.

| Module | OW | MG | SL | CA | CH | SC | SV | HO | DR | DS | AC | CL | BT | TR |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `auth` | Full | Own | Own | Own | Own | Own | Own | Own | Own | Own | Own | Own | Own | Own |
| `pos` | Full | Approval ≤25% | Approval ≤15% | Create; self ≤10% | None | None | Restricted create | None | None | None | Read authorized | None | None | Read |
| `orders` | Full | Restricted CRUD | Restricted CRUD | Read/create | Read/preparation | Read/preparation | Create/service updates | Read | Assigned read | Delivery read | Read | None | Read | Read |
| `kitchen` | Read/update | Restricted update | Restricted update | None | Own station | All stations | Read | None | None | None | None | None | BAR only | Read |
| `tables` | Full | Full branch scope | Operational full scope | Read/restricted status | None | None | Zone updates incl. cleaning handoff | Seating/reservations | None | None | None | Cleaning completion | None | Read |
| `reservations` | Full | Full branch scope | Full branch scope | None | None | None | Read/check-in support | Full branch scope | None | None | None | None | None | Read |
| `delivery` | Full | Restricted CRUD | Read | None | None | None | None | None | Assigned updates | Dispatch CRUD | None | None | None | Read |
| `menu` | Full | Read/availability | Read | Read | Availability | Read | Read | Read | None | None | None | None | BAR availability | Read |
| `recipes` | Full | Read | Read | None | Read | Read | None | None | None | None | None | None | BAR recipes | Read |
| `inventory` | Full | Read/movement approval | Read | Alerts/read | Read | Read | None | None | None | None | Read | None | BAR read | Read |
| `suppliers` | Full | Approval ≤₹50k | Read | None | None | None | None | None | None | None | Read | None | None | None |
| `stock_movements` | Full | Create/approve ≤₹10k | Create/approve ≤₹5k | None | Waste ≤₹2k auto-post | Read | None | None | None | None | Read | None | Waste ≤₹2k auto-post | Read |
| `customers` | Full subject to policy | Restricted PII | Restricted PII | POS fields | None | None | Service fields | Name/phone | Assigned delivery fields | Masked delivery fields | Billing fields | None | None | Read authorized |
| `loyalty` | Full | Read/validate | Read/validate | Read/validate | None | None | None | None | None | None | None | None | Read/validate | Read |
| `feedback` | Full | Full | Full | None | None | None | Create | Create | None | None | None | None | None | Read |
| `staff` | Full | Create/update | Read | Own attendance | None | None | None | None | Own shift | None | Payroll read | None | None | None |
| `tasks` | Full | Full | Full | None | Create/complete | Create/complete | None | None | None | None | None | Create/complete | Create/complete | Read |
| `equipment` | Full | Read/maintenance | Read/maintenance | None | Read/breakdown | Read/breakdown | None | None | None | None | None | Breakdown | Read/breakdown | Read |
| `finance` | Full | Read | Read | POS-sourced entries | None | None | None | None | None | None | Full | None | None | Read |
| `reports` | Full | Branch reports | Branch read | Drawer reports | None | None | None | None | None | Delivery reports | Finance reports | None | None | Read |
| `branches` | Full tenant scope | Read | None | None | None | None | None | None | None | None | Read | None | None | None |
| `users` | Full tenant scope | Invite/manage within policy | None | None | None | None | None | None | None | None | None | None | None | None |
| `audit` | Full read | Branch read | None | None | None | None | None | None | None | None | Finance-scoped read | None | None | None |
| `settings` | Full | Read | None | None | None | None | None | None | None | None | None | None | None | None |

### 5.1 Matrix interpretation

1. `Full` means full CRUD only within the explicitly defined tenant, branch, entity, and field scope. It never overrides immutable audit rules, financial reversal rules, or legal restrictions.
2. Approval ceilings are upper limits, not grants to approve every operation below the limit. The relevant module permission and state-transition rule must also permit the operation.
3. `None` means no access unless an explicitly documented endpoint permission grants a narrower operation.
4. `Read` does not imply unrestricted PII visibility.
5. TRAINEE permissions are derived from `target_role` but are read-only by default. The training-write exception in §4.14 never permits production mutations.
6. This matrix is a summary. The detailed role specifications and rules in §7 take precedence where the matrix is abbreviated.

## 6. Cross-Role End-to-End Dataflows

### 6.1 Dine-in order lifecycle

```text
SERVER             KITCHEN              CASHIER             CLEANER
  |                   |                    |                   |
  |-- seat table ---->|                    |                   |
  |-- create ticket ->|                    |                   |
  |                   |-- KOT created      |                   |
  |                   |-- prepare/bump     |                   |
  |                   |-- mark READY       |                   |
  |<-- service-ready -|                    |                   |
  |-- mark SERVED ------------------------>|                   |
  |                   |                    |-- accept payment   |
  |-- table Dining -> NeedsCleaning -------------------------->|
  |                   |                    |                   |-- clean
  |                   |                    |                   |-- Available
```

Requirements:

- Ticket creation, KOT creation, and required stock effects MUST be transactionally consistent.
- Kitchen updates MUST be station-authorized.
- Payment MUST use the financial idempotency contract.
- The SERVER may transition `Dining → NeedsCleaning`.
- CLEANER alone may complete the cleaning transition `NeedsCleaning → Available`, subject to assigned branch and zone.
- A table MUST NOT become `Available` while an active dining session or unsettled table dependency remains.

### 6.2 Discount and elevation

```text
CASHIER                 SERVER                 MANAGER
   |                       |                      |
   |-- request discount above 10% -------------->|
   |                       |                      |
   |<-- approval required / authorize operation --|
   |                       |                      |
   |-- POST /auth/elevate ------------------------>|
   |   operation, entity_id, reason, credentials  |
   |<-- scoped token; expires in 60 seconds ------|
   |                                              |
   |-- submit protected operation with token ---->|
   |   server validates token and session         |
   |   transaction consumes token exactly once    |
   |   mutation + audit commit atomically          |
   |<-- success or canonical error ----------------|
```

The requestor remains the actor. The authorizer is recorded separately. A token cannot be reused for a different entity, operation, user, or expired session.

### 6.3 Delivery and cash on delivery

```text
DISPATCHER             DRIVER                 ACCOUNTANT
    |                     |                        |
    |-- assign dispatch ->|                        |
    |                     |-- PICKED_UP            |
    |                     |-- ON_THE_WAY           |
    |                     |-- DELIVERED            |
    |                     |-- collect COD          |
    |                     |   idempotent financial  |
    |                     |   transaction created  |
    |                     |                        |
    |                     |                        |-- reconcile
```

COD collection MUST create an auditable financial transaction linked to the dispatch. Duplicate collection requests with the same idempotency key and identical body MUST return the original result rather than create another financial entry.

### 6.4 Shift handover

The handover request includes:

```json
{
  "opening_float": 0,
  "closing_float": 0,
  "expected_cash": 0,
  "variance": 0,
  "denomination_breakdown": {}
}
```

Values above are illustrative only.

Requirements:

- The outgoing CASHIER initiates the handover.
- The system calculates or independently verifies the variance rather than trusting a client-supplied value.
- A variance greater than the configured tolerance requires authorized review.
- MANAGER signs the review; if unavailable, SHIFT_LEAD may witness the handover.
- A Shift Lead witnessed handover MUST be flagged `pending_manager_review=true`.
- MANAGER MUST review such a handover within 12 hours.
- The audit event MUST include both signatures, the verified variance, the applicable branch, and the request identifier.
- Duplicate handover submissions MUST be idempotent.

### 6.5 Real-time subscriptions

Example endpoint:

```text
wss://<host>/api/v1/realtime?channel=kitchen:HOT_LINE
```

Authenticate the connection using the supported secure WebSocket authentication mechanism. If a JWT is supplied during connection establishment, it MUST NOT be exposed through application, proxy, or analytics logs. Prefer an authenticated handshake or a short-lived, single-use connection ticket over a long-lived bearer token in a URL.

Example message:

```json
{
  "v": 1,
  "type": "KOT_NEW",
  "channel": "kitchen:HOT_LINE",
  "timestamp": "ISO-8601 UTC timestamp",
  "payload": {}
}
```

Channel access:

- CHEF: assigned kitchen station.
- SOUS_CHEF: all permitted kitchen stations.
- BARTENDER: BAR station only.
- SERVER: assigned floor zone.
- HOST: authorized floor channels for the branch.
- CLEANER: assigned cleaning zone.
- DRIVER: own assigned delivery work.
- DISPATCHER: authorized delivery queue for the branch.
- MANAGER, SHIFT_LEAD, OWNER: only the floor and operational channels explicitly allowed by policy.

The server MUST authorize every subscription and MUST revalidate active sessions and relevant permissions. Events MUST NOT include fields that subscribers are not authorized to read.

### 6.6 Customer Kiosk Ordering Flow

```
KIOSK TERMINAL        CUSTOMER-AUTH       ORDER SERVICE       KITCHEN/KDS
      |                      |                  |                   |
      |-- provisioned login->|                  |                   |
      |<-- terminal session -|                  |                   |
      |-- read published menu ----------------->|                   |
      |<-- menu and prices ---------------------|                   |
      |-- validate coupon --------------------->|                   |
      |<-- eligible discount / rejection -------|                   |
      |-- submit order + Idempotency-Key ------>|                   |
      |                                         |-- validate branch  |
      |                                         |-- recalculate tax  |
      |                                         |-- validate prices  |
      |                                         |-- create order --->|
      |<-- order token and status --------------|                   |
      |                                         |                   |-- prepare
      |-- read own order status --------------->|                   |
```

Requirements:

- The kiosk MUST use customer-terminal authentication rather than staff login.
- The server MUST validate published item availability and current pricing during submission.
- Coupon eligibility and discount amounts MUST be calculated server-side.
- The server MUST calculate tax using the branch's authoritative `BranchTaxConfig`.
- An order MUST be persisted before the kiosk displays a confirmed order token.
- Order creation MUST be idempotent and must not create duplicate orders when a request is retried.
- Kiosk orders MUST enter the existing order and kitchen workflow through the authorized order service.
- Customer-terminal authentication MUST NOT grant KDS, staff, finance, or administrative permissions.
- Payment confirmation MUST come from an authorized payment provider or an explicitly authorized counter-settlement workflow. A simulated UPI QR or card interaction MUST NOT mark an order as paid.
- The order token MUST be unguessable or cryptographically protected, short-lived where appropriate, and restricted to the minimum status information required by the customer.

### 6.7 Offers Board and Promotions Flow

```
OFFERS BOARD         PUBLIC/TERMINAL API       PROMOTION SERVICE
      |                       |                       |
      |-- load published data>|                       |
      |                       |-- retrieve active --->|
      |                       |   promotions/menu     |
      |                       |<-- eligible public ---|
      |<-- sanitized payload -|    display data       |
      |                       |                       |
      |-- refresh periodically|                       |
```

Requirements:

- The board MUST display only published, branch-authorized menu items and active public promotions.
- Promotion start/end times MUST use the configured business timezone and effective-date rules.
- Expired, disabled, or unpublished offers MUST NOT be displayed as active.
- Public display data MUST exclude internal cost, staff details, private customer information, and administrative metadata.
- The board's preparation-time estimate MUST be a published, sanitized estimate rather than an unrestricted KDS subscription.
- Carousel timing, pause/resume, and fullscreen controls MAY be client-side presentation features.
- The board MUST NOT require a staff session merely to display public offers.
- Any branch-specific private configuration MUST require a provisioned, read-only terminal session.

## 7. Data Manipulation Rules and Constraints

### 7.1 Field-level DTO allowlists

The server MUST define explicit writable and readable fields for each role and entity. It MUST NOT accept arbitrary client-supplied entity objects or rely only on stripping a few known forbidden fields.

| Role | Entity | Restricted or forbidden fields |
|---|---|---|
| CASHIER | `MenuItem` | `price`, `cost`, `available` |
| CASHIER | `PosTicket` | Submitted item prices; payment method after payment |
| CHEF | `MenuItem` | `price`, `category`, `description` |
| CHEF | `PosTicket` | `payment_status`, `discount`, `total` |
| SOUS_CHEF | `MenuItem` | `available` |
| SERVER | `PosTicket` | `payment_method`, `discount`, `total` |
| SERVER | `Order` | `completed_at`, `payment_id` |
| HOST | `CustomerProfile` | `email`, `order_history`, `lifetime_value`, `payment_methods` |
| DRIVER | `CustomerProfile` | `email`, `order_history`, `lifetime_value`, `payment_methods` |
| DRIVER | `Dispatch` | Cannot change assignment away from self, `branch_id`, or `fee` |
| DISPATCHER | `Dispatch` | `fee` |
| ACCOUNTANT | `StaffMember` | `salary`, `hourly_rate`, `bank_account` unless a separately authorized payroll-read DTO permits the necessary fields |
| ACCOUNTANT | `MenuItem` | All mutation fields |
| MANAGER | `MenuItem` | Direct `price` mutation; proposal only |
| CLEANER | `DiningTable` | All fields except an allowed status transition |
| TRAINEE | All entities | Same field restrictions as `target_role`, plus forced training isolation |

Field allowlists MUST be enforced on both create and update operations. Nested objects, arrays, relation identifiers, computed totals, and ownership fields MUST be independently validated.

Sensitive response fields MUST be omitted or masked server-side. Hiding fields in the frontend is not an authorization control.

### 7.2 Mandatory reason fields

A non-empty, validated reason is required for:

| Action | Roles |
|---|---|
| Discount above the actor's self-approval ceiling | Actor and authorizer, where applicable |
| Refund or void | SHIFT_LEAD, MANAGER, OWNER |
| Menu price change | OWNER |
| Menu availability changed to sold out | CHEF, BARTENDER, MANAGER, OWNER |
| Inventory adjustment | MANAGER, OWNER |
| Waste movement above ₹2,000 | CHEF, BARTENDER, MANAGER, OWNER |
| Manual finance transaction | ACCOUNTANT, OWNER |
| Purchase-order approval | MANAGER, OWNER |
| Force-clear table | SHIFT_LEAD, MANAGER, OWNER |
| Cancel order after `READY` | MANAGER, OWNER |
| Role change | OWNER |
| Settings mutation | OWNER |
| Elevation issuance | Authorizer |
| Shift handover with variance | CASHIER, reviewing manager or witness |
| Training write | TRAINEE |

Missing or invalid reasons MUST return `422 VALIDATION_ERROR` with a field-specific error. The reason MUST be included in the audit event and MUST NOT be allowed to override authorization or state-transition constraints.

### 7.3 State-transition guards

The following are the permitted business transitions. Each transition is subject to role permissions, current entity version, and applicable business rules.

**Order**

```text
New → Accepted → Preparing → Ready → Served → Completed
                         └→ Cancelled
```

Cancellation after `Ready` requires MANAGER or OWNER authorization. SHIFT_LEAD may cancel only through `Ready`, subject to the exact current state and applicable policy.

**POS ticket**

```text
Draft → Submitted → PartiallyPaid → Paid → Settled
  ├→ VoidRequested → Voided
  └→ RefundRequested → RefundApproved → Refunded
```

- Voiding a submitted ticket requires the applicable MANAGER or OWNER approval.
- Refund ceilings: SHIFT_LEAD up to ₹5,000; MANAGER up to ₹15,000; OWNER above that.
- The backend MUST enforce approval limits against the full refund amount, including cumulative partial refunds.
- A ticket MUST NOT be refunded beyond its refundable amount.
- Financial reversals MUST be recorded as separate immutable records.

**Split tickets and settlement**

- A parent ticket's settlement status MUST be derived from its children.
- The parent may be `Completed` only when every child is `Paid` or `Voided`.
- A partial payment MUST NOT mark the full parent settled.
- Every payment and settlement operation MUST be idempotent.

**Table**

```text
Available → Reserved → Seated → Ordering → Dining
                                         → NeedsCleaning → Available

Reserved → NoShow
```

Only the roles authorized for the relevant transition may perform it. HOST may manage permitted reservation and seating transitions; SERVER may hand off a dining table to cleaning; CLEANER completes cleaning. Force-clear is a separate privileged operation requiring a reason.

**Kitchen order**

```text
New → InProgress → Ready → Bumped
                         └→ Unbumped
```

Only MANAGER or OWNER may unbump, with a reason, within 60 seconds of the original bump. The server MUST verify the original event time rather than trust the client clock.

**Dispatch**

```text
Queued → Preparing → ReadyForPickup → PickedUp → OnTheWay → Delivered
                                   └→ Failed
```

The driver reports failure with a reason. Reassignment is a dispatcher/manager operation and MUST preserve an auditable assignment history.

**Purchase order**

```text
Draft → PendingApproval → Approved → Ordered
                                      → PartiallyReceived → Received
```

Approvals MUST enforce the purchase-order ceiling, tenant/branch ownership, and separation of duties where configured.

**Reservation**

```text
Requested → Confirmed → Arrived → Seated → Completed
               └→ Cancelled
                         └→ NoShow
```

Only authorized roles may perform each transition. Deposit overrides require MANAGER or OWNER.

**Stock movement**

```text
POSTED | PENDING_REVIEW | REJECTED | REVERSED
```

Stock movement approval and reversal MUST preserve the original record and a complete history of decisions. A posted movement MUST NOT be edited in place; corrections require an auditable reversal and, where necessary, a replacement movement.

Invalid transitions MUST return `403 TRANSITION_FORBIDDEN` with the current state and permitted next states where disclosure is safe.

### 7.4 Immutable audit requirements

Every successful mutation and every protected PII read MUST produce an audit record. Authentication failures, lockouts, session revocations, elevation lifecycle events, role changes, and security-sensitive denials MUST also be recorded.

```ts
type AuditEvent = {
  event_id: string;
  timestamp: string;              // ISO-8601 UTC
  actor_id: string;
  actor_role: Role;
  authorized_by?: string;
  elevation_token_id?: string;
  branch_id: string;
  restaurant_id: string;
  module: string;
  entity: string;
  entity_id: string;
  action: string;
  before: object | null;
  after: object | null;
  reason: string | null;
  is_training: boolean;
  channel: "web" | "pos" | "kds" | "mobile" | "api";
  ip_address: string;
  user_agent: string;
  device_id: string;
  request_id: string;
  prev_hash: string;
  this_hash: string;
};
```

Requirements:

- Audit events MUST be append-only.
- No application role, including OWNER, may delete or rewrite existing audit events.
- Audit storage MUST be protected against unauthorized modification and deletion.
- Hash chaining MUST use a documented canonical serialization and cryptographic hash algorithm.
- Hash-chain verification MUST detect alteration, deletion, and insertion within the protected chain.
- The implementation MUST define concurrency-safe chain ordering and recovery behavior. A hash chain alone does not protect against an attacker who can rewrite the entire chain and its trusted checkpoint.
- Audit persistence MUST be atomic with protected mutations when both use the same transactional database.
- Secrets, plaintext PINs, passwords, bearer tokens, and full payment credentials MUST never be stored in audit payloads.
- Audit records MUST minimize unnecessary PII while preserving the evidence needed for accountability.
- Read access to audit records is role-scoped: OWNER across the tenant; MANAGER within the authorized branch; ACCOUNTANT for finance-scoped events; SHIFT_LEAD only where explicitly allowed and without unrestricted PII.

Required event types include:

`AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_FAILED`, `AUTH_LOCKOUT`, `ELEVATION_ISSUED`, `ELEVATION_REVOKED`, `ELEVATION_CONSUMED`, `READ_PII`, role changes, session revocations, and every successful create/update/delete/status mutation.

PII reads MUST be audited for operational roles that access customer profiles or financial records. The default policy is 100% audit coverage for DRIVER, HOST, SERVER, and CASHIER customer-profile reads. ACCOUNTANT billing-read sampling may be 10% only where legally permitted and approved by the data-governance policy; security-sensitive financial PII reads SHOULD be audited at 100%. Sampling MUST NOT be used to omit required statutory or security audit events.

### 7.5 Tenant and branch enforcement

Tenant and branch scope MUST be enforced at the repository/service boundary, not only in controllers.

Every resource identifier accepted from a request MUST be resolved through a tenant-scoped lookup. Nested records MUST be checked against the same tenant and the authorized branch. Client-supplied tenant IDs MUST NOT be trusted.

### 7.6 Optimistic locking

Every mutable business entity MUST carry a monotonically increasing `version`.

All `PATCH` and `PUT` operations MUST require `If-Match: <version>`. The server MUST atomically compare the supplied version with the current version before writing.

A version mismatch MUST return `409 CONFLICT`, including `current_version` and an appropriately authorized representation of the current record.

Versioned entities:

- `PosTicket`
- `PosTicketItem`
- `Order`
- `TableSession`
- `KitchenTicket`
- `Dispatch`
- `StockItem`
- `StockMovement` while mutable
- `PurchaseOrder`
- `Reservation`
- `MenuItem`
- `Recipe`
- `EquipmentAsset`
- `FinancialTransaction` while mutable
- `CustomerProfile` while mutable

Append-only entities, including `AuditEvent`, immutable financial reversal records, consumed elevation records, and posted stock movements, MUST NOT be updated in place.

The exact semantics for version conflicts MUST be documented in the OpenAPI contracts. The server MUST NOT silently overwrite a conflicting update.

### 7.7 Idempotency

All POST requests that create financial or stock side effects MUST require `Idempotency-Key` containing a valid unique request key.

Required endpoints:

- `POST /pos/tickets/:id/pay`
- `POST /pos/tickets/:id/refund`
- `POST /finance/transactions`
- `POST /finance/transactions/:id/reverse`
- `POST /suppliers/orders`
- `POST /delivery/dispatches/:id/collect-cash`
- `POST /stock-movements`

The key MUST be scoped to the authenticated tenant and requestor, with endpoint and entity scope included where appropriate. The idempotency record MUST be retained for at least 24 hours.

Replay behavior:

- Same key and same canonical request body, with prior success: return the original successful result with `Idempotency-Replayed: true`.
- Same key and a different request body: return `409 IDEMPOTENCY_CONFLICT`.
- Same key and a definitively failed transaction: retry may be allowed.
- A request whose commit outcome is unknown MUST be reconciled against the idempotency record before execution is repeated.

The idempotency record and protected side effect MUST be committed atomically where possible. Concurrent requests using the same key MUST NOT create duplicate side effects.

A new key MUST NOT permit a business-level duplicate payment, refund, COD collection, or stock movement when a separate business uniqueness constraint forbids it.

### 7.8 Soft deletion, erasure, and legal retention

| Entity class | Required policy |
|---|---|
| Financial transactions, invoices, refunds | Never delete; correct using immutable reversal records |
| Orders, tickets, dispatches | Soft-delete only where permitted; preserve financial and statutory references |
| Menu items, tables, recipes, equipment | Soft-delete; OWNER may hard-delete only when no protected references remain and retention policy permits |
| Customer PII | Support authenticated erasure requests; erase or anonymize only where legally permitted |
| Employee HR and payroll records | Apply the approved statutory and employment retention schedule |
| Audit | Never delete through application operations |
| Training data | Purge at shift end, subject to a documented cleanup and verification process |
| Records under legal hold | Retain and restrict disposition until the hold is released by an authorized process |

Customer erasure endpoint:

`POST /customers/:id/erasure-request`

The endpoint initiates an authorized erasure workflow; it MUST NOT assume every field can be erased immediately. Financial, tax, fraud-prevention, litigation, and other legally required records may require continued retention.

Where cryptographic erasure is used, the design MUST specify key isolation, key destruction, backup treatment, derived-data handling, and verification. Nulling selected fields and retaining a salted hash is not, by itself, proof that all copies of personal data have been erased.

## 8. Operational Contracts

### 8.1 Real-time transport

- WebSocket is used for KDS and floor events.
- Server-Sent Events (SSE) may be used for customer-facing or driver order tracking.
- The canonical realtime endpoint is `/api/v1/realtime`.
- Clients MUST send a ping every 30 seconds; the server replies with a pong.
- Messages MUST use a versioned envelope containing `v`, `type`, `channel`, `timestamp`, and `payload`.
- The server MUST authorize the user for every requested channel and event payload.
- The server MUST terminate or reauthorize connections when sessions expire, permissions change, devices are revoked, or users are disabled.
- Clients MUST reject unsupported protocol versions.
- If WebSocket connection attempts fail three times within 30 seconds, the client SHOULD switch to polling every five seconds until realtime connectivity is restored.
- Realtime delivery MUST NOT be treated as a substitute for authoritative API reads, optimistic locking, or idempotency.

### 8.2 Offline mode

| Surface | Required behavior during network loss |
|---|---|
| POS cart | Persist cart locally using IndexedDB; retry ticket submission using the same idempotency key |
| POS payment | Block payment; display `OFFLINE — retry when connected` |
| KDS | Display an offline banner; queue eligible bumps locally and replay with version validation |
| Floor | Cached read-only view; block write operations |
| Driver | Block unsafe writes; queue eligible status transitions only if they can be safely replayed with version checks |

Offline clients MUST NOT treat a locally queued operation as committed. The UI MUST distinguish pending, confirmed, rejected, and conflict states.

Offline data MUST be protected against unauthorized local access and cleared according to device/session policy. Sensitive customer data MUST NOT be retained in local caches beyond the approved retention period.

### 8.3 Branch tax configuration

`POST /pos/calculate` MUST use the branch's authoritative `BranchTaxConfig`; tax rates MUST NOT be hardcoded in application logic.

Required behavior:

- Missing branch tax configuration: `422 CONFIG_MISSING`.
- Tax calculation MUST use the item's configured tax category and the applicable jurisdictional rules.
- `FOOD`, `ALCOHOL`, and `EXEMPT` are classification examples, not universal legal tax rates.
- Tax configuration MUST support applicable CGST/SGST and IGST treatment, exemptions, effective dates, rounding rules, and state-specific requirements.
- Historical invoices MUST retain the tax configuration and calculation details applicable at issuance.
- Changes to tax configuration MUST be permission-restricted, effective-dated, and audited.

### 8.4 Device registration

Operational terminals MUST be registered before normal staff operations.

Registration endpoint:

`POST /auth/register-device`

Registration records include:

```ts
type RegisteredDevice = {
  device_id: string;
  name: string;
  role_hint?: Role;
  branch_id: string;
  ip_allowlist?: string[];
};
```

OWNER or MANAGER authorization is required to approve a terminal.

Requirements:

- The server MUST issue or verify the device identifier; clients MUST NOT be able to impersonate a registered terminal by choosing another device's ID.
- Operational sessions MUST match a registered, active device assigned to the authorized branch.
- Browser fingerprints alone MUST NOT be treated as strong hardware identity.
- Device revocation MUST terminate relevant sessions and realtime connections.
- Device registration and rotation MUST be audited.
- IP allowlists are supplementary controls, not a replacement for authentication or authorization.

### 8.5 Migration and bootstrap framework

Schema migration metadata:

```text
schema_migrations(
  version,
  applied_at,
  checksum
)
```

Migration files:

```text
backend/src/apps/<app>/migrations/<NNN>__<name>.ts
```

Each migration MUST expose an `up` operation and, where safe, a corresponding `down` operation.

Requirements:

- Migration versions MUST be ordered and unique.
- Checksums MUST detect unexpected changes to applied migrations.
- Migrations MUST run transactionally where supported by the database.
- The migration runner MUST prevent concurrent processes from applying the same migration.
- Rollback is supported for the last three migrations only when the relevant rollback is explicitly safe and tested.
- Destructive or data-loss migrations MUST require an approved backup and recovery plan.
- Production migrations SHOULD follow an expand-and-contract approach for deployments with independently updated clients or multiple application instances.
- SQLite and PostgreSQL differences MUST be addressed explicitly; PostgreSQL-only schema behavior MUST NOT be assumed to work in SQLite.

Bootstrap requirements:

- The first OWNER MUST be created through a controlled bootstrap flow.
- Bootstrap MUST generate a cryptographically secure initial credential and deliver it through a secure, documented mechanism.
- Production MUST refuse automatic demo seeding.
- `NODE_ENV=production` with `SEED_ALLOWED=false` MUST prevent ordinary seed-password creation.
- An empty production database MUST NOT silently become an unsecured application.
- The emergency OWNER recovery procedure MUST be documented as an out-of-band, authenticated operational procedure.
- Bootstrap and recovery MUST be auditable and MUST NOT log plaintext credentials.
- The application MUST fail safely if no valid OWNER exists and no authorized bootstrap/recovery process is available.

## 9. India-Specific Compliance

### 9.1 Digital Personal Data Protection Act

The implementation MUST support applicable data-protection obligations, including purpose limitation, appropriate consent management where consent is the applicable legal basis, data minimization, security safeguards, rights handling, and lawful retention.

Consent event model:

```ts
type CustomerConsentEvent = {
  customer_id: string;
  purpose: string;
  granted: boolean;
  timestamp: string;
  source: string;
  ip?: string;
  user_agent?: string;
};
```

Supported purposes may include `TRANSACTIONAL`, `MARKETING`, and `ANALYTICS`. These labels MUST be mapped to a documented purpose and lawful-processing policy rather than treated as interchangeable consent categories.

Consent changes MUST be auditable and MUST NOT silently overwrite previous consent events.

Customer erasure requests MUST be authenticated, authorized, tracked, and evaluated against applicable statutory retention and legal obligations. An erasure request is not a blanket authorization to delete financial or statutory records.

The implementation MUST be reviewed against the DPDP Act 2023 and the rules and commencement provisions applicable at the time of deployment. This document does not independently establish legal compliance.

### 9.2 GST invoicing

`FinancialTransaction` and invoice records MUST retain the invoice number, financial year, branch, applicable tax configuration, and issuance state.

Requirements:

- Invoice-number allocation MUST be concurrency-safe.
- The numbering policy MUST be configured to meet applicable GST requirements for the relevant document type and jurisdiction.
- Where gapless allocation is a business requirement, the sequence MUST be allocated transactionally and cancelled numbers MUST remain marked void rather than being reused.
- A universal gapless-numbering requirement MUST NOT be assumed for every statutory document without legal verification.
- Intra-state and inter-state tax treatment MUST follow applicable GST rules.
- Historical invoice tax calculations MUST remain reproducible.
- Invoice cancellation and correction MUST preserve the original record and the applicable statutory audit trail.

### 9.3 FSSAI

The `Branch` entity MUST support:

- `fssai_license_number`
- `fssai_valid_until`

Authorized branch reads MUST return the applicable licence information.

Where applicable, the receipt template MUST print the required FSSAI licence number and GSTIN. A nightly scheduled process SHOULD notify authorized management users when a licence is due to expire within 30 days.

Receipt and licence behavior MUST be configurable for the business and legal requirements applicable to the branch.

### 9.4 PII and record retention

The following are default product-policy targets and MUST be reconciled with the applicable legal retention requirements before production deployment:

| Record category | Default policy |
|---|---|
| Customer PII | Retain for up to three years after the last order, unless an applicable legal basis requires a different period |
| Employee HR records | Default seven-year post-termination retention, subject to applicable statutory requirements |
| Audit records | Default eight-year retention, subject to applicable statutory requirements |

Retention policies MUST specify the start date, exceptions, legal-hold behavior, deletion workflow, backup expiry, and verification evidence.

The system MUST NOT automatically erase records subject to a valid legal hold or mandatory retention obligation. It MUST also not retain personal data indefinitely solely because it is technically convenient.

## 10. Escalation and Conflict Resolution

| Trigger | Escalation path | Target response |
|---|---|---|
| Cashier discount above 10% | CASHIER → eligible SHIFT_LEAD or MANAGER authorization; OWNER for amounts above MANAGER ceiling | Immediate |
| Refund above ₹5,000 | SHIFT_LEAD up to ₹5,000 → MANAGER up to ₹15,000 → OWNER above ₹15,000 | Immediate |
| Feedback below 3 stars | SERVER → SHIFT_LEAD → MANAGER → OWNER | 2h / 4h / 24h targets respectively |
| Purchase order above ₹50,000 | MANAGER → OWNER | 4h target |
| Waste above ₹2,000 | CHEF/BARTENDER → review queue → MANAGER; OWNER above ₹10,000 | 24h target |
| Low stock or expiry | System → MANAGER → OWNER digest | Daily |
| Equipment breakdown | CHEF/CLEANER/SOUS_CHEF → MANAGER → OWNER for repairs above ₹50,000 | 24h target |
| Repeated authentication failures | Security alert → OWNER | Immediate |
| Payment reconciliation mismatch | ACCOUNTANT → MANAGER → OWNER | End of business day |
| Cash drawer variance above tolerance | CASHIER → MANAGER and ACCOUNTANT as required | End of shift |
| Shift handover variance above ₹500 | CASHIER → SHIFT_LEAD witness → MANAGER review | End of shift; manager review within 12h |

These are operational targets, not guarantees that a notification or resolution occurs automatically. Alert delivery, retries, escalation timers, and breach tracking MUST be defined in the operational contracts.

Conflicting permissions MUST be resolved by the more restrictive applicable constraint. A broad module permission MUST NOT override a field restriction, approval ceiling, tenant boundary, state-transition guard, legal hold, or immutable-record rule.

## 11. Frontend Permission Synchronization

`GET /auth/permissions` MUST return:

```json
{
  "permissions": [],
  "permissions_version": 0,
  "role": "SERVER",
  "target_role": null,
  "pii_access": false,
  "is_training": false
}
```

The example illustrates the response shape only. Actual values MUST come from the authenticated session.

Requirements:

- The frontend MAY cache permissions for navigation and display, but the backend MUST enforce every authorization decision.
- Route guards MUST be refreshed when the session changes.
- When role, branch, scope, or permissions change, the server SHOULD emit `permissions:changed` to the affected active sessions.
- The frontend MUST invalidate its cached permission set and fetch the current permissions after receiving that event.
- If the API returns `401 SESSION_STALE`, the frontend MUST attempt one refresh-and-retry cycle for an eligible, safe request.
- The frontend MUST NOT automatically replay a non-idempotent mutation after a stale-session response unless its idempotency and commit-status contract guarantees safe replay.
- If refresh fails, the session is revoked, or the second request is stale, the frontend MUST clear the local authenticated state and require reauthentication.
- Permission synchronization failure MUST fail closed for privileged operations.
- Unknown role-specific routes MUST NOT fall back to a more privileged role's interface.

The detailed retry, timeout, and compatibility behavior MUST be specified in the API contracts.

## 12. Endpoint Index

The following endpoints are part of the RBAC and operational interface. This is not the complete OpenAPI inventory.

| Endpoint | Purpose | Authorized roles or constraints |
|---|---|---|
| `POST /auth/login` | Authenticate | All configured roles |
| `POST /auth/refresh` | Rotate session credentials | All authenticated session types |
| `POST /auth/switch-branch` | Change active branch | OWNER, MANAGER, ACCOUNTANT within authorized scope |
| `POST /auth/elevate` | Request operation-bound elevation | Eligible requestor and authorized authorizer |
| `POST /auth/pin-reset` | Rotate a PIN | OWNER, MANAGER, subject to §2.5.3 |
| `POST /auth/sessions/revoke` | Revoke sessions | OWNER, MANAGER within authorized scope |
| `GET /auth/lockout-status` | Inspect or unlock lockouts | OWNER, MANAGER |
| `GET /auth/permissions` | Read effective permissions | All roles |
| `POST /auth/register-device` | Register an operational terminal | OWNER, MANAGER |
| `POST /pos/tickets` | Create POS ticket | Authorized POS roles |
| `POST /pos/tickets/:id/pay` | Pay ticket | Authorized cashier/approval flow; idempotency required |
| `POST /pos/tickets/:id/discount-override` | Apply a privileged discount | Authorized POS role and valid elevation where required |
| `POST /pos/tickets/:id/refund` | Initiate refund | SHIFT_LEAD, MANAGER, OWNER within ceilings |
| `POST /pos/calculate` | Calculate tax and totals | Authorized POS caller; requires branch tax configuration |
| `PATCH /kitchen/tickets/:id/items/:itemId/unbump` | Undo a bump | MANAGER, OWNER; reason and 60-second limit |
| `PATCH /tasks/:id/complete` | Complete an operational task | Authorized task role |
| `PATCH /delivery/drivers/me/status` | Update own shift status | DRIVER |
| `POST /delivery/dispatches/:id/assign` | Assign a driver | DISPATCHER and authorized management roles |
| `POST /delivery/dispatches/:id/collect-cash` | Record COD collection | DRIVER assigned to dispatch; idempotency required |
| `POST /tables/:id/reserve` | Reserve a table | HOST, SERVER where permitted, MANAGER, OWNER |
| `POST /tables/:id/seat` | Seat a party | HOST and other explicitly authorized roles |
| `POST /tables/waitlist` | Create waitlist entry | HOST |
| `POST /reservations/:id/check-in` | Check in a reservation | HOST and authorized roles |
| `POST /orders/:id/partial-pay` | Apply partial settlement | CASHIER, MANAGER, OWNER; idempotency required |
| `POST /orders/:id/settle-external` | Confirm an eligible external settlement | CASHIER, MANAGER, OWNER; required financial safeguards |
| `PATCH /menu/items/:id/price-proposal` | Submit a price proposal | MANAGER; OWNER approval required |
| `POST /staff/attendance/clock` | Record attendance clock action | Authorized staff member |
| `POST /staff/shift-handover` | Record drawer handover | CASHIER, SHIFT_LEAD, MANAGER |
| `POST /finance/transactions` | Create a finance entry | ACCOUNTANT, OWNER; manual entries require reason and source |
| `POST /finance/transactions/:id/reverse` | Reverse a financial transaction | ACCOUNTANT, OWNER; idempotency required |
| `POST /customers/:id/erasure-request` | Initiate customer erasure review | OWNER, ACCOUNTANT, subject to retention and legal-hold policy |

Every endpoint MUST have a corresponding OpenAPI operation specifying request DTOs, response DTOs, authentication, authorization, status codes, canonical errors, idempotency, versioning, and examples.

An endpoint appearing in this index does not imply that its implementation already exists.

## 13. Implementation Acceptance Criteria

A module MUST NOT be considered RBAC-complete until the following checks pass:

1. Authentication rejects invalid, expired, revoked, and stale sessions.
2. Tenant isolation is enforced for every direct and nested record lookup.
3. Branch restrictions are enforced for reads, writes, exports, and realtime subscriptions.
4. Role and field allowlists are tested against both permitted and forbidden fields.
5. Approval ceilings are enforced server-side, including cumulative refunds and repeated requests.
6. Elevation tokens are single-use, operation-bound, entity-bound, session-bound, authorizer-bound, and atomically consumed.
7. Session revocation and role changes invalidate relevant access and outstanding elevation tokens.
8. Invalid state transitions are rejected without partial mutation.
9. Optimistic-lock conflicts cannot silently overwrite newer data.
10. Idempotency tests demonstrate safe replay and prevention of duplicate side effects.
11. Audit failures cannot leave protected mutations committed without required audit evidence.
12. PII visibility and PII-read audit coverage are tested for every role with customer or financial access.
13. Training writes cannot mutate production data or trigger real financial/external side effects.
14. Realtime events do not leak unauthorized fields or continue after revocation.
15. Offline queues distinguish pending operations from committed operations.
16. Migrations, bootstrap, backup recovery, and database-provider differences are tested.
17. Retention, erasure, and legal-hold workflows preserve records that must not be deleted.
18. Each implemented endpoint has an RBAC acceptance test and documented API contract.

## 14. Summary

- **14 roles:** OWNER, MANAGER, SHIFT_LEAD, CASHIER, CHEF, SOUS_CHEF, SERVER, HOST, DRIVER, DISPATCHER, ACCOUNTANT, CLEANER, BARTENDER, TRAINEE.
- **Discount ceilings:** CASHIER 10%, SHIFT_LEAD 15%, MANAGER 25%, OWNER subject to applicable policy and legal controls.
- **Refund ceilings:** SHIFT_LEAD ₹5,000, MANAGER ₹15,000, OWNER above ₹15,000.
- **Waste policy:** CHEF/BARTENDER movements up to ₹2,000 may auto-post; higher movements require review, with OWNER approval above ₹10,000.
- **Tenancy:** Session-derived tenant and branch scope; deprecated headers cannot grant access.
- **Elevation:** 60-second, single-use, operation/entity/requestor/authorizer-bound token with atomic consumption.
- **Integrity:** Optimistic locking, idempotency, guarded state transitions, immutable financial reversals, and audit records.
- **PII:** Server-enforced field restrictions, purpose-aware access, and auditable reads.
- **Operations:** Realtime channel authorization, safe offline behavior, device registration, and versioned migrations.
- **Compliance:** Configurable retention, lawful erasure, GST/FSSAI support, and India-specific legal review.

**Status:** This document defines the RBAC and operational access-control baseline. It does not claim that the entire backend is implementation-complete. The entity schema, complete OpenAPI definitions, canonical error registry, cross-cutting contracts, disaster recovery procedures, and comprehensive RBAC test matrix remain separate deliverables.
| `POST /customer-auth/initialize` | Provision a customer-facing terminal | Authorized provisioning flow only |
| `POST /customer-auth/session` | Create a terminal session | Provisioned KIOSK or OFFERS_BOARD |
| `POST /customer-auth/refresh` | Rotate terminal session credentials | Valid terminal session |
| `POST /customer-auth/logout` | Revoke terminal session | Own terminal session or authorized administrator |
| `GET /customer-auth/config` | Read allowed terminal configuration | Valid terminal session |
| `GET /customer/menu` | Read published menu data | Public endpoint or authorized customer terminal |
| `GET /customer/promotions` | Read active public promotions | Public endpoint or authorized customer terminal |
| `POST /customer/coupons/validate` | Validate a coupon for a proposed cart | Customer-terminal session |
| `POST /customer/orders` | Create a kiosk order | KIOSK session; idempotency required |
| `GET /customer/orders/:token/status` | Read the corresponding guest order status | Valid order-scoped token or authorized terminal session |
