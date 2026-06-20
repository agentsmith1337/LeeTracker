import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
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

function createPrismaClient(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return connectionString;
}

const databaseUrl = getDatabaseUrl();
const clientMtime = getGeneratedClientMtime();

const hasFreshClient =
  globalForPrisma.prismaDatabaseUrl === databaseUrl &&
  globalForPrisma.prismaClientMtime === clientMtime &&
  globalForPrisma.prisma;

export const prisma = hasFreshClient
  ? globalForPrisma.prisma!
  : createPrismaClient(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDatabaseUrl = databaseUrl;
  globalForPrisma.prismaClientMtime = clientMtime;
}