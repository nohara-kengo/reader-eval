import {
  toggleCategoryActiveAction,
  toggleItemActiveAction,
} from "@/features/evaluation-axes/server/actions";
import type {
  EvaluationCategoryListItem,
  EvaluationItemListItem,
} from "@/features/evaluation-axes/types";

// 有効/無効を示すバッジ。
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isActive ? "有効" : "無効"}
    </span>
  );
}

// 有効/無効を切り替えるボタン（server action へ id と次状態を送る）。
function ToggleButton({
  id,
  isActive,
  action,
}: {
  id: string;
  isActive: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next" value={isActive ? "false" : "true"} />
      <button
        type="submit"
        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        {isActive ? "無効化" : "有効化"}
      </button>
    </form>
  );
}

// カテゴリ配下の評価項目テーブル。
function ItemsTable({ items }: { items: EvaluationItemListItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-3 text-sm text-gray-500">評価項目は登録されていません。</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-600">
          <th scope="col" className="py-2 pl-4 pr-4 font-medium">
            コード
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            評価項目名
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            表示順
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            状態
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            操作
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-gray-100">
            <td className="py-2 pl-4 pr-4 font-medium">{item.code}</td>
            <td className="py-2 pr-4">{item.name}</td>
            <td className="py-2 pr-4 tabular-nums">{item.sortOrder}</td>
            <td className="py-2 pr-4">
              <StatusBadge isActive={item.isActive} />
            </td>
            <td className="py-2 pr-4">
              <ToggleButton id={item.id} isActive={item.isActive} action={toggleItemActiveAction} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 評価軸カテゴリと配下の評価項目の一覧表示。カテゴリ単位でカード表示し、各行で有効/無効を切り替える。
export function EvaluationAxesTable({ categories }: { categories: EvaluationCategoryListItem[] }) {
  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        登録されている評価軸カテゴリはありません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <section key={category.id} className="overflow-hidden rounded-lg border border-gray-200">
          <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{category.name}</h3>
              <span className="text-xs text-gray-500">{category.code}</span>
              <StatusBadge isActive={category.isActive} />
            </div>
            <ToggleButton
              id={category.id}
              isActive={category.isActive}
              action={toggleCategoryActiveAction}
            />
          </header>
          <div className="overflow-x-auto">
            <ItemsTable items={category.items} />
          </div>
        </section>
      ))}
    </div>
  );
}
