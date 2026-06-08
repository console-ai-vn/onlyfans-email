# VSBG Box — System Architecture

| Field | Value |
|---|---|
| **Last updated** | 2026-06-08 |
| **Worker** | `vsbg-box` (`workers/app.ts`) |
| **Custom domains** | `box.vsbg.vn` (auth), `start.vsbg.vn` (public) |
| **Trust boundary** | Cloudflare Access JWT |

---

## 1. High-Level Diagram

```
Browser (React 19 + RR7 SSR)
  Routes: / (landing) → /app (home) → /mailbox/:id → { email-list | settings | search }
  State:  TanStack Query (server) + Zustand (UI) + useComposeForm (local)
  All API calls → /api/v1/* (no client auth; CF Access sets JWT cookie)
            │
            ▼ HTTPS
Cloudflare Access (Zero Trust) — JWT cookie on box.vsbg.vn
  start.vsbg.vn is in PUBLIC_HOSTNAMES → no Access check.
            │
            ▼
Hono Worker — workers/app.ts
  app.use("*")  → Access JWT middleware (fail-closed in prod)
  app.all("/mcp", ...) / app.all("/mcp/*", ...) → EmailMCP DO (20 tools)
  app.route("/", apiApp)            ← /api/v1/* (auth) + /api/public/* (no auth)
  app.all("*", requestHandler)      → React Router SSR catch-all
  default.email(...)                → Cloudflare Email Routing inbound
            │
            ▼
   ┌────────────────────────┬─────────────────────┬────────────────────────┐
   ▼                        ▼                     ▼                        ▼
MailboxDO             EmailAgent DO         EmailMCP DO              R2 Bucket
(SQLite)              AIChatAgent           20 MCP tools             "vsbg-box"
Per-mailbox           13 email tools        via /mcp
isolation             kimi-k2.5            Exposed to               mailboxes/<email>.json
11 SQL migrations     onNewEmail →         external AI              attachments/<emailId>/<attId>/<file>
• folders             auto-draft           clients                  signup-requests/<ts>-<uuid>.json
• emails              Persistent chat
• attachments         history.
• contacts            Workers AI:
• conversation_       • kimi-k2.5
  participants       • llama-3.1-8b injection check
• conversation_state  • llama-4-scout draft verify
• internal_notes
• conversation_events

Inbound mail:  CF Email Routing catch-all on "vsbg.vn"
                → default.email handler → postal-mime parse
                → MailboxDO.inbox (threaded by In-Reply-To / References)

Outbound mail: MailboxDO → getRecipientRouting
                → internal recipients: deliverInternalEmail (DO-to-DO direct write)
                → external recipients: 403 "internal-only"
                (Email Service binding used only if ALLOW_FORWARDING + external)
```

---

## 2. Data Flow

### 2.1 Send an Email (User Action)

```
[UI] ComposePanel / ComposeEmail
     → useComposeForm.send()  (validates To/Subject, builds base64 attachments)
     → useSendEmail() mutation
     → POST /api/v1/mailboxes/:id/emails  (SendEmailRequestSchema)
        [worker] validateSender(to, from, mailboxId)        → 400 on SenderValidationError
        [worker] generateMessageId(fromDomain)
        [worker] checkSendRateLimit()                       → 429 on 20/hr or 100/day
        [worker] getRecipientRouting(env, { to, cc, bcc })  → 403 "internal-only" on external
        [worker] storeAttachments(BUCKET, messageId)        → R2 put
        [worker] stub.createEmail(Folders.SENT, ...)        → SQLite insert
        [worker] deliverInternalEmail(env, ...)              → DO-to-DO direct write per recipient
        ← 202 { id, status: "sent" }
     [UI] invalidate queryKeys.emails.list(mailboxId, "sent")
```

### 2.2 Receive an Email (Inbound)

