import { PrismaClient } from "@prisma/client";
import "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Vercel Serverless: her function instance en fazla 10 bağlantı açabilir.
// connection_limit değeri DATABASE_URL parametresinden okunur; burada üst sınırı 10 ile kısıtlıyoruz.
// pool_timeout: 10s — bağlantı bulunamazsa hemen hata ver, askıda bekleme.
function buildDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    // Zaten parametre varsa dokunma, yoksa ekle
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "10");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "10");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const datasourceUrl = buildDatabaseUrl();
  return new PrismaClient({
    datasourceUrl,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Geliştirme ortamında hot-reload sırasında çoklu bağlantıyı önle
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
