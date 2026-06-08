# Synthesis - Ship Debug Plan

## Inputs

- Research 01: `research/researcher-01-upstream-mailflow.md`
- Research 02: `research/researcher-02-current-ship-blockers.md`
- Scout: `scout/scout-01-codebase-map.md`

## Key synthesis

- MVP currently works for Access login + inbound feed.
- Main ship blockers:
  - broken inline image rendering
  - outbound send/reply not proven
  - dirty uncommitted changes in image rendering files
  - previous fixes mixed product behavior and security assumptions
- Upstream should be source of truth for mail render/storage/send.
- Before any fix, capture actual failed email metadata:
  - `body`
  - `attachments[].content_id`
  - `attachments[].disposition`
  - attachment endpoint HTTP status
- Do not broaden iframe sandbox or cid rewrite until evidence proves it is required.

## Contradiction to resolve

- Research 01 says upstream iframe has `allow-same-origin`.
- Direct earlier `git show upstream/main:app/components/EmailIframe.tsx` showed no `allow-same-origin`.
- Phase 01 must verify upstream from git before changing files.

## Unresolved

- Exact failing email id.
- Attachment endpoint status from browser/network.
- Whether outbound should use Cloudflare Email Sending, Resend, or Lark SMTP.
