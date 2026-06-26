import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

// 認証済みユーザー向けホーム。共通ヘッダー（AppHeader）配下に評価サマリーを表示する予定。
export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        {/* 後続 Issue で評価サマリー等を表示する。現時点は空のプレースホルダ。 */}
        <p className="mt-6 text-sm text-gray-500">ここに評価サマリーを表示する予定です。</p>
      </main>
    </>
  );
}
