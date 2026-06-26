import { toggleOrganizationActiveAction } from "@/features/organizations/server/actions";
import type { OrganizationListItem } from "@/features/organizations/types";

// 組織マスタの一覧表示。各行で有効/無効を切り替えられる。
export function OrganizationsTable({ organizations }: { organizations: OrganizationListItem[] }) {
  if (organizations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        登録されている組織はありません。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th scope="col" className="py-2 pr-4 font-medium">
              コード
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              組織名
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              表示順
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              状態
            </th>
            <th scope="col" className="py-2 font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((organization) => (
            <tr key={organization.id} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-medium">{organization.code}</td>
              <td className="py-2 pr-4">{organization.name}</td>
              <td className="py-2 pr-4 tabular-nums">{organization.sortOrder}</td>
              <td className="py-2 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    organization.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {organization.isActive ? "有効" : "無効"}
                </span>
              </td>
              <td className="py-2">
                <form action={toggleOrganizationActiveAction}>
                  <input type="hidden" name="id" value={organization.id} />
                  <input
                    type="hidden"
                    name="next"
                    value={organization.isActive ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {organization.isActive ? "無効化" : "有効化"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
