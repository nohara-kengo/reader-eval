import NextAuth from "next-auth";
import { baseAuthConfig } from "@/lib/auth/base";
import { extractEmail, isAllowedUser } from "@/lib/auth/allowlist";
import { db } from "@/lib/db";

// full 認証設定（Node ランタイム）。base 設定に DB 照合を伴う signIn コールバックを合成する。
// middleware（Edge）は base 設定のみを使う（lib/auth/base.ts / NextAuth v5 split-config）。
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...baseAuthConfig,
  callbacks: {
    ...baseAuthConfig.callbacks,
    // SSO 認証成立後、アプリ DB の許可リストに該当があればログイン許可、なければ拒否する（既定拒否 / authz.md §5）。
    // false を返すと NextAuth は pages.error(/login) へ ?error=AccessDenied を付けて誘導する（セッションは発行されない）。
    async signIn({ user, profile }) {
      const email = extractEmail(user, profile);
      return isAllowedUser(db, email);
    },
  },
});
