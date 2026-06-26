import type { PrismaClient } from "@prisma/client";

// 許可リスト照合に必要な最小限の DB 依存（service-layer.md §2: クライアントは引数注入し、テストで差し替え可能に）。
export type AllowlistDb = Pick<PrismaClient, "user">;

// email を照合キーへ正規化する（前後空白除去 + 小文字化）。空なら null。
export function normalizeEmail(email?: string | null): string | null {
  if (!email) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

// Entra ID のクレーム（user / profile）からログイン照合用の email を取り出す。
// Auth.js は user.email を埋めるが、無い場合は profile の email / preferred_username（UPN）へフォールバックする。
type EntraProfile = {
  email?: unknown;
  preferred_username?: unknown;
};

export function extractEmail(
  user?: { email?: string | null } | null,
  profile?: EntraProfile | null,
): string | null {
  const candidates: unknown[] = [user?.email, profile?.email, profile?.preferred_username];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const normalized = normalizeEmail(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }
  return null;
}

// アプリ DB の許可リスト（users）に、有効な該当ユーザーが存在するか判定する（既定拒否 / authz.md §5）。
export async function isAllowedUser(db: AllowlistDb, email?: string | null): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  const found = await db.user.findFirst({
    where: { email: normalized, isActive: true },
    select: { id: true },
  });
  return found !== null;
}
