import type { PrismaClient } from "@prisma/client";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import type { GradeListItem } from "@/features/grades/types";

// 等級マスタ（grade テーブル）を扱う。
// クライアントは引数注入し、テストで差し替え可能にする（service-layer.md §2）。
export type GradesDb = Pick<PrismaClient, "grade">;

// 追加サービスの入力（スキーマ由来の値を受ける）。
export type CreateGradeData = { code: string; name: string; sortOrder?: number };

type GradeRow = {
  id: bigint;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

// Entity 行を画面・API 向け DTO へ整形する（BigInt → string / Date → ISO）。
function toItem(row: GradeRow): GradeListItem {
  return {
    id: row.id.toString(),
    code: row.code,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// 等級を全件返す（有効を先頭・表示順昇順 → コード昇順）。
export async function listGrades(db: GradesDb): Promise<GradeListItem[]> {
  const rows = await db.grade.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
  });
  return rows.map(toItem);
}

// 等級を追加する。code は前後空白を除去し、重複を一意制約前に検出して弾く。
export async function createGrade(db: GradesDb, input: CreateGradeData): Promise<GradeListItem> {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code) {
    throw new ValidationError("入力値が不正です", { code: "等級コードは必須です" });
  }
  if (!name) {
    throw new ValidationError("入力値が不正です", { name: "等級名は必須です" });
  }

  const existing = await db.grade.findUnique({ where: { code } });
  if (existing) {
    throw new ConflictError("この等級コードは既に登録されています");
  }

  const sortOrder = input.sortOrder ?? 0;
  const created = await db.grade.create({ data: { code, name, sortOrder } });
  return toItem(created);
}

// 等級の有効/無効を設定する（評価対象としての利用可否の切替）。
export async function setGradeActive(db: GradesDb, id: string, isActive: boolean): Promise<void> {
  await db.grade.update({ where: { id: BigInt(id) }, data: { isActive } });
}
