import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

// 認証済みユーザー向けホーム。本 Issue では中身を持たない（空のプレースホルダ）。
export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            サインアウト
          </button>
        </form>
      </div>
      {/* 後続 Issue で評価サマリー等を表示する。現時点は空のプレースホルダ。 */}
      <p className="mt-6 text-sm text-gray-500">ここに評価サマリーを表示する予定です。</p>
    </main>
  );
}
