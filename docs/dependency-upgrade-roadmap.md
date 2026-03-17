# Dependency Upgrade Roadmap

This roadmap reduces upgrade risk by sequencing changes in safe batches.

## Current High-Risk Areas

- Prisma is pinned to v5 while latest major is v7.
- next-auth is on beta v5.
- Lint/test ecosystem has mixed major versions.

## Phase 1: Safe Patch/Minor Updates

Run weekly:

```bash
npm run deps:outdated
npm run deps:audit
```

Update first:
- `@sentry/nextjs`
- `@supabase/supabase-js`
- `@upstash/redis`
- `tailwindcss` and `@tailwindcss/postcss`
- `vitest` and `@vitest/coverage-v8`

Validation after each batch:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npx next build`

## Phase 2: Auth Stabilization

- Decide target: stable next-auth release strategy.
- Validate middleware/session callbacks against the chosen version.
- Add targeted auth regression tests before upgrade.

## Phase 3: Prisma Major Migration (v5 -> v7)

Preparation:
- Read Prisma v6/v7 migration notes.
- Dry-run schema + client generation in a branch.
- Validate all routes touching Prisma queries.

Execution checklist:
- Upgrade `prisma` and `@prisma/client`
- Re-generate client
- Run migration checks in staging database
- Execute API smoke tests

## Phase 4: Continuous Maintenance

- Keep monthly dependency review cadence.
- Keep changelog notes in PR descriptions for major upgrades.
- Avoid mixing major upgrades in the same PR.
