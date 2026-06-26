"use client";

import { useActionState } from "react";
import { addItemAction } from "@/features/evaluation-axes/server/actions";
import type {
  EvaluationAxisFormState,
  EvaluationCategoryListItem,
} from "@/features/evaluation-axes/types";

const INITIAL_STATE: EvaluationAxisFormState = { ok: false };

// 評価項目の追加フォーム。所属カテゴリを選択し、コード・名称・表示順を入力する。
// カテゴリが未登録のときは登録を促し、フォームは無効化する。
export function AddItemForm({ categories }: { categories: EvaluationCategoryListItem[] }) {
  const [state, formAction, pending] = useActionState(addItemAction, INITIAL_STATE);
  const hasCategory = categories.length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold">評価項目を追加</h2>

      {!hasCategory && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          先に評価軸カテゴリを登録してください。
        </p>
      )}

      {state.ok && state.message && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </p>
      )}
      {!state.ok && state.message && !state.errors && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="item-categoryId" className="text-sm font-medium">
          カテゴリ{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <select
          id="item-categoryId"
          name="categoryId"
          required
          disabled={!hasCategory}
          aria-invalid={Boolean(state.errors?.categoryId)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}（{category.code}）
            </option>
          ))}
        </select>
        {state.errors?.categoryId && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.categoryId}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="item-code" className="text-sm font-medium">
          評価項目コード{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="item-code"
          name="code"
          type="text"
          required
          disabled={!hasCategory}
          aria-invalid={Boolean(state.errors?.code)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        />
        {state.errors?.code && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="item-name" className="text-sm font-medium">
          評価項目名{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="item-name"
          name="name"
          type="text"
          required
          disabled={!hasCategory}
          aria-invalid={Boolean(state.errors?.name)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        />
        {state.errors?.name && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="item-sortOrder" className="text-sm font-medium">
          表示順
        </label>
        <input
          id="item-sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={0}
          disabled={!hasCategory}
          aria-invalid={Boolean(state.errors?.sortOrder)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        />
        {state.errors?.sortOrder && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.sortOrder}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || !hasCategory}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "登録中…" : "登録"}
      </button>
    </form>
  );
}