```
[CF] Email Routing catch-all on "vsbg.vn" → Worker email handler
     → default.email(event, env, ctx)         (workers/app.ts:132-147)
     → receiveEmail(event, env, ctx)          (workers/index.ts:508-575)
        [parse]  postal-mime.parse(event.raw)
        [pick]   recipient from EMAIL_ADDRESSES (case-insensitive)
        [thread] use In-Reply-To / References, else subject normalization
        [store]  MailboxDO.createEmail(Folders.INBOX, ...)
                 + storeAttachments(BUCKET, messageId, attachments) — JPEG/PNG/WebP only
        ← re-throw on error so CF can retry/bounce
[Agent] EmailAgent.onNewEmail(email)
        [guard] isPromptInjection(body)        → true: skip auto-draft (fail-closed on AI error)
        [guard] isPromptInjection(threadCtx)   → true: skip auto-draft
        [draft] generateText with kimi-k2.5
                 → toolDraftReply called OR inline text → MailboxDO.createEmail(Folders.DRAFT, ...)
        ← draft visible in Drafts; click "Edit & send in composer" to confirm
```

### 2.3 AI Auto-Draft → User Sends

```
[UI] AgentPanel detects "has_draft" in list OR user opens Drafts folder
     → user clicks "Edit & send in composer"
     → useUIStore.startCompose({ mode: "new", draftEmail })
     → useComposeForm loads draft body + attachments
     → user edits, clicks Send
     → useSendEmail() mutation as in §2.1 (thread_id preserved from draft)
```

### 2.4 Search (User Action)

```
[UI] search input in Header (URL-synced: ?q=...)
     → user types "from:alice has:attachment is:unread"
     → useSearchEmails({ q: "alice", hasAttachment: true, isRead: false })
        [parse] parseSearchQuery("from:alice has:attachment is:unread")
                → { from: "alice", has_attachment: true, is_read: false, query: "alice" }
     → GET /api/v1/mailboxes/:id/search?from=alice&has_attachment=true&is_read=false
        [worker] MailboxDO.searchEmails(...)  → SELECT … FROM emails WHERE …
        ← { emails: [...], totalCount: N }
     [UI] search-results.tsx renders with match highlighting + pagination (PAGE_SIZE = 25)
```

### 2.5 Attachment Download

```
[UI] User clicks "Download" on EmailAttachmentList
     → GET /api/v1/mailboxes/:mailboxId/emails/:emailId/attachments/:attachmentId
        [worker] requireMailbox middleware (loads DO stub + access check)
        [worker] MailboxDO.getAttachment(emailId, attachmentId)  → ownership check
        [worker] BUCKET.get(attachments/<emailId>/<attachmentId>/<filename>)  → R2 object
        ← 200 with Content-Disposition + binary body
[UI] downloadFile(blob, filename) in lib/utils.ts triggers browser save
```

### 2.6 Conversation State / Notes / Events (V1.5)

```
[UI] User opens EmailPanel → SocialContextSheet (or MobileSocialInboxCard)
     → PATCH /api/v1/mailboxes/:id/threads/:threadId/state
        { status: "waiting", priority: "high", assignee_email: "...", needs_reply: true }
        [worker] normalizeConversationStatePatch(...)
        [worker] MailboxDO.updateConversationState(threadId, patch)
                 → UPSERT conversation_state + INSERT conversation_events('state_updated')
     → POST /api/v1/mailboxes/:id/threads/:threadId/notes
        { body: "Call back at 3pm" }
        [worker] normalizeInternalNoteBody(body)  (max 5000 chars)
        [worker] MailboxDO.createInternalNote(threadId, authorEmail, body)
                 → INSERT internal_notes + INSERT conversation_events('note_created')
     → GET /api/v1/mailboxes/:id/threads/:threadId/events
        ← array of { type, actor_email, created_at, payload }
```

### 2.7 MCP Tool Call (External AI Client)

```
[External] Claude Code / Cursor → HTTPS POST to https://box.vsbg.vn/mcp
        (CF Access JWT must be present)
[Worker] DO routing → EmailMCP DO instance
        → tools/list  → 20 tools (list_mailboxes, list_emails, get_email, get_thread,
                          get_contact_profile, get_conversation_context,
                          create_internal_note, update_conversation_state,
                          search_emails, draft_reply, create_draft, update_draft,
                          delete_email, send_reply, send_email,
                          mark_email_read, move_email, …)
        → tools/call  → shared business logic (workers/lib/tools.ts) → typed JSON
```

---

## 3. Database Schema

