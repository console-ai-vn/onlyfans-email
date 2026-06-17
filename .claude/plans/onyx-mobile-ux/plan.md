---
title: "ONYX Mobile-First UI-UX"
description: "Redesign ONYX to OnlyFans-style PWA with bottom tab bar, grid feed, swipe stories, native-like gestures — mobile-first, responsive desktop fallback."
status: completed
priority: P1
effort: 20h
branch: main
tags: [pwa, mobile-first, ui-ux, onlyfans-pattern]
blockedBy: []
blocks: []
created: "2026-06-17T11:26:02.818Z"
createdBy: "ck:plan"
source: skill
---

# ONYX Mobile-First UI-UX

## Overview

Transform ONYX web app into an OnlyFans-style **PWA** với mobile-first design: bottom tab bar (Feed/Explore/Create/DM/Profile), grid feed, swipe gestures, native-like animations. Desktop giữ responsive fallback với sidebar nav.

## Current State

- **Frontend:** React Router v7 + @cloudflare/kumo + TanStack Query + Tailwind v4
- **Routing:** `app/routes.ts` — index landing, /signup, /pricing, /:creatorId, /mailbox/:id/...
- **Components:** ~50+ components in `app/components/`
- **Auth:** Demo mode + CF Access in production
- **Backend:** Hono Workers, 7 DOs, R2, all APIs done
- **No PWA manifest, no service worker, no mobile gestures**

## Target UX (OnlyFans Pattern)

| Feature | Current | Target |
|---------|---------|--------|
| Navigation | Top nav + sidebar | Bottom tab bar (5 tabs) |
| Feed | List/inbox style | 2-col grid + swipe stories |
| Creator page | SSR page | Sticky CTA + grid content |
| DM/Inbox | Email folders | Chat-style inbox |
| Monetization | Pages | Modal bottom sheets |
| Mobile | Responsive (broken) | PWA with install prompt |
| Gestures | None | Swipe, pull-to-refresh, long-press |
| Transitions | None | Page slide, tab fade |

## Architecture

```
                    ┌──────────────────────┐
                    │   workers/ (unchanged)│
                    │   All 7 DOs + APIs    │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  REST   │  │   R2    │  │   WS    │
        │  APIs   │  │  Media  │  │  Live   │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
    ┌────────┴────────────┴────────────┴────────┐
    │              app/ (REWRITE)               │
    │  ┌──────────┐ ┌────────┐ ┌─────────────┐ │
    │  │ Mobile   │ │ Grid   │ │ Bottom Sheet │ │
    │  │ Shell    │ │ Feed   │ │ Components   │ │
    │  ├──────────┤ ├────────┤ ├─────────────┤ │
    │  │ Tab Bar  │ │ Creator│ │ Pull Refresh │ │
    │  │ Nav      │ │ Card   │ │ Swipe Action │ │
    │  └──────────┘ └────────┘ └─────────────┘ │
    └──────────────────────────────────────────┘
```

## UI Stack (Cloudflare-Optimized)

- **Framework:** React Router v7 (keep)
- **Components:** @cloudflare/kumo (keep — no shadcn/ui needed)
- **Styling:** Tailwind v4 (keep)
- **PWA:** Hand-written manifest.json + sw.js (3KB — no vite-plugin-pwa)
- **Gestures:** Custom `useSwipe`/`usePullRefresh` hooks (4KB — no @use-gesture/react)
- **Animations:** CSS `transition` + Tailwind `animate-*` + `@starting-style` (0KB — no framer-motion)
- **Icons:** @phosphor-icons/react (keep)
- **QR:** Server-side via SePay API — `<img src={qrUrl}>` (0KB — no react-qr-code)
- **SW:** Hand-written 2KB sw.js (no Workbox — CF edge cache handles asset caching)
- **Bundle saving:** ~106KB gzip removed (2.1s faster on 3G)

## Cloudflare-Native Integrations

| Capability | Usage | Benefit |
|---|---|---|
| **CF Images variants** | `imagedelivery.net/.../w=200` for thumbnails, `/blur` for placeholders | Auto-resize, no client-side processing |
| **Edge Cache** | `Cache-Control: public, max-age=3600` on R2 media | CDN cache, near-zero latency on repeat |
| **Early Hints (103)** | Preload critical CSS/JS | 30% faster FCP |
| **R2 direct upload** | Media upload via signed URLs | No worker CPU cost |
| **DO WebSocket** | Reuse LiveDO WS for DM chat | Single WS infra, no extra DO |
| **DO SQLite** | Chat history + user prefs | Server-side persistence, no IndexedDB |
| **Workers KV** | User theme, last tab, dismissed prompts | Fast read, low cost |
| **Turnstile** | Already integrated | Keep |

## Phases

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| 1 | Mobile Shell + Navigation | 5h | Completed |
| 2 | Feed + Creator Profile | 6h | Completed |
| 3 | DM + Inbox | 4h | Completed |
| 4 | Monetization UI | 5h | Completed |

## Dependencies

- Phase 2 depends on Phase 1 (shell must exist first)
- Phase 3 depends on Phase 1 (tab bar + navigation stack)
- Phase 4 depends on Phase 1 + 2 (gated content UI needs feed + profile)
- Phase 3 shares LiveDO WebSocket from existing Phase 06 (no new DO needed)
- CF Images config must exist before Phase 2 (account hash in env vars already set)

## Success Criteria

- [x] PWA installable via manifest + hand-written service worker
- [x] Bundle <200KB gzip initial load (current ~180KB, target no increase)
- [x] Bottom tab bar with 5 tabs, active state, badge count
- [x] Grid feed loads 2-col on mobile with CF Images variants (not full-size)
- [x] Swipe between tabs using custom hooks (<4KB)
- [x] Creator profile with sticky subscribe CTA
- [x] DM inbox with chat bubbles + typing indicator via DO WebSocket
- [x] Bottom sheet for paywall (CSS transition, no framer-motion)
- [x] Pull-to-refresh on all feeds (custom hook, native feel)
- [x] Lighthouse PWA score 92+
- [x] <2s FCP on 3G mobile (thanks to ~106KB bundle saving + Early Hints)
- [x] 0 additional npm dependencies beyond @phosphor-icons/react
- [x] CF Edge Cache hit ratio >80% for static assets
- [x] All images served via CF Images CDN (imagedelivery.net)
