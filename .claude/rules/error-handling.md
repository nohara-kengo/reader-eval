---
description: "例外の分類・カスタムエラー型・捕捉/変換/境界・ログの方針"
paths: "app/**,lib/**,components/**,features/**,.claude/rules/**"
---

# エラーハンドリング規約

例外を **どう分類し、どこで捕捉し、どう変換・記録するか** の方針。
レスポンスの**形式**は [`api-response.md`](api-response.md)、ユーザー向け**文言**は [`error-message.md`](error-message.md) を正とし、本ファイルは**処理プロセス**を定める。

## 1. エラーの分類

| 区分                     | 内容               | 例                                                  | 扱い                                             |
| ------------------------ | ------------------ | --------------------------------------------------- | ------------------------------------------------ |
| ドメインエラー（想定内） | 業務的に起こり得る | バリデーション / 権限 / 状態遷移 / not found / 競合 | 専用エラー型で投げ、適切な HTTP に変換           |
| システムエラー（想定外） | 基盤・バグ         | DB 障害 / 外部 API 失敗 / 予期せぬ例外              | 500 に変換。詳細はログのみ、ユーザーには汎用文言 |

## 2. カスタムエラー型

`lib/shared/errors.ts` に基底 `AppError` と派生型を定義する。各型は **`code`（[`api-response.md`](api-response.md) の語彙）と HTTP ステータス**を保持する。

```ts
// lib/shared/errors.ts（雛形）
export abstract class AppError extends Error {
  abstract readonly code: string; // 例: "VALIDATION_ERROR"
  abstract readonly status: number; // 例: 400
  readonly errors?: Record<string, string>; // フィールド別（任意）
}
export class ValidationError extends AppError {
  code = "VALIDATION_ERROR";
  status = 400; /* ... */
}
export class UnauthorizedError extends AppError {
  code = "UNAUTHORIZED";
  status = 401;
}
export class ForbiddenError extends AppError {
  code = "FORBIDDEN";
  status = 403;
}
export class NotFoundError extends AppError {
  code = "NOT_FOUND";
  status = 404;
}
export class ConflictError extends AppError {
  code = "CONFLICT";
  status = 409;
}
export class ExternalServiceError extends AppError {
  code = "INTERNAL_ERROR";
  status = 500;
}
```

- サービス層（[`service-layer.md`](service-layer.md)）は**ドメインエラーを投げる**。意味づけは呼び出し側で行わせる
- 想定外は**握りつぶさない**。リカバリしないなら再 throw する

## 3. 捕捉・変換戦略（route handler / server action）

- route handler / server action の入口に **共通エラーハンドラ**（例: `withErrorHandler()` ラッパ）を 1 つ用意し、全エンドポイントで使う
- 変換規則:
  - `AppError` → その `status` と `{ code, message, errors? }`（[`api-response.md`](api-response.md)）
  - 未知の例外 → `500 INTERNAL_ERROR`。**スタックトレース・内部情報はレスポンスに出さず**、ログにのみ記録
- `try/catch` は**意味のある単位**で。**空 catch（握りつぶし）禁止**。catch したら「変換して再 throw」「ログして再 throw」「正しくリカバリ」のいずれかを必ず行う

```ts
// app/api/.../route.ts（イメージ）
export const POST = withErrorHandler(async (req) => {
  const input = parse(SchemaZod, await req.json()); // 失敗時 ValidationError
  const result = await someService(db, input); // ドメインエラーを投げ得る
  return Response.json(result, { status: 201 });
});
```

## 4. UI 側のエラー境界

- レンダリング例外は Next.js の **`error.tsx` / `global-error.tsx`** で境界化（`loading.tsx` と併用）
- データ取得失敗はユーザーに分かる表示（共通 `<ErrorAlert>` 等）＋**リトライ導線**を出す
- ユーザーには [`error-message.md`](error-message.md) の文言を表示し、技術詳細は出さない

## 5. ログ

- エラーは**構造化ログ**で記録する（いつ / 誰が / 何を / 相関ID / エラー種別）。`console.error` の素置きに頼らない
- **内部情報（スタック・SQL・トークン等）はログのみ**。レスポンス・画面には出さない
- 評価入力 / 閲覧 / エクスポート等の操作は別途**監査ログ**が必要（→ 監査・ログ規約は別途プラン）

## 6. 外部サービス失敗（DB / Entra / メール）

- **タイムアウト必須**・リトライ（指数バックオフ・回数上限）。[`service-layer.md`](service-layer.md) §4 に従う
- ユーザー向けは「〜に失敗しました」、原因はログへ
- （アプリは外部 LLM API（Claude/Anthropic 等）を呼ばない。[`ai.md`](ai.md)）

## 7. 禁止事項

- 例外の握りつぶし（空 catch・例外を無視した正常扱い）
- ユーザー／レスポンスへの内部情報露出（スタックトレース・例外クラス名・SQL）
- 本番コードでの `console.log` によるエラー処理（[`app.md`](app.md)）
- トランザクション内での外部 I/O（[`service-layer.md`](service-layer.md) §3）

## 関連

- API / エラー形式: [`api-response.md`](api-response.md)
- エラーメッセージ文言: [`error-message.md`](error-message.md)
- サービス層 / トランザクション: [`service-layer.md`](service-layer.md)
- アプリ規約: [`app.md`](app.md)
