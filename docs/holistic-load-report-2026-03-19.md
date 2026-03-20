# Holistic Production Load Report — 2026-03-19

## Scope

Production was stressed after the feed snapshot deployment using a mixed workload that exercised:

- homepage + filtered listings
- auth login
- personalized feed
- social posts feed
- profile reads
- listing detail
- listing creation
- direct conversation creation + message write

The test used a dedicated benchmark fixture set seeded directly into the production database:

- 650 benchmark users
- 120 open listings
- 180 public posts
- 1 dedicated direct-message sink user

The scenario was executed as separate waves of 10, 50, 100, 200, and 500 users. Each wave launched a single burst of users with the same weighted traffic mix.

## Artifacts

- Fixture generator: `scripts/setup-holistic-bench.mjs`
- Artillery processor: `perf/holistic-load-processor.js`
- Artillery scenario: `perf/holistic-load.ts`
- Raw reports:
  - `perf/holistic_10.json`
  - `perf/holistic_50.json`
  - `perf/holistic_100.json`
  - `perf/holistic_200.json`
  - `perf/holistic_500.json`
- Summary helper: `scripts/summarize-holistic-load.mjs`

## Wave Summary

| Wave | Requests | Responses | Failed VUs | Response Success | Mean | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 users | 40 | 40 | 0 | 100.00% | 422.7 ms | 889.1 ms | 925.4 ms |
| 50 users | 195 | 195 | 0 | 100.00% | 408.5 ms | 1249.1 ms | 1652.8 ms |
| 100 users | 396 | 396 | 0 | 100.00% | 332.9 ms | 944.0 ms | 1274.3 ms |
| 200 users | 793 | 793 | 0 | 100.00% | 338.4 ms | 871.5 ms | 1130.2 ms |
| 500 users | 1961 | 1961 | 0 | 100.00% | 311.1 ms | 854.2 ms | 907.0 ms |

## 500-User Endpoint Breakdown

| Endpoint | Count | Status | Mean | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` homepage | 101 | 100% success | 299.6 ms | 376.2 ms | 407.5 ms |
| `/api/listings?...cityId&sportId` filtered listings | 101 | 100% success | 96.6 ms | 130.3 ms | 210.6 ms |
| `/api/listings/:id` listing detail | 101 | 100% success | 278.9 ms | 539.2 ms | 561.2 ms |
| `/api/auth/csrf` | 399 | 100% success | 161.9 ms | 459.5 ms | 487.9 ms |
| `/api/auth/callback/credentials` | 399 | 100% success | 139.9 ms | 194.4 ms | 228.2 ms |
| `/api/profile` auth check | 63 | 100% success | 301.1 ms | 561.2 ms | 632.8 ms |
| `/api/feed?page=1` | 79 | 100% success | 345.8 ms | 596.0 ms | 671.9 ms |
| `/api/posts?limit=10` | 59 | 100% success | 303.9 ms | 561.2 ms | 608.0 ms |
| `/api/profile` profile read | 63 | 100% success | 330.5 ms | 596.0 ms | 699.4 ms |
| `/api/conversations` | 62 | 100% success | 305.2 ms | 561.2 ms | 572.6 ms |
| `/api/conversations/:id/messages` | 62 | 100% success | 317.2 ms | 550.1 ms | 561.2 ms |
| `/api/listings` create | 73 | 100% success | 410.0 ms | 727.9 ms | 804.5 ms |

## Findings

1. No wall was reached within the requested 10/50/100/200/500-user envelope.
2. No 4xx overload, 5xx, timeout, TLS, or connection-reset failures were recorded in the Artillery JSON reports.
3. Both the public surface and the DB-backed authenticated surface stayed healthy at 500 users.
4. The hottest path in the requested envelope was listing creation, but even that path stayed below 0.8 s at p99 with 100% success.
5. The feed endpoint remained stable under the mixed workload, which is consistent with the new snapshot-based read path being live and effective.

## Weakest-Link Assessment

There is no evidence in this run set that either Vercel or Supabase cracked first.

If forced to rank likely first-pressure points beyond this envelope, the order is:

1. listing creation
2. feed/profile read cluster
3. direct message write
4. public homepage/filter/listing reads

That ranking is based on relative latency under the 500-user wave, not on observed failures.

## Conclusion

Within the requested production test envelope, the system remained stable end-to-end. The requested comparison of “Supabase mı önce kırılır, Vercel mi?” could not be decisively answered because neither layer exhibited failure symptoms at 500 users.

To find the actual first wall, the next step is not more code changes first. The next step is a more aggressive sustained test beyond this envelope, for example:

- 500 users sustained for 30-60 seconds
- 750-user burst
- 1000-user burst
- write-heavy mix with a larger share of listing/message mutations