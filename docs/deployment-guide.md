# VSBG Box — Deployment Guide

End-to-end walkthrough for deploying VSBG Box to Cloudflare. Covers local dev, R2, Email Routing, Email Service, Cloudflare Access, secrets, and the actual `wrangler deploy`.

> **Audience:** solo dev / small team. No CI yet — these steps are manual.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | ≥ 20.x | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| pnpm | 11.5.0 | `pnpm --version` |
| wrangler | ^4.96.0 (devDep) | `npx wrangler --version` |
| Cloudflare account | with Email Routing enabled for `vsbg.vn` | dashboard |

```bash
npx wrangler login   # OAuth flow, one-time per machine
```

---

## 2. First-time setup

```bash
git clone <repo>
cd "Email Web"
pnpm install
```

### 2.1 Local R2 bucket

Required for `wrangler.local.jsonc` to bind `BUCKET` correctly.

```bash
wrangler r2 bucket create vsbg-box-local
```

If you skip this, `pnpm dev` will fail with `BUCKET: undefined`.

### 2.2 Local secrets (`.dev.vars`)

Copy the example and fill in:

```bash
cp .dev.vars.example .dev.vars
```

Minimum required for local dev (Access bypassed via `x-dev-user-email` header):

```ini
# .dev.vars (gitignored)
POLICY_AUD=local-placeholder
TEAM_DOMAIN=local.cloudflareaccess.com
```

> `import.meta.env.DEV` skips JWT validation entirely in local. The values above are never sent anywhere. Don't set `DEMO_MODE` for normal local dev.

### 2.3 Run

```bash
pnpm dev      # http://localhost:5173, vite + RR + wrangler bindings
```

To impersonate a mailbox in the browser dev tools:

```http
x-dev-user-email: admin@vsbg.vn
```

---

## 3. Production deploy

### 3.1 Production R2 bucket

```bash
wrangler r2 bucket create vsbg-box
```

### 3.2 Custom domains

Two custom domains in `wrangler.jsonc` `routes`:

| Hostname | Purpose | Access? |
|---|---|---|
| `box.vsbg.vn` | The app (mailbox UI, API, MCP) | Yes (CF Access) |
| `start.vsbg.vn` | Public landing + signup form (`/`, `/signup`) | No (`PUBLIC_HOSTNAMES`) |

DNS is managed by Cloudflare once the zone is added; just attach the custom domains from the Worker settings (or keep the `routes` block in `wrangler.jsonc`).

### 3.3 Email Routing

In the Cloudflare dashboard:

1. **Email Routing → Routes** for `vsbg.vn`.
2. Create a **catch-all** rule → action: **Send to Worker** → select `vsbg-box`.

Without this, inbound mail is dropped at the edge.

### 3.4 Email Service (send_email binding)

**This is the step most likely to be missed.** Production outbound mail requires the `EMAIL` binding.

⚠ **As of this writing, the `send_email` block is in `wrangler.local.jsonc` but NOT in `wrangler.jsonc`.** Production deploys will not be able to send external email until you add it:

```jsonc
// wrangler.jsonc — add this block
"send_email": [
	{
		"name": "EMAIL",
		"remote": true
	}
]
```

Then in the dashboard:

1. **Email → Email Service → Enable** for the `vsbg.vn` zone.
2. Grant the `send_email` permission to the `vsbg-box` Worker.

If you skip this, the worker binds `EMAIL` to `undefined` and every outbound send returns 502.

> **Note:** the app is **internal-only** by design (`getRecipientRouting` blocks external recipients at the API). The `EMAIL` binding is only used if you flip `ALLOW_FORWARDING` and forward to external mailboxes.

### 3.5 Cloudflare Access

1. **Workers → `vsbg-box` → Settings → Domains & Routes → Add** (or use **one-click Access**).
2. Cloudflare shows a modal with `POLICY_AUD` and `TEAM_DOMAIN`. **Copy both.**
3. Set as Worker secrets:

