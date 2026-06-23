/**
 * エラーレスポンス共通形式と例外変換ヘルパ（api-response.md §2 / error-handling.md §3 準拠）
 *
 * route handler では個別に try/catch を散らさず、`withErrorHandler()` で囲む。
 * 捕捉した例外は `toErrorResponse()` で `ErrorResponse` JSON に変換して返す。
 */

import { NextResponse } from "next/server";

import { AppError } from "@/lib/shared/errors";

/**
 * 全エラーレスポンスの共通構造（api-response.md §2）。
 *
 * - `code`: UPPER_SNAKE_CASE のエラー分類コード
 * - `message`: エンドユーザーに表示可能な日本語メッセージ
 * - `errors`: フィールド別エラー（入力バリデーション時のみ・任意）
 * - `reason`: ドメイン例外の補助識別子（UI の分岐 / CTA 出し分け用・任意）
 */
export interface ErrorResponse {
  code: string;
  message: string;
  errors?: Record<string, string>;
  reason?: string;
}

/** 未知例外時の固定文言（api-response.md §4。内部情報は露出しない）。 */
const INTERNAL_ERROR_MESSAGE = "サーバーエラーが発生しました";

/**
 * 任意の例外を `ErrorResponse` と HTTP ステータスに変換する。
 *
 * - `AppError` → その `status` と `{ code, message, errors? }`
 * - 未知の例外 → 500 `INTERNAL_ERROR`（固定文言）。
 *   スタックトレース・内部情報はレスポンスに出さず、ログにのみ記録する。
 */
export function toErrorResponse(err: unknown): {
  status: number;
  body: ErrorResponse;
} {
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      code: err.code,
      message: err.message,
    };
    // 任意フィールドは存在する場合のみ付与する
    if (err.errors) {
      body.errors = err.errors;
    }
    return { status: err.status, body };
  }

  // 既知でない例外: 詳細はサーバログにのみ出力し、レスポンスは固定文言にフォールバックする
  console.error(err);
  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: INTERNAL_ERROR_MESSAGE },
  };
}

/** route handler の関数シグネチャ（App Router の route handler 互換）。 */
type RouteHandler<Args extends unknown[]> = (
  ...args: Args
) => Promise<Response> | Response;

/**
 * route handler を共通エラーハンドラで囲むラッパ（error-handling.md §3）。
 *
 * ハンドラ内で投げられた例外を捕捉し、`toErrorResponse()` で変換して
 * `NextResponse.json(body, { status })` を返す。全エンドポイントで使う。
 *
 * @example
 * export const POST = withErrorHandler(async (req: Request) => {
 *   const input = parse(Schema, await req.json()); // 失敗時 ValidationError
 *   const result = await someService(input);        // ドメインエラーを投げ得る
 *   return NextResponse.json(result, { status: 201 });
 * });
 */
export function withErrorHandler<Args extends unknown[]>(
  handler: RouteHandler<Args>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      const { status, body } = toErrorResponse(err);
      return NextResponse.json(body, { status });
    }
  };
}
