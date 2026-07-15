# Warehouse Backend

Express + TypeScript backend for the Mother & Baby warehouse management system.

This backend was migrated from the original NestJS/Prisma scaffold to a plain Express architecture using MySQL directly through `mysql2/promise`.

## Current Status

The project now has a production-oriented backend foundation and several core warehouse transaction flows implemented.

Overall status:

- Express structure: stable.
- TypeScript strict mode: enabled.
- Validation: enabled with Zod.
- Auth middleware: JWT + active-user check.
- Socket.IO auth: implemented.
- Read/list endpoints: scaffolded for all major domain modules.
- Critical inventory transactions: partially implemented.
- Integration tests with a real MySQL test database: still missing.

## Stack

- Express
- TypeScript
- MySQL 8+ / InnoDB
- `mysql2/promise`
- Socket.IO
- JWT via `jsonwebtoken`
- Zod validation
- Jest + Supertest
- ESLint + Prettier

## Environment

Create `.env` from `.env.example` and update values for your machine.

```bash
cp .env.example .env
```

Required variables:

```env
PORT=3000
CORS_ORIGIN=*
DATABASE_URL=mysql://root:password@localhost:3306/warehouse_management
DB_CONNECTION_LIMIT=10
JWT_SECRET=change_this_to_a_long_random_secret
```

## Scripts

```bash
npm install
npm run start:dev
npm run build
npm run lint
npm run test:e2e
```

Useful verification commands:

```bash
npm run lint
npx tsc -p tsconfig.build.json --noEmit
npx jest --config ./test/jest-e2e.json --runInBand
```

## Source Layout

```text
src/
  app.ts
  main.ts
  common/
    audit/
    code/
    middleware/
    types/
    validation/
  config/
  database/
  modules/
  socket/
```

Feature modules follow this structure:

- `*.routes.ts` defines endpoints.
- `*.controller.ts` maps HTTP request/response.
- `*.validation.ts` validates request input.
- `*.service.ts` contains business rules and error mapping.
- `*.repository.ts` contains database queries and transactions.
- `*.model.ts` contains request/row/domain types.
- `*.module.ts` exports the router mounted by `app.ts`.

## Modules

Implemented domain modules:

- `auth`
- `authorization`
- `warehouses`
- `locations`
- `catalog`
- `suppliers`
- `batches`
- `stock`
- `inventory-transactions`
- `goods-receipts`
- `goods-issues`
- `stock-transfers`
- `stock-counts`
- `stock-adjustments`
- `alerts`
- `notifications`
- `audit-logs`
- `attachments`
- `settings`
- `reports`
- `health`

Most modules currently expose a base `GET /module` list endpoint with simple filters. The modules that already contain real transaction behavior are listed below.

## Core Infrastructure Implemented

### Config

Centralized config is in `src/config/config.ts`.

Current config values:

- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `DB_CONNECTION_LIMIT`
- `JWT_SECRET`

### Database

Database pool is in `src/database/db.ts`.

The backend expects the MySQL schema from:

```text
warehouse_management_mysql.sql
```

### Validation

Request validation uses Zod through:

```text
src/common/validation/validate.ts
```

### Auth

Auth module includes:

- `verifyToken`
- `requirePermission(permission)`
- JWT verification
- active-user lookup in database
- role permission loading

Socket.IO also uses the same token verification path.

### Code Generation

Unique transaction codes use:

```text
src/common/code/code-generator.ts
```

This avoids timestamp-only transaction codes.

### Audit Log

Audit insert helper is in:

```text
src/common/audit/audit.repository.ts
```

It is used inside transaction flows so business changes and audit logs commit or rollback together.

## Transaction Flows Implemented

### 1. Confirm Goods Issue

Endpoint:

```http
POST /goods-issues/:id/confirm
Authorization: Bearer <token>
```

Body:

```json
{
  "strategy": "FEFO"
}
```

Supported strategies:

- `FEFO`
- `FIFO`

Implemented behavior:

- Requires `goods_issues:confirm` permission.
- Locks `goods_issues` row with `FOR UPDATE`.
- Allows confirm only from `DRAFT` or `PENDING`.
- Idempotent if already `CONFIRMED`.
- Locks issue items.
- Aggregates demand by product variant.
- Allocates stock using FEFO/FIFO.
- Locks candidate stock rows with `FOR UPDATE`.
- Prevents expired, blocked, depleted batches.
- Enforces batch for lot-tracked products.
- Enforces expiry date for expiry-tracked products under FEFO.
- Deducts stock atomically using `quantity - reserved_quantity >= requested`.
- Writes `inventory_transactions` with type `ISSUE`.
- Replaces issue items with actual allocated pick lines.
- Updates issue status to `CONFIRMED`.
- Writes audit log in the same transaction.

### 2. Confirm Goods Receipt

Endpoint:

```http
POST /goods-receipts/:id/confirm
Authorization: Bearer <token>
```

Implemented behavior:

- Requires `goods_receipts:confirm` permission.
- Locks receipt and receipt items.
- Allows confirm only from `DRAFT` or `PENDING`.
- Idempotent if already `CONFIRMED`.
- Enforces batch for lot-tracked products.
- Enforces expiry for expiry-tracked products.
- Validates item location belongs to receipt warehouse.
- Upserts stock into `stock_locations`.
- Writes `inventory_transactions` with type `RECEIPT`.
- Updates receipt status to `CONFIRMED`.
- Writes audit log in the same transaction.

