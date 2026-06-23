---
description: "入力バリデーション規約（Zod / サーバ検証を正 / スキーマ配置・型導出・失敗時の扱い）"
paths: "app/**,lib/**,features/**,components/**,.claude/rules/**"
---

# バリデーション規約

reader-eval（Next.js フルスタック 1 本）における入力バリデーションの方針を定める。**「どこで・何で・どう検証し、失敗をどう返すか」**を統一する。失敗時のレスポンス形式・`code` 語彙は [`api-response.md`](api-response.md)、例外の捕捉・変換は [`error-handling.md`](error-handling.md)、文言は [`error-message.md`](error-message.md) を正とし、本ファイルは**検証そのものの規約**を扱う。

## 1. ライブラリ（暫定: Zod）

- バリデーションライブラリは **Zod を採用（暫定）**。確定は ADR で行う。
- スキーマ定義・パース・型導出（`z.infer`）を一貫して Zod に集約し、独自の検証ロジックを散らさない。
- フォーム連携は React Hook Form + `@hookform/resolvers/zod` を推奨（[`app.md`](app.md) §フォーム / バリデーション）。ただし**業務ルールの正はサーバ側**（§3）。

## 2. スキーマの置き場所

| 種別 | 置き場所 | 例 |
| --- | --- | --- |
| 機能固有スキーマ | `features/<feature>/schema.ts` | `features/score/schema.ts` |
| 機能横断の共通スキーマ / プリミティブ | `lib/shared/validation/` | メールアドレス / ID / ページネーション等 |

- 機能固有のスキーマは**機能内に閉じる**。2 機能以上で再利用が確定したものだけ `lib/shared/validation/` へ昇格する（昇格基準は [`shared.md`](shared.md)）。
- 共通プリミティブ（例: `emailSchema` / `idSchema` / `paginationSchema`）を `lib/shared/validation/` に用意し、機能スキーマはそれを `extend` / 合成して組み立てる。同じ制約を各所で書き直さない。
- ディレクトリが肥大化したらカテゴリで分割する（[`shared.md`](shared.md) §5）。

## 3. サーバ検証を正とする

- **検証の正はサーバ側**。route handler（`app/api/.../route.ts`）/ server action の**入口で必ず検証する**。クライアントから来る値はすべて信頼しない。
- **クライアント側検証は UX 補助に留める**（即時フィードバック・submit 制御）。業務ルールをクライアントとサーバで**二重に書かない**。共通化できる構造検証は同一スキーマを import して共有し、サーバを置き換えない。
- 認可（権限・状態遷移可否）は入力バリデーションとは別レイヤ。スキーマ検証通過後に**サービス層**（[`service-layer.md`](service-layer.md)）で判定する。

```ts
// app/api/scores/route.ts（イメージ）
import { scoreInputSchema } from "@/features/score/schema";
import { parse } from "@/lib/shared/validation"; // safeParse をラップし ValidationError を投げる薄いヘルパ

export const POST = withErrorHandler(async (req) => {
  const input = parse(scoreInputSchema, await req.json()); // 失敗時 ValidationError
  const result = await submitScore(db, input);              // サービス層へ
  return Response.json(result, { status: 201 });
});
```

## 4. 失敗時の扱い

- 検証失敗は **`ValidationError`**（[`error-handling.md`](error-handling.md) §2）を投げ、共通エラーハンドラが **`VALIDATION_ERROR`（HTTP 400）**へ変換する（[`api-response.md`](api-response.md) §2.1）。
- フィールド別エラーは `errors`（`Record<string, string>`）に詰める。Zod の `error.flatten().fieldErrors` をフィールド名キー・日本語メッセージ値へ整形する（変換は共通ヘルパに集約）。
- メッセージ文言は [`error-message.md`](error-message.md) §3.1 の規約形に揃える（例: 「メールアドレスは必須です」「氏名は100文字以内で入力してください」）。スキーマには技術詞彙を含む既定英語メッセージを残さず、`message` を明示的に日本語で与える。
- server action では HTTP を直接返さず、`{ ok: false, error: ErrorResponse }` 形式で返す（[`api-response.md`](api-response.md) §3）。`error.errors` をフォームのフィールド別表示に振り分ける。

```ts
// features/score/schema.ts（イメージ）
import { z } from "zod";

export const scoreInputSchema = z.object({
  participantId: z.number().int().positive(),
  comment: z
    .string()
    .min(10, "コメントは10〜2000文字で入力してください")
    .max(2000, "コメントは10〜2000文字で入力してください"),
  rating: z.enum(["A", "B", "C", "D"]), // 列挙は as const ユニオンと整合（app.md）
});
```

## 5. 型の単一ソース化

- **スキーマを単一ソース**とし、型は `z.infer` で導出する。手書きの `interface` / `type` と**二重定義しない**。

```ts
export type ScoreInput = z.infer<typeof scoreInputSchema>; // ← これを唯一の入力型とする
```

- 入力 DTO（API・server action の受け口）はスキーマ由来の型を使う。出力 DTO は別途定義してよい（入力スキーマを出力に流用しない）。
- DB の Entity 型をそのまま入力型に使わない（[`app.md`](app.md) / [`service-layer.md`](service-layer.md)）。

## 6. よくある検証の指針

| 種別 | 指針 |
| --- | --- |
| 必須 | 文字列は `min(1)` ＋空白のみを弾く（必要に応じて `trim()`）。任意項目は `optional()` / `nullable()` を明示し曖昧にしない |
| 形式 | メール・URL・日付等は専用バリデータ（`z.string().email()` 等）。共通形式は `lib/shared/validation/` に集約し再利用する |
| 文字数 | `min` / `max` を明示。文言は範囲なら「{min}〜{max}文字」、上限のみなら「{max}文字以内」（[`error-message.md`](error-message.md) §3.1） |
| 列挙 | `z.enum([...])` を使い、対応する TS 型は文字列ユニオン / `as const` と一致させる（[`app.md`](app.md)）。マジック文字列を散らさない |
| 数値 | 整数は `int()`、範囲は `min` / `max`、ID は `positive()`。文字列由来は `coerce` で変換しつつ型を保証する |
| 未知キー | 必要に応じて `strict()` で予期せぬキーを拒否する（特に外部公開 route handler） |

- 共通制約（ID・ページネーション・並び順等）は `lib/shared/validation/` の共通スキーマへ寄せ、機能側はそれを合成する。

## 7. 関連

- レスポンス・`code` 語彙・例外変換: [`api-response.md`](api-response.md)
- 例外の分類・カスタムエラー型・捕捉/変換: [`error-handling.md`](error-handling.md)
- エラーメッセージ文言: [`error-message.md`](error-message.md)
- アプリ規約（フォーム / TS / 責務分離）: [`app.md`](app.md)
- 共通化・パーツ化: [`shared.md`](shared.md)
