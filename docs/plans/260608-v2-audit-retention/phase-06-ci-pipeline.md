# Phase 06 — CI Pipeline

| Field | Value |
|---|---|
| **Status** | pending |
| **Effort** | M (1-2 ngày) |
| **Depends on** | Phase 05 (code must be clean before CI enforces it) |

## Overview

Add automated CI pipeline via GitHub Actions: typecheck → test → lint → build on every push and PR. Currently all checks are manual (`pnpm typecheck`, `pnpm test`). No ESLint/Prettier exist yet — add them as part of this phase.

## Requirements

### CI Pipeline
- **Trigger**: push to `metro-mail-v1`, PR to `metro-mail-v1`
- **Steps**: install deps → typecheck → test → lint → build
- **Node**: 22.x (match wrangler compatibility)
- **pnpm**: 11.5.0 (via `packageManager` in package.json)
- **Cache**: pnpm store + node_modules
- **Wrangler**: generate types before typecheck (`pnpm cf-typegen`)

### ESLint + Prettier (V3-1, pulled forward)
- **ESLint**: flat config (`eslint.config.mjs`) with `@typescript-eslint` + `react` + `react-hooks` plugins
- **Prettier**: `.prettierrc` with tabs, double quotes, semicolons, trailing commas (multi-line)
- **Scripts**: `pnpm lint` (eslint), `pnpm format` (prettier --write), `pnpm format:check` (prettier --check)
- **Auto-fix**: `pnpm lint --fix` for auto-fixable rules
- **Ignore**: `build/`, `.react-router/`, `node_modules/`, `worker-configuration.d.ts`

### Implementation Steps
1. Add ESLint + Prettier + plugins to `devDependencies`
2. Create `eslint.config.mjs` (flat config, not `.eslintrc`)
3. Create `.prettierrc` matching codebase conventions (tabs, double quotes, semicolons)
4. Create `.prettierignore` + add to `.gitignore` if needed
5. Add `lint`, `format`, `format:check` scripts to `package.json`
6. Run `pnpm format` once to normalize existing code
7. Fix any lint errors (likely: unused imports, missing return types)
8. Create `.github/workflows/ci.yml`
9. Verify CI passes on next push
10. Add badge to README

## CI Workflow

```yaml
name: CI
on:
  push:
    branches: [metro-mail-v1]
  pull_request:
    branches: [metro-mail-v1]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm cf-typegen
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm build
```

## Key Files

| Action | File |
|---|---|
| Create | `eslint.config.mjs` |
| Create | `.prettierrc` |
| Create | `.prettierignore` |
| Create | `.github/workflows/ci.yml` |
| Modify | `package.json` (scripts + devDependencies) |

## Success Criteria

- [ ] CI passes on push: typecheck + test + lint + format:check + build all green
- [ ] `pnpm lint` reports 0 errors
- [ ] `pnpm format:check` passes
- [ ] PRs get CI status check
- [ ] CI runs in < 3 minutes (cached)
