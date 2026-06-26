import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AddOrganizationForm } from "@/features/organizations/components/AddOrganizationForm";
import { OrganizationsTable } from "@/features/organizations/components/OrganizationsTable";
import { listOrganizations } from "@/features/organizations/server/organizationsService";

// 組織（部署）マスタ管理画面。認証済みユーザーのみアクセス可（暫定 / 管理者限定は Epic #57）。
export default async function OrganizationsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const organizations = await listOrganizations(db);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-2xl font-bold">組織管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          評価対象者が所属する組織（部署）マスタを管理します。
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
          <AddOrganizationForm />
          <OrganizationsTable organizations={organizations} />
        </div>
      </main>
    </>
  );
}
