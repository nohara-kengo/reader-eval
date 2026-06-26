"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/shared/errors";
import { createUserSchema } from "@/features/users/schema";
import { createUser, setUserActive } from "@/features/users/server/usersService";
import type { UserFormState } from "@/features/users/types";

// 許可リストへユーザーを追加する server action。
// 認可: 暫定で「認証済みなら可」（ADMIN 限定は別 issue の TODO / authz.md）。
export async function addUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "認証が必要です" };
  }

  const parsed = createUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const errors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages && messages[0]) {
        errors[key] = messages[0];
      }
    }
    return { ok: false, message: "入力値が不正です", errors };
  }

  try {
    await createUser(db, parsed.data);
  } catch (e) {
    if (e instanceof AppError) {
      return { ok: false, message: e.message, errors: e.errors };
    }
    // 想定外はログにのみ残し、ユーザーには固定文言（api-response.md §4）
    console.error(e);
    return { ok: false, message: "サーバーエラーが発生しました" };
  }

  revalidatePath("/users");
  return { ok: true, message: "ユーザーを登録しました" };
}

// ユーザーの有効/無効を切り替える server action（フォームの hidden 値で次状態を受ける）。
export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) {
    return;
  }

  await setUserActive(db, id, next);
  revalidatePath("/users");
}
