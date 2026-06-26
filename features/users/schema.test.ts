import { describe, expect, it } from "vitest";
import { createUserSchema } from "./schema";

// Zod の安全パースからフィールド別エラーメッセージを取り出す補助。
function fieldErrors(input: unknown): Record<string, string[]> {
  const result = createUserSchema.safeParse(input);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe("createUserSchema", () => {
  it("正しい入力を受理する", () => {
    const result = createUserSchema.safeParse({ email: "a@comthink.co.jp", name: "山田" });
    expect(result.success).toBe(true);
  });

  it("氏名は任意（未指定でも受理）", () => {
    const result = createUserSchema.safeParse({ email: "a@comthink.co.jp" });
    expect(result.success).toBe(true);
  });

  it("メールアドレス未入力は必須エラー", () => {
    expect(fieldErrors({ email: "", name: "" }).email).toContain("メールアドレスは必須です");
  });

  it("メールアドレスの形式不正はエラー", () => {
    expect(fieldErrors({ email: "not-an-email" }).email).toContain(
      "メールアドレスの形式が不正です",
    );
  });

  it("氏名が100文字超はエラー", () => {
    expect(fieldErrors({ email: "a@comthink.co.jp", name: "あ".repeat(101) }).name).toContain(
      "氏名は100文字以内で入力してください",
    );
  });
});
