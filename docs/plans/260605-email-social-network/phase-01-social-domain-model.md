# Phase 01 Social Domain Model

Parent plan: [plan.md](./plan.md)

## Goal

Create the social graph data model inside existing mailbox storage without changing user-facing behavior.

Implementation status: completed
Review status: local tests + typecheck passed

## Files

- Modify: `workers/durableObject/migrations.ts`
- Modify: `workers/db/schema.ts`
- Modify: `workers/durableObject/index.ts`
- Create/Modify tests under `tests/`

## Tasks

- [x] Add `contacts` table keyed by normalized email address.
- [x] Add `conversation_participants` keyed by `thread_id + contact_id`.
- [x] Add helper to upsert contacts from inbound sender/recipient headers.
- [x] Add helper to upsert contacts from outbound To/Cc/Bcc.
- [x] Backfill contact graph lazily when a thread is read.
- [x] Add node tests for normalization and idempotent upsert.

## Acceptance

- Existing email tests pass.
- Re-processing the same email does not duplicate contacts.
- Contact graph can be queried by thread id.

## Verification

```bash
npm test
npm run typecheck
```

Both passed on 2026-06-06.

## Risks

- DO SQLite migrations must be idempotent.
- Email headers may include display names, groups, malformed addresses.
