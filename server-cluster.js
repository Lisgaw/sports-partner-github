"use strict";

// Node.js Cluster Mode — tek process yerine CPU başına 1 worker açar.
// Her worker bağımsız bir event loop + V8 heap çalıştırır.
// OOM riskini kısmen izole eder: 1 worker crash olursa diğerleri çalışmaya devam eder.

const cluster = require("cluster");
const os = require("os");
const path = require("path");

// Container'ın sahip olduğu CPU sayısı; max 8 ile kısıtla (kaynak israfını önle).
// Docker'da os.cpus() container cgroup limitini yansıtır.
const WORKER_COUNT = Math.max(2, Math.min(os.cpus().length, 8));

if (cluster.isPrimary) {
  console.log(
    `[cluster] Primary PID=${process.pid} — ${os.cpus().length} CPUs available, starting ${WORKER_COUNT} workers`
  );

  // İlk worker'ları oluştur
  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }

  // Çöken worker'ı otomatik yeniden başlat (crash loop'a karşı back-off ile)
  const restartAttempts = new Map();
  cluster.on("exit", (worker, code, signal) => {
    if (worker.exitedAfterDisconnect) return; // kasıtlı kapatma — yeniden başlatma

    const key = worker.id;
    const attempts = restartAttempts.get(key) ?? 0;
    const delay = Math.min(1000 * 2 ** attempts, 30_000); // exp back-off, max 30s

    console.error(
      `[cluster] Worker PID=${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting in ${delay}ms (attempt ${attempts + 1})…`
    );

    restartAttempts.set(key, attempts + 1);
    setTimeout(() => {
      const w = cluster.fork();
      // Yeni worker başarılı olursa sayacı sıfırla
      w.on("online", () => restartAttempts.delete(w.id));
    }, delay);
  });

  cluster.on("online", (worker) => {
    console.log(`[cluster] Worker PID=${worker.process.pid} is online`);
  });
} else {
  // Worker: Next.js standalone server.js'i yükle
  require(path.join(__dirname, "server.js"));
}
