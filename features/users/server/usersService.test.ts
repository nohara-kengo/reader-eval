import { describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import { createUser, listUsers, setUserActive, type UsersDb } from "./usersService";

// user テーブルのみを持つ Prisma クライアントのモックを作る。
function makeDb() {
  const user = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return { db: { user } as unknown as UsersDb, user };
}

const baseRow = {
  id: 1n,
  email: "taro@comthink.co.jp",
  name: "山田 太郎",
  isActive: true,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

describe("listUsers", () => {
  it("DTO へ整形して返す（id は文字列・createdAt は ISO）", async () => {
    const { db, user } = makeDb();
    user.findMany.mockResolvedValue([baseRow]);

    const result = await listUsers(db);

    expect(result).toEqual([
      {
        id: "1",
        email: "taro@comthink.co.jp",
        name: "山田 太郎",
        isActive: true,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
  });
});

describe("createUser", () => {
  it("email を正規化（小文字化・トリム）して作成する", async () => {
    const { db, user } = makeDb();
    user.findUnique.mockResolvedValue(null);
    user.create.mockResolvedValue({ ...baseRow, email: "new@comthink.co.jp", name: "新人" });

    await createUser(db, { email: "  NEW@Comthink.co.jp  ", name: " 新人 " });

    expect(user.findUnique).toHaveBeenCalledWith({ where: { email: "new@comthink.co.jp" } });
    expect(user.create).toHaveBeenCalledWith({
      data: { email: "new@comthink.co.jp", name: "新人" },
    });
  });

  it("氏名が空のときは name を null で作成する", async () => {
    const { db, user } = makeDb();
    user.findUnique.mockResolvedValue(null);
    user.create.mockResolvedValue({ ...baseRow, name: null });

    await createUser(db, { email: "a@comthink.co.jp", name: "   " });

    expect(user.create).toHaveBeenCalledWith({
      data: { email: "a@comthink.co.jp", name: null },
    });
  });

  it("既に登録済みのメールアドレスは ConflictError を投げる", async () => {
    const { db, user } = makeDb();
    user.findUnique.mockResolvedValue(baseRow);

    await expect(createUser(db, { email: "taro@comthink.co.jp" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(user.create).not.toHaveBeenCalled();
  });

  it("メールアドレスが空のときは ValidationError を投げる", async () => {
    const { db, user } = makeDb();

    await expect(createUser(db, { email: "   " })).rejects.toBeInstanceOf(ValidationError);
    expect(user.findUnique).not.toHaveBeenCalled();
  });
});

describe("setUserActive", () => {
  it("id を BigInt に変換して isActive を更新する", async () => {
    const { db, user } = makeDb();
    user.update.mockResolvedValue(baseRow);

    await setUserActive(db, "5", false);

    expect(user.update).toHaveBeenCalledWith({ where: { id: 5n }, data: { isActive: false } });
  });
});
