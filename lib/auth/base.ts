import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { entraIssuer, readAuthEnv } from "@/lib/auth/config";

// Edge ランタイム安全な基本認証設定（Prisma 等 Node 専用依存を持ち込まない）。
// middleware（Edge）と full 設定（lib/auth/index.ts, Node）の双方から共有する。
// DB 照合を伴う signIn コールバックは index.ts 側でのみ合成する（NextAuth v5 split-config）。
const { config } = readAuthEnv();

export const baseAuthConfig = {
  // オンプレ（Coolify / Cloudflare Tunnel）配下で動かすため信頼ホストを有効化する。
  trustHost: true,
  secret: config.AUTH_SECRET,
  // DB アダプタは使わず JWT Cookie セッションとする。
  session: { strategy: "jwt" },
  // サインイン・エラーともに /login に集約し、技術詳細を出さず日本語で扱う（error-message.md）。
  pages: { signIn: "/login", error: "/login" },
  providers: [
    MicrosoftEntraID({
      clientId: config.AZURE_AD_CLIENT_ID,
      clientSecret: config.AZURE_AD_CLIENT_SECRET,
      issuer: entraIssuer(config.AZURE_AD_TENANT_ID),
    }),
  ],
  callbacks: {
    // 保護ルートの既定拒否ガード（authz.md §4・§7）。/dashboard は認証必須。
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/dashboard")) {
        return Boolean(auth);
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
