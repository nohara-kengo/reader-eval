import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

// ログイン画面。認証済みならダッシュボードへ。未認証は Microsoft SSO 導線を表示する。
export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">reader-eval ログイン</h1>
      <p className="text-sm text-gray-600">
        社内アカウント（Microsoft 365）でサインインしてください。
      </p>
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
    </main>
  );
}
