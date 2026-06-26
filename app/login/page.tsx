import { redirect } from "next/navigation";
import { HealthCheck } from "@/features/health/components/HealthCheck";
import { auth, signIn } from "@/lib/auth";

// Auth.js のサインインエラー種別をユーザー向け日本語へ。
// 内部事情（種別・スタック等）は出さず、規約形の日本語に統一する（error-message.md §3.4/§3.5）。
function loginErrorMessage(error?: string): string | null {
  if (!error) {
    return null;
  }
  // 許可リスト未登録（signIn コールバックが false）は AccessDenied で戻る。
  if (error === "AccessDenied") {
    return "許可されたユーザーではありません。管理者にお問い合わせください。";
  }
  return "サインインに失敗しました。時間をおいて再度お試しください。";
}

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

// ログイン画面。認証済みならダッシュボードへ。未認証は Microsoft SSO 導線を表示する。
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const message = loginErrorMessage(params.error);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">reader-eval ログイン</h1>
      <p className="text-sm text-gray-600">
        社内アカウント（Microsoft 365）でサインインしてください。
      </p>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
        }}
      >
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Microsoft でサインイン
        </button>
      </form>
      {/* 開発中の暫定表示: バックエンド疎通確認（後日整理） */}
      <HealthCheck />
    </main>
  );
}
