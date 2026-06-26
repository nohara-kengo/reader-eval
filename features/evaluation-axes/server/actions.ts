"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/shared/errors";
import { createCategorySchema, createItemSchema } from "@/features/evaluation-axes/schema";
import {
  createCategory,
  createItem,
  setCategoryActive,
  setItemActive,
} from "@/features/evaluation-axes/server/evaluationAxesService";
import type { EvaluationAxisFormState } from "@/features/evaluation-axes/types";

const PATH = "/evaluation-axes";

// Zod の safeParse 失敗時のフィールド別エラーを {key: 先頭メッセージ} 形へ整形する。
function toFieldErrors(fieldErrors: Record<string, string[] | undefined>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages[0]) {
      errors[key] = messages[0];
    }
  }
  return errors;
}

// 評価軸カテゴリを追加する server action。
// 認可: 暫定で「認証済みなら可」（管理者限定は後続 Issue の宿題 / authz.md）。
export async function addCategoryAction(
  _prev: EvaluationAxisFormState,
  formData: FormData,
): Promise<EvaluationAxisFormState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "認証が必要です" };
  }

  const parsed = createCategorySchema.safeParse({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "入力値が不正です",
      errors: toFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    await createCategory(db, parsed.data);
  } catch (e) {
    if (e instanceof AppError) {
      return { ok: false, message: e.message, errors: e.errors };
    }
    // 想定外はログにのみ残し、ユーザーには固定文言（api-response.md §4）
    console.error(e);
    return { ok: false, message: "サーバーエラーが発生しました" };
  }

  revalidatePath(PATH);
  return { ok: true, message: "評価軸カテゴリを登録しました" };
}

// 評価項目を追加する server action。
export async function addItemAction(
  _prev: EvaluationAxisFormState,
  formData: FormData,
): Promise<EvaluationAxisFormState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "認証が必要です" };
  }

  const parsed = createItemSchema.safeParse({
    categoryId: String(formData.get("categoryId") ?? ""),
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "入力値が不正です",
      errors: toFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    await createItem(db, parsed.data);
  } catch (e) {
    if (e instanceof AppError) {
      return { ok: false, message: e.message, errors: e.errors };
    }
    console.error(e);
    return { ok: false, message: "サーバーエラーが発生しました" };
  }

  revalidatePath(PATH);
  return { ok: true, message: "評価項目を登録しました" };
}

// 評価軸カテゴリの有効/無効を切り替える server action（フォームの hidden 値で次状態を受ける）。
export async function toggleCategoryActiveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) {
    return;
  }

  await setCategoryActive(db, id, next);
  revalidatePath(PATH);
}

// 評価項目の有効/無効を切り替える server action。
export async function toggleItemActiveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) {
    return;
  }

  await setItemActive(db, id, next);
  revalidatePath(PATH);
}
