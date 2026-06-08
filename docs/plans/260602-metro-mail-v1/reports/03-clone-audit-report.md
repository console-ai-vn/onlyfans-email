# Phase 01 Clone Audit

## Baseline
- Branch: `metro-mail-v1`
- Upstream: `https://github.com/cloudflare/agentic-inbox.git`
- Upstream commit: `48039bb`
- Setup: `npm install`
- Verification: `npm run typecheck` exit `0`; `npm run build` exit `0`.
- Test harness: upstream exposes no `test` script.

## Environment Notes
- Vite emits noisy `tsconfig-paths` warnings while scanning unrelated projects outside this workspace.
- Build still exits `0`.
- `npm install` with npm `11.12.1` rewrites `package-lock.json`; review before committing.

## Audited Worker Surface
- `workers/app.ts`: production Access JWT middleware, MCP routes, agent routes, SPA fallback, inbound email entry.
- `workers/index.ts`: API routes, mailbox CRUD, send, drafts, search, private attachment route, inbound MIME parsing.
- `workers/lib/mailbox.ts`: `requireMailbox`; checks mailbox existence only.
- `workers/lib/attachments.ts`: outbound base64 attachment storage in private R2.
- `workers/lib/email-helpers.ts`: sender validation, mailbox listing, message IDs, threading.
- `workers/lib/schemas.ts`: request schemas.
- `workers/durableObject/index.ts`: mailbox-local SQLite CRUD, threads, unread state, search, rate limits.
- `workers/durableObject/migrations.ts`: DO SQLite migrations.
- `workers/db/schema.ts`: email, folder, attachment tables.
- `workers/routes/reply-forward.ts`: reply and forward handlers.
- `workers/agent/index.ts`, `workers/mcp/index.ts`: deferred AI/MCP paths.

## Audited Frontend Surface
- `app/routes/home.tsx`: mailbox create/delete UI.
- `app/routes/email-list.tsx`: inbox list.
- `app/components/MailboxSplitView.tsx`: list/detail layout.
- `app/components/EmailPanel.tsx`: thread actions.
- `app/components/email-panel/ThreadMessage.tsx`: existing chat-adjacent message rendering.
- `app/components/EmailAttachmentList.tsx`: image/file cards and preview callback.
- `app/components/ComposeEmail.tsx`, `app/components/ComposePanel.tsx`: compose surfaces.
- `app/hooks/useComposeForm.ts`, `app/hooks/useUIStore.ts`: compose mode and forwarding path.
- `app/services/api.ts`: browser API client.
- `app/lib/utils.ts`: CID replacement and private attachment URLs.

## Existing Reusable Capability
- `EMAIL_ADDRESSES` already restricts mailbox creation and inbound recipient matching.
- Durable Object SQLite already stores threads, unread state, search, and attachment metadata.
- R2 bucket is private; attachment access already goes through Worker API.
- Reply path and inline `contentId` attachment shape already exist.
- Search can remain in V1 with minor UI treatment only.

## Security Gaps To Close
- `workers/app.ts`: Access validates JWT but does not map JWT email to mailbox ownership.
- `workers/lib/mailbox.ts`: any Access-approved user can request any existing mailbox ID.
- `workers/index.ts`: attachment fetch looks up `attachmentId` but does not verify its `email_id` matches URL `emailId`.
- `workers/index.ts`: mailbox delete is destructive and contains unresolved cleanup comment; V1 should hide or replace with archive/deactivation.
- AI/MCP routes are still exposed by default and can access mailboxes; deferred V1 must disable them.

## Dependency Audit
- `npm audit --json`: `18` vulnerabilities (`8 moderate`, `10 high`).
- Direct packages requiring a controlled update pass: `drizzle-orm`, `hono`, `dompurify`, `vite`, `wrangler`, `@cloudflare/vite-plugin`.
- Do not run blind `npm audit fix`; upgrade deliberately and verify build/typecheck.

## Phase 02 Focus
- Add Access identity extraction and exact mailbox ownership guard.
- Use configured `EMAIL_ADDRESSES` as internal provisioning allowlist for V1.
- Disable AI/MCP routes and UI in V1.
- Add minimum automated test harness before auth behavior changes.
