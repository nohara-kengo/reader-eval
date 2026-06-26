import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AddUserForm } from "@/features/users/components/AddUserForm";
import { UsersTable } from "@/features/users/components/UsersTable";
import { listUsers } from "@/features/users/server/usersService";

// 許可リストユーザー管理画面。認証済みユーザーのみアクセス可（暫定 / ADMIN 限定は別 issue）。
export default async function UsersPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const users = await listUsers(db);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          ログインを許可するユーザー（許可リスト）を管理します。
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <AddUserForm />
          <UsersTable users={users} />
        </div>
      </main>
    </>
  );
}
