# Phase 05 AI MCP Social Context

Parent plan: [plan.md](./plan.md)

## Goal

Give AI and MCP access to social context while gating risky actions behind explicit approval.

## Files

- Modify: `workers/lib/tools.ts`
- Modify: `workers/agent/index.ts`
- Modify: `workers/mcp/index.ts`
- Modify: `app/components/AgentPanel.tsx`
- Modify: `app/components/MCPPanel.tsx`

## Tasks

- [x] Add shared tool `get_contact_profile`.
- [x] Add shared tool `get_conversation_context`.
- [x] Add shared tool `create_internal_note`.
- [x] Add shared tool `update_conversation_state`.
- [x] Require approval for send/delete/state-changing agent tools where supported.
- [x] Update MCP tool docs so external agents know internal notes are private.
- [x] Add tests/verification for tool validation and mailbox scoping.

## Acceptance

- Agent can summarize a relationship using profile + history + notes.
- Agent cannot silently send/delete/close without user confirmation.
- MCP callers get typed errors for inaccessible mailbox/thread.

## Risks

- Internal notes may contain sensitive strategy; prompts must label them as private context.

## Notes

- Agent remains draft-only for outbound email; it does not expose send tools.
- State-changing social tools are described as explicit-operator-only. Runtime human-in-loop approval is not available in this local AI SDK wrapper yet.
- Mailbox scoping continues through MCP `verifyMailbox` plus existing access tests.

## Verification

- `npm test`
- `npm run typecheck`
- `npm run build`
