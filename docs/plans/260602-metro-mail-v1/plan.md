---
title: "Metro Mail V1 Implementation Plan"
description: "Phased plan to fork agentic-inbox into an internal-only Metro Mail V1 on Cloudflare."
status: approved
priority: P2
effort: 9d
branch: metro-mail-v1
tags: [metro-mail, cloudflare, workers, durable-objects, r2]
created: 2026-06-02
---
# Metro Mail V1 Implementation Plan

> **For agentic workers:** Required execution skill: use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Execute phases in order and update checkbox progress.

Goal: fork `cloudflare/agentic-inbox` into a single-company internal mail app with chat-style inbox, Access OTP auth, external send/receive, reply, and private image delivery.

Defaults locked for V1:
- Access OTP only; single company domain; one mailbox per internal user.
- External send/receive enabled; reply included; forward deferred.
- Durable Objects SQLite + private R2 retained; AI/MCP deferred; shared mailbox deferred.
- Images: JPEG/PNG/WebP only at launch; Worker-authenticated private retrieval.
- Limits: `10MB` per image, `25MB` total message payload.

Constraints:
- Cloudflare account login and production domain/mailbox values are still required before deploy.
- Local SSR UI smoke is blocked by the Cloudflare Vite runner `bad allocation`; API smoke and production build pass.

Verification commands:
```bash
npm install
npm test
npm run typecheck
npm run build
```

## Phases
| Phase | Status | Progress | Output |
|---|---|---:|---|
| [Phase 01](./phase-01-upstream-clone-audit.md) | completed | 100% | Fork/clone baseline, source audit, file map |
| [Phase 02](./phase-02-access-identity-provisioning.md) | completed | 100% | Access auth, mailbox identity guard, config allowlist |
| [Phase 03](./phase-03-mailflow-chat-thread.md) | in progress | 35% | External receive/send and reply retained; DM-style polish pending |
| [Phase 04](./phase-04-private-images-attachments.md) | in progress | 80% | Private R2 images, paste/drop/upload flow; visual verification pending |
| [Phase 05](./phase-05-hardening-verification-deploy.md) | in progress | 85% | Live demo deployed; Access OTP and Email Routing hardening pending |

## Notes
- Reuse upstream search only if low-friction after audit; not a blocker for first inbox flow.
- Phase order follows lowest-risk path: source first, auth boundary second, then mail UX and blobs.
- [Implementation checkpoint](./reports/04-implementation-checkpoint.md)
- [Demo security follow-ups](./reports/05-demo-security-followups.md)

## Inputs
- [Scope](./reports/01-product-scope-report.md)
- [Upstream map](./reports/02-upstream-source-map.md)
- [Cloudflare fit](./research/researcher-01-upstream-cloudflare.md)
- [Auth + images](./research/researcher-02-v1-auth-images.md)
- [Local baseline](./scout/scout-01-local-baseline.md)
