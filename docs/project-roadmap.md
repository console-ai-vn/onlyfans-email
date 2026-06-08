# VSBG Box — Project Roadmap

| Field | Value |
|---|---|
| **Last updated** | 2026-06-08 |
| **Status** | V1 + V1.5 shipped (internal use) |
| **Next milestone** | V2 (audit + retention) |

---

## 1. Current state

**V1** (core email client + AI + MCP) and **V1.5** (social/conversation layer) are both shipped and running on `box.vsbg.vn`.

### 1.1 Shipped in V1

- Cloudflare Access JWT auth, fail-closed in prod
- Mailbox CRUD + per-mailbox DO isolation
- Send / receive / reply / forward (internal-only)
- Threading by `In-Reply-To` / `References` + subject fallback (7-day window)
- Drafts, folders (system + custom), search (Gmail-style DSL)
- Image attachments (JPEG/PNG/WebP, 10MB/25MB)
- Rich-text composer (TipTap), sandboxed HTML iframe (DOMPurify + CSP)
- AI agent (kimi-k2.5) with auto-draft on inbound (prompt-injection scan, fail-closed)
- MCP server (20 tools) at `/mcp`
- Rate limit 20/hr, 100/day per mailbox

### 1.2 Shipped in V1.5 (was "V2-deferred" in older docs)

- Social graph (`contacts` + `conversation_participants`)
- Conversation state (status, priority, assignee, needs_reply)
- Internal notes (per-thread, max 5000 chars)
- Conversation events (received, sent, note_created, state_updated)
- Internal-only delivery — external recipients blocked at the API
- Mobile-friendly `MobileSocialInboxCard`, `ConversationStateControls`, `SocialContextSheet`
- Public landing page + signup form at `start.vsbg.vn`
- Forwarding enabled (`ALLOW_FORWARDING = true`)

> **The "V2 deferred" items in [`project-overview-pdr.md`](./project-overview-pdr.md) are now V1.5 shipped.** The PDR is being updated to reflect this. Don't trust the old "V2" labels for social/notes/state.

---

## 2. Next: V2 — Audit + Retention

Theme: **observability + control** for production use.

| ID | Item | Why | Effort |
|---|---|---|---|
| **V2-1** | Audit log table + read-only admin viewer | `metro-mail.txt:38, 73` — required for compliance review | M |
| **V2-2** | Retention policy (auto-archive Trash > 30d, Sent > 1y) | Storage cost control | M |
| **V2-3** | Move `POLICY_AUD` and `TEAM_DOMAIN` to `wrangler secret` | Currently in `vars` (see tech debt § 3.1) | S |
| **V2-4** | Per-mailbox permission model (read_email, send_email, …) | Replace single CF Access policy | L |
| **V2-5** | Domain management UI for admins | `metro-mail.txt:26, 62-63` | M |
| **V2-6** | Full mailbox deletion (R2 + DO cleanup) | `workers/index.ts:235` TODO | S |
| **V2-7** | App-level CSP `<meta>` in `app/root.tsx` | See tech debt § 3.2 | S |
| **V2-8** | CI pipeline (typecheck + test + lint) | See tech debt § 3.4 | M |

---

## 3. Backlog: V3 — Quality + Scale

Theme: **remove tech debt, harden the foundations.**

| ID | Item | Why | Effort |
|---|---|---|---|
| **V3-1** | ESLint + Prettier + `pnpm lint` / `format` | Hand-enforced rules are drifting | S |
| **V3-2** | Refactor `AgentPanel.tsx` (592 LOC) into smaller hooks | See tech debt § 3.5 | M |
| **V3-3** | Refactor `EmailPanel.tsx` (440 LOC), `home.tsx` (366), `email-list.tsx` (352) | Same | M |
| **V3-4** | Fix N+1 write on read in `getThreadEmails` (`workers/durableObject/index.ts`) — `upsertSocialGraphForEmail` runs on every read | Perf at scale | S |
| **V3-5** | Atomic draft save (delete + create in one transaction) | `workers/index.ts:330` TODO | S |
| **V3-6** | MCPPanel hardcoded 14 tools, server exposes 20 — sync | Drift | S |
| **V3-7** | `DEMO_MODE` env-assertion guard in prod | Fail-closed in prod | S |
| **V3-8** | Move `ALLOW_FORWARDING` + `ALLOW_MAILBOX_DELETION` to env vars | Per-environment override | S |
| **V3-9** | Replace 2-space indent in `app/entry.server.tsx` with tabs | Inconsistent | S |
| **V3-10** | Replace `window.confirm` (3 places) with Kumo `Dialog` | Bypasses design system | S |

---

## 4. Considered, rejected

| Idea | Why not |
|---|---|
| **IMAP / POP3 / SMTP clients** | Out of scope; we ARE the server. |
| **Mobile native apps** | Web is responsive; team is small. |
| **Multi-region replication** | DOs are pinned to a region by design; R2 is already global. |
| **Natural language search** | Gmail-style DSL ships in V1; NL is a research project. |
| **CRM layer** (`metro-mail.txt:81-84`) | Separate product line. |
| **Public-internet inbox** | Email is **internal-only** by design — see outbound guard in landing. |

---

## 5. Success metrics (North Star)

- **$10k MRR within 12 months** from one of: real estate content, CFP × AI advisory, DAIN framework.
- VSBG Box is the **internal tool that keeps the team unblocked** — not the product. Treat outages as P1.
- Time-to-first-email-from-cold-DO: < 300ms (current: ~100-300ms, see [`system-architecture.md`](./system-architecture.md) § Operational Notes).

---

## 6. See also

- [`project-overview-pdr.md`](./project-overview-pdr.md) — V1 scope, PDR, acceptance criteria.
- [`system-architecture.md`](./system-architecture.md) § 9 — full known TODOs.
- [`code-standards.md`](./code-standards.md) § 9 — linting gap.
- Root [`README.md`](../README.md) § "Known Limitations".
