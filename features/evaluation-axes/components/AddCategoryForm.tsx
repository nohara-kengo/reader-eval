"use client";

import { useActionState } from "react";
import { addCategoryAction } from "@/features/evaluation-axes/server/actions";
import type { EvaluationAxisFormState } from "@/features/evaluation-axes/types";

const INITIAL_STATE: EvaluationAxisFormState = { ok: false };

// 評価軸カテゴリの追加フォーム。サーバ検証の結果（フィールド別エラー）を表示する。
export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(addCategoryAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold">評価軸カテゴリを追加</h2>

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
        <label htmlFor="category-code" className="text-sm font-medium">
          カテゴリコード{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="category-code"
          name="code"
          type="text"
          required
          aria-invalid={Boolean(state.errors?.code)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {state.errors?.code && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category-name" className="text-sm font-medium">
          カテゴリ名{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
          required
          aria-invalid={Boolean(state.errors?.name)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {state.errors?.name && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category-sortOrder" className="text-sm font-medium">
          表示順
        </label>
        <input
          id="category-sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={0}
          aria-invalid={Boolean(state.errors?.sortOrder)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {state.errors?.sortOrder && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.sortOrder}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "登録中…" : "登録"}
      </button>
    </form>
  );
}
