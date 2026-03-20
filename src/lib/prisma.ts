import { PrismaClient } from "@prisma/client";
import "@/lib/env";
import { trackQueryInBudget } from "@/lib/query-budget";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRead: PrismaClient | undefined;
};

// Vercel Serverless: her function instance en fazla 10 bağlantı açabilir.
// connection_limit değeri DATABASE_URL parametresinden okunur; burada üst sınırı 10 ile kısıtlıyoruz.
// pool_timeout: 10s — bağlantı bulunamazsa hemen hata ver, askıda bekleme.
function buildDatabaseUrl(envKey = "DATABASE_URL"): string | undefined {
  const url = process.env[envKey];
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Zaten parametre varsa dokunma, yoksa ekle
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "20");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "15");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient(datasourceUrl?: string) {
  const client = new PrismaClient({
    datasourceUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  // Query Budget: aktif budget context varsa her sorguyu say
  client.$use(async (params, next) => {
    trackQueryInBudget();
    return next(params);
  });

  return client;
}

// ─── Primary (read + write) ─────────────────────────────────────────────────
export const prisma = globalForPrisma.prisma ?? createPrismaClient(buildDatabaseUrl());

// ─── Read Replica ────────────────────────────────────────────────────────────
// DATABASE_READ_URL varsa replica'ya bağlanır, yoksa primary'ye fallback eder.
// GET (read-only) endpoint'lerinde import { prismaRead } from "@/lib/prisma" kullanın.
// Write latency'yi düşürür: read yükü replica'ya kayar, primary sadece write yapar.
const readUrl = buildDatabaseUrl("DATABASE_READ_URL") ?? buildDatabaseUrl();
export const prismaRead = globalForPrisma.prismaRead ?? createPrismaClient(readUrl);

// Geliştirme ortamında hot-reload sırasında çoklu bağlantıyı önle
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRead = prismaRead;
}
