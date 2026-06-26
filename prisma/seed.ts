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

// 組織（部署）マスタの初期データ（Epic #57）。code は一意・表示順で並べる。
const organizations = [
  { code: "PTU", name: "PTU部", sortOrder: 1 },
  { code: "SRU", name: "SRU部", sortOrder: 2 },
  { code: "R", name: "R部", sortOrder: 3 },
  { code: "VUC", name: "VUC部", sortOrder: 4 },
];

// 評価軸カテゴリと配下の評価項目の初期データ（要件 B-03）。
// 4 カテゴリ（資格 / 技術力 / リーダーシップ / その他）× 各 4 評価項目。
// code はカテゴリ単位で一意（カテゴリ code をプレフィックスにし重複を避ける）。
const evaluationAxes = [
  {
    code: "QUAL",
    name: "資格",
    sortOrder: 1,
    items: [
      { code: "QUAL-01", name: "基本情報技術者", sortOrder: 1 },
      { code: "QUAL-02", name: "応用情報技術者", sortOrder: 2 },
      { code: "QUAL-03", name: "クラウド認定資格（AWS/Azure 等）", sortOrder: 3 },
      { code: "QUAL-04", name: "プロジェクトマネジメント資格（PMP 等）", sortOrder: 4 },
    ],
  },
  {
    code: "TECH",
    name: "技術力",
    sortOrder: 2,
    items: [
      { code: "TECH-01", name: "設計力", sortOrder: 1 },
      { code: "TECH-02", name: "実装力", sortOrder: 2 },
      { code: "TECH-03", name: "コードレビュー", sortOrder: 3 },
      { code: "TECH-04", name: "技術選定・アーキテクチャ", sortOrder: 4 },
    ],
  },
  {
    code: "LEAD",
    name: "リーダーシップ",
    sortOrder: 3,
    items: [
      { code: "LEAD-01", name: "チームマネジメント", sortOrder: 1 },
      { code: "LEAD-02", name: "意思決定", sortOrder: 2 },
      { code: "LEAD-03", name: "育成・コーチング", sortOrder: 3 },
      { code: "LEAD-04", name: "ビジョン共有", sortOrder: 4 },
    ],
  },
  {
    code: "GROWTH",
    name: "その他（伸びしろ系項目）",
    sortOrder: 4,
    items: [
      { code: "GROWTH-01", name: "学習意欲", sortOrder: 1 },
      { code: "GROWTH-02", name: "主体性", sortOrder: 2 },
      { code: "GROWTH-03", name: "課題発見力", sortOrder: 3 },
      { code: "GROWTH-04", name: "適応力", sortOrder: 4 },
    ],
  },
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

  // 評価軸カテゴリと評価項目を upsert（冪等。code 一意制約で重複・上書き事故を防ぐ。db.md §4）
  for (const axis of evaluationAxes) {
    const category = await prisma.evaluationAxisCategory.upsert({
      where: { code: axis.code },
      update: {},
      create: { code: axis.code, name: axis.name, sortOrder: axis.sortOrder },
    });
    for (const item of axis.items) {
      await prisma.evaluationItem.upsert({
        // カテゴリ内 code の複合一意キーで冪等にする（再実行で重複しない）
        where: { categoryId_code: { categoryId: category.id, code: item.code } },
        update: {},
        create: {
          categoryId: category.id,
          code: item.code,
          name: item.name,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  // 組織マスタを upsert（冪等。code 一意制約で重複・上書き事故を防ぐ。db.md §4）
  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { code: org.code },
      update: {},
      create: org,
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
