import fs from "node:fs/promises";

const args = process.argv.slice(2);

function getArg(name, fallback = undefined) {
  const flag = `--${name}`;
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * ratio) - 1));
  return sortedValues[index];
}

async function runLevel({ url, concurrency, durationMs, timeoutMs, headers }) {
  const deadline = Date.now() + durationMs;
  const latencies = [];
  let totalRequests = 0;
  let successCount = 0;
  let timeoutCount = 0;
  let non2xxCount = 0;
  let otherErrors = 0;

  async function worker() {
    while (Date.now() < deadline) {
      totalRequests += 1;
      const startedAt = performance.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        const elapsed = performance.now() - startedAt;
        if (response.ok) {
          successCount += 1;
          latencies.push(elapsed);
        } else {
          non2xxCount += 1;
        }
        await response.arrayBuffer();
      } catch (error) {
        if (error && typeof error === "object" && error.name === "AbortError") {
          timeoutCount += 1;
        } else {
          otherErrors += 1;
        }
      } finally {
        clearTimeout(timer);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  latencies.sort((left, right) => left - right);
  const latencySum = latencies.reduce((sum, value) => sum + value, 0);

  return {
    concurrency,
    durationMs,
    totalRequests,
    successCount,
    timeoutCount,
    non2xxCount,
    otherErrors,
    successRate: totalRequests === 0 ? 0 : successCount / totalRequests,
    timeoutRate: totalRequests === 0 ? 0 : timeoutCount / totalRequests,
    latencyMs: {
      mean: latencies.length === 0 ? null : latencySum / latencies.length,
      p50: percentile(latencies, 0.5),
      p90: percentile(latencies, 0.9),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
      max: latencies.length === 0 ? null : latencies[latencies.length - 1],
    },
  };
}

async function main() {
  const url = getArg("url");
  const label = getArg("label", "benchmark");
  const output = getArg("output");
  const timeoutMs = Number(getArg("timeout", "10000"));
  const durationMs = Number(getArg("duration", "15000"));
  const concurrencyList = (getArg("concurrency", "10,50,100,200"))
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  const cookie = getArg("cookie", "");

  if (!url) {
    throw new Error("--url is required");
  }

  const headers = {
    Accept: "application/json",
    ...(cookie ? { Cookie: cookie } : {}),
  };

  const results = [];
  for (const concurrency of concurrencyList) {
    const levelResult = await runLevel({
      url,
      concurrency,
      durationMs,
      timeoutMs,
      headers,
    });
    results.push(levelResult);
  }

  const payload = {
    label,
    url,
    durationMs,
    timeoutMs,
    generatedAt: new Date().toISOString(),
    results,
  };

  const serialized = JSON.stringify(payload, null, 2);
  if (output) {
    await fs.writeFile(output, serialized, "utf8");
  }
  console.log(serialized);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});