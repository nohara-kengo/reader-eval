// Next.js 起動時フック（Next 15 で安定）。
// 本番起動時に認証 env を検証し、不足・不正なら起動を中止する（fail-fast。config.md §3）。
export async function register() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const { parseAuthEnv } = await import("@/lib/auth/config");
  try {
    parseAuthEnv();
  } catch {
    // 設定不備のまま本番稼働させない。理由をログに出し、プロセスを終了して起動を止める。
    // （構造化ロガー lib/logger は未整備のため、起動時の致命エラーは console.error を用いる）
    console.error(
      "[startup] 認証に必要な環境変数が不足しています（AZURE_AD_TENANT_ID / AZURE_AD_CLIENT_ID / AZURE_AD_CLIENT_SECRET / AUTH_SECRET）。起動を中止します。",
    );
    process.exit(1);
  }
}
