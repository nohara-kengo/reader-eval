import { PrismaClient } from "@prisma/client";

// PrismaClient のシングルトン（service-layer.md）。
// 開発時の HMR で複数インスタンスが生成されないよう globalThis にキャッシュする。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
