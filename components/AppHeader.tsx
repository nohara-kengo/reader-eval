import Link from "next/link";
import { signOut } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

// 認証後ページ共通のヘッダー。アプリ名・メインナビ・サインアウトを提供する。
// サインアウトは server action（lib/auth）で行い、完了後 /login へ遷移する。
export function AppHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            reader-eval
          </Link>
          <NavBar />
        </div>
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
    </header>
  );
}
