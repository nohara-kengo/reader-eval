import { z } from "zod";

// 許可リストへのユーザー追加の入力スキーマ。サーバ側検証を正とする（validation.md）。
// 文言は error-message.md §3.1 の規約形に揃える。
export const createUserSchema = z.object({
  email: z.string().min(1, "メールアドレスは必須です").email("メールアドレスの形式が不正です"),
  // 氏名は任意。未入力は空文字で届くため optional とし、サービス側で trim → null 化する。
  name: z.string().max(100, "氏名は100文字以内で入力してください").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
