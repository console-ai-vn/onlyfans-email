---
phase: 3
title: "DM + Inbox"
status: completed
effort: "4h"
priority: P1
dependencies: [1]
---

# Phase 3: DM + Inbox

## Overview

Chat-style Direct Messages replacing email inbox for mobile. Conversation list, chat bubbles, media sharing, typing indicator, online status, push notification integration.

## Architecture

```
app/
├── components/
│   ├── DMList.tsx            NEW: conversation list with previews
│   ├── DMChat.tsx            NEW: chat bubble UI + input bar
│   ├── ChatBubble.tsx        NEW: message bubble (sent/received)
│   ├── TypingIndicator.tsx   NEW: animated typing dots
│   ├── OnlineBadge.tsx       NEW: green dot for online status
│   ├── DMComposer.tsx        NEW: message input + attachment + send
│   └── MediaPreview.tsx      NEW: full-screen image viewer in chat
├── routes/
│   ├── tab-dm.tsx            NEW: DM list view
│   └── dm.$conversationId.tsx NEW: individual chat view
├── hooks/
│   ├── useDM.ts              NEW: WebSocket hook for real-time messaging
│   └── useTyping.ts          NEW: typing indicator via WS heartbeat
└── queries/
    └── dm.ts                 NEW: DM queries (list, messages, send)
```

## Requirements

### Functional
- Conversation list: avatar + name + last message preview + timestamp + unread count + online badge
- Swipe conversation left: archive/delete
- Chat view: messages grouped by date, sent messages right-aligned (blue bubble), received left (gray bubble)
- Image attachment: tap to full-screen, pinch to zoom
- Typing indicator: animated 3 dots khi partner đang gõ
- Online status: green dot trên avatar, last seen timestamp
- New message notification: push (defer to service worker in Phase 1)
- Input bar: text field + attach button (image only) + send button
- Empty state: "No messages yet" for new conversations
- Search conversations by name

### Non-Functional
- Message send optimistic (show immediately, grey out if fail)
- Message list virtualized for performance (>1000 messages)
- **DO WebSocket** reused from existing LiveDO — single WS infra, no extra DO billing unit
- WebSocket reconnection with exponential backoff (1s→2s→4s→8s→max 30s)
- **Fallback polling: 30s interval** (not 5s — DO billing per wall-clock. 5s = 12x cost increase with zero benefit)
- Messages stored in DO SQLite server-side — client caches last 50 in React state
- No IndexedDB — simpler, faster, no sync conflicts

## Implementation Steps

1. **DMList component** — FlatList-style scrollable list. Each row: avatar (48px), name + last message (1 line truncated), timestamp (relative: "2m ago", "1h ago"), unread badge (blue dot or count), online dot (green, 8px). Divider between rows. Pull-to-refresh.

2. **DMChat component** — Message list (auto-scroll to bottom on new message). Date separator ("Today", "Yesterday", "Jun 15"). Input bar fixed bottom (above tab bar). Image attachments: thumbnail in chat, tap → full-screen overlay. Keyboard-aware height (viewport resize).

3. **ChatBubble component** — Props: `{text, isSent, timestamp, status}`. Sent: right-aligned, bg-kumo-brand, white text, rounded-tl-xl rounded-tr-xl rounded-bl-xl. Received: left-aligned, bg-kumo-recessed, text-kumo-default, rounded-tr-xl rounded-tl-xl rounded-br-xl. Status: single check (sent), double check (delivered), blue double check (read). Timestamp small below.

4. **DMComposer component** — Text input (auto-expand up to 4 lines). Paperclip button opens image picker. Send button (arrow icon, brand color). Keyboard avoidance via `visualViewport` API. Character count for long messages.

5. **WebSocket hook (reuse LiveDO)** — `useDM(userEmail)`: connects to existing LiveDO WebSocket endpoint (extend with `message` and `typing` event types). Reconnection: exponential backoff (1s, 2s, 4s, 8s, max 30s). **Fallback to polling at 30s intervals** (not 5s — DO billing is wall-clock based, 5s polling would cost 6x more with no UX benefit). On reconnect, re-fetch latest 50 messages from DO SQLite.

6. **MediaPreview component** — Full-screen overlay. Pinch-to-zoom (CSS transform scale). Swipe down to dismiss. Share button. Download button.

7. **Tab DM route** — `app/routes/tab-dm.tsx`: DMList as main content. Search bar top. "New Message" FAB button (bottom-right, above tab bar). Empty state illustration.

## Related Code Files

- Create: `app/components/DMList.tsx`, `app/components/DMChat.tsx`, `app/components/ChatBubble.tsx`, `app/components/TypingIndicator.tsx`, `app/components/OnlineBadge.tsx`, `app/components/DMComposer.tsx`, `app/components/MediaPreview.tsx`, `app/routes/tab-dm.tsx`, `app/routes/dm.$conversationId.tsx`, `app/hooks/useDM.ts`, `app/hooks/useTyping.ts`, `app/queries/dm.ts`
- Modify: `workers/routes/live.ts` (extend WebSocket for DM), `workers/app.ts` (mount DM WS route), `app/components/BottomTabBar.tsx` (DM badge count)

## Success Criteria

- [x] Conversation list shows all DMs with preview + unread count
- [x] Chat view renders messages with sent/received styling
- [x] Typing indicator shows when partner typing
- [x] Online status green dot visible
- [x] Image attachment tap → full-screen viewer
- [x] Message sends optimistically (instant UI, grey if fail)
- [x] Swipe left to delete conversation
- [x] Pull-to-refresh on DM list
- [x] Keyboard aware: input stays visible when keyboard opens
