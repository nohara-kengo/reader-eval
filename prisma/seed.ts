// 開発用シード（冪等）。ダミーデータのみ・実 PII は入れない（db.md §4）。
// 実行は Node 22 の型ストリップ前提（package.json の prisma.seed を参照）。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 監査ログのサンプル（冪等にするため件数で制御）
  const count = await prisma.auditLog.count();
  if (count === 0) {
    await prisma.auditLog.create({
      data: {
        actorId: "seed-user",
        action: "seed.init",
        result: "success",
        summary: "初期シード",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
