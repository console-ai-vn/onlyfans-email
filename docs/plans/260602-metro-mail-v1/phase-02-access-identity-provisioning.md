# Phase 02: Access Identity Provisioning

## Context links
- [plan.md](./plan.md)
- [01-product-scope-report.md](./reports/01-product-scope-report.md)
- [researcher-02-v1-auth-images.md](./research/researcher-02-v1-auth-images.md)

## Overview
Date: 2026-06-02  
Priority: P2  
Implementation status: completed  
Review status: verified by automated tests  

Lock V1 identity model around Cloudflare Access OTP and a provisioned internal mailbox allowlist, with one mailbox per internal user and one initial domain.

## Key Insights
- Access OTP is the recommended V1 login.
- Mailbox identity should key on immutable email address plus internal mailbox ID.
- Shared mailboxes, aliases, and custom role systems are deferred.

## Requirements
- Access-authenticated user must map to a provisioned mailbox.
- Non-provisioned Access users must be denied app/mailbox access.
- Minimal admin provisioning path via config or light admin route.

## Architecture
Use Cloudflare Access as outer auth boundary; app layer enforces mailbox authorization by exact provisioned email/domain match plus mailbox state checks.

## Related code files
- Expected after clone: `workers/app.ts`, auth helpers under `workers/lib/*`, `workers/types.ts`
- Expected after clone: mailbox schema/config files under `workers/db/*` or `shared/*`
- Expected after clone: `wrangler.jsonc`, `.dev.vars.example`, settings/admin UI files if present

## Implementation Steps
1. Audit current Access JWT validation and request context wiring.
2. Define mailbox provisioning record and single-domain constraints in schema/config.
3. Add authorization guard so authenticated identity can access only its mailbox.
4. Add minimal provisioning interface or config path for admin-managed mailbox creation/deactivation.
5. TDD checkpoint: add auth/authorization tests once harness exists; if absent, add minimal Worker route coverage before shipping auth changes.

## Todo list
- [x] Confirm upstream Access middleware path.
- [x] Add mailbox allowlist/provisioning model.
- [x] Enforce one-mailbox-per-user rule.
- [x] Define denied-access behavior.
- [x] Add test harness for auth boundary coverage.
- [ ] Add structured audit logging after first internal rollout.

## Success Criteria
- Only provisioned internal addresses can enter a mailbox.
- Single-domain restriction is enforced in config and provisioning flow.

## Risk Assessment
Biggest risk is trusting Access identity without mailbox-level authorization; this phase closes that gap.

## Security Considerations
Validate Access JWT server-side, never trust client-side mailbox IDs, and avoid exposing provisioning actions without admin gating.

## Next steps
Proceed to Phase 03 after auth guard and provisioning contract are stable.
