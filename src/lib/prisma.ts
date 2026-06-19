import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbPath: string | undefined;
  prismaClientMtime: number | undefined;
};

function getGeneratedClientMtime(): number {
  try {
    const clientModelPath = path.join(
      process.cwd(),
      "src/generated/prisma/internal/class.ts",
    );
    return fs.statSync(clientModelPath).mtimeMs;
  } catch {
    return 0;
  }
}

function getDatabasePath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl?.startsWith("file:")) {
    const filePath = envUrl.slice("file:".length);
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "dev.db");
}

function createPrismaClient(dbPath: string) {
  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
  });
  return new PrismaClient({ adapter });
}

const dbPath = getDatabasePath();
const clientMtime = getGeneratedClientMtime();

const hasFreshClient =
  globalForPrisma.prismaDbPath === dbPath &&
  globalForPrisma.prismaClientMtime === clientMtime &&
  globalForPrisma.prisma;

export const prisma = hasFreshClient
  ? globalForPrisma.prisma!
  : createPrismaClient(dbPath);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDbPath = dbPath;
  globalForPrisma.prismaClientMtime = clientMtime;
}