import type { PrismaClient } from "@prisma/client";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import type { OrganizationListItem } from "@/features/organizations/types";

// 組織（organization テーブル）を扱う。
// クライアントは引数注入し、テストで差し替え可能にする（service-layer.md §2）。
export type OrganizationsDb = Pick<PrismaClient, "organization">;

// 追加サービスの入力（スキーマ由来の値を受ける）。
export type CreateOrganizationData = { code: string; name: string; sortOrder?: number };

type OrganizationRow = {
  id: bigint;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

// Entity 行を画面・API 向け DTO へ整形する（BigInt → string / Date → ISO）。
function toItem(row: OrganizationRow): OrganizationListItem {
  return {
    id: row.id.toString(),
    code: row.code,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// 組織を全件返す（有効を先頭・表示順昇順 → コード昇順）。
export async function listOrganizations(db: OrganizationsDb): Promise<OrganizationListItem[]> {
  const rows = await db.organization.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
  });
  return rows.map(toItem);
}

// 組織を追加する。code は前後空白を除去し、重複を一意制約前に検出して弾く。
export async function createOrganization(
  db: OrganizationsDb,
  input: CreateOrganizationData,
): Promise<OrganizationListItem> {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code) {
    throw new ValidationError("入力値が不正です", { code: "組織コードは必須です" });
  }
  if (!name) {
    throw new ValidationError("入力値が不正です", { name: "組織名は必須です" });
  }

  const existing = await db.organization.findUnique({ where: { code } });
  if (existing) {
    throw new ConflictError("この組織コードは既に登録されています");
  }

  const sortOrder = input.sortOrder ?? 0;
  const created = await db.organization.create({ data: { code, name, sortOrder } });
  return toItem(created);
}

// 組織の有効/無効を設定する（所属先としての利用可否の切替）。
export async function setOrganizationActive(
  db: OrganizationsDb,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db.organization.update({ where: { id: BigInt(id) }, data: { isActive } });
}
