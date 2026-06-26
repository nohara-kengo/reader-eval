import { describe, expect, it, vi } from "vitest";
import { ConflictError, ValidationError } from "@/lib/shared/errors";
import { createGrade, listGrades, setGradeActive, type GradesDb } from "./gradesService";

// grade テーブルのみを持つ Prisma クライアントのモックを作る。
function makeDb() {
  const grade = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return { db: { grade } as unknown as GradesDb, grade };
}

const baseRow = {
  id: 1n,
  code: "R",
  name: "R クラス",
  sortOrder: 1,
  isActive: true,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

describe("listGrades", () => {
  it("DTO へ整形して返す（id は文字列・createdAt は ISO）", async () => {
    const { db, grade } = makeDb();
    grade.findMany.mockResolvedValue([baseRow]);

    const result = await listGrades(db);

    expect(result).toEqual([
      {
        id: "1",
        code: "R",
        name: "R クラス",
        sortOrder: 1,
        isActive: true,
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
  });

  it("有効を先頭に表示順→コード昇順で取得する", async () => {
    const { db, grade } = makeDb();
    grade.findMany.mockResolvedValue([]);

    await listGrades(db);

    expect(grade.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
    });
  });
});

describe("createGrade", () => {
  it("code・name の前後空白を除去して作成する", async () => {
    const { db, grade } = makeDb();
    grade.findUnique.mockResolvedValue(null);
    grade.create.mockResolvedValue({ ...baseRow, code: "M", name: "M クラス", sortOrder: 2 });

    await createGrade(db, { code: " M ", name: " M クラス ", sortOrder: 2 });

    expect(grade.findUnique).toHaveBeenCalledWith({ where: { code: "M" } });
    expect(grade.create).toHaveBeenCalledWith({
      data: { code: "M", name: "M クラス", sortOrder: 2 },
    });
  });

  it("表示順未指定のときは 0 で作成する", async () => {
    const { db, grade } = makeDb();
    grade.findUnique.mockResolvedValue(null);
    grade.create.mockResolvedValue({ ...baseRow, sortOrder: 0 });

    await createGrade(db, { code: "R", name: "R クラス" });

    expect(grade.create).toHaveBeenCalledWith({
      data: { code: "R", name: "R クラス", sortOrder: 0 },
    });
  });

  it("既に登録済みの等級コードは ConflictError を投げる", async () => {
    const { db, grade } = makeDb();
    grade.findUnique.mockResolvedValue(baseRow);

    await expect(createGrade(db, { code: "R", name: "R クラス" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(grade.create).not.toHaveBeenCalled();
  });

  it("等級コードが空のときは ValidationError を投げる", async () => {
    const { db, grade } = makeDb();

    await expect(createGrade(db, { code: "   ", name: "R クラス" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(grade.findUnique).not.toHaveBeenCalled();
  });

  it("等級名が空のときは ValidationError を投げる", async () => {
    const { db, grade } = makeDb();

    await expect(createGrade(db, { code: "R", name: "   " })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(grade.findUnique).not.toHaveBeenCalled();
  });
});

describe("setGradeActive", () => {
  it("id を BigInt に変換して isActive を更新する", async () => {
    const { db, grade } = makeDb();
    grade.update.mockResolvedValue(baseRow);

    await setGradeActive(db, "5", false);

    expect(grade.update).toHaveBeenCalledWith({ where: { id: 5n }, data: { isActive: false } });
  });
});
