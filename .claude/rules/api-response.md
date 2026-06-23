---
description: "API レスポンス・エラー形式の統一規約（route handlers / server actions）"
paths: "app/**,lib/**,.claude/rules/**"
---

# API レスポンス・エラー形式の統一規約

reader-eval は **Next.js（App Router）フルスタック 1 本**であり、API は同一アプリの route handlers（`app/api/.../route.ts`）/ server actions として実装する。本ファイルは、それらが返す JSON レスポンスとエラー形式を統一する横断ルールを定める。機能ごとの DTO スキーマや HTTP メソッドの個別事情は各機能の設計を正とし、本ファイルは形式のみを規定する。

## 1. 成功時レスポンス

- **共通エンベロープは導入しない**。ドメイン層（`lib/`）が返す値（オブジェクト / 配列）を JSON で直返しする。
- レスポンスは `NextResponse.json(data, { status })` で返す。
- ステータスコード:
  - `GET` / `PUT` / `PATCH`: `200 OK`（取得・更新後の現在状態を返す）
  - `POST`: `201 Created`（新規作成。必要に応じて `Location` ヘッダに新規リソース URI を付与）
  - `DELETE`: `204 No Content`（ボディなし）
- DB の Entity / モデルをそのまま返さず、API 用の型（DTO）へ整形して返す。

```ts
// GET /api/participants/1 → 200 OK
return NextResponse.json(
  { id: 1, name: "山田 太郎", createdAt: "2026-06-23T12:00:00Z" },
  { status: 200 },
)
```

## 2. エラーレスポンス共通形式

すべてのエラーレスポンスは以下の構造に揃える。route handler ごとに try/catch を散らさず、**共通の例外変換ヘルパ**（後述）に集約する。

```json
{
  "code": "VALIDATION_ERROR",
  "message": "入力値が不正です",
  "errors": { "name": "必須です", "email": "形式が不正です" },
  "reason": "EVALUATION_PERIOD_CLOSED"
}
```

| フィールド | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `code` | `string` | ◯ | `UPPER_SNAKE_CASE` のエラー分類コード（後述語彙参照） |
| `message` | `string` | ◯ | エンドユーザーに表示可能な日本語メッセージ |
| `errors` | `Record<string, string>` | ✗ | フィールド別エラー（入力バリデーション時のみ）。キー＝フィールド名、値＝日本語メッセージ |
| `reason` | `string` | ✗ | ドメイン例外の補助識別子（UI の分岐 / CTA 出し分け用） |

### 2.1 `code` 語彙（固定）

| `code` | HTTP | 主な発火元 |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | 一般的な入力エラー（JSON 不正・必須パラメータ欠落・enum 値違反等） |
| `VALIDATION_ERROR` | 400 | 入力スキーマ検証エラー（Zod 等）。`errors` を付与 |
| `UNAUTHORIZED` | 401 | 未認証（Entra ID セッション無効 / 失効）。原則 middleware / 認証層が返す |
| `FORBIDDEN` | 403 | 認可不可（権限不足） |
| `NOT_FOUND` | 404 | 指定リソースが存在しない |
| `CONFLICT` | 409 | 一意制約違反 / 状態不整合 / 重複登録 |
| `INTERNAL_ERROR` | 500 | 上記以外（fallback）。**スタックトレースは含めない**。固定文言を返す |

> 上記以外の `code` を追加するときは本ファイルにも追記し、`UPPER_SNAKE_CASE` を維持する。業務固有のエラーはまず既存語彙に当てはまらないか検討し、必要な場合のみ専用 `code` を足す。

### 2.2 例外 → レスポンス変換方針（実装）

route handler では個別に `try/catch` を書き散らさず、共通の **エラー変換ヘルパ**（例: `lib/api/errors.ts`）に集約する。方針:

1. ドメイン層は意味のある業務例外を投げる。基底クラス（例: `AppError`）を設け、`code` / `httpStatus` / `message`（任意で `errors` / `reason`）を保持させる。
2. route handler は処理を共通ラッパ（例: `withErrorHandling(handler)`）で囲み、捕捉した例外を `ErrorResponse` JSON に変換して `NextResponse.json(body, { status })` で返す。
3. 既知でない例外は `INTERNAL_ERROR`（500・固定文言「サーバーエラーが発生しました」）にフォールバックし、**詳細はサーバログにのみ出力**する。

例外と `code` / HTTP の対応（指針）:

| 状況 / 例外 | HTTP | `code` |
| --- | --- | --- |
| 入力スキーマ検証エラー（Zod 等の `safeParse` 失敗） | 400 | `VALIDATION_ERROR`（`errors` 付き） |
| 一般入力エラー（JSON 不正・必須パラメータ欠落・enum 値違反） | 400 | `BAD_REQUEST` |
| 未認証（Entra ID セッション無効） | 401 | `UNAUTHORIZED` |
| 認可不可（権限不足） | 403 | `FORBIDDEN` |
| リソース未存在 | 404 | `NOT_FOUND` |
| 一意制約違反 / 状態不整合 / 重複登録 | 409 | `CONFLICT` |
| 業務例外（`AppError` 基底） | 子が保持 | 子が保持。共通ラッパ 1 つで集約捕捉 |
| 上記以外の `Error`（fallback） | 500 | `INTERNAL_ERROR`（固定文言、スタックトレースを返さない） |

```ts
// lib/api/errors.ts（方針イメージ）
export function toErrorResponse(e: unknown): { body: ErrorResponse; status: number } {
  if (e instanceof AppError) {
    return { body: { code: e.code, message: e.message, errors: e.errors, reason: e.reason }, status: e.httpStatus }
  }
  // 既知でない例外: ログのみ。レスポンスは固定文言
  console.error(e)
  return { body: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" }, status: 500 }
}
```

新規の業務例外は `AppError` 継承を原則とし、route handler ごとの個別 catch を増やさない。

## 3. server actions での扱い

server actions は HTTP ステータスを直接返さない代わりに、結果オブジェクトで成否を表現する（例: `{ ok: true, data }` / `{ ok: false, error: ErrorResponse }`）。`error` の中身は §2 の `ErrorResponse` 形式（`code` / `message` / 任意 `errors` / `reason`）に揃え、route handler と語彙を共有する。クライアント側はこの `error` をフォームのフィールド別表示（`errors`）や toast（`message`）に振り分ける。

## 4. セキュリティ要件

- スタックトレース・内部例外名・SQL / テーブル名を **絶対にレスポンスへ含めない**。`INTERNAL_ERROR` は固定文言を返し、技術詳細はサーバログにのみ出す。
- 認証・認可エラーで内部実装（どのチェックで弾いたか等）を過度に露出しない。

## 5. 関連

- 文言規約: [`error-message.md`](error-message.md)
- 全体方針: [`../../CLAUDE.md`](../../CLAUDE.md)
