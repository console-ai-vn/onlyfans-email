# Phase 04 — Domain Management UI

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | M (1-2 ngày) |
| **Depends on** | Phase 03 (permission model — only admins can manage domains) |

## Overview

Admin UI for managing `DOMAINS` and `EMAIL_ADDRESSES` without editing `wrangler.jsonc` and redeploying. Store domain config in R2 alongside mailbox settings, with `wrangler.jsonc` as bootstrap fallback.

## Requirements

### Functional
- **Domain config in R2**: `domains/config.json` storing `{ domains: string[], emailAddresses: string[], accessEmailAddresses: string[] }`
- **Config precedence**: R2 config > `wrangler.jsonc` `vars` fallback
- **Admin API**: `GET/PUT /api/v1/admin/domains` (admin-only, gated by permission model)
- **Admin UI**: Domain management panel at `/mailbox/:mailboxId/admin/domains`
- **Add/remove domains**: add domain → update `DOMAINS`; add email address → update `EMAIL_ADDRESSES`
- **Validation**: domain format check; email address must match one of the configured domains
- **Audit**: log all domain config changes

### Non-Functional
- Without R2 config, system falls back to `wrangler.jsonc` `vars` (current behavior)
- Changes take effect immediately (no redeploy)
- Frontend uses existing `queryKeys.config` pattern

## Implementation Steps

1. Add `GET /api/v1/admin/domains` route (reads R2, falls back to env vars)
2. Add `PUT /api/v1/admin/domains` route (writes R2, gated by admin role)
3. Add `workers/lib/admin.ts` with `getDomainConfig()`, `updateDomainConfig()`
4. Update `GET /api/v1/config` to use new precedence
5. Add `DomainManager` component in admin panel
6. Add route: `/mailbox/:mailboxId/admin/domains`
7. Tests: `tests/admin.test.ts`

## Key Files

| Action | File |
|---|---|
| Create | `workers/lib/admin.ts` |
| Modify | `workers/index.ts` (admin API routes + config precedence) |
| Create | `app/routes/admin-domains.tsx` |
| Create | `tests/admin.test.ts` |

## Success Criteria

- [ ] `pnpm typecheck` passes
- [ ] Admin can add/remove domains without redeploy
- [ ] Non-admin gets 403 on admin API
- [ ] `GET /api/v1/config` returns R2-stored config
- [ ] Fallback to `wrangler.jsonc` `vars` when R2 config missing