### 3. Confirm Stock Transfer

Endpoint:

```http
POST /stock-transfers/:id/confirm
Authorization: Bearer <token>
```

Implemented behavior:

- Requires `stock_transfers:confirm` permission.
- Locks transfer and transfer items.
- Allows confirm only from `DRAFT` or `PENDING`.
- Idempotent if already `CONFIRMED`.
- Validates source location belongs to source warehouse.
- Validates destination location belongs to destination warehouse.
- Deducts source stock atomically.
- Upserts destination stock.
- Writes paired inventory transactions:
  - `TRANSFER_OUT`
  - `TRANSFER_IN`
- Updates transfer status to `CONFIRMED`.
- Writes audit log in the same transaction.

### 4. Approve Stock Adjustment

Endpoint:

```http
POST /stock-adjustments/:id/approve
Authorization: Bearer <token>
```

Implemented behavior:

- Requires `stock_adjustments:approve` permission.
- Locks adjustment and adjustment items.
- Allows approve only from `PENDING`.
- Idempotent if already `APPROVED`.
- Prevents self-approval.
- Validates item location belongs to adjustment warehouse.
- Applies IN/OUT adjustment to stock.
- Prevents negative stock.
- Updates adjustment item `quantity_before` and `quantity_after`.
- Writes inventory transactions:
  - `COUNT_ADJUSTMENT_IN`
  - `COUNT_ADJUSTMENT_OUT`
  - `MANUAL_ADJUSTMENT_IN`
  - `MANUAL_ADJUSTMENT_OUT`
- Updates adjustment status to `APPROVED`.
- Writes audit log in the same transaction.

### 5. FEFO/FIFO Allocation Preview

Endpoint:

```http
GET /stock/allocation?warehouseId=1&productVariantId=10&quantity=5&strategy=FEFO
```

Implemented behavior:

- Returns preview of which stock locations/batches would be picked.
- Does not mutate stock.
- Used as the basis for confirm goods issue allocation.

## What Is Still Missing

The backend is not yet a complete warehouse management system. Important missing work remains.

### Transaction Flows Still Missing

- Complete stock count.
- Generate stock adjustments from stock count variance.
- Reject stock adjustment.
- Cancel documents safely.
- Return-in / return-out flows.
- Reversal transaction flow for correcting mistakes.

### Auth Flows Missing

- Login.
- Refresh token.
- Logout / revoke session.
- Password reset.
- Failed login lockout behavior.

The schema has tables for sessions and reset tokens, but the API flows are not implemented yet.

### Notifications Missing

The `notifications` and `alerts` modules currently expose list-style scaffold APIs. Missing work:

- Create notification on important events.
- Mark notification as read.
- Resolve alerts.
- Socket.IO push events to online users.
- Low stock / near expiry alert generation.

### Audit Log Coverage Incomplete

Audit logs are currently written by the implemented transaction flows. Other write operations still need audit integration once implemented.

### Reports Need Expansion

The database has reporting views:

- `vw_current_stock`
- `vw_product_total_stock`
- `vw_near_expiry_stock`

Current report endpoints are basic. More useful reporting endpoints should be added for:

- low stock
- stock by warehouse
- stock by category
- movement history
- expiry risk
- adjustment history

### Testing Missing

Current tests verify only that the app boots and the root endpoint responds.

Missing test coverage:

- Unit tests for FEFO/FIFO allocation.
- Integration tests for goods issue confirm.
- Integration tests for goods receipt confirm.
- Integration tests for stock transfer confirm.
- Integration tests for adjustment approve.
- Auth and permission tests.
- Concurrency tests for atomic stock updates.

A real MySQL test database with seed data is required to properly test transaction behavior.

## Current Verification Status

The project currently passes:

```bash
npm run lint
npx tsc -p tsconfig.build.json --noEmit
npx jest --config ./test/jest-e2e.json --runInBand
```

This means code style, TypeScript strict compile, and a basic Express e2e smoke test are passing.

It does not yet prove every warehouse transaction is correct under real MySQL data and concurrency.

## Recommended Roadmap

### Phase 1: Stabilize Core Transactions

- Add MySQL integration test database.
- Seed warehouse, locations, users, products, batches, stock.
- Test confirm receipt, issue, transfer, adjustment approve.
- Test insufficient stock and concurrent update cases.

### Phase 2: Complete Warehouse Workflows

- Complete stock count.
- Generate adjustments from stock count variance.
- Reject/cancel workflows.
- Reversal transactions.
- Return flows.

### Phase 3: Auth and Operations

- Login / refresh / logout.
- User sessions.
- Password reset.
- Better permission management APIs.

### Phase 4: Notifications and Reporting

- Alert generation.
- Notification creation and read status.
- Socket.IO push notifications.
- Dashboard/reporting endpoints.

### Phase 5: Hardening

- Request id / correlation id middleware.
- Structured logging.
- Rate limiting.
- API pagination standard.
- OpenAPI documentation.
- CI pipeline.

## Important Design Notes

- `inventory_transactions` and `audit_logs` should be treated as append-only.
- Stock mutation and inventory transaction insert must happen in the same DB transaction.
- Any stock deduction must use row locks and/or atomic update checks.
- FEFO should be used for expiry-tracked goods.
- FIFO can be used for non-expiry goods where business rules allow it.
- Products, variants, batches, and locations with transaction history should be soft-deleted, not hard-deleted.