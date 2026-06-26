"use client";

import { useActionState } from "react";
import { addOrganizationAction } from "@/features/organizations/server/actions";
import type { OrganizationFormState } from "@/features/organizations/types";

const INITIAL_STATE: OrganizationFormState = { ok: false };

// 組織マスタへの追加フォーム。サーバ検証の結果（フィールド別エラー）を表示する。
export function AddOrganizationForm() {
  const [state, formAction, pending] = useActionState(addOrganizationAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold">組織を追加</h2>

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
        <label htmlFor="code" className="text-sm font-medium">
          組織コード{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="code"
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
        <label htmlFor="name" className="text-sm font-medium">
          組織名{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="name"
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
        <label htmlFor="sortOrder" className="text-sm font-medium">
          表示順
        </label>
        <input
          id="sortOrder"
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
