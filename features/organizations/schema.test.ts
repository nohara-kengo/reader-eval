import { describe, expect, it } from "vitest";
import { createOrganizationSchema } from "./schema";

// Zod の安全パースからフィールド別エラーメッセージを取り出す補助。
function fieldErrors(input: unknown): Record<string, string[]> {
  const result = createOrganizationSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("createOrganizationSchema", () => {
  it("正しい入力を受理する", () => {
    const result = createOrganizationSchema.safeParse({
      code: "PTU",
      name: "PTU部",
      sortOrder: "1",
    });
    expect(result.success).toBe(true);
  });

  it("表示順は任意（未指定なら 0 を既定値とする）", () => {
    const result = createOrganizationSchema.safeParse({ code: "PTU", name: "PTU部" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("組織コード未入力は必須エラー", () => {
    expect(fieldErrors({ code: "", name: "PTU部" }).code).toContain("組織コードは必須です");
  });

  it("組織名未入力は必須エラー", () => {
    expect(fieldErrors({ code: "PTU", name: "" }).name).toContain("組織名は必須です");
  });

  it("組織コードが20文字超はエラー", () => {
    expect(fieldErrors({ code: "A".repeat(21), name: "PTU部" }).code).toContain(
      "組織コードは20文字以内で入力してください",
    );
  });

  it("組織名が50文字超はエラー", () => {
    expect(fieldErrors({ code: "PTU", name: "あ".repeat(51) }).name).toContain(
      "組織名は50文字以内で入力してください",
    );
  });

  it("表示順が負数はエラー", () => {
    expect(fieldErrors({ code: "PTU", name: "PTU部", sortOrder: "-1" }).sortOrder).toContain(
      "表示順は0以上の整数で入力してください",
    );
  });

  it("表示順が数値でない場合はエラー", () => {
    expect(fieldErrors({ code: "PTU", name: "PTU部", sortOrder: "abc" }).sortOrder).toContain(
      "表示順は0以上の整数で入力してください",
    );
  });

  it("表示順が32bit整数の上限を超える場合はエラー（DBオーバーフロー防止）", () => {
    expect(
      fieldErrors({ code: "PTU", name: "PTU部", sortOrder: "9999999999" }).sortOrder,
    ).toContain("表示順は2147483647以下で入力してください");
  });
});
