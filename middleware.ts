import NextAuth from "next-auth";
import { baseAuthConfig } from "@/lib/auth/base";

// middleware は Edge ランタイムで動くため、Prisma 等 Node 専用依存を含む lib/auth/index.ts を import しない。
// Edge 安全な base 設定のみから auth を生成する（NextAuth v5 split-config）。
export const { auth: middleware } = NextAuth(baseAuthConfig);

// /dashboard 配下のみ認証ガードを適用する。未認証は pages.signIn(/login) へリダイレクトされる。
export const config = {
  matcher: ["/dashboard/:path*"],
};
