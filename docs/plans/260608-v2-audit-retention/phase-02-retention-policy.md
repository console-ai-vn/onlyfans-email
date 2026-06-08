# Phase 02 — Retention Policy

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | M (1-2 ngày) |
| **Depends on** | Phase 01 (audit log — reuse audit for auto-archive events) |

## Overview

Auto-archive old emails to control DO SQLite storage growth. Trash folder purged after 30 days. Sent folder archived after 1 year. Implement as a scheduled DO alarm, not external cron.

## Requirements

### Functional
- **Trash auto-delete**: emails in `trash` folder older than 30 days → permanently delete (including R2 attachments)
- **Sent auto-archive**: emails in `sent` folder older than 365 days → move to `archive`
- **Manual trigger**: admin endpoint `POST /api/v1/mailboxes/:id/retention/run` for testing/on-demand
- **DO Alarm**: use DO alarm API (`state.storage.setAlarm`) to schedule daily cleanup
- **Audit**: log retention actions to audit_log (V2-1)

### Non-Functional
- Retention runs once per day per mailbox (alarm-based, not cron)
- Max batch size per run: 500 emails (prevents alarm timeout)
- Soft-delete pattern: trash purge is permanent; sent archive is reversible (move back to sent)
- R2 attachment blobs deleted alongside email purge

## Implementation Steps

1. Add `retentionLastRun` to DO storage metadata
2. Add `runRetention()` method to MailboxDO: query trash > 30d, sent > 365d
3. Wire DO alarm in constructor: `if (!alarm) setAlarm(24 * 60 * 60 * 1000)`
4. Add `POST /api/v1/mailboxes/:id/retention/run` admin endpoint
5. Handle attachment cleanup: batch-delete R2 keys for purged emails
6. Audit log entries for retention actions
7. Tests: `tests/retention.test.ts`

## Key Files

| Action | File |
|---|---|
| Modify | `workers/durableObject/index.ts` (add alarm + retention method) |
| Modify | `workers/index.ts` (add retention API route) |
| Modify | `workers/lib/attachments.ts` (batch R2 delete helper) |
| Create | `tests/retention.test.ts` |

## Success Criteria

- [ ] `pnpm typecheck` passes
- [ ] Emails in trash > 30d are permanently deleted (email row + R2 blobs)
- [ ] Emails in sent > 365d are moved to archive
- [ ] DO alarm fires on schedule
- [ ] Manual trigger works via API
- [ ] No alarm timeout (batch size ≤ 500)
