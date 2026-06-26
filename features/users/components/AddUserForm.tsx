"use client";

import { useActionState } from "react";
import { addUserAction } from "@/features/users/server/actions";
import type { UserFormState } from "@/features/users/types";

const INITIAL_STATE: UserFormState = { ok: false };

// 許可リストへのユーザー追加フォーム。サーバ検証の結果（フィールド別エラー）を表示する。
export function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUserAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold">ユーザーを追加</h2>

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
        <label htmlFor="email" className="text-sm font-medium">
          メールアドレス{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          aria-invalid={Boolean(state.errors?.email)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {state.errors?.email && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          氏名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          aria-invalid={Boolean(state.errors?.name)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        {state.errors?.name && (
          <p role="alert" className="text-sm text-red-700">
            {state.errors.name}
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
