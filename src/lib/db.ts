import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDatasourceUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;
  const isVercel = process.env.VERCEL === "1";

  // Vercel functions run on a read-only filesystem except /tmp.
  // For SQLite demo deployments, copy the bundled DB into /tmp and use it there.
  if (isVercel && (!envUrl || envUrl.startsWith("file:"))) {
    const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");
    const runtimeDbPath = "/tmp/medboard.db";

    if (!fs.existsSync(runtimeDbPath)) {
      if (fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, runtimeDbPath);
      } else {
        console.error("[Prisma] Bundled SQLite file not found at prisma/dev.db");
      }
    }

    return `file:${runtimeDbPath}`;
  }

  return envUrl;
}

const datasourceUrl = resolveDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
