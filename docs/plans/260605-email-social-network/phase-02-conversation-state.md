# Phase 02 Conversation State

Parent plan: [plan.md](./plan.md)

## Goal

Add shared-inbox state to each social conversation: assignee, status, priority, seen state, and reply state.

Implementation status: completed
Review status: local tests + typecheck passed

## Files

- Modify: `workers/durableObject/migrations.ts`
- Modify: `workers/db/schema.ts`
- Modify: `workers/durableObject/index.ts`
- Modify: `workers/index.ts`
- Modify: `app/queries/emails.ts`
- Modify: `app/types/index.ts`

## Tasks

- [x] Add `conversation_state` table keyed by `thread_id`.
- [x] Add allowed status values: `open`, `waiting`, `done`.
- [x] Add `assignee_email`, `priority`, `last_seen_at`, `needs_reply`.
- [x] Update threaded list query to include state fields.
- [x] Add API route to patch conversation state.
- [x] Add tests for invalid status and migration coverage.

## Acceptance

- Thread list can show ownership/status without extra N+1 requests.
- State updates do not mutate email body or outbound headers.
- Existing search/list behavior stays compatible.

## Verification

```bash
npm test -- tests/conversation-state.test.ts tests/social-graph.test.ts
npm run typecheck
```

Both passed on 2026-06-06.

## Risks

- Thread id fallback by subject may merge unrelated conversations; status must be reversible.
