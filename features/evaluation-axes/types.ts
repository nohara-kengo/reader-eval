// 評価軸カテゴリ管理機能（B-03）の型定義。

// 評価項目（カテゴリ配下）の一覧・画面表示用 DTO。
// DB の Entity をそのまま返さず整形する（app.md / service-layer.md）。
// id / categoryId は Prisma の BigInt を文字列へ、createdAt は ISO 文字列へ変換して保持する。
export type EvaluationItemListItem = {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

// 評価軸カテゴリの一覧・画面表示用 DTO。配下の評価項目を items に含める。
export type EvaluationCategoryListItem = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  items: EvaluationItemListItem[];
};

// server action（追加フォーム）の結果状態。api-response.md §3 の {ok, error} 方針に沿う。
export type EvaluationAxisFormState = {
  ok: boolean;
  message?: string;
  // フィールド別エラー（キー＝フィールド名 / 値＝日本語メッセージ）
  errors?: Record<string, string>;
};
