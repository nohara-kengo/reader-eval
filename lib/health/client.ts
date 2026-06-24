// ヘルスチェック API（/api/health）クライアント。
// UI コンポーネントから fetch を直書きせず、本クライアントを経由する（.claude/rules/app.md）。

// ヘルスチェック応答の型
export type HealthStatus = {
  status: string;
};

// 同一 Next.js アプリ内のバックエンド（route handler）の疎通を確認する。
// ブラウザ（Client Component）から相対パスで /api/health を呼び出す。
export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`ヘルスチェックに失敗しました (status: ${res.status})`);
  }
  return (await res.json()) as HealthStatus;
}
