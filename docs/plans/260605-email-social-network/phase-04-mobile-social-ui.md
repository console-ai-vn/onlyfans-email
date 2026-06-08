# Phase 04 Mobile Social UI

Parent plan: [plan.md](./plan.md)

## Goal

Shift UI from desktop email reader to mobile-first relationship cockpit: inbox cards, conversation timeline, sticky actions, and context/profile sheet.

## Mobile Flow

```text
Inbox
  -> Conversation
      -> Context sheet
      -> Note composer
      -> Reply composer
```

## Files

- Modify: `app/routes/email-list.tsx`
- Modify: `app/components/EmailPanel.tsx`
- Modify: `app/components/MailboxSplitView.tsx`
- Modify: `app/components/email-panel/*`
- Create: `app/components/mobile-social-inbox-card.tsx`
- Create: `app/components/mobile-conversation-header.tsx`
- Create: `app/components/social-context-sheet.tsx`
- Create: `app/components/conversation-state-controls.tsx`

## Tasks

- [x] Make mobile inbox cards show contact, snippet, status, assignee, priority, needs-reply.
- [x] Make conversation screen full-height on mobile with social timeline.
- [x] Add sticky bottom action bar: `Reply`, `Note`, `Context`.
- [x] Add context/profile as bottom sheet or desktop side sheet.
- [x] Add assignment/status controls inside context sheet and compact header.
- [x] Merge email messages, internal notes, and events into one mobile timeline.
- [x] Keep subject visible but secondary.
- [x] Add empty states for unknown contact and no notes.
- [x] Preserve desktop split-view by composing the same mobile screens side-by-side.

## Acceptance

- First mobile viewport communicates "relationship thread", not Gmail clone.
- User can read, reply, note, assign, and close from one hand.
- No action depends on hover or wide desktop.
- Text and buttons fit on 360px viewport.
- Desktop still works, but is not the source of truth.

## Risks

- Current `EmailPanel.tsx` is dense; split only around mobile screen boundaries.
- Kumo components may need wrapper constraints for touch targets.

## Verification

- `npm test`
- `npm run typecheck`
- `npm run build`
