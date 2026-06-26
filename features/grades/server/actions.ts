"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/shared/errors";
import { createGradeSchema } from "@/features/grades/schema";
import { createGrade, setGradeActive } from "@/features/grades/server/gradesService";
import type { GradeFormState } from "@/features/grades/types";

// 等級マスタへ等級を追加する server action。
// 認可: 暫定で「認証済みなら可」（ADMIN 限定は別 issue の TODO / authz.md）。
export async function addGradeAction(
  _prev: GradeFormState,
  formData: FormData,
): Promise<GradeFormState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "認証が必要です" };
  }

  const parsed = createGradeSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? ""),
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
    await createGrade(db, parsed.data);
  } catch (e) {
    if (e instanceof AppError) {
      return { ok: false, message: e.message, errors: e.errors };
    }
    // 想定外はログにのみ残し、ユーザーには固定文言（api-response.md §4）
    console.error(e);
    return { ok: false, message: "サーバーエラーが発生しました" };
  }

  revalidatePath("/grades");
  return { ok: true, message: "等級を登録しました" };
}

// 等級の有効/無効を切り替える server action（フォームの hidden 値で次状態を受ける）。
export async function toggleGradeActiveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) {
    return;
  }

  await setGradeActive(db, id, next);
  revalidatePath("/grades");
}
