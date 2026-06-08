# Phase 05: Hardening Verification Deploy

## Context links
- [plan.md](./plan.md)
- [02-upstream-source-map.md](./reports/02-upstream-source-map.md)
- [scout-01-local-baseline.md](./scout/scout-01-local-baseline.md)

## Overview
Date: 2026-06-02  
Priority: P2  
Implementation status: in progress  
Review status: verification passed; deploy pending  

Close V1 with build verification, test-harness decision, Cloudflare config hardening, and explicit deferred-scope cleanup before deploy.

## Key Insights
- Upstream exposes `npm install`, `npm run typecheck`, `npm run build`.
- No upstream test script is currently known.
- AI/MCP, shared mailbox, and forward must remain deferred in shipped V1.

## Requirements
- Verify install, typecheck, and build on cloned source.
- Audit package scripts and add/document minimal test harness if absent.
- Confirm `wrangler.jsonc`, R2, Email Service, Access, and domain config align with single-company rollout.

## Architecture
This phase does not add product scope; it validates that earlier phases are deployable and that deferred features are not accidentally exposed.

## Related code files
- Expected after clone: `package.json`, `wrangler.jsonc`, `.dev.vars.example`
- Expected after clone: any CI/build config present upstream
- Expected after clone: UI entry points exposing AI/MCP/settings routes

## Implementation Steps
1. Run `npm install`, `npm run typecheck`, `npm run build`.
2. Audit `package.json` scripts; if no tests exist, add/document minimal harness for critical routes/DO logic.
3. Review config for Access OTP, single domain, Email Service binding, DO SQLite, and private R2.
4. Remove or hide deferred UI/routes: AI/MCP-first surfaces, shared mailbox, forward, unsupported image types.

## Todo list
- [x] Verify baseline commands pass on current branch.
- [x] Add minimum automated test entrypoint for auth and image boundaries.
- [ ] Confirm deploy/env checklist for Cloudflare rollout.
- [x] Hide deferred AI/MCP routes and UI in V1.
- [x] Hide deferred forward and mailbox-delete surfaces in V1.
- [ ] Review controlled dependency upgrades before production rollout.

## Success Criteria
- Final branch builds cleanly, has an auditable test strategy, and ships only approved V1 scope.

## Risk Assessment
Without a test harness, regressions around auth/mailflow/blob delivery are easy to miss; this phase forces that decision before ship.

## Security Considerations
Recheck Access config, private R2 routing, and deferred route exposure before production deploy.

## Next steps
Deploy the internal V1 after fresh verification evidence and Cloudflare dashboard configuration review.
