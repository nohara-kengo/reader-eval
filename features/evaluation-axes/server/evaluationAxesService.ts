import type { PrismaClient } from "@prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/shared/errors";
import type {
  EvaluationCategoryListItem,
  EvaluationItemListItem,
} from "@/features/evaluation-axes/types";

// 評価軸カテゴリ（evaluation_axis_categories）・評価項目（evaluation_items）を扱う。
// クライアントは引数注入し、テストで差し替え可能にする（service-layer.md §2）。
export type EvaluationAxesDb = Pick<PrismaClient, "evaluationAxisCategory" | "evaluationItem">;

// 追加サービスの入力（スキーマ由来の値を受ける）。
export type CreateCategoryData = { code: string; name: string; sortOrder?: number };
export type CreateItemData = {
  categoryId: string;
  code: string;
  name: string;
  sortOrder?: number;
};

type ItemRow = {
  id: bigint;
  categoryId: bigint;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

type CategoryRow = {
  id: bigint;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  items?: ItemRow[];
};

// 一覧の並び順（有効を先頭・表示順昇順 → コード昇順）。カテゴリ・項目で共通。
const LIST_ORDER_BY = [
  { isActive: "desc" as const },
  { sortOrder: "asc" as const },
  { code: "asc" as const },
];

// 評価項目の Entity 行を画面・API 向け DTO へ整形する（BigInt → string / Date → ISO）。
function toItem(row: ItemRow): EvaluationItemListItem {
  return {
    id: row.id.toString(),
    categoryId: row.categoryId.toString(),
    code: row.code,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// 評価軸カテゴリの Entity 行を DTO へ整形する。配下の評価項目も整形して含める。
function toCategory(row: CategoryRow): EvaluationCategoryListItem {
  return {
    id: row.id.toString(),
    code: row.code,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    items: (row.items ?? []).map(toItem),
  };
}

// 評価軸カテゴリを全件返す（配下の評価項目をネストして含める）。
export async function listEvaluationAxes(
  db: EvaluationAxesDb,
): Promise<EvaluationCategoryListItem[]> {
  const rows = await db.evaluationAxisCategory.findMany({
    orderBy: LIST_ORDER_BY,
    include: { items: { orderBy: LIST_ORDER_BY } },
  });
  return rows.map(toCategory);
}

// 評価軸カテゴリを追加する。code は前後空白を除去し、重複を一意制約前に検出して弾く。
export async function createCategory(
  db: EvaluationAxesDb,
  input: CreateCategoryData,
): Promise<EvaluationCategoryListItem> {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code) {
    throw new ValidationError("入力値が不正です", { code: "カテゴリコードは必須です" });
  }
  if (!name) {
    throw new ValidationError("入力値が不正です", { name: "カテゴリ名は必須です" });
  }

  const existing = await db.evaluationAxisCategory.findUnique({ where: { code } });
  if (existing) {
    throw new ConflictError("このカテゴリコードは既に登録されています");
  }

  const sortOrder = input.sortOrder ?? 0;
  const created = await db.evaluationAxisCategory.create({ data: { code, name, sortOrder } });
  return toCategory(created);
}

// 評価項目を追加する。所属カテゴリの存在を確認し、カテゴリ内の code 重複を弾く。
export async function createItem(
  db: EvaluationAxesDb,
  input: CreateItemData,
): Promise<EvaluationItemListItem> {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code) {
    throw new ValidationError("入力値が不正です", { code: "評価項目コードは必須です" });
  }
  if (!name) {
    throw new ValidationError("入力値が不正です", { name: "評価項目名は必須です" });
  }

  const categoryId = BigInt(input.categoryId);
  const category = await db.evaluationAxisCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new NotFoundError("対象の評価軸カテゴリが見つかりません");
  }

  const existing = await db.evaluationItem.findUnique({
    where: { categoryId_code: { categoryId, code } },
  });
  if (existing) {
    throw new ConflictError("この評価項目コードはカテゴリ内に既に登録されています");
  }

  const sortOrder = input.sortOrder ?? 0;
  const created = await db.evaluationItem.create({
    data: { categoryId, code, name, sortOrder },
  });
  return toItem(created);
}

// 評価軸カテゴリの有効/無効を設定する。
export async function setCategoryActive(
  db: EvaluationAxesDb,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db.evaluationAxisCategory.update({ where: { id: BigInt(id) }, data: { isActive } });
}

// 評価項目の有効/無効を設定する。
export async function setItemActive(
  db: EvaluationAxesDb,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db.evaluationItem.update({ where: { id: BigInt(id) }, data: { isActive } });
}
