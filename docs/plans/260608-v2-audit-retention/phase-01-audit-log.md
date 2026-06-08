# Phase 01 — Audit Log Foundation

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | M (2-3 ngày) |
| **Depends on** | None |

## Overview

Add immutable audit log for compliance and debugging. Every significant action (read email, send email, delete email, login/Access validation, mailbox create/update, state change, note create) produces an audit entry with actor, action, target, and timestamp.

## Requirements

### Functional
- **Audit table** in MailboxDO SQLite: `audit_log(id, actor_email, action, target_type, target_id, payload, created_at)`
- **Write audit entries** on: email read, email send, email delete, email move, draft save, mailbox create, mailbox settings update, conversation state change, internal note create, login (Access JWT validate success)
- **Read-only admin viewer**: route `/mailbox/:mailboxId/audit?page=&limit=&action=&actor=&from=&to=`
- **API**: `GET /api/v1/mailboxes/:id/audit` with filter params
- **Migration #12**: `12_add_audit_log`

### Non-Functional
- Audit writes are fire-and-forget (don't block the main action on audit failure)
- Audit table is append-only — no UPDATE or DELETE through API
- Payload is JSON blob for action-specific context
- Pagination: 50 entries per page, sorted by created_at DESC

## Implementation Steps

1. Add `audit_log` table to Drizzle schema (`workers/db/schema.ts`)
2. Create migration #12 in `workers/durableObject/migrations.ts`
3. Add `insertAuditEntry()` helper to `workers/lib/audit.ts`
4. Sprinkle audit calls at key action points in `workers/index.ts` and DO methods
5. Add `GET /api/v1/mailboxes/:id/audit` route
6. Add `useAuditLog` query + `AuditLogViewer` component (admin only, read-only)
7. Add route: `/mailbox/:mailboxId/audit`
8. Tests: `tests/audit.test.ts`

## Key Files

| Action | File |
|---|---|
| Create | `workers/lib/audit.ts` |
| Modify | `workers/db/schema.ts` |
| Modify | `workers/durableObject/migrations.ts` |
| Modify | `workers/index.ts` (API routes) |
| Modify | `workers/durableObject/index.ts` (DO methods) |
| Create | `app/routes/audit.tsx` |
| Create | `app/queries/audit.ts` |
| Create | `tests/audit.test.ts` |

## Success Criteria

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` includes audit-specific tests
- [ ] Audit entries appear when reading/sending/deleting emails
- [ ] Audit viewer shows paginated, filterable log
- [ ] Audit table is append-only (verified by attempting UPDATE via API → 405)
