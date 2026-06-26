import { describe, expect, it, vi } from "vitest";
import {
  extractEmail,
  isAllowedUser,
  normalizeEmail,
  type AllowlistDb,
} from "@/lib/auth/allowlist";

// findFirst だけを持つ最小モック（select で id のみ取得する想定）。
function makeDbMock(found: { id: bigint } | null) {
  const findFirst = vi.fn().mockResolvedValue(found);
  const db = { user: { findFirst } } as unknown as AllowlistDb;
  return { db, findFirst };
}

describe("normalizeEmail", () => {
  it("前後空白を除去し小文字へ正規化する", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });

  it("空文字・undefined・null は null を返す", () => {
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("extractEmail", () => {
  it("user.email を最優先で採用する", () => {
    expect(
      extractEmail({ email: "User@Comthink.co.jp" }, { preferred_username: "other@x.jp" }),
    ).toBe("user@comthink.co.jp");
  });

  it("user.email が無ければ profile.preferred_username（UPN）へフォールバックする", () => {
    expect(extractEmail(null, { preferred_username: "Upn@Comthink.co.jp" })).toBe(
      "upn@comthink.co.jp",
    );
  });

  it("どこにも email が無ければ null を返す", () => {
    expect(extractEmail(null, {})).toBeNull();
    expect(extractEmail({ email: null }, { email: 123 })).toBeNull();
  });
});

describe("isAllowedUser", () => {
  it("登録済み（有効）ユーザーなら true を返す", async () => {
    const { db, findFirst } = makeDbMock({ id: 1n });

    await expect(isAllowedUser(db, "kengo-nohara@comthink.co.jp")).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: { email: "kengo-nohara@comthink.co.jp", isActive: true },
      select: { id: true },
    });
  });

  it("未登録ユーザーなら false を返す", async () => {
    const { db } = makeDbMock(null);
    await expect(isAllowedUser(db, "unknown@comthink.co.jp")).resolves.toBe(false);
  });

  it("email が空なら DB を照会せず false を返す", async () => {
    const { db, findFirst } = makeDbMock(null);
    await expect(isAllowedUser(db, "  ")).resolves.toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("照合前に email を正規化する（大文字・空白を吸収）", async () => {
    const { db, findFirst } = makeDbMock({ id: 2n });
    await expect(isAllowedUser(db, " Kengo-Nohara@Comthink.co.jp ")).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: { email: "kengo-nohara@comthink.co.jp", isActive: true },
      select: { id: true },
    });
  });
});
