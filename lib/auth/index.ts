import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { entraIssuer, readAuthEnv } from "@/lib/auth/config";

// 認証設定は lib/auth に集約する（app.md §認証）。シークレットはサーバ側のみで参照する。
const { config } = readAuthEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  // オンプレ（Coolify / Cloudflare Tunnel）配下で動かすため信頼ホストを有効化する。
  trustHost: true,
  secret: config.AUTH_SECRET,
  // DB アダプタは使わず JWT Cookie セッションとする（本 Issue では永続化しない）。
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
});
