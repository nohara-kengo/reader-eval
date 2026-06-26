// 開発用シード（冪等）。ダミーデータのみ・実 PII は入れない（db.md §4）。
// 実行は Node 22 の型ストリップ前提（package.json の prisma.seed を参照）。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 許可リスト（users）の初期メンバー。email は小文字で保持する（allowlist.ts の正規化と一致させる）。
const allowedUsers = [
  "junya-orito@comthink.co.jp",
  "fumitaka-hatano@comthink.co.jp",
  "shunsuke-honjo@comthink.co.jp",
  "kengo-nohara@comthink.co.jp",
];

async function main() {
  // 許可ユーザーを upsert（冪等。再実行で重複・上書き事故を起こさない。db.md §4）
  for (const email of allowedUsers) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  }

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
