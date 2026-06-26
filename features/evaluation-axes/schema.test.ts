import { describe, expect, it } from "vitest";
import { createCategorySchema, createItemSchema } from "./schema";

// Zod の安全パースからフィールド別エラーメッセージを取り出す補助。
function categoryFieldErrors(input: unknown): Record<string, string[]> {
  const result = createCategorySchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

function itemFieldErrors(input: unknown): Record<string, string[]> {
  const result = createItemSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("createCategorySchema", () => {
  it("正しい入力を受理する", () => {
    const result = createCategorySchema.safeParse({
      code: "QUAL",
      name: "資格",
      sortOrder: "1",
    });
    expect(result.success).toBe(true);
  });

  it("表示順は任意（未指定なら 0 を既定値とする）", () => {
    const result = createCategorySchema.safeParse({ code: "QUAL", name: "資格" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("カテゴリコード未入力は必須エラー", () => {
    expect(categoryFieldErrors({ code: "", name: "資格" }).code).toContain(
      "カテゴリコードは必須です",
    );
  });

  it("カテゴリ名未入力は必須エラー", () => {
    expect(categoryFieldErrors({ code: "QUAL", name: "" }).name).toContain("カテゴリ名は必須です");
  });

  it("カテゴリコードが20文字超はエラー", () => {
    expect(categoryFieldErrors({ code: "A".repeat(21), name: "資格" }).code).toContain(
      "カテゴリコードは20文字以内で入力してください",
    );
  });

  it("カテゴリ名が50文字超はエラー", () => {
    expect(categoryFieldErrors({ code: "QUAL", name: "あ".repeat(51) }).name).toContain(
      "カテゴリ名は50文字以内で入力してください",
    );
  });

  it("表示順が負数はエラー", () => {
    expect(
      categoryFieldErrors({ code: "QUAL", name: "資格", sortOrder: "-1" }).sortOrder,
    ).toContain("表示順は0以上の整数で入力してください");
  });

  it("表示順が32bit整数の上限を超える場合はエラー（DBオーバーフロー防止）", () => {
    expect(
      categoryFieldErrors({ code: "QUAL", name: "資格", sortOrder: "9999999999" }).sortOrder,
    ).toContain("表示順は2147483647以下で入力してください");
  });
});

describe("createItemSchema", () => {
  it("正しい入力を受理する", () => {
    const result = createItemSchema.safeParse({
      categoryId: "1",
      code: "QUAL-01",
      name: "基本情報技術者",
      sortOrder: "1",
    });
    expect(result.success).toBe(true);
  });

  it("カテゴリ未指定は必須エラー", () => {
    expect(
      itemFieldErrors({ categoryId: "", code: "QUAL-01", name: "基本情報技術者" }).categoryId,
    ).toContain("カテゴリは必須です");
  });

  it("カテゴリ指定が数字以外は不正エラー", () => {
    expect(
      itemFieldErrors({ categoryId: "abc", code: "QUAL-01", name: "基本情報技術者" }).categoryId,
    ).toContain("カテゴリの指定が不正です");
  });

  it("評価項目コード未入力は必須エラー", () => {
    expect(itemFieldErrors({ categoryId: "1", code: "", name: "基本情報技術者" }).code).toContain(
      "評価項目コードは必須です",
    );
  });

  it("評価項目名未入力は必須エラー", () => {
    expect(itemFieldErrors({ categoryId: "1", code: "QUAL-01", name: "" }).name).toContain(
      "評価項目名は必須です",
    );
  });

  it("評価項目コードが30文字超はエラー", () => {
    expect(
      itemFieldErrors({ categoryId: "1", code: "A".repeat(31), name: "基本情報技術者" }).code,
    ).toContain("評価項目コードは30文字以内で入力してください");
  });

  it("評価項目名が100文字超はエラー", () => {
    expect(
      itemFieldErrors({ categoryId: "1", code: "QUAL-01", name: "あ".repeat(101) }).name,
    ).toContain("評価項目名は100文字以内で入力してください");
  });
});
