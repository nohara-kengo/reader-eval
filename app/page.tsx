import { redirect } from "next/navigation";

// ルート(/) はログイン画面に集約する。未認証の入口を /login に統一する。
// （認証済みなら /login 側で /dashboard へ遷移する）
export default function Home() {
  redirect("/login");
}
