---
phase: 1
title: "Mobile Shell + Navigation"
status: completed
effort: "5h"
priority: P1
dependencies: []
---

# Phase 1: Mobile Shell + Navigation

## Overview

Add PWA manifest + service worker. Rewrite root layout with bottom tab bar navigation (Feed/Explore/Create/DM/Profile). Mobile-first container, desktop sidebar fallback. Touch gestures (swipe between tabs). Install prompt.

## Architecture

```
app/
├── root.tsx              MODIFY: new mobile-aware layout + iOS meta
├── routes.ts             MODIFY: restructure routes for tabs
├── routes/
│   ├── mobile-layout.tsx NEW: tab shell wrapper
│   ├── tab-feed.tsx      NEW: Feed tab
│   ├── tab-explore.tsx   NEW: Explore tab
│   └── tab-create.tsx    NEW: Create tab
├── components/
│   ├── MobileShell.tsx        NEW: PWA container + install prompt
│   ├── BottomTabBar.tsx       NEW: 5-tab bar, active state, badges
│   ├── SwipeContainer.tsx     NEW: horizontal swipe between tabs
│   ├── DesktopSidebar.tsx     NEW: desktop navigation fallback
│   └── InstallBanner.tsx      NEW: "Add to Home Screen" prompt
├── lib/
│   ├── pwa-utils.ts      NEW: install prompt + SW registration (~1KB)
│   └── gesture-utils.ts  NEW: useSwipe + usePullRefresh hooks (~3KB)
└── public/
    ├── manifest.json      NEW: PWA manifest (hand-written, ~20 lines)
    ├── sw.js              NEW: service worker (hand-written, ~50 lines)
    └── icons/             NEW: icon-192.png, icon-512.png, apple-icon-180.png
```

## Requirements

### Functional
- PWA manifest hand-written (~20 lines JSON): name "ONYX", short_name "ONYX", theme_color #0a1020, display standalone, icons array
- Service worker hand-written (~50 lines JS): network-first for API, cache-first for static assets via CF Edge, offline fallback page
- iOS meta tags in root.tsx: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (black-translucent), `apple-touch-icon` 180x180
- Bottom tab bar: Feed (House), Explore (MagnifyingGlass), Create (PlusCircle), DM (Envelope), Profile (UserCircle)
- Active tab highlight + unread badge count on DM
- Swipe ngang để chuyển tab — custom `useSwipe` hook (~2KB, no library)
- Pull-to-refresh — custom `usePullRefresh` hook (~1KB, no library)
- Desktop: sidebar nav bên trái (icon + label), main content bên phải
- Install banner hiện sau 3 lần visit (use beforeinstallprompt)
- Responsive breakpoint: <768px → mobile shell, ≥768px → desktop sidebar
- Push permissions deferred (not in Phase 1)

### Non-Functional
- Tab transitions <200ms, 60fps
- Service worker cache <50MB
- PWA Lighthouse score ≥90
- First paint <2s on 3G

## Implementation Steps

1. **PWA Foundation (CF-Native)** — Hand-write `public/manifest.json` (~20 lines, no build plugin). Hand-write `public/sw.js` (~50 lines): stale-while-revalidate for static assets (CF Edge cache handles this natively), network-first for API calls, cache-first for images (CF Images CDN backs this), offline fallback HTML. SW registration in root.tsx via `navigator.serviceWorker.register('/sw.js')`. Add iOS meta tags: `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, `<link rel="apple-touch-icon" href="/icons/icon-180.png">`. Create icons from existing favicon.svg (use sharp or ImageMagick to generate PNGs at 192, 512, 180). **NO vite-plugin-pwa, NO Workbox.**

2. **MobileShell component** — Wrapper component that detects viewport width. <768px renders BottomTabBar + swipe container. ≥768px renders DesktopSidebar + main content. Uses `useMediaQuery` hook or CSS media query.

3. **BottomTabBar component** — Fixed bottom bar, 5 tabs with Phosphor icons: House (feed), MagnifyingGlass (explore), PlusCircle (create), Envelope (DM), UserCircle (profile). Active state: icon fill + color, subtle scale animation. Badge: red dot + number on DM tab. Bottom padding to avoid iPhone home indicator.

4. **SwipeContainer (custom, 0 deps)** — `useSwipe` hook using native `touchstart`/`touchmove`/`touchend` events. Track `startX`/`currentX`, `translateX` during drag, snap to nearest tab on release. Detect velocity (>0.3px/ms) for quick swipes. CSS `transition: translateX` for spring snap. Disable on desktop via `matchMedia('(pointer: fine)')`. **No @use-gesture/react, no hammer.js.**

5. **DesktopSidebar** — Fixed left sidebar (64px collapsed, 240px expanded). Icons collapsed, hover to expand. Active state highlight. Account switcher at bottom.

6. **Install prompt** — Listen for `beforeinstallprompt` event. Store deferredPrompt. Show banner after 3 visits (cookie-based). "Add to Home Screen" button calls deferredPrompt.prompt(). Native iOS-style bottom sheet prompt.

7. **Pull-to-refresh (custom, 0 deps)** — `usePullRefresh(ref)` hook: `touchstart`/`touchmove`/`touchend` on scroll container. Shows native-like spinner via CSS animation when pulling >60px. Calls `queryClient.invalidateQueries()` on release. Works only when scrollY = 0. **No library, <1KB.**

8. **Restructure routes** — `app/routes.ts`: wrap authenticated routes in MobileShell layout. Keep public routes (landing, signup) outside shell. Tab routes: `/app` → Feed, `/app/explore` → Explore, `/app/create` → Create, `/app/dm` → DM, `/app/profile` → Profile.

## Related Code Files

- Create: `app/public/manifest.json`, `app/public/sw.js`, `app/public/icons/*`, `app/components/MobileShell.tsx`, `app/components/BottomTabBar.tsx`, `app/components/SwipeContainer.tsx`, `app/components/DesktopSidebar.tsx`, `app/components/InstallBanner.tsx`, `app/lib/pwa-utils.ts`, `app/lib/gesture-utils.ts`, `app/routes/mobile-layout.tsx`, `app/routes/tab-feed.tsx`, `app/routes/tab-explore.tsx`, `app/routes/tab-create.tsx`
- Modify: `app/root.tsx`, `app/routes.ts`, `app/routes/landing.tsx` (add install CTA)
- Delete: none

## Success Criteria

- [x] PWA installs on Android Chrome + iOS Safari (standalone mode)
- [x] Bottom tab bar visible, 5 tabs, active highlight, badge count
- [x] Swipe between tabs works on touch devices
- [x] Desktop shows sidebar nav
- [x] Pull-to-refresh triggers data reload
- [x] Install banner shows after 3 visits
- [x] Lighthouse PWA score ≥90 (verified locally via Chrome DevTools; production audit pending deployment)
- [x] <200KB service worker cache budget (3.5KB SW)
