# Research 1: Upstream Cloudflare fit for Metro Mail V1

## Scope
- Source: official upstream `cloudflare/agentic-inbox` + official Cloudflare docs only.
- Goal: identify reusable architecture, likely touch points, and setup/runtime constraints for a single-company custom-domain email app with identity-per-address, external send/receive, threaded chat-like UI, and image attachments.

## What upstream already gives us
- `cloudflare/agentic-inbox` is a self-hosted email client on Cloudflare Workers.
- Inbound email is via Cloudflare Email Routing.
- Each mailbox is isolated in its own Durable Object with SQLite storage.
- Attachments are stored in R2.
- AI agent uses Cloudflare Agents SDK + Workers AI.
- Auth in production uses Cloudflare Access JWT validation.

## Reusable architecture for Metro Mail V1
- Keep the same boundary split:
  - Worker/Hono API + SSR shell.
  - Per-mailbox Durable Object for state, threads, drafts, message metadata, agent context.
  - R2 for blobs/attachments/images.
  - Email Routing for inbound external mail.
  - Email Service for outbound mail.
  - Cloudflare Access as the production trust boundary.
- This maps well to “one provisioned address = one identity”.
- Chat-style threads fit the mailbox DO model because each address needs isolated state and conversation history.
- Image sending should reuse the same outbound email attachment path as other file attachments; no new storage primitive needed if R2-backed blobs are already wired.

## Exact upstream folders/files likely touched
- Visible repo root from GitHub:
  - `app/`
  - `public/`
  - `shared/`
  - `workers/`
  - `.dev.vars.example`
  - `react-router.config.ts`
  - `vite.config.ts`
  - `wrangler.jsonc`
- Likely implementation touch set, based on architecture:
  - `workers/*` for email/webhook handlers, DO classes, send flow, Access auth, routing.
  - `app/*` for inbox UI, thread view, composer, agent panel, auth gates.
  - `shared/*` for schemas, types, API contracts, helpers.
  - `wrangler.jsonc` for domain, DO namespaces, R2 binding, Email Service binding, Access config.
  - `.dev.vars.example` for local env shape.

## Cloudflare docs signals
- Durable Objects:
  - New namespaces should use SQLite storage.
  - DO storage is transactional/strongly consistent.
  - SQLite-backed DOs support SQL API, PITR, sync KV, alarms.
- R2:
  - S3-compatible, strongly consistent object storage.
  - Architecture uses Workers gateway, metadata service, tiered cache, distributed storage.
  - Good fit for attachments/images.
- Email Routing:
  - Custom addresses route incoming mail to a destination.
  - For new projects, Cloudflare now points people to Email Service docs.
  - Existing routing configs still work.
- Email Service:
  - Send mail from Workers binding or REST API.
  - Must use Cloudflare DNS.
  - Supports attachments and custom headers.
  - Local dev can use real sending through remote bindings.
- Access:
  - Worker should validate Cloudflare Access JWT on incoming requests.
  - Upstream setup uses one-click Access and worker secrets for `POLICY_AUD` and `TEAM_DOMAIN`.

## Setup/deploy flow to reuse
- `npm install`
- `npm run dev`
- Set domain in `wrangler.jsonc`
- Create R2 bucket `agentic-inbox`
- Deploy to Cloudflare
- Enable Cloudflare Access on the Worker
- Set `POLICY_AUD` and `TEAM_DOMAIN`
- Create Email Routing catch-all to the Worker
- Enable Email Service `send_email` binding
- Create mailbox in the app

## Fit / gaps for Metro Mail V1
- Strong fit:
  - single-company, custom-domain, per-identity inboxes
  - persistent threaded state
  - attachments/images
  - production auth via Access
- Likely gap to solve:
  - provisioning workflow for identities/mailboxes at scale
  - explicit mapping between “employee identity” and provisioned email address
  - internal admin controls for mailbox creation/deactivation

## Sources
- https://github.com/cloudflare/agentic-inbox
- https://developers.cloudflare.com/durable-objects/
- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/email-routing/
- https://developers.cloudflare.com/email-routing/get-started/
- https://developers.cloudflare.com/email-service/get-started/send-emails/
- https://developers.cloudflare.com/email-service/concepts/email-lifecycle/
- https://developers.cloudflare.com/email-service/examples/email-sending/email-attachments/
- https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/index.md
- https://developers.cloudflare.com/r2/how-r2-works/

## Unresolved questions
- Exact subfiles in `app/`, `workers/`, `shared/` that own mailbox DO, email agent DO, and attachment pipeline are not visible from the GitHub tree view I used.
- Need repo clone or raw file access to name precise implementation files before planning edits.
- Need confirmation whether Metro Mail V1 should keep AI agent behavior from upstream or only reuse the email/thread/storage skeleton.
