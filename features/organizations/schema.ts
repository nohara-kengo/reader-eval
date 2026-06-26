import { z } from "zod";

// 組織（部署）マスタ追加の入力スキーマ。サーバ側検証を正とする（validation.md）。
// 文言は error-message.md §3.1 の規約形に揃える。
export const createOrganizationSchema = z.object({
  // 組織コード（例: PTU / SRU / R / VUC）。前後空白を除去し、必須・最大 20 文字とする。
  code: z
    .string()
    .trim()
    .min(1, "組織コードは必須です")
    .max(20, "組織コードは20文字以内で入力してください"),
  // 組織名（例: PTU部）。前後空白を除去し、必須・最大 50 文字とする。
  name: z
    .string()
    .trim()
    .min(1, "組織名は必須です")
    .max(50, "組織名は50文字以内で入力してください"),
  // 表示順。フォームからは文字列で届くため coerce で数値化し、0 以上の整数に限定する。
  // 上限は DB の INTEGER（32bit）上限に合わせ、超過を 500 でなく入力エラー（400）として弾く。
  sortOrder: z.coerce
    .number({ invalid_type_error: "表示順は0以上の整数で入力してください" })
    .int("表示順は0以上の整数で入力してください")
    .min(0, "表示順は0以上の整数で入力してください")
    .max(2147483647, "表示順は2147483647以下で入力してください")
    .default(0),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
