# Phase 03 Internal Notes Events

Parent plan: [plan.md](./plan.md)

## Goal

Make conversations social by supporting internal notes and activity events that never leave the app.

Implementation status: completed
Review status: backend/API tests + typecheck passed; mobile rendering handled in Phase 04

## Files

- Modify: `workers/durableObject/migrations.ts`
- Modify: `workers/db/schema.ts`
- Modify: `workers/durableObject/index.ts`
- Modify: `workers/index.ts`
- Modify: `app/queries/emails.ts`
- Modify: `app/components/email-panel/ThreadMessage.tsx`
- Modify: `app/components/EmailPanel.tsx`

## Tasks

- [x] Add `internal_notes` table with `thread_id`, author email, body, timestamps.
- [x] Add `conversation_events` table for assignment/status/note/send/receive markers.
- [x] Add API routes to create/list notes by thread.
- [ ] Render notes inline in thread timeline with distinct internal style.
- [x] Add audit-friendly event rows for note create and state update.
- [x] Add tests ensuring note validation/migrations keep internal notes separate from email send paths.

## Acceptance

- Internal note appears in app timeline only.
- Reply/forward excludes internal notes.
- Notes survive page reload and thread refetch.

## Verification

```bash
npm test -- tests/internal-notes.test.ts tests/conversation-state.test.ts tests/social-graph.test.ts
npm run typecheck
```

Both passed on 2026-06-06. UI timeline rendering moves to Phase 04.

## Risks

- UI must make internal vs external content unmistakable.
