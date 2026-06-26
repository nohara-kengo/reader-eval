import { z } from "zod";

// 表示順の共通定義。フォームからは文字列で届くため coerce で数値化し、0 以上の整数に限定する。
// 上限は DB の INTEGER（32bit）上限に合わせ、超過を入力エラー（400）として弾く（organizations と同方針）。
const sortOrderSchema = z.coerce
  .number({ invalid_type_error: "表示順は0以上の整数で入力してください" })
  .int("表示順は0以上の整数で入力してください")
  .min(0, "表示順は0以上の整数で入力してください")
  .max(2147483647, "表示順は2147483647以下で入力してください")
  .default(0);

// 評価軸カテゴリ追加の入力スキーマ。サーバ側検証を正とする（validation.md）。
// 文言は error-message.md §3.1 の規約形に揃える。
export const createCategorySchema = z.object({
  // カテゴリコード（例: QUAL / TECH）。前後空白を除去し、必須・最大 20 文字とする。
  code: z
    .string()
    .trim()
    .min(1, "カテゴリコードは必須です")
    .max(20, "カテゴリコードは20文字以内で入力してください"),
  // カテゴリ名（例: 資格）。前後空白を除去し、必須・最大 50 文字とする。
  name: z
    .string()
    .trim()
    .min(1, "カテゴリ名は必須です")
    .max(50, "カテゴリ名は50文字以内で入力してください"),
  sortOrder: sortOrderSchema,
});

// 評価項目追加の入力スキーマ。カテゴリ ID は文字列（BigInt 由来）で受け、サービス層で BigInt へ変換する。
export const createItemSchema = z.object({
  // 所属カテゴリの ID。フォームの hidden / select から文字列で届く。必須・数字のみ。
  categoryId: z
    .string()
    .trim()
    .min(1, "カテゴリは必須です")
    .regex(/^\d+$/, "カテゴリの指定が不正です"),
  // 評価項目コード（例: QUAL-01）。前後空白を除去し、必須・最大 30 文字とする。
  code: z
    .string()
    .trim()
    .min(1, "評価項目コードは必須です")
    .max(30, "評価項目コードは30文字以内で入力してください"),
  // 評価項目名（例: 基本情報技術者）。前後空白を除去し、必須・最大 100 文字とする。
  name: z
    .string()
    .trim()
    .min(1, "評価項目名は必須です")
    .max(100, "評価項目名は100文字以内で入力してください"),
  sortOrder: sortOrderSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
