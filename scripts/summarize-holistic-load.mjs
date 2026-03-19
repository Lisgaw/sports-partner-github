import fs from "node:fs/promises";
import path from "node:path";

function getArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

function percent(value, total) {
  if (!total) return "0.00";
  return ((value / total) * 100).toFixed(2);
}

function collectMatching(counters, fragment) {
  return Object.entries(counters)
    .filter(([key]) => key.includes(fragment))
    .reduce((sum, [, value]) => sum + Number(value || 0), 0);
}

function classifyWall(endpointRows) {
  const staticRow = endpointRows.find((row) => row.endpoint === "/");
  const authRow = endpointRows.find((row) => row.endpoint === "/api/auth/csrf");
  const dbHeavy = endpointRows.filter((row) => row.endpoint.startsWith("/api/") && !row.endpoint.startsWith("/api/auth/"));

  const widespreadTimeouts = endpointRows.filter((row) => row.errors > 0).length >= Math.max(2, Math.floor(endpointRows.length / 3));
  const staticHealthy = staticRow ? staticRow.successRate >= 90 : false;
  const authHealthy = authRow ? authRow.successRate >= 90 : false;
  const dbHeavyDegraded = dbHeavy.filter((row) => row.successRate < 85 || row.p95 >= 3000).length >= Math.max(2, Math.floor(dbHeavy.length / 2));

  if (widespreadTimeouts && (!staticHealthy || !authHealthy)) {
    return "Vercel/request edge saturation is the first wall";
  }

  if (dbHeavyDegraded && staticHealthy) {
    return "Supabase/Postgres-backed API paths are the first wall";
  }

  return "Mixed degradation; no single wall dominates cleanly";
}

async function summarizeFile(filePath) {
  const raw = JSON.parse(await fs.readFile(filePath, "utf8"));
  const counters = raw.aggregate?.counters ?? {};
  const summaries = raw.aggregate?.summaries ?? {};
  const totalRequests = Number(counters["http.requests"] ?? 0);
  const totalResponses = Number(counters["http.responses"] ?? 0);
  const totalCreated = Number(counters["vusers.created"] ?? 0);
  const totalFailed = Number(counters["vusers.failed"] ?? 0);
  const totalCompleted = Number(counters["vusers.completed"] ?? 0);

  const endpointNames = Object.keys(summaries)
    .filter((key) => key.startsWith("plugins.metrics-by-endpoint.response_time."))
    .map((key) => key.replace("plugins.metrics-by-endpoint.response_time.", ""))
    .sort();

  const endpointRows = endpointNames.map((endpoint) => {
    const stats = summaries[`plugins.metrics-by-endpoint.response_time.${endpoint}`] ?? {};
    const success = collectMatching(counters, `plugins.metrics-by-endpoint.${endpoint}.codes.2`)
      + collectMatching(counters, `plugins.metrics-by-endpoint.${endpoint}.codes.3`);
    const clientErrors = collectMatching(counters, `plugins.metrics-by-endpoint.${endpoint}.codes.4`);
    const serverErrors = collectMatching(counters, `plugins.metrics-by-endpoint.${endpoint}.codes.5`);
    const errors = collectMatching(counters, `plugins.metrics-by-endpoint.${endpoint}.errors.`);
    const totalEndpoint = success + clientErrors + serverErrors + errors;

    return {
      endpoint,
      count: totalEndpoint,
      success,
      clientErrors,
      serverErrors,
      errors,
      successRate: totalEndpoint ? (success / totalEndpoint) * 100 : 0,
      mean: Number(stats.mean ?? 0),
      p95: Number(stats.p95 ?? 0),
      p99: Number(stats.p99 ?? 0),
    };
  });

  const failureByType = Object.entries(counters)
    .filter(([key]) => key.startsWith("errors."))
    .map(([key, value]) => ({ type: key.replace("errors.", ""), count: Number(value) }))
    .sort((left, right) => right.count - left.count);

  return {
    file: path.basename(filePath),
    totalRequests,
    totalResponses,
    totalCreated,
    totalCompleted,
    totalFailed,
    failureRate: Number(percent(totalFailed, totalCreated)),
    successRate: Number(percent(totalResponses, totalRequests)),
    responseTime: {
      mean: Number(summaries["http.response_time"]?.mean ?? 0),
      p95: Number(summaries["http.response_time"]?.p95 ?? 0),
      p99: Number(summaries["http.response_time"]?.p99 ?? 0),
    },
    failureByType,
    endpointRows: endpointRows.sort((left, right) => {
      if (left.successRate !== right.successRate) {
        return left.successRate - right.successRate;
      }
      return right.p95 - left.p95;
    }),
  };
}

async function main() {
  const filesArg = getArg("--files");
  if (!filesArg) {
    throw new Error("Usage: node scripts/summarize-holistic-load.mjs --files perf/holistic_10.json,perf/holistic_50.json");
  }

  const files = filesArg.split(",").map((file) => path.resolve(process.cwd(), file.trim()));
  const summaries = await Promise.all(files.map(summarizeFile));

  const report = summaries.map((summary) => ({
    wave: summary.file,
    requests: summary.totalRequests,
    responses: summary.totalResponses,
    createdVusers: summary.totalCreated,
    failedVusers: summary.totalFailed,
    failedVuserRatePct: summary.failureRate,
    successfulResponseRatePct: summary.successRate,
    meanMs: summary.responseTime.mean,
    p95Ms: summary.responseTime.p95,
    p99Ms: summary.responseTime.p99,
    topFailures: summary.failureByType.slice(0, 3),
    weakestEndpoints: summary.endpointRows.slice(0, 5),
    wall: classifyWall(summary.endpointRows),
  }));

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});