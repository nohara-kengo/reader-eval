// 組織（部署）マスタ管理機能の型定義。

// 一覧・画面表示用の DTO。DB の Entity をそのまま返さず整形する（app.md / service-layer.md）。
// id は Prisma の BigInt を文字列へ、createdAt は ISO 文字列へ変換して保持する。
export type OrganizationListItem = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

// server action（追加フォーム）の結果状態。api-response.md §3 の {ok, error} 方針に沿う。
export type OrganizationFormState = {
  ok: boolean;
  message?: string;
  // フィールド別エラー（キー＝フィールド名 / 値＝日本語メッセージ）
  errors?: Record<string, string>;
};
