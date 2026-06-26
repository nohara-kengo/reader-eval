import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/shared/errors";
import {
  createCategory,
  createItem,
  listEvaluationAxes,
  setCategoryActive,
  setItemActive,
  type EvaluationAxesDb,
} from "./evaluationAxesService";

// evaluationAxisCategory / evaluationItem を持つ Prisma クライアントのモックを作る。
function makeDb() {
  const evaluationAxisCategory = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const evaluationItem = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return {
    db: { evaluationAxisCategory, evaluationItem } as unknown as EvaluationAxesDb,
    evaluationAxisCategory,
    evaluationItem,
  };
}

const itemRow = {
  id: 10n,
  categoryId: 1n,
  code: "QUAL-01",
  name: "基本情報技術者",
  sortOrder: 1,
  isActive: true,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

const categoryRow = {
  id: 1n,
  code: "QUAL",
  name: "資格",
  sortOrder: 1,
  isActive: true,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  items: [itemRow],
};

describe("listEvaluationAxes", () => {
  it("カテゴリと配下の評価項目を DTO へ整形して返す（id は文字列・createdAt は ISO）", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.findMany.mockResolvedValue([categoryRow]);

    const result = await listEvaluationAxes(db);

    expect(result).toEqual([
      {
        id: "1",
        code: "QUAL",
        name: "資格",
        sortOrder: 1,
        isActive: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        items: [
          {
            id: "10",
            categoryId: "1",
            code: "QUAL-01",
            name: "基本情報技術者",
            sortOrder: 1,
            isActive: true,
            createdAt: "2026-06-01T00:00:00.000Z",
          },
        ],
      },
    ]);
  });

  it("有効を先頭に表示順→コード昇順で取得し、項目も同順で include する", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.findMany.mockResolvedValue([]);

    await listEvaluationAxes(db);

    const order = [{ isActive: "desc" }, { sortOrder: "asc" }, { code: "asc" }];
    expect(evaluationAxisCategory.findMany).toHaveBeenCalledWith({
      orderBy: order,
      include: { items: { orderBy: order } },
    });
  });
});

describe("createCategory", () => {
  it("code・name の前後空白を除去して作成する", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(null);
    evaluationAxisCategory.create.mockResolvedValue({ ...categoryRow, items: [] });

    await createCategory(db, { code: " QUAL ", name: " 資格 ", sortOrder: 1 });

    expect(evaluationAxisCategory.findUnique).toHaveBeenCalledWith({ where: { code: "QUAL" } });
    expect(evaluationAxisCategory.create).toHaveBeenCalledWith({
      data: { code: "QUAL", name: "資格", sortOrder: 1 },
    });
  });

  it("表示順未指定のときは 0 で作成する", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(null);
    evaluationAxisCategory.create.mockResolvedValue({ ...categoryRow, sortOrder: 0, items: [] });

    await createCategory(db, { code: "QUAL", name: "資格" });

    expect(evaluationAxisCategory.create).toHaveBeenCalledWith({
      data: { code: "QUAL", name: "資格", sortOrder: 0 },
    });
  });

  it("既に登録済みのカテゴリコードは ConflictError を投げる", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(categoryRow);

    await expect(createCategory(db, { code: "QUAL", name: "資格" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(evaluationAxisCategory.create).not.toHaveBeenCalled();
  });

  it("カテゴリコードが空のときは ValidationError を投げる", async () => {
    const { db, evaluationAxisCategory } = makeDb();

    await expect(createCategory(db, { code: "   ", name: "資格" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(evaluationAxisCategory.findUnique).not.toHaveBeenCalled();
  });
});

describe("createItem", () => {
  it("カテゴリ存在確認・カテゴリ内 code 重複確認のうえ作成する", async () => {
    const { db, evaluationAxisCategory, evaluationItem } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(categoryRow);
    evaluationItem.findUnique.mockResolvedValue(null);
    evaluationItem.create.mockResolvedValue(itemRow);

    await createItem(db, {
      categoryId: "1",
      code: " QUAL-01 ",
      name: " 基本情報技術者 ",
      sortOrder: 1,
    });

    expect(evaluationAxisCategory.findUnique).toHaveBeenCalledWith({ where: { id: 1n } });
    expect(evaluationItem.findUnique).toHaveBeenCalledWith({
      where: { categoryId_code: { categoryId: 1n, code: "QUAL-01" } },
    });
    expect(evaluationItem.create).toHaveBeenCalledWith({
      data: { categoryId: 1n, code: "QUAL-01", name: "基本情報技術者", sortOrder: 1 },
    });
  });

  it("所属カテゴリが存在しないときは NotFoundError を投げる", async () => {
    const { db, evaluationAxisCategory, evaluationItem } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(null);

    await expect(
      createItem(db, { categoryId: "999", code: "QUAL-01", name: "基本情報技術者" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(evaluationItem.create).not.toHaveBeenCalled();
  });

  it("カテゴリ内で重複する評価項目コードは ConflictError を投げる", async () => {
    const { db, evaluationAxisCategory, evaluationItem } = makeDb();
    evaluationAxisCategory.findUnique.mockResolvedValue(categoryRow);
    evaluationItem.findUnique.mockResolvedValue(itemRow);

    await expect(
      createItem(db, { categoryId: "1", code: "QUAL-01", name: "基本情報技術者" }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(evaluationItem.create).not.toHaveBeenCalled();
  });

  it("評価項目名が空のときは ValidationError を投げる（カテゴリ照会前に弾く）", async () => {
    const { db, evaluationAxisCategory } = makeDb();

    await expect(
      createItem(db, { categoryId: "1", code: "QUAL-01", name: "   " }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(evaluationAxisCategory.findUnique).not.toHaveBeenCalled();
  });
});

describe("setCategoryActive / setItemActive", () => {
  it("カテゴリ: id を BigInt に変換して isActive を更新する", async () => {
    const { db, evaluationAxisCategory } = makeDb();
    evaluationAxisCategory.update.mockResolvedValue(categoryRow);

    await setCategoryActive(db, "1", false);

    expect(evaluationAxisCategory.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { isActive: false },
    });
  });

  it("評価項目: id を BigInt に変換して isActive を更新する", async () => {
    const { db, evaluationItem } = makeDb();
    evaluationItem.update.mockResolvedValue(itemRow);

    await setItemActive(db, "10", false);

    expect(evaluationItem.update).toHaveBeenCalledWith({
      where: { id: 10n },
      data: { isActive: false },
    });
  });
});
