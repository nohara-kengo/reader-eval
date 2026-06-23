---
description: "サービス層の責務・コンポーネント化・トランザクション境界の規約"
paths: "app/**,lib/**,features/**,.claude/rules/**"
---

# サービス層規約（コンポーネント化 / トランザクション管理）

Next.js フルスタック1本（[`app.md`](app.md)）における **サービス層** の設計規約。「ビジネスロジックをどこに、どう分割して置くか」「トランザクション境界を誰が持つか」を定める。

## 1. レイヤと依存方向

```
UI 層            app/(routes), components/, features/*/components
  │ 呼び出し（下方向のみ）
サービス層        features/<feature>/server/, lib/<domain>/      ← ビジネスロジックの所在
  │
データアクセス層   lib/db/（Prisma or Drizzle クライアント・クエリ）
  │
外部サービス       lib/claude/（Anthropic）, lib/auth/（Entra）, メール 等
```

- 依存は **上 → 下のみ**。下層が上層（UI / route handler）を import しない
- route handler / server action は**サービス層の呼び出し口**であって、ロジックの置き場ではない（§2）
- サービス層から UI / Next.js 固有 API（`next/headers` 等）への依存を持ち込まない（テスト容易性のため）

## 2. サービスのコンポーネント化

### 単位と置き場所

- **1 サービス = 1 ユースケース／1 責務**。肥大化したら関数単位に分割する
- 機能固有: `features/<feature>/server/<feature>.service.ts`
- 複数機能で再利用: `lib/<domain>/`（[`shared.md`](shared.md) の昇格基準を満たした時のみ）
- route handler / server action は **「入力検証 → サービス呼び出し → 結果整形」** の薄いオーケストレーションに徹する。`if` の業務分岐・集計・外部呼び出しをここに書かない

### 設計ルール

- サービスは**純粋なモジュール関数**を基本とする。副作用（DB / Claude / Entra）は**引数で渡されたクライアント**、または `lib/` の確立済みクライアント経由で行う（テストでモック差し替え可能に）
- 入出力は**型（DTO 相当）で明示**する。Entity / DB 行をそのまま返さず、画面・API が必要とする形へ整形する
- サービス同士の**直接相互依存を避ける**。共通処理は `lib/` に切り出すか、インターフェースを介す（**循環依存禁止**）
- 1 つの公開関数は 1 つのことだけ行う。複合ユースケースは小さなサービス関数の合成で表現する
- 例外は **ドメインエラー型**で投げる（[`error-handling.md`](error-handling.md)）。呼び出し側（route handler）が共通ハンドラで HTTP に変換する

### 例（雛形）

```ts
// features/score/server/submitSelfEvaluation.ts
import type { Db } from "@/lib/db";
import { ValidationError } from "@/lib/shared/errors";
import type { SelfEvaluationInput, SelfEvaluationResult } from "../types";

// サービス = 1 ユースケース。DB はトランザクションも受けられるよう引数で受ける
export async function submitSelfEvaluation(
  db: Db,
  input: SelfEvaluationInput,
): Promise<SelfEvaluationResult> {
  if (!input.items.length) throw new ValidationError("評価項目は必須です");
  // ... ドメインロジック（整形して DTO を返す） ...
}
```

## 3. トランザクション管理

### 境界はサービス層が所有する

- **1 つの業務操作 = 1 トランザクション**。複数テーブルへの書き込みが 1 操作なら必ず単一トランザクションで原子的に行う
- トランザクションを**開始・コミット・ロールバックするのはサービス層**。route handler / UI / 個別クエリ単体に散らさない
- トランザクションは**短く保つ**。ロック保持時間を最小化する

### ツール別パターン（採用後に 1 つへ統一＝ADR）

```ts
// Prisma
await prisma.$transaction(async (tx) => {
  await tx.evaluation.create({ ... });
  await tx.auditLog.create({ ... });
});

// Drizzle
await db.transaction(async (tx) => {
  await tx.insert(evaluations).values({ ... });
  await tx.insert(auditLogs).values({ ... });
});
```

- サービス関数は**トランザクションクライアント（`tx`）を引数で受け取れる**設計にし、単独実行とトランザクション内実行の両方に対応する

### 禁止・注意

- **トランザクション内で非 DB の外部 I/O を行わない**（Claude API 呼び出し・メール送信・ファイル出力等）。ロールバック不能になり、ロックも長引く
  - 外部副作用は**コミット後**に実行する。確実性が要る場合は **アウトボックス**（DB に予約を書く → 別処理で送信）を採る
- **部分コミット禁止**。途中失敗は例外で必ずロールバックする（空 catch で握りつぶさない）
- **冪等性**を確保する。リトライ・二重送信に備え、必要な操作はユニーク制約 / `upsert` / 冪等キーで二重実行を防ぐ
- 整合性の必要な集計・採点はトランザクション内、または適切な分離レベルで行う

## 4. 外部サービス連携（Claude / Entra / メール）

- 呼び出しは `lib/<service>/` に集約し、**タイムアウト必須**・リトライ（指数バックオフ・回数上限）を実装する
- 失敗は**ドメイン外エラー**として扱い、ユーザー向け文言は「〜に失敗しました」（[`error-message.md`](error-message.md)）
- DB トランザクションと**混在させない**（§3）

## 関連

- アプリ規約: [`app.md`](app.md)
- エラーハンドリング: [`error-handling.md`](error-handling.md)
- API / エラー形式: [`api-response.md`](api-response.md)
- 共通化・パーツ化: [`shared.md`](shared.md)