**No D1.** All data lives in **Durable Object SQLite storage** inside each `MailboxDO` instance. Each mailbox is its own DO; the DO ID is derived from the mailbox email (lowercased). True per-mailbox isolation.

`workers/db/schema.ts` is a Drizzle type schema (not a D1 binding). The actual DDL is inline in `workers/durableObject/migrations.ts` and applied automatically when the DO is constructed.

### 3.1 Tables

#### `folders` (V1)

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PRIMARY KEY |
| `name` | TEXT | NOT NULL UNIQUE |
| `is_deletable` | INTEGER | NOT NULL DEFAULT 1 |

#### `emails` (V1, extended in V1.5)

| Column | Type | Constraints | Added in migration |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | #1 |
| `folder_id` | TEXT | NOT NULL, FK → `folders(id)` ON DELETE CASCADE | #1 |
| `subject` / `sender` / `recipient` | TEXT | nullable | #1 |
| `cc` / `bcc` | TEXT | nullable | **#7** |
| `date` | TEXT | nullable (ISO 8601) | #1 |
| `read` / `starred` | INTEGER | DEFAULT 0 | #1 |
| `body` | TEXT | nullable (HTML or plain text) | #1 |
| `in_reply_to` / `email_references` / `thread_id` | TEXT | nullable | **#2** |
| `message_id` | TEXT | nullable (RFC 822 Message-ID) | **#4** |
| `raw_headers` | TEXT | nullable (JSON) | **#5** |

