import type { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/allowlist";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import type { UserListItem } from "@/features/users/types";

// 許可リスト照合（lib/auth/allowlist）と同じ user テーブルを扱う。
// クライアントは引数注入し、テストで差し替え可能にする（service-layer.md §2）。
export type UsersDb = Pick<PrismaClient, "user">;

// 追加サービスの入力（スキーマ由来の値を受ける）。
export type CreateUserData = { email: string; name?: string };

type UserRow = {
  id: bigint;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
};

// Entity 行を画面・API 向け DTO へ整形する（BigInt → string / Date → ISO）。
function toItem(row: UserRow): UserListItem {
  return {
    id: row.id.toString(),
    email: row.email,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

// 許可リストの全ユーザーを返す（有効を先頭・メール昇順）。
export async function listUsers(db: UsersDb): Promise<UserListItem[]> {
  const rows = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { email: "asc" }],
  });
  return rows.map(toItem);
}

// 許可リストへユーザーを追加する。email は正規化（小文字化）して重複を防ぐ。
export async function createUser(db: UsersDb, input: CreateUserData): Promise<UserListItem> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new ValidationError("入力値が不正です", {
      email: "メールアドレスは必須です",
    });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("このメールアドレスは既に登録されています");
  }

  const name = input.name?.trim() ? input.name.trim() : null;
  const created = await db.user.create({ data: { email, name } });
  return toItem(created);
}

// ユーザーの有効/無効を設定する（ログイン可否の切替）。
export async function setUserActive(db: UsersDb, id: string, isActive: boolean): Promise<void> {
  await db.user.update({ where: { id: BigInt(id) }, data: { isActive } });
}
