export { auth as middleware } from "@/lib/auth";

// /dashboard 配下のみ認証ガードを適用する。未認証は pages.signIn(/login) へリダイレクトされる。
export const config = {
  matcher: ["/dashboard/:path*"],
};
