# Upstream Source Map

## Official Upstream
- Repo: https://github.com/cloudflare/agentic-inbox
- Package: https://raw.githubusercontent.com/cloudflare/agentic-inbox/main/package.json
- Wrangler config: https://raw.githubusercontent.com/cloudflare/agentic-inbox/main/wrangler.jsonc

## Stack Observed
- React 19, React Router 7, Tailwind, Zustand, TipTap, Kumo.
- Hono Worker.
- Durable Objects SQLite.
- R2 attachment bucket.
- Cloudflare Email Routing inbound.
- Cloudflare Email Service outbound binding `EMAIL`.
- Production auth via Cloudflare Access JWT.
- Postal Mime available for MIME parsing.

## Root Worker Files
- `workers/app.ts`: Worker entry from `wrangler.jsonc`; API/auth routing integration point.
- `workers/email-sender.ts`: outbound email and attachment construction touch point.
- `workers/index.ts`: Worker exports.
- `workers/types.ts`: environment and shared worker types.

## Worker Modules
- `workers/db/schema.ts`: mailbox-local SQLite schema.
- `workers/durableObject/index.ts`: `MailboxDO` implementation surface.
- `workers/durableObject/migrations.ts`: schema migration surface.
- `workers/routes/reply-forward.ts`: reply/forward API route.
- `workers/lib/*`: inspect after fork for Access helpers, mailbox helpers, attachment helpers.
- `workers/agent/*`, `workers/mcp/*`: AI/MCP surfaces to disable or remove from default V1 UI after fork audit.

## Frontend Files
- `app/components/ComposeEmail.tsx`
- `app/components/ComposePanel.tsx`
- `app/components/EmailAttachmentList.tsx`
- `app/components/EmailIframe.tsx`
- `app/components/EmailPanel.tsx`
- `app/components/MailboxSplitView.tsx`
- `app/components/RichTextEditor.tsx`
- `app/components/Sidebar.tsx`
- `app/components/email-panel/*`
- `app/routes/email-list.tsx`
- `app/routes/home.tsx`
- `app/routes/mailbox-index.tsx`
- `app/routes/mailbox.tsx`
- `app/routes/search-results.tsx`
- `app/routes/settings.tsx`
- `app/services/api.ts`

## Config Files
- `wrangler.jsonc`: Worker entry, `DOMAINS`, `EMAIL_ADDRESSES`, R2, send binding, AI binding, DO bindings.
- `.dev.vars.example`: Access development env surface.
- `package.json`: build, dev, deploy, typecheck scripts.

## Planning Implication
- Clone/fork upstream first, then perform local baseline audit before edits.
- Reuse mailbox DO SQLite and R2; do not introduce D1 in V1.
- Keep Email Service and Access integration.
- Add provisioned-email identity guard around mailbox access.
- Replace email-reader emphasis with DM-style thread rendering.
- Extend attachment UI for image paste/drop, preview, and private delivery.

## Unresolved Questions
- Exact helper filenames under `workers/lib/*` require source clone before implementation.
- Existing test harness requires audit after clone; root package scripts expose no test command in upstream `package.json`.
