# Rift ERP — Specification Gap Analysis and Implementation Readiness

> Companion review for `dataflowrules.md` v2.
>
> This document distinguishes the RBAC specification from the complete backend implementation contract. It identifies remaining decisions, required companion documents, and implementation gates.
>
> **Status:** The RBAC baseline is substantially specified. Full implementation readiness must be demonstrated through schemas, endpoint contracts, error definitions, cross-cutting contracts, security tests, and operational verification.

## 1. Purpose

The purpose of this document is to prevent the team from treating a comprehensive role matrix as a complete backend design.

The current RBAC specification defines:

- Fourteen staff roles and their operational responsibilities.
- Authentication and session rules.
- Tenant and branch isolation.
- Field-level restrictions and approval ceilings.
- Elevation-token controls.
- State transitions and financial integrity requirements.
- Audit, realtime, offline, migration, and retention expectations.

It does not independently define every database field, endpoint DTO, HTTP error, infrastructure dependency, or operational recovery procedure required to implement every module without further design decisions.

## 2. P0 — Required Before Implementing the Affected Module

### 2.1 Canonical error registry

**Gap:** Error codes and HTTP statuses are referenced in multiple sections without a single machine-readable source of truth.

**Required artifact:** `backend/src/core/errors.registry.ts`, with a corresponding human-readable `errors.registry.md`.

Every error definition MUST include:

- Stable error code.
- HTTP status.
- Human-readable message.
- Structured details schema.
- Whether the operation can be retried.
- Whether the error reveals resource existence.
- Whether the error is safe to expose to the client.
- A stable mapping to frontend handling.

At minimum, define the codes already referenced by the specification:

