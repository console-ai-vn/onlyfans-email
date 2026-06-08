# Phase 03: Mailflow Chat Thread

## Context links
- [plan.md](./plan.md)
- [01-product-scope-report.md](./reports/01-product-scope-report.md)
- [researcher-01-upstream-cloudflare.md](./research/researcher-01-upstream-cloudflare.md)

## Overview
Date: 2026-06-02  
Priority: P2  
Implementation status: pending  
Review status: pending  

Adapt upstream email-reader UX into a DM-style inbox and chronological bubble thread while preserving external inbound/outbound mail and including reply in V1.

## Key Insights
- Upstream already has Email Routing inbound and Email Service outbound.
- V1 should feel like chat, not Gmail.
- Forward stays deferred until reply path is proven stable.

## Requirements
- Receive external email into the correct mailbox.
- Show conversation list with unread/new-message indicator.
- Render chronological thread as DM bubbles.
- Support outbound send and reply to external contacts.

## Architecture
Reuse mailbox Durable Object for per-mailbox message state. Worker routes handle inbound mail, reply/send APIs, and UI data hydration; frontend remaps message data into chat-thread presentation.

## Related code files
- Expected after clone: `workers/durableObject/index.ts`, `workers/db/schema.ts`, `workers/routes/reply-forward.ts`, `workers/email-sender.ts`
- Expected after clone: `app/routes/mailbox*.tsx`, `app/routes/email-list.tsx`
- Expected after clone: `app/components/EmailPanel.tsx`, `MailboxSplitView.tsx`, `Sidebar.tsx`, compose/thread components

## Implementation Steps
1. Audit upstream message/thread schema and inbound routing lifecycle.
2. Remove or hide AI/MCP-first UX paths from default mailbox experience.
3. Redesign list + thread rendering into DM-style conversation UI using existing message data.
4. Keep outbound send, add/retain reply, and explicitly defer forward controls.
5. TDD checkpoint: add route and DO tests for inbound threading, unread state, and reply behavior once harness is available.

## Todo list
- [ ] Confirm actual thread data model in DO schema.
- [ ] Map external sender to conversation/contact view.
- [ ] Implement unread/new-message indicator path.
- [ ] Keep reply action; suppress forward in V1 UI/API if needed.
- [ ] Add regression coverage for inbound and reply flows.

## Success Criteria
- A provisioned user can receive, read, send, and reply in a chat-style thread against external addresses.

## Risk Assessment
Main risk is UI remap exposing assumptions in upstream email-reader components; keep data contract stable and change presentation first.

## Security Considerations
Do not render untrusted HTML directly; sanitize or fall back to safe text/controlled rendering in thread view.

## Next steps
Move to Phase 04 after core thread flow works without attachments/images regressions.
