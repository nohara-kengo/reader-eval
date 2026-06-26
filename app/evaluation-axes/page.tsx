import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AddCategoryForm } from "@/features/evaluation-axes/components/AddCategoryForm";
import { AddItemForm } from "@/features/evaluation-axes/components/AddItemForm";
import { EvaluationAxesTable } from "@/features/evaluation-axes/components/EvaluationAxesTable";
import { listEvaluationAxes } from "@/features/evaluation-axes/server/evaluationAxesService";

// 評価軸カテゴリ管理画面（B-03）。認証済みユーザーのみアクセス可（暫定 / 管理者限定は後続）。
// 評価軸カテゴリと配下の評価項目を一覧表示し、各々の追加・有効無効切替を行う。
export default async function EvaluationAxesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const categories = await listEvaluationAxes(db);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-bold">評価軸カテゴリ管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          評価の軸となるカテゴリ（資格・技術力・リーダーシップ等）と、その配下の評価項目を管理します。
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-8">
            <AddCategoryForm />
            <AddItemForm categories={categories} />
          </div>
          <EvaluationAxesTable categories={categories} />
        </div>
      </main>
    </>
  );
}