```bash
wrangler secret put POLICY_AUD
# paste the value from the modal

wrangler secret put TEAM_DOMAIN
# paste the value from the modal
```

**The secrets are read at runtime** via `c.env.POLICY_AUD` and `c.env.TEAM_DOMAIN`. The `vars` values in `wrangler.jsonc` are kept only for local convenience (see tech debt in [`project-roadmap.md`](./project-roadmap.md) § 3.1).

### 3.6 Email addresses

In `wrangler.jsonc` `vars` (or `wrangler secret put` if you prefer):

```jsonc
"vars": {
  "DOMAINS": "vsbg.vn",
  "EMAIL_ADDRESSES": ["admin@vsbg.vn", "test@vsbg.vn"],
  "ACCESS_EMAIL_ADDRESSES": ["ceo@bdsmetro.com"]
}
```

| Var | Meaning |
|---|---|
| `DOMAINS` | Comma-separated list of Email Routing domains. |
| `EMAIL_ADDRESSES` | Allowed mailbox addresses. Filtering for inbound + creation gate. |
| `ACCESS_EMAIL_ADDRESSES` | Privileged users that can open every mailbox in `EMAIL_ADDRESSES`. |
| `DEMO_MODE` | **Never set in production.** `"true"` bypasses Access and uses first `EMAIL_ADDRESSES` entry. |

### 3.7 Deploy

```bash
pnpm deploy   # react-router build && wrangler deploy
```

Output: `Published vsbg-box (X.XXs)` + URL.

### 3.8 Smoke test

1. Visit `https://box.vsbg.vn` → Cloudflare Access login → land on `/app`.
2. The mailbox `admin@vsbg.vn` should auto-create (it's in `EMAIL_ADDRESSES`).
3. Send a test email from `admin@vsbg.vn` to a Gmail address — check it lands (or hits the "internal-only" 403 if Gmail is not in `EMAIL_ADDRESSES`).
4. Send an email **to** `admin@vsbg.vn` from Gmail → it should appear in Inbox within a few seconds.
5. Visit `https://start.vsbg.vn` → landing page, no Access prompt.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid or expired Access token` | `POLICY_AUD` or `TEAM_DOMAIN` wrong | Disable Access, re-enable, copy new values, re-run `wrangler secret put` |
| `Cloudflare Access must be configured in production` | Secrets missing | See § 3.5 |
| `BUCKET: undefined` in dev | R2 bucket not created | `wrangler r2 bucket create vsbg-box-local` |
| `EMAIL is not a function` / send returns 502 | `send_email` binding missing from `wrangler.jsonc` | See § 3.4 |
| Mailbox not auto-created on first visit | Mailbox email not in `EMAIL_ADDRESSES` | Add to `vars` and redeploy |
| Inbound email silently dropped | No Email Routing rule | Add catch-all rule pointing to Worker (§ 3.3) |
| `window.confirm` in dev tools | Outdated code | Refactor — see [`project-roadmap.md`](./project-roadmap.md) § V3-10 |

---

## 5. Local vs production summary

| Setting | Local (`wrangler.local.jsonc`) | Production (`wrangler.jsonc`) |
|---|---|---|
| Worker name | `vsbg-box-local` | `vsbg-box` |
| R2 bucket | `vsbg-box-local` | `vsbg-box` |
| `EMAIL` binding | `remote: false` (mailpit-style) | `remote: true` (Email Service) |
| Auth | `import.meta.env.DEV` → trust `x-dev-user-email` header | CF Access JWT (fail-closed) |
| Custom domains | none | `box.vsbg.vn`, `start.vsbg.vn` |
| DO migrations | `v1`, `v2`, `v3` (new_sqlite_classes) | same |

---

## 6. Rollback

```bash
wrangler rollback vsbg-box           # interactive
wrangler rollback vsbg-box --version-id <id>   # non-interactive
```

DO SQLite migrations are forward-only. Adding a column is safe. Removing a column requires a multi-deploy dance. **Never** edit a past migration's SQL.
