import { z } from "zod";

// 認証（Entra ID / Auth.js）に必要な環境変数スキーマ（config.md §3 / §4）。
// 既存 .env.example の AZURE_AD_* を正とし、Auth.js へ橋渡しする。
const authEnvSchema = z.object({
  AZURE_AD_TENANT_ID: z.string().min(1),
  AZURE_AD_CLIENT_ID: z.string().min(1),
  AZURE_AD_CLIENT_SECRET: z.string().min(1),
  // セッション（JWT Cookie）暗号化用シークレット
  AUTH_SECRET: z.string().min(1),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

// 検証済みの認証 env を返す。欠落時は例外を投げる（サーバ側の fail-fast 用。config.md §3）。
export function parseAuthEnv(env: Record<string, string | undefined> = process.env): AuthEnv {
  return authEnvSchema.parse(env);
}

// import 時（ビルド・未設定環境）に壊れないための安全読み出し。設定の有無も返す。
export function readAuthEnv(env: Record<string, string | undefined> = process.env): {
  config: Partial<AuthEnv>;
  configured: boolean;
} {
  const result = authEnvSchema.safeParse(env);
  if (result.success) {
    return { config: result.data, configured: true };
  }
  return {
    config: {
      AZURE_AD_TENANT_ID: env.AZURE_AD_TENANT_ID,
      AZURE_AD_CLIENT_ID: env.AZURE_AD_CLIENT_ID,
      AZURE_AD_CLIENT_SECRET: env.AZURE_AD_CLIENT_SECRET,
      AUTH_SECRET: env.AUTH_SECRET,
    },
    configured: false,
  };
}

// テナント ID から Entra ID（v2.0）の issuer URL を組み立てる。
// 未指定時は undefined（Auth.js 既定の common エンドポイントにフォールバック）。
export function entraIssuer(tenantId?: string): string | undefined {
  if (!tenantId) {
    return undefined;
  }
  return `https://login.microsoftonline.com/${tenantId}/v2.0`;
}
