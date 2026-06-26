import { describe, expect, it } from "vitest";
import { createGradeSchema } from "./schema";

// Zod の安全パースからフィールド別エラーメッセージを取り出す補助。
function fieldErrors(input: unknown): Record<string, string[]> {
  const result = createGradeSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("createGradeSchema", () => {
  it("正しい入力を受理する", () => {
    const result = createGradeSchema.safeParse({ code: "R", name: "R クラス", sortOrder: "1" });
    expect(result.success).toBe(true);
  });

  it("表示順は任意（未指定なら 0 を既定値とする）", () => {
    const result = createGradeSchema.safeParse({ code: "R", name: "R クラス" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("等級コード未入力は必須エラー", () => {
    expect(fieldErrors({ code: "", name: "R クラス" }).code).toContain("等級コードは必須です");
  });

  it("等級名未入力は必須エラー", () => {
    expect(fieldErrors({ code: "R", name: "" }).name).toContain("等級名は必須です");
  });

  it("等級コードが20文字超はエラー", () => {
    expect(fieldErrors({ code: "A".repeat(21), name: "R クラス" }).code).toContain(
      "等級コードは20文字以内で入力してください",
    );
  });

  it("等級名が50文字超はエラー", () => {
    expect(fieldErrors({ code: "R", name: "あ".repeat(51) }).name).toContain(
      "等級名は50文字以内で入力してください",
    );
  });

  it("表示順が負数はエラー", () => {
    expect(fieldErrors({ code: "R", name: "R クラス", sortOrder: "-1" }).sortOrder).toContain(
      "表示順は0以上の整数で入力してください",
    );
  });

  it("表示順が数値でない場合はエラー", () => {
    expect(fieldErrors({ code: "R", name: "R クラス", sortOrder: "abc" }).sortOrder).toContain(
      "表示順は0以上の整数で入力してください",
    );
  });

  it("表示順が32bit整数の上限を超える場合はエラー（DBオーバーフロー防止）", () => {
    expect(
      fieldErrors({ code: "R", name: "R クラス", sortOrder: "9999999999" }).sortOrder,
    ).toContain("表示順は2147483647以下で入力してください");
  });
});
