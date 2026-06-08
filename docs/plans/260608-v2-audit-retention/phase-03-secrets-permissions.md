# Phase 03 — Secrets + Permission Model

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | L (3-4 ngày) |
| **Depends on** | Phase 01 (audit log for permission change events) |

## Overview

Part A: Move `POLICY_AUD` + `TEAM_DOMAIN` from `wrangler.jsonc` `vars` to `wrangler secret`. Part B: Replace single CF Access policy with per-mailbox role-based permissions stored in DO SQLite.

## Part A: Secrets Migration (S)

### Requirements
- Remove `POLICY_AUD` and `TEAM_DOMAIN` from `wrangler.jsonc` `vars`
- Worker reads them from `c.env` (secrets are automatically in env)
- Update `workers/app.ts` to read from secrets (no code change needed — `c.env.POLICY_AUD` already works with secrets)
- Update `.dev.vars.example` with clear instructions
- Update `deployment-guide.md` § 3.5

### Implementation
1. Run `wrangler secret put POLICY_AUD` with current value
2. Run `wrangler secret put TEAM_DOMAIN` with current value
3. Remove from `wrangler.jsonc` `vars`
4. Verify local dev still works via `.dev.vars`
5. Deploy and smoke test Access login

## Part B: Per-Mailbox Permission Model (L)

### Context
Currently: single CF Access policy → any authenticated user can access any mailbox in `EMAIL_ADDRESSES`. `ACCESS_EMAIL_ADDRESSES` provides privileged access to all mailboxes. Owner access is `accessEmail === mailboxId`.

### Target Model

| Role | Permissions |
|---|---|
| **owner** | Full access to own mailbox (read, send, delete, settings, audit view) |
| **admin** | Full access to ALL mailboxes + manage permissions + domain management |
| **manager** | Read + send + notes + state on assigned mailboxes |
| **member** | Read + send + notes on own mailbox only |
| **viewer** | Read-only on assigned mailboxes |

### Requirements
- **Permissions table**: `mailbox_permissions(mailbox_id, user_email, role, granted_by, granted_at)`
- **Migration #13**: `13_add_mailbox_permissions`
- **Middleware upgrade**: `requireMailbox` checks permissions table first, falls back to current logic
- **API**: CRUD for permissions (`GET/POST/DELETE /api/v1/mailboxes/:id/permissions`)
- **UI**: Permission management panel in settings (admin only)
- **Backward compat**: existing `EMAIL_ADDRESSES` + `ACCESS_EMAIL_ADDRESSES` logic preserved as fallback
- **Audit**: log all permission grants/revokes

### Implementation Steps
1. Add `mailbox_permissions` table to Drizzle schema
2. Create migration #13
3. Add `workers/lib/permissions.ts` with `getUserRole()`, `assertPermission()`
4. Upgrade `requireMailbox` middleware to check permissions table
5. Add permission CRUD API routes
6. Add `PermissionManager` component in settings
7. Tests: `tests/permissions.test.ts`

## Key Files

| Action | File |
|---|---|
| Modify | `wrangler.jsonc` (remove POLICY_AUD + TEAM_DOMAIN from vars) |
| Modify | `.dev.vars.example` |
| Create | `workers/lib/permissions.ts` |
| Modify | `workers/db/schema.ts` |
| Modify | `workers/durableObject/migrations.ts` |
| Modify | `workers/index.ts` (permission CRUD routes) |
| Modify | `workers/lib/mailbox.ts` (upgrade requireMailbox) |
| Create | `app/routes/permissions.tsx` |
| Create | `tests/permissions.test.ts` |
| Modify | `docs/deployment-guide.md` |

## Success Criteria

- [ ] `wrangler.jsonc` no longer contains POLICY_AUD or TEAM_DOMAIN in vars
- [ ] Deploy with secrets works — Access login still functions
- [ ] `pnpm typecheck` passes
- [ ] Permission CRUD works via API
- [ ] Viewer role cannot send/delete
- [ ] Admin role can manage permissions for all mailboxes
- [ ] Backward compat: existing mailboxes work without explicit permission rows
