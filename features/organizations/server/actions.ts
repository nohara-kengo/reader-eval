"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError } from "@/lib/shared/errors";
import { createOrganizationSchema } from "@/features/organizations/schema";
import {
  createOrganization,
  setOrganizationActive,
} from "@/features/organizations/server/organizationsService";
import type { OrganizationFormState } from "@/features/organizations/types";

// 組織マスタへ組織を追加する server action。
// 認可: 暫定で「認証済みなら可」（SYSTEM_ADMIN/OWNER 限定は Epic #57 の宿題 / authz.md）。
export async function addOrganizationAction(
  _prev: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await auth();
  if (!session) {
    return { ok: false, message: "認証が必要です" };
  }

  const parsed = createOrganizationSchema.safeParse({
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
    await createOrganization(db, parsed.data);
  } catch (e) {
    if (e instanceof AppError) {
      return { ok: false, message: e.message, errors: e.errors };
    }
    // 想定外はログにのみ残し、ユーザーには固定文言（api-response.md §4）
    console.error(e);
    return { ok: false, message: "サーバーエラーが発生しました" };
  }

  revalidatePath("/organizations");
  return { ok: true, message: "組織を登録しました" };
}

// 組織の有効/無効を切り替える server action（フォームの hidden 値で次状態を受ける）。
export async function toggleOrganizationActiveAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) {
    return;
  }

  await setOrganizationActive(db, id, next);
  revalidatePath("/organizations");
}
