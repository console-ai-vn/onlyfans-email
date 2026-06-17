---
phase: 2
title: "Feed + Creator Profile"
status: completed
effort: "6h"
priority: P1
dependencies: [1]
---

# Phase 2: Feed + Creator Profile

## Overview

OnlyFans-style discovery feed (2-col grid), swipeable story bar, creator profile with sticky subscribe CTA + content grid tab. Gesture-heavy interactions (double-tap like, long-press preview).

## Architecture

```
app/
├── components/
│   ├── GridFeed.tsx           NEW: 2-col masonry/justified grid
│   ├── FeedCard.tsx           NEW: creator thumbnail + preview + lock badge
│   ├── StoryBar.tsx           NEW: horizontal scrollable story avatars
│   ├── StoryViewer.tsx        NEW: full-screen story viewer (tap to advance)
│   ├── CreatorHeader.tsx      NEW: sticky profile header + subscribe CTA
│   ├── ContentGrid.tsx        NEW: tabbed content grid (Posts/Media/Shop)
│   ├── ContentCard.tsx        NEW: individual content item with gate overlay
│   ├── PreviewModal.tsx       NEW: long-press preview / quick view
│   └── Tabs.tsx               NEW: swipeable tabs component
├── routes/
│   ├── tab-feed.tsx           MODIFY: GridFeed + StoryBar
│   ├── tab-explore.tsx        MODIFY: search + category grid
│   └── creator.$creatorId.tsx REWRITE: sticky header + content grid
├── hooks/
│   ├── useGridLayout.ts       NEW: responsive column calculator
│   └── useSwipeableTabs.ts    NEW: swipe between Post/Media/Shop tabs
└── queries/
    └── feed.ts                NEW: paginated feed queries with cursor
```

## Requirements

### Functional
- 2-col grid feed on mobile (3-col tablet, 4-col desktop) với lazy loading
- FeedCard: creator avatar + name, thumbnail image (3:4 aspect) via CF Images `imagedelivery.net/.../w=400`, lock icon nếu gated, subscriber count
- Horizontal StoryBar phía trên feed: circle avatars, ring color = tier (green=public, blue=sub, gold=ppv), tap để mở full-screen story viewer
- StoryViewer: full-screen, tap right → next, tap left → previous, hold → pause, progress bar
- Creator profile: sticky header với avatar + cover, subscribe CTA hover, bio, stats (posts/subscribers/items)
- Content tab bar (Posts/Media/Shop) swipeable
- Double-tap content card để like/unlock
- Long-press để preview content
- Empty states: "No posts yet" with illustration
- Loading skeleton: pulse animation matching grid layout
- Pagination: cursor-based infinite scroll

### Non-Functional
- **CF Images variants** for all thumbnails: `/w=200` for grid cards, `/w=400` for preview, `/blur` for placeholder (CF Images auto-generates — no manual processing)
- **Native lazy loading** via `loading="lazy"` + `decoding="async"` on `<img>` (no JS Intersection Observer for images — use native attribute)
- Intersection Observer for infinite scroll trigger only (not image loading)
- Grid items pre-fetch on scroll within 500px viewport
- Story pre-loading: next 2 stories preloaded
- Feed render <500ms first batch
- Smooth scroll performance (use virtualized grid if >100 items)
- All images served via `imagedelivery.net` CDN (already configured)

## Implementation Steps

1. **GridFeed component** — Responsive grid with `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. Each item 3:4 aspect ratio (OnlyFans style). Images via `<img src={imagedeliveryUrl}/w=400 loading="lazy" decoding="async">` — CF Images CDN handles resize + cache. Use `imagedelivery.net/{accountHash}/{imageId}/w=400` for thumbnails, `/w=800` for retina. Blur placeholder via `/blur` variant. Intersection Observer for infinite scroll trigger only. `useGridLayout` hook: returns {columns, gap} based on viewport.

2. **FeedCard component** — Props: `{creator, thumbnail, title, tier, subscriberCount, isNew}`. Creator avatar (32px circle) top-left overlay. Lock icon top-right if contentTier != public. Subscriber count below image. "New" badge pulse animation. Tap → navigate to creator profile. Hover: scale(1.02) + shadow.

3. **StoryBar component** — Horizontal scroll (snap). Each story avatar: 64px circle với ring 2px (green #22c55e, blue #3b82f6, gold #f59e0b). "Your Story" first item với + icon. Live indicator (red pulsing dot) on active stories. Tap → open StoryViewer full-screen.

4. **StoryViewer component** — Fixed overlay. Image preload: current + next 2. Progress bar top (30 bars like Instagram, 5s each). Swipe left/right or tap left/right half. Hold to pause. Reply area bottom. Close X top-right.

5. **CreatorHeader component** — Sticky position top-0 dưới tab bar. Cover image parallax on scroll. Avatar (80px) overlapping. Name + @handle. Bio collapse/expand. Subscribe button (primary CTA, pulse animation). Stats row: Posts | Subscribers | Items.

6. **ContentGrid (creator profile)** — Tab bar: Posts | Media | Shop. Swipeable between tabs. Posts: 3-col grid. Media: 2-col large thumbnails. Shop: ItemCard grid from Phase 03. Filter by tier toggle.

7. **gesture hooks** — `useDoubleTap(callback)`: touchstart/touchend timing <300ms = double tap. `useLongPress(callback, delay=500ms)`: touchstart sets timer, touchend/move cancels.

8. **feed queries** — `app/queries/feed.ts`: `useFeedFeed()` (following creators), `useExploreFeed()` (all public), `useStories()` (active stories), `useInfiniteFeed(queryKey, fetchFn)` cursor-based with `useInfiniteQuery`.

## Related Code Files

- Create: `app/components/GridFeed.tsx`, `app/components/FeedCard.tsx`, `app/components/StoryBar.tsx`, `app/components/StoryViewer.tsx`, `app/components/CreatorHeader.tsx`, `app/components/ContentGrid.tsx`, `app/components/ContentCard.tsx`, `app/components/PreviewModal.tsx`, `app/components/Tabs.tsx`, `app/hooks/useGridLayout.ts`, `app/hooks/useSwipeableTabs.ts`, `app/queries/feed.ts`
- Modify: `app/routes/tab-feed.tsx`, `app/routes/tab-explore.tsx`, `app/routes/creator.$creatorId.tsx`

## Success Criteria

- [x] Grid feed renders 2-col on mobile (<768px)
- [x] Infinite scroll loads next page smoothly
- [x] StoryBar shows 5+ creator avatars, tap opens viewer
- [x] StoryViewer auto-advances, supports tap to navigate
- [x] Creator profile header sticky with subscribe CTA
- [x] Content tabs (Posts/Media/Shop) swipeable
- [x] Double-tap like, long-press preview
- [x] Empty state renders for no-content creators
- [x] Skeleton loading matches grid layout
