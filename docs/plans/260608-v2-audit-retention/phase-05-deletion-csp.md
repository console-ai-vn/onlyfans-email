# Phase 05 — Mailbox Deletion + CSP Hardening

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | S (1 ngày) |
| **Depends on** | Phase 01 (audit log) |

## Overview

Two small security/compliance items bundled: (A) implement full mailbox deletion with R2 + DO cleanup, (B) add app-level Content-Security-Policy header.

## Part A: Full Mailbox Deletion (S)

### Context
`ALLOW_MAILBOX_DELETION = false` in `workers/index.ts:39` because the delete handler only removes the R2 settings JSON (`mailboxes/<email>.json`). The TODO at `workers/index.ts:235` notes: "also delete DO data and R2 attachment blobs."

### Requirements
- **Enable deletion when admin**: gate on admin permission (Phase 03), not env var
- **Cleanup order**: enumerate all emails in DO → collect R2 attachment keys → delete R2 blobs → drop DO data → delete R2 mailbox settings
- **DO deletion**: call `c.env.MAILBOX.delete(mailboxId)` after data cleanup
- **R2 enumeration**: list all `attachments/<emailId>/*` for each email in the mailbox
- **Confirmation**: UI confirmation dialog with mailbox email display
- **Audit**: log deletion with actor + mailbox ID

### Implementation Steps
1. Add `deleteMailboxData()` method to MailboxDO (enumerate + delete all emails + attachments)
2. Update `DELETE /api/v1/mailboxes/:id` with full cleanup pipeline
3. Remove `ALLOW_MAILBOX_DELETION` flag — replace with permission check
4. Add confirmation dialog in UI (Kumo Dialog, not window.confirm)
5. Tests: add deletion test to `tests/access.test.ts`

## Part B: App-Level CSP (S)

### Context
`EmailIframe.tsx` has a strict CSP in the iframe's `<meta>`, but the main app document has no CSP. V2-7 from roadmap.

### Requirements
- **CSP header**: `Content-Security-Policy` on all non-iframe responses via Hono middleware
- **Policy**: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-src 'none'; object-src 'none'`
- **Report-only mode first**: use `Content-Security-Policy-Report-Only` initially, monitor violations via console
- **Worker middleware**: add to `workers/app.ts` response pipeline

### Implementation Steps
1. Add CSP middleware to `workers/app.ts` (after auth, before routes)
2. Set `Content-Security-Policy-Report-Only` for 1 week → review reports → switch to enforce
3. Ensure iframe `srcdoc` CSP (EmailIframe.tsx) is stricter and not affected

## Key Files

| Action | File |
|---|---|
| Modify | `workers/index.ts` (mailbox deletion) |
| Modify | `workers/durableObject/index.ts` (deleteMailboxData method) |
| Modify | `workers/app.ts` (CSP middleware) |
| Remove | `ALLOW_MAILBOX_DELETION` constant |
| Modify | `app/queries/mailboxes.ts` (delete mutation) |

## Success Criteria

- [ ] `pnpm typecheck` passes
- [ ] Full mailbox deletion removes: DO data + all R2 attachment blobs + R2 settings
- [ ] Confirmation dialog shown before deletion
- [ ] Audit log entry created for deletion
- [ ] CSP header present on all app HTML responses
- [ ] Email iframe rendering not broken by CSP
