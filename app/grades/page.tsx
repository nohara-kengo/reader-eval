import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AddGradeForm } from "@/features/grades/components/AddGradeForm";
import { GradesTable } from "@/features/grades/components/GradesTable";
import { listGrades } from "@/features/grades/server/gradesService";

// 等級マスタ管理画面。認証済みユーザーのみアクセス可（暫定 / ADMIN 限定は別 issue）。
export default async function GradesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const grades = await listGrades(db);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-bold">等級管理</h1>
        <p className="mt-2 text-sm text-gray-600">評価対象者の区分（等級）マスタを管理します。</p>
        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <AddGradeForm />
          <GradesTable grades={grades} />
        </div>
      </main>
    </>
  );
}
