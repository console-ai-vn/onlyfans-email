# Phase 01 Evidence Lock

## Context links

- Parent plan: [plan.md](./plan.md)
- Research: [researcher-01-upstream-mailflow.md](./research/researcher-01-upstream-mailflow.md), [researcher-02-current-ship-blockers.md](./research/researcher-02-current-ship-blockers.md)
- Scout: [scout-01-codebase-map.md](./scout/scout-01-codebase-map.md)

## Overview

- Date: 2026-06-02
- Description: Khóa evidence thật trước khi sửa tiếp.
- Priority: P0
- Implementation status: completed
- Review status: passed

## Key Insights

- Hiện có dirty changes ở `EmailIframe.tsx` và `utils.ts`.
- Cần biết ảnh lỗi vì cid mismatch, disposition mismatch, 403/404 attachment, hay iframe sandbox.
- Research có mâu thuẫn về upstream iframe; phải verify bằng `git show upstream/main`.

## Requirements

- Không sửa implementation.
- Không commit file user `Metro Mail.pdf`.
- Tạo được debug evidence cho email lỗi.

## Architecture

- Dùng read-only commands + temporary debug route plan.
- Evidence phải gồm frontend body, attachment metadata, endpoint status.

## Related code files

- `app/components/EmailIframe.tsx`
- `app/lib/utils.ts`
- `workers/index.ts`
- `workers/durableObject/index.ts`
- `app/components/email-panel/SingleMessageView.tsx`
- `app/components/email-panel/ThreadMessage.tsx`

## Implementation Steps

1. Run:
   ```powershell
   git status --short
   git diff -- app/components/EmailIframe.tsx app/lib/utils.ts
   git show upstream/main:app/components/EmailIframe.tsx
   git show upstream/main:app/lib/utils.ts
   ```
2. Capture current failing email id from browser URL/API response.
3. Add temporary debug endpoint only after user approves execution:
   ```txt
   GET /api/v1/mailboxes/:mailboxId/emails/:id/debug
   ```
4. Inspect:
   ```txt
   body cid values
   attachments id/content_id/disposition/mimetype
   GET attachment URL status
   ```

## Todo list

- [x] Verify upstream iframe from git.
- [x] Verify current dirty diff.
- [x] Deploy Access-protected debug endpoint.
- [x] Identify exact failed email id.
- [x] Capture email body + attachment metadata.
- [x] Capture attachment HTTP status.

## Success Criteria

- Root cause category known before any fix.
- Evidence saved to `reports/02-image-debug-evidence.md`.

## Risk Assessment

- Debug endpoint may expose raw email body. Keep behind existing Access + mailbox guard and remove after diagnosis.

## Security Considerations

- Do not keep `allow-same-origin` unless evidence proves it is necessary.
- Do not expose attachment URLs publicly.

## Next steps

- Move to Phase 02 once evidence identifies exact image path failure.
