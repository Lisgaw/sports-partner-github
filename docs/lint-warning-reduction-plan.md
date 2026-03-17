# Lint Warning Reduction Plan

This plan is designed to reduce warning debt incrementally without blocking delivery.

## Current Baseline

Run:

```bash
npm run lint:warnings
```

Track:
- Total warning count
- Top warning rules
- Top warning-heavy files

## Phase 1 (Fast, low risk)

- Remove unused variables (`@typescript-eslint/no-unused-vars`)
- Remove stale eslint-disable comments
- Fix obvious dependency array issues in hooks

## Phase 2 (Type safety)

- Reduce `any` usage in leaf components first
- Introduce narrow utility types for repeated API payload shapes
- Avoid broad `as any` casts in page-level components

## Phase 3 (Performance and UX)

- Gradually migrate high-impact `<img>` to `next/image`
- Prioritize components on frequently visited pages

## Execution Rules

- Keep changes atomic by feature area
- Validate each batch with `npm run lint` and `npx tsc --noEmit`
- Prefer warning reduction in touched files first (boy-scout rule)