- `SESSION_STALE`
- `APPROVAL_REQUIRED`
- `DEVICE_UNREGISTERED`
- `TRAINING_MODE`
- `CONFIG_MISSING`
- `TRANSITION_FORBIDDEN`
- `CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `VALIDATION_ERROR`

The implementation MUST also define authentication, authorization, rate-limit, not-found, malformed-request, unavailable-dependency, and internal-server errors.

Error codes MUST be imported from the canonical registry rather than copied as unvalidated string literals throughout the application.

### 2.2 Entity schema and ERD

**Gap:** The RBAC document references entities and relationships without defining their complete structures.

**Required artifact:** `schema.md`, supported by versioned database migrations.

For every entity, document:

- Field names and types.
- Nullability and defaults.
- Primary and foreign keys.
- Unique constraints.
- Tenant and branch ownership.
- Indexes.
- Version fields.
- Soft-delete fields.
- Creation and modification timestamps.
- Retention classification.
- PII classification.
- Permitted state transitions.
- Referential-integrity rules.
- Database-specific behavior for SQLite and PostgreSQL.

The schema MUST cover at least users, sessions, devices, branches, customers, orders, POS tickets, ticket items, payments, refunds, financial transactions, stock items, stock movements, reservations, tables, kitchen tickets, dispatches, staff, attendance, shift handovers, audit events, elevation tokens, consent events, tax configuration, migrations, and training data.

### 2.3 OpenAPI endpoint contracts

**Gap:** The endpoint index is not a substitute for complete API contracts.

**Required artifact:** `openapi/*.yaml`, organized by module.

Every operation MUST specify:

- Method and path.
- Authentication requirements.
- Permission requirements.
- Path, query, and header parameters.
- Request schema.
- Response schema.
- Success and error status codes.
- Canonical error codes.
- Version and idempotency requirements.
- Required reason fields.
- Approval and elevation behavior.
- Tenant and branch scope.
- Examples.
- Pagination and filtering behavior where applicable.

The published API contract MUST match the implementation. An endpoint MUST NOT be described as implemented merely because it appears in the endpoint index.

### 2.4 Bootstrap and emergency recovery

**Gap:** Initial OWNER creation and recovery after loss of all owner credentials need an explicit operational procedure.

**Required artifact:** `bootstrap.md`.

It MUST define:

- First-run detection.
- Initial OWNER creation.
- Credential generation and delivery.
- Mandatory initial credential rotation.
- Prevention of insecure production seeding.
- Recovery when the database is empty or all OWNER accounts are inaccessible.
- Audit evidence for bootstrap and recovery.
- Safe behavior when bootstrap is incomplete.
- Recovery-key storage and rotation.
- Backup restoration prerequisites.

Emergency recovery MUST be an authenticated out-of-band procedure, not an unauthenticated public endpoint or an undocumented environment-variable shortcut.

### 2.5 Role-transition cleanup

**Gap:** Promotion, demotion, suspension, and branch reassignment can invalidate existing operational state.

**Required behavior for role changes:**

1. Verify the actor's authorization and any required confirmation.
2. Validate the new role and target scope.
3. Identify incompatible open tickets, shifts, dispatch assignments, and approvals.
4. Apply explicit reassign, close, or retain policies to those records.
5. Revoke sessions and outstanding elevation tokens as required.
6. Increment `permissions_version`.
7. Emit permission-change notifications.
8. Audit the old role, new role, scope changes, reason, and resulting actions.

The implementation MUST NOT silently transfer financial ownership or discard an open shift.

A role-change endpoint and any secondary confirmation flow MUST be defined in OpenAPI before the behavior is implemented.

### 2.6 Permission-version retry contract

**Gap:** A stale permission response needs a deterministic frontend and backend recovery contract.

**Required behavior:**

- Return `401 SESSION_STALE` when a protected request uses an outdated permission version.
- Permit one eligible refresh-and-retry cycle.
- Do not automatically replay a non-idempotent operation unless safe replay is guaranteed.
- If refresh fails or the retried request remains stale, clear local authentication state and require reauthentication.
- Do not allow cached frontend permissions to authorize backend operations.

The retry contract MUST specify refresh-token rotation, revoked-session behavior, and treatment of unknown mutation outcomes.

### 2.7 Elevation-token revocation

**Gap:** Token validity must depend on the continued authorization of both the requestor and authorizer.

**Required behavior:**

- Revoke or invalidate outstanding tokens after authorizer session revocation.
- Invalidate tokens after role, permission, branch-scope, or account-status changes that affect approval authority.
- Reject expired or previously consumed tokens.
- Bind tokens to the exact operation, entity, requestor, and authorizer.
- Atomically consume a token with the protected mutation.
- Prevent concurrent token reuse.
- Audit issuance and consumption without logging the token secret.

## 3. P1 — Required Before Pilot

### 3.1 API rate-limit matrix

Define rate limits by endpoint, user, tenant, IP, device, and risk category.

At minimum, cover:

- Login and PIN verification.
- Refresh and elevation.
- POS calculations.
- Reports and exports.
- Customer search.
- Reservation creation.
- Realtime connection attempts.
- Webhook ingestion and delivery.
- Bulk operations.

Document response codes, retry headers, distributed rate-limit storage, trusted proxy handling, and exceptions for legitimate POS bursts.

### 3.2 Bulk-operation contract

Define supported bulk endpoints and their semantics.

For each bulk operation, specify:

- Maximum item count.
- Per-item authorization.
- Atomic versus partial-success behavior.
- Validation and error reporting.
- Version checks.
- Idempotency.
- Audit granularity.
- Rate limits.
- Retry behavior.

The implementation MUST NOT assume that a permission to mutate one record grants permission to perform an unrestricted bulk mutation.

### 3.3 Pagination, filtering, sorting, and field selection

Establish a consistent list-endpoint contract.

Document:

- Cursor or page-based pagination.
- Default and maximum page size.
- Stable ordering.
- Allowed sort fields and directions.
- Allowed filter operators.
- Search semantics.
- Field-selection rules.
- Total-count behavior.
- Branch and tenant filtering.
- Consistency guarantees when data changes during pagination.

All filtering and sorting MUST be validated against allowlists. User-supplied SQL fragments or arbitrary field paths MUST NOT be accepted.

### 3.4 Delivery-aggregator webhooks

Define contracts for external delivery providers, including:

- HMAC signature verification.
- Timestamp validation and replay protection.
- Provider-specific event identifiers.
- Idempotent processing.
- Retry and exponential backoff.
- Dead-letter queue handling.
- Event ordering and deduplication.
- Secret rotation.
- Observability and operator recovery.

External webhook payloads MUST be treated as untrusted input. A provider event MUST NOT bypass tenant, branch, or order-state validation.

### 3.5 QR and kiosk ordering

The staff-role model does not cover unauthenticated customer ordering.

Before implementation, define a separate guest access model with:

- Table- or session-bound ordering tokens.
- Narrow resource scope.
- Expiration and revocation.
- Abuse prevention and rate limiting.
- Customer consent and privacy controls.
- Menu availability validation.
- Payment-provider boundaries.
- Order submission idempotency.
- Protection against access to staff APIs.

A guest ordering token MUST NOT function as a staff session or grant staff permissions.

### 3.6 Cross-branch customer search

ACCOUNTANT's cross-branch scope MUST NOT imply unrestricted customer PII access.

Define:

- Which billing fields are searchable.
- Which fields may be returned.
- Whether results are branch-filtered by default.
- Whether a business purpose must be provided.
- How search queries and PII reads are audited.
- How result counts and existence are protected from unauthorized disclosure.

Search and export paths MUST enforce the same field-level and tenant-level restrictions as direct record reads.

### 3.7 Legal hold

Define a legal-hold model for financial, operational, HR, and audit records.

It MUST specify:

- Who can place or release a hold.
- Required reason and supporting reference.
- Which entities and derived records are covered.
- How retention and erasure jobs honor a hold.
- How hold changes are audited.
- How conflicting holds are resolved.
- How backup and export copies are treated.

A legal hold MUST prevent destructive disposition of covered records until authorized release.

### 3.8 Backup and disaster recovery

Define the deployment-specific recovery strategy for SQLite and PostgreSQL.

Required elements:

- Backup frequency.
- Encryption and access controls.
- Backup retention.
- Recovery point objective (RPO).
- Recovery time objective (RTO).
- Database and audit-chain consistency.
- Restore procedures.
- Key recovery.
- Disaster recovery roles.
- Restore drills and evidence.
- Verification of idempotency and migration state after recovery.

Backup success MUST be verified. A completed backup job is not proof that the data can be restored.

### 3.9 Authorization observability

Define structured authorization decision logs with:

- Request ID.
- Actor ID and role.
- Tenant and branch identifiers.
- Module and action.
- Target entity type.
- Permission version.
- Decision outcome.
- Denial category.
- Elevation validation result.
- Device and channel.
- Correlation and trace identifiers.

Logs MUST NOT include plaintext credentials, bearer tokens, or unnecessary PII.

Monitoring SHOULD identify repeated denials, cross-tenant access attempts, stale-session loops, elevation failures, and abnormal PII access patterns.

### 3.10 Feature flags

Define a feature-flag model that supports controlled rollout of new roles and modules.

Document:

- Flag ownership.
- Tenant and branch scope.
- Default values.
- Rollout rules.
- Audit requirements.
- Emergency disable behavior.
- Frontend/backend compatibility.
- Data migration prerequisites.

A feature flag MUST NOT replace server-side authorization. Disabling a frontend feature is not sufficient to revoke backend access.

### 3.11 Backward compatibility

Define how the application behaves when a backend role or permission is deployed before the matching frontend.

Required rules:

- The backend MUST continue enforcing actual permissions.
- Unknown routes MUST fail closed.
- The frontend MUST NOT substitute a more privileged role's interface.
- Missing UI support MUST NOT grant additional backend permissions.
- API and realtime protocol versions MUST be compatible across the supported deployment window.
- Rollback MUST account for already-created data and permissions.

### 3.12 Training-mode persistence and cleanup

Define one provider-neutral training-data contract for SQLite and PostgreSQL.

It MUST specify:

- Isolation of training reads and writes.
- Ownership of training records.
- Referential integrity.
- Cleanup scheduling.
- Cleanup retries and verification.
- Crash recovery.
- Prevention of external side effects.
- Training audit retention.
- Behavior when cleanup fails.

PostgreSQL schemas are one possible implementation, not a universal requirement.

### 3.13 Customer-terminal authentication and self-service ordering

**Gap:** The kiosk and offers board introduce customer-facing access paths that must remain isolated from staff authentication and administrative APIs.

**Required artifact:** Extend `openapi/*.yaml` and `contracts.md` with the customer-terminal API contract.

Required decisions and implementation requirements:

- Define terminal provisioning, session issuance, expiration, refresh, and revocation.
- Keep customer-terminal permissions separate from the 14 staff roles.
- Define whether the offers board uses anonymous public reads or provisioned read-only terminal authentication.
- Restrict kiosk order creation and order-status reads to the authorized terminal or guest order token.
- Enforce branch scope, menu availability, pricing, tax, and coupon validation on the backend.
- Require idempotency for order creation and payment-related operations.
- Define the authoritative payment confirmation and counter-settlement workflows.
- Prevent customer-terminal sessions from accessing staff APIs, KDS administration, finance, inventory administration, customer records, or audit logs.
- Define idle reset, local cart cleanup, terminal revocation, and recovery after interrupted orders.
- Add negative security tests for cross-terminal order access, forged totals, coupon abuse, expired sessions, and unauthorized payment confirmation.

The kiosk and offers board MUST NOT be treated as complete merely because their frontend routes render successfully. Backend authorization, order persistence, pricing integrity, payment-state correctness, and terminal isolation must be verified independently.

## 4. P2 — Required Before Scale

### 4.1 Multi-tenant franchise ownership

The current session model assumes one restaurant tenant per user.

If franchise-level users must access multiple restaurant tenants, define an explicit user-to-tenant membership model, tenant-switch flow, permission-version behavior, and audit rules. Do not overload branch scope to represent tenant scope.

### 4.2 Audit export

Define an export format that supports:

- Stable event ordering.
- UTC timestamps.
- Integrity verification.
- Export generation metadata.
- Cryptographic signing or equivalent integrity evidence.
- Access authorization.
- Redaction and minimization.
- Chain verification.
- Retention and legal-hold requirements.

### 4.3 Customer-facing status page

Define an external status API for QR orders and delivery tracking. It MUST expose only token-authorized status information and MUST NOT reveal staff data, payment credentials, internal IDs, or unrelated orders.

### 4.4 Kiosk mode

Define kiosk identity, device registration, session reset, guest scope, abuse prevention, and secure cleanup between customers.

### 4.5 Timezone and business-day semantics

Store timestamps in UTC and define branch-local business-time calculations explicitly.

Document:

- Branch timezone identifiers.
- Business-day cutoffs.
- Daylight-saving behavior where applicable.
- Shift and payroll cutoffs.
- Financial close and reconciliation boundaries.
- GST reporting dates.
- Scheduled job behavior.
- Date-only values versus timestamps.

Do not assume that UTC midnight is the branch's business-day boundary.

### 4.6 Localization

Define translation keys, supported locales, currency and number formatting, translated validation messages, and locale fallback behavior.

Localized labels MUST NOT change canonical enum values, permission keys, or audit event identifiers.

### 4.7 Accessibility

Define accessibility acceptance criteria for POS and staff interfaces, including keyboard access, focus management, contrast, screen-reader labels, touch-target sizing, and error announcements. Target WCAG 2.1 AA where applicable.

### 4.8 Device attestation

If the threat model requires hardware assurance, define device attestation and its failure behavior. Device IDs, browser fingerprints, and IP allowlists alone are not hardware attestation.

### 4.9 RBAC acceptance-test matrix

Create a machine-readable test matrix covering every implemented role, endpoint, entity, and relevant field.

Tests MUST cover:

- Allowed operation.
- Denied operation.
- Cross-tenant access.
- Cross-branch access.
- Missing or stale permission.
- Field injection.
- Invalid transition.
- Missing reason.
- Approval ceiling exceeded.
- Expired or reused elevation token.
- Optimistic-lock conflict.
- Idempotency replay.
- PII visibility and audit.
- Session revocation.
- Training isolation.
- Legal hold and retention restrictions.

The test matrix MUST be generated from or checked against the permission registry so that new endpoints cannot silently escape coverage.

### 4.10 Role-change confirmation

Where secondary confirmation is required, implement an explicit two-step flow instead of relying on an undocumented header convention.

The contract MUST specify authorization, confirmation expiration, entity binding, concurrency behavior, audit events, and cancellation.

## 5. Required Companion Documents

The following documents are the minimum practical set for implementation by a team without prior design context.

### 5.1 `schema.md`

The complete entity schema, ERD, constraints, indexes, relationships, versioning, tenancy, PII classification, retention, and database-provider differences.

### 5.2 `openapi/*.yaml`

Complete endpoint definitions, grouped by module, including DTOs, authentication, authorization, statuses, error responses, idempotency, optimistic locking, examples, and pagination.

### 5.3 `errors.registry.md`

The canonical error registry, aligned with the backend registry and frontend error handling.

### 5.4 `contracts.md`

Cross-cutting contracts for rate limits, pagination, filtering, bulk operations, retries, webhooks, timezones, compatibility, offline replay, and realtime delivery.

### 5.5 `bootstrap.md`

First-owner creation, production safeguards, emergency recovery, credential handling, and recovery verification.

### 5.6 `security-operations.md`

Session revocation, device revocation, incident handling, backup and restore, audit-chain verification, key management, and emergency access.

### 5.7 `rbac-test-matrix.md`

Role-by-endpoint acceptance tests and negative security tests.

These documents may be developed incrementally, but no module should be described as implementation-ready until its applicable contracts and tests are complete.

## 6. Recommended Implementation Order

### Phase 1 — Core security

- Freeze the role and permission registry.
- Implement authentication, session lifecycle, PIN lockout, and permission-version checks.
- Implement tenant and branch enforcement at the data-access boundary.
- Implement field allowlists and canonical errors.
- Implement audit persistence and security-event logging.
- Implement elevation-token validation, revocation, and atomic consumption.
- Add negative tests for cross-tenant and privilege-escalation attempts.

### Phase 2 — POS and financial integrity

- Complete ticket, item, payment, refund, and settlement schemas.
- Implement optimistic locking and idempotency.
- Implement discount and refund ceilings.
- Implement tax configuration and financial reversal records.
- Verify that financial mutations and required audit records commit atomically.
- Test concurrent payments, duplicate requests, stale versions, and failed transaction recovery.

### Phase 3 — Kitchen, tables, orders, and delivery

- Complete entity schemas and OpenAPI contracts.
- Implement state-transition guards.
- Implement KDS and floor authorization.
- Implement table-cleaning handoff.
- Implement dispatch assignment and COD collection.
- Implement realtime authorization and offline replay safeguards.

### Phase 4 — Governance and compliance

- Implement role-change cleanup and confirmation.
- Implement retention, erasure, legal holds, and training cleanup.
- Implement migration and bootstrap recovery.
- Implement backup/restore drills.
- Add authorization observability and feature flags.
- Complete the RBAC acceptance-test matrix.

### Phase 5 — Pilot readiness

- Verify the implemented endpoints against OpenAPI.
- Run cross-tenant and cross-branch security tests.
- Run concurrent mutation and idempotency tests.
- Verify audit-chain integrity.
- Verify backup restoration and migration rollback procedures.
- Verify operational alerts, recovery procedures, and staff workflows.
- Document unresolved risks and obtain explicit acceptance before pilot deployment.

## 7. Definition of Done

A module is **RBAC-complete** only when its role permissions, field restrictions, tenant isolation, branch scope, state transitions, audit requirements, and negative tests are implemented.

A module is **API-complete** only when its OpenAPI contract matches the implementation and defines all supported request, response, error, retry, pagination, and idempotency behavior.

A module is **production-ready** only when its security tests, operational monitoring, backup/recovery, migration, retention, and incident-response requirements have been verified.

The whole backend is **spec-complete** only when all required modules and cross-cutting contracts are defined, internally consistent, and testable without relying on undocumented assumptions.

## 8. Final Assessment

The RBAC specification is a strong foundation for implementation, but role completeness and backend completeness are different claims.

The correct next step is to freeze the RBAC baseline, implement and test the core authentication and POS contracts, and complete the relevant companion documents as each module enters development.

Do not describe all modules as fully specified or implemented until the schema, endpoint contracts, error registry, operational contracts, and acceptance tests support that claim.
