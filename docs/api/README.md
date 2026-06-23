# API 規約

reader-eval の API は Next.js（App Router）の **route handlers**（`app/api/**/route.ts`）／ server actions として実装する。形式の正本は横断規約 [`api-response.md`](../../.claude/rules/api-response.md)、例外の処理プロセスは [`error-handling.md`](../../.claude/rules/error-handling.md) を参照。本ドキュメントは入口（読む順序と実装の使い方）を示す。

## 基本方針

- 共通エンベロープは導入しない。ドメイン層（`lib/`）の戻り値を **DTO へ整形**して `NextResponse.json(data, { status })` で直返しする。
- ステータスコード: `GET`/`PUT`/`PATCH` → 200、`POST` → 201、`DELETE` → 204。
- DB の Entity をそのまま返さない（DTO へ変換）。
- 入力検証は Zod 等で行い、失敗時は `ValidationError` を投げる（[`validation.md`](../../.claude/rules/validation.md)）。

## エラーレスポンス形式

すべてのエラーは共通の `ErrorResponse` 形式に揃える。詳細・`code` 語彙（`BAD_REQUEST` / `VALIDATION_ERROR` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `INTERNAL_ERROR`）は [`api-response.md`](../../.claude/rules/api-response.md) §2 を正とする。

```jsonc
{
  "code": "VALIDATION_ERROR",
  "message": "入力値が不正です",
  "errors": { "name": "必須です" }, // 任意
  "reason": "EVALUATION_PERIOD_CLOSED" // 任意
}
```

## 実装の使い方（`lib/api/error-response.ts`）

route handler ごとに try/catch を書き散らさず、共通ラッパ `withErrorHandler` で囲む。捕捉した例外は `toErrorResponse` が `AppError` 派生型 → 該当 `code`/`status`、未知例外 → 500 `INTERNAL_ERROR`（固定文言・内部情報非露出）に変換する。

```ts
// app/api/participants/route.ts（例）
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/error-response";
import { ValidationError } from "@/lib/shared/errors";

export const POST = withErrorHandler(async (req: Request) => {
  const json = await req.json();
  // 検証失敗時は ValidationError を投げる → 400 VALIDATION_ERROR に変換される
  if (!json?.name) {
    throw new ValidationError("入力値が不正です", { name: "必須です" });
  }
  const created = { id: 1, name: json.name };
  return NextResponse.json(created, { status: 201 });
});
```

- カスタムエラー型の定義: [`lib/shared/errors.ts`](../../lib/shared/errors.ts)（`AppError` 基底 + `ValidationError` / `UnauthorizedError` / `ForbiddenError` / `NotFoundError` / `ConflictError` / `ExternalServiceError`）
- 変換ヘルパ / ラッパ: [`lib/api/error-response.ts`](../../lib/api/error-response.ts)（`ErrorResponse` 型・`toErrorResponse`・`withErrorHandler`）

## server actions

HTTP ステータスを直接返さず、結果オブジェクト（`{ ok: true, data }` / `{ ok: false, error: ErrorResponse }`）で成否を表す。`error` は上記 `ErrorResponse` 形式に揃える（[`api-response.md`](../../.claude/rules/api-response.md) §3）。

## セキュリティ

スタックトレース・内部例外名・SQL / テーブル名をレスポンスに含めない。`INTERNAL_ERROR` は固定文言、技術詳細はサーバログのみ（[`api-response.md`](../../.claude/rules/api-response.md) §4 / [`security.md`](../../.claude/rules/security.md)）。

## 関連

- アーキテクチャ概要: [`../architecture/README.md`](../architecture/README.md)
- エラーメッセージ文言: [`error-message.md`](../../.claude/rules/error-message.md)
- ヘルスチェック: `GET /api/health`（[`../runbooks/README.md`](../runbooks/README.md)）