**Indexes** (created in migrations #2 and #8):
`idx_emails_thread_id`, `idx_emails_in_reply_to`, `idx_emails_folder_id`, `idx_emails_date`, `idx_emails_folder_date` (composite).

#### `attachments` (V1)

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PRIMARY KEY |
| `email_id` | TEXT | NOT NULL, FK → `emails(id)` ON DELETE CASCADE |
| `filename` / `mimetype` | TEXT | NOT NULL |
| `size` | INTEGER | NOT NULL |
| `content_id` | TEXT | nullable (for `cid:` inline references) |
| `disposition` | TEXT | nullable (`"attachment"` / `"inline"`) |

#### `contacts` (V1.5 — migration #9)

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PRIMARY KEY (deterministic: `contact:<email>`) |
| `email` | TEXT | NOT NULL UNIQUE |
| `display_name` | TEXT | nullable |
| `first_seen_at` / `last_seen_at` | TEXT | NOT NULL DEFAULT (datetime('now')) |

#### `conversation_participants` (V1.5 — migration #9)

| Column | Type | Constraints |
|---|---|---|
| `thread_id` | TEXT | NOT NULL (composite PK) |
| `contact_id` | TEXT | NOT NULL (composite PK), FK → `contacts(id)` |
| `first_seen_at` / `last_seen_at` | TEXT | NOT NULL DEFAULT (datetime('now')) |

Indexes: `idx_contacts_email` (UNIQUE), `idx_conversation_participants_thread`, `idx_conversation_participants_thread_contact` (UNIQUE).

#### `conversation_state` (V1.5 — migration #10)

| Column | Type | Constraints |
|---|---|---|
| `thread_id` | TEXT | PRIMARY KEY |
| `assignee_email` | TEXT | nullable |
| `status` | TEXT | NOT NULL DEFAULT `'open'` (`open` / `waiting` / `done`) |
| `priority` | TEXT | NOT NULL DEFAULT `'normal'` (`low` / `normal` / `high`) |
| `needs_reply` | INTEGER | NOT NULL DEFAULT 0 |
| `last_seen_at` | TEXT | nullable |
| `updated_at` | TEXT | NOT NULL DEFAULT (datetime('now')) |

Indexes: `idx_conversation_state_status`, `idx_conversation_state_assignee`.

#### `internal_notes` (V1.5 — migration #11)

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PRIMARY KEY |
| `thread_id` | TEXT | NOT NULL |
| `author_email` | TEXT | NOT NULL |
| `body` | TEXT | NOT NULL (max 5000 chars; enforced in `normalizeInternalNoteBody`) |
| `created_at` / `updated_at` | TEXT | NOT NULL DEFAULT (datetime('now')) |

#### `conversation_events` (V1.5 — migration #11)

| Column | Type | Constraints |
|---|---|---|
| `id` | TEXT | PRIMARY KEY |
| `thread_id` | TEXT | NOT NULL |
| `type` | TEXT | NOT NULL (`email_received` / `email_sent` / `note_created` / `state_updated`) |
| `actor_email` | TEXT | nullable |
| `payload` | TEXT | nullable (JSON) |
| `created_at` | TEXT | NOT NULL DEFAULT (datetime('now')) |

### 3.2 Storage Outside SQLite

| What | Where | Key pattern |
|---|---|---|
| Mailbox settings (JSON) | R2 | `mailboxes/<email>.json` |
| Attachment binaries | R2 | `attachments/<emailId>/<attachmentId>/<sanitized-filename>` |
| Signup requests | R2 | `signup-requests/<iso-ts>-<uuid>.json` |

### 3.3 Migrations — **11 total** (was 8 in older docs)

Tracked in a `d1_migrations` table (id, name, applied_at) inside the DO SQLite. Applied automatically in the `MailboxDO` constructor via `applyMigrations()` (`workers/durableObject/migrations.ts:17-60`).

| # | Name | Purpose |
|---|---|---|
| 1 | `1_initial_setup` | Create 3 tables; seed `inbox`, `sent`, `trash`, `archive`, `spam` |
| 2 | `2_add_email_threading` | Add `in_reply_to`, `email_references`, `thread_id` + indexes |
| 3 | `3_add_draft_folder` | Seed `draft` |
| 4 | `4_add_message_id` | Add `message_id` column |
| 5 | `5_add_raw_headers` | Add `raw_headers` column |
| 6 | `6_mark_sent_emails_as_read` | One-time `UPDATE` to mark `sent` folder emails as read |
| 7 | `7_add_cc_bcc` | Add `cc`, `bcc` columns |
| 8 | `8_add_folder_date_indexes` | `idx_emails_folder_id`, `idx_emails_date`, `idx_emails_folder_date` (idempotent) |
| 9 | `9_add_social_graph` | `contacts` + `conversation_participants` (V1.5) |
| 10 | `10_add_conversation_state` | `conversation_state` (V1.5) |
| 11 | `11_add_internal_notes_events` | `internal_notes` + `conversation_events` (V1.5) |

---

## 4. Cloudflare Bindings (`wrangler.jsonc`)

| Binding | Kind | Class / Target | Notes |
|---|---|---|---|
| `BUCKET` | R2 bucket | `vsbg-box` (prod) / `vsbg-box-local` (dev) | Attachments + mailbox settings JSON + signup requests |
| `EMAIL` | `send_email` | CF Email Service | **⚠ Not in `wrangler.jsonc`; only in `wrangler.local.jsonc` (remote=false).** Prod outbound send 502s until added. |
| `AI` | Workers AI | binding | All AI calls |
| `MAILBOX` | DO namespace | `MailboxDO` | 1 DO per mailbox |
| `EMAIL_AGENT` | DO namespace | `EmailAgent` | 1 DO per mailbox (chat history) |
| `EMAIL_MCP` | DO namespace | `EmailMCP` | 1 shared DO (MCP server) |

**Env vars** (public, in `wrangler.jsonc vars`):
- `DOMAINS` / `EMAIL_ADDRESSES` / `ACCESS_EMAIL_ADDRESSES` — see root README.
- `POLICY_AUD` / `TEAM_DOMAIN` — CF Access. **Should be secrets** (see TODO § 9).
- `DEMO_MODE` — `"true"` bypasses Access. **Never set in production.**

**Migrations** (`wrangler.jsonc:62-81`): 3 tags (`v1`, `v2`, `v3`) for `MailboxDO`, `EmailAgent`, `EmailMCP` SQLite DOs.
**Routes** (`wrangler.jsonc:6-15`): `box.vsbg.vn` (Access), `start.vsbg.vn` (public).
**Observability** (`wrangler.jsonc:16-18`): enabled. **No KV, no Queues, no Analytics Engine, no D1.**

**Local override** (`wrangler.local.jsonc`): name `vsbg-box-local`, `EMAIL.remote=false` (mailpit-style), `EMAIL_ADDRESSES: []`, separate `vsbg-box-local` R2 bucket.

---

## 5. Auth Flow (Production)

```
Browser (any page on box.vsbg.vn)
  │  GET https://box.vsbg.vn/mailbox/admin@vsbg.vn
  ▼
Cloudflare Access (Zero Trust policy)
  │  - User not authenticated?  → 302 to Access login
  │  - User authenticated?      → Set Cf-Access-Jwt-Assertion cookie + header
  ▼
Hono Worker (workers/app.ts:67-111)
  │  app.use("*", async (c, next) => {
  │    if (isPublicRequest(c.req.raw))      → c.set("accessEmail", ""); return next();
  │    if (import.meta.env.DEV)             → c.set("accessEmail", header("x-dev-user-email") || "")
  │    if (c.env.DEMO_MODE === "true")      → c.set("accessEmail", EMAIL_ADDRESSES[0])
  │    if (!POLICY_AUD || !TEAM_DOMAIN)     → 500 (fail-closed)
  │    const token = c.req.header("cf-access-jwt-assertion")
  │    if (!token)                          → 403 "Missing required CF Access JWT"
  │    const JWKS = createRemoteJWKSet(certsUrl)
  │    const { payload } = await jwtVerify(token, JWKS, { issuer, audience: POLICY_AUD })
  │    c.set("accessEmail", getAccessEmail(payload))
  │  })
  ▼
API handlers (workers/index.ts)
  │  - filterMailboxIdsForAccess(accessEmail, EMAIL_ADDRESSES, ACCESS_EMAIL_ADDRESSES)
  │  - assertMailboxAccess(accessEmail, mailboxId, ...)
  │  - In Hono context: c.var.accessEmail
  ▼
MailboxDO operations
```

### 5.1 Per-Mailbox Authorization (`workers/lib/access.ts`)

| User type | Can access |
|---|---|
| Owner (`accessEmail === mailboxId`) | Their own mailbox only |
| Privileged (`accessEmail ∈ ACCESS_EMAIL_ADDRESSES`) | All mailboxes in `EMAIL_ADDRESSES` |
| Other (passed CF Access but not in any of the above) | Nothing |

`filterMailboxIdsForAccess()` is used in list endpoints. `assertMailboxAccess()` is used as a per-route guard.

### 5.2 Public Auth Bypass (`workers/app.ts:50-64`)

- `start.vsbg.vn` is in `PUBLIC_HOSTNAMES`.
- Paths `/`, `/signup`, `/api/public/signup-requests` (POST only), and static assets are unauthenticated.
- All other hostnames require Access.

### 5.3 MCP Authorization

The MCP server at `/mcp` reuses the same `c.var.accessEmail`. Caller passes a `mailboxId` parameter to scope tool calls. **Trust is shared** with the web app.

---

## 6. Feature Flags

| Flag | Default | Where | Effect |
|---|---|---|---|
| `ALLOW_FORWARDING` | **`true`** | `workers/index.ts:38` | `POST /api/v1/.../emails/:id/forward` returns 404 when `false`. Currently ON. |
| `ALLOW_MAILBOX_DELETION` | `false` | `workers/index.ts:39` | `DELETE /api/v1/mailboxes/:id` returns 405 when `false`. |
| `SHOW_AGENT_SETTINGS` | `false` (UI-gated) | `app/routes/settings.tsx` | The "Agent system prompt" editor is hidden when `false`. |
| `DEMO_MODE` | unset | `workers/app.ts:78-82` | Bypasses CF Access JWT check. **Never set in production.** |

---

## 7. Threading Strategy

| Step | Source | Code |
|---|---|---|
| 1. Primary threading by `In-Reply-To` / `References` | RFC 822 | `findThreadByHeaders` (in DO) |
| 2. Fallback: subject normalization (strip `Re:`, `Fwd:`, `FW:`, `AW:`, `WG:`, `Réf:`, `SV:`) + 7-day window + 50 most-recent threads | Heuristic | `findThreadBySubject` |
| 3. Aggregation: complex CTE merges by `thread_id` and subject groups; computes `thread_count`, `thread_unread_count`, `participants`, `needs_reply`, `has_draft`, conversation state | SQL | `getThreadedEmails` (`workers/durableObject/index.ts`) |

Thread ID is stored on every email (`thread_id` column). When no header heuristic applies, the message ID is used as the thread ID.

---

## 8. Rate Limiting

- **Outbound send:** 20 emails/hr and 100 emails/day per mailbox.
- Implementation: raw SQL count queries in `MailboxDO.checkSendRateLimit()`.
- Returns `429` with an error message when exceeded.
- No global rate limit at the worker level (Cloudflare's built-in rate limits apply separately).

---

## 9. Known TODOs / Limitations

| Location | Issue | Suggested fix |
|---|---|---|
| `workers/index.ts:235` | `await c.env.BUCKET.delete(key); // TODO: also delete DO data and R2 attachment blobs` | Mailbox deletion disabled (`ALLOW_MAILBOX_DELETION = false`); would leak data if enabled. Fix: enumerate R2 `attachments/<emailId>/...` keys + `storage.sql.exec("DELETE FROM emails WHERE folder_id IN ...")` + `c.env.MAILBOX.delete(id)` |
| `workers/index.ts:330` | `if (draft_id) await stub.deleteEmail(draft_id); // not atomic` | Draft save race. Fix: single SQL `INSERT OR REPLACE` after a `WHERE id = draft_id` check, or `storage.transactionSync`. |
| `workers/index.ts:38-39` | `ALLOW_FORWARDING` + `ALLOW_MAILBOX_DELETION` hardcoded | Promote to env vars. |
| `wrangler.jsonc:33-34` | `POLICY_AUD` + `TEAM_DOMAIN` in `vars` (not `secret`) | Move to `wrangler secret put`. |
| `wrangler.jsonc` (missing) | No `send_email` block | Add it for production outbound send (see [`deployment-guide.md`](./deployment-guide.md) § 3.4). |
| `workers/durableObject/index.ts` `getThreadEmails` | `upsertSocialGraphForEmail` runs on every read (N+1) | Batch upsert, debounce, or move to a write-time hook. |
| `app/components/EmailIframe.tsx` | No automated CSP test for inbound HTML | Add unit test that runs DOMPurify + asserts `<script>`, `onerror=`, `javascript:` URLs are stripped. |
| `app/components/MCPPanel.tsx:48-63` | Hardcodes 14 tools, server exposes 20 | Move to a `useMCPTools()` query that hits `/mcp` `tools/list`. |
| `app/components/*` (3 places) | `window.confirm` bypasses design system | Replace with Kumo `Dialog` + `<Banner variant="warning">`. |
| `app/entry.server.tsx` | 2-space indent (legacy from upstream fork) | Reformat to tabs. |
| (gap) | No ESLint / Prettier config | See [`code-standards.md`](./code-standards.md) § 9. |
| (gap) | No app-level CSP `<meta>` in `app/root.tsx` | Add a strict CSP in the worker response for non-iframe HTML. |
| (gap) | No CI | Manual typecheck/test/lint only. |
| (gap) | Mailbox settings edits stored in R2 only — no DO cache, no broadcast to other open tabs | Acceptable for V1; consider DO fanout for V2. |
| (gap) | `DEMO_MODE` not gated by env assertion in prod | Add a startup check that throws if `DEMO_MODE === "true"` and `import.meta.env.MODE === "production"`. |

---

## 10. Operational Notes

- **Cold start:** ~100-300ms for first-time access to a mailbox DO; < 50ms after.
- **Storage cost:** Mailbox SQLite + R2 are billed per GB-month. Consider archival in V2.
- **No backup policy.** DO SQLite and R2 are durable within CF; no off-platform backup.
- **No multi-region replication.** DOs are region-pinned; R2 is global.
- **Internal-only delivery:** External recipients blocked at the API (`getRecipientRouting`).

---

## 11. Quick Links

[`codebase-summary.md`](./codebase-summary.md) · [`code-standards.md`](./code-standards.md) · [`project-overview-pdr.md`](./project-overview-pdr.md) · [`project-roadmap.md`](./project-roadmap.md) · [`deployment-guide.md`](./deployment-guide.md) · [`design-guidelines.md`](./design-guidelines.md) · `wrangler.jsonc` · `wrangler.local.jsonc`
