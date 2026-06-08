# Phase 01: Upstream Clone Audit

## Context links
- [plan.md](./plan.md)
- [02-upstream-source-map.md](./reports/02-upstream-source-map.md)
- [scout-01-local-baseline.md](./scout/scout-01-local-baseline.md)

## Overview
Date: 2026-06-02  
Priority: P2  
Implementation status: completed  
Review status: completed  

Fork and clone `cloudflare/agentic-inbox`, install deps, confirm build/typecheck, then replace speculative file assumptions with an actual local source map.

## Key Insights
- Current workspace is docs-only.
- Upstream already matches Workers + DO SQLite + R2 + Access.
- Exact helper and route ownership must be confirmed locally before edits.

## Requirements
- Fork upstream into project workspace.
- Run `npm install`, `npm run typecheck`, `npm run build`.
- Capture real file map for auth, mailbox, attachments, AI/MCP, and config surfaces.

## Architecture
Keep upstream structure intact first. Phase output is an audited baseline, not a refactor.

## Related code files
- Expected after clone: `package.json`, `wrangler.jsonc`, `.dev.vars.example`
- Expected after clone: `workers/app.ts`, `workers/durableObject/index.ts`, `workers/db/schema.ts`
- Expected after clone: `app/routes/*`, `app/components/*`, `shared/*`

## Implementation Steps
1. Fork upstream repo and clone into local workspace.
2. Install dependencies and confirm baseline typecheck/build.
3. Inventory auth helpers, email routes, DO schema, attachment handlers, and AI/MCP entry points.
4. Record actual files to touch for later phases and flag any missing upstream capability.

## Todo list
- [x] Clone upstream fork locally.
- [x] Verify baseline commands pass.
- [x] Produce audited source map for execution session.
- [x] Confirm whether search can stay unchanged in V1.

## Success Criteria
- Local source exists and builds.
- Implementation phases can point to concrete local files instead of inferred paths.

## Risk Assessment
Main risk is upstream drift versus research notes; this phase absorbs that risk early.

## Security Considerations
Do not weaken upstream Access or R2 privacy defaults during clone/setup.

## Next steps
Start Phase 02 only after clone audit confirms real auth and mailbox ownership files.
