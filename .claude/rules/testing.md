---
description: "テスト戦略（Vitest + Testing Library + Playwright / 種別と境界 / モック方針 / 配置・命名 / CI）"
paths: "app/**,lib/**,features/**,components/**,.claude/rules/**"
---

# テスト戦略

reader-eval（Next.js フルスタック 1 本）のテスト方針を定める。**「何を・どの粒度で・どこに・どうモックして書くか」**を統一する。アプリ全体の前提は [`app.md`](app.md)、サービス層の設計は [`service-layer.md`](service-layer.md)、CI / PR 運用は [`git-workflow.md`](git-workflow.md) を正とする。

## 1. ツール

| 種別                                  | ツール                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| ユニット（ロジック / コンポーネント） | **Vitest** + **Testing Library**（`@testing-library/react`） |
| 統合（route handler / server action） | **Vitest**（テスト DB 併用）                                 |
| e2e（主要業務フロー）                 | **Playwright**（**Chromium のみ**、暫定）                    |

```bash
npm test            # Vitest（ユニット / 統合）
npm run test:e2e    # Playwright（e2e, Chromium）
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # 本番ビルド
```

PR 前に `lint` / `typecheck` / `test` / `build` をすべて通す（[`git-workflow.md`](git-workflow.md)）。

## 2. テスト種別と境界

| 種別     | 対象                                                                                                                             | ツール                     | 目的                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| ユニット | `lib/` のサービス / ユーティリティ / バリデーションスキーマ、`components/` ・`features/*/components/` の UI、`features/*/hooks/` | Vitest (+ Testing Library) | ドメインロジック・分岐・整形・表示の検証                                               |
| 統合     | route handler（`app/api/.../route.ts`）/ server action                                                                           | Vitest（テスト DB）        | 入力検証 → サービス → レスポンス整形（[`api-response.md`](api-response.md)）の通し検証 |
| e2e      | 主要業務フロー（ログイン → 評価入力 → 保存・確定、一覧・エクスポート等）                                                         | Playwright                 | ユーザー視点の正常導線が壊れていないこと                                               |

- **ピラミッド型**を基本とする。ロジックはユニットに寄せ、e2e は数を絞り主要フローのみ（§7）。
- ビジネスロジックは UI でなく**サービス層**にあるので（[`service-layer.md`](service-layer.md)）、検証の主戦場もユニット。

## 3. テストケースの方針

- **1 受け入れ条件 = 1 テスト**（[`app.md`](app.md) §テスト）。1 つの `it` / `test` に複数条件を詰めない。
- 各機能で **正常系 + 異常系 + Edge ケース**を網羅する。
  - 正常系: 期待される入力で期待結果を返す。
  - 異常系: バリデーション失敗（`VALIDATION_ERROR`）/ 権限不可 / 未存在 / 競合など、定義済みエラー（[`api-response.md`](api-response.md) §2.1）を返す。
  - Edge: 境界値（文字数 min/max・0 件・上限件数）、空入力、null/undefined、重複。
- バリデーションは [`validation.md`](validation.md) のスキーマ単位でユニットテストを書く（許容値・拒否値・フィールド別 `errors`）。
- 振る舞いを検証する（実装詳細でなく入出力・副作用・表示）。UI は role / ラベル等ユーザー視点のクエリで検証する。

## 4. モック方針（外部依存は実呼びしない）

- **DB / Entra ID は実呼びしない。**（アプリは外部 LLM API を呼ばないため Claude のモックは不要 — [`ai.md`](../rules/ai.md)）
  - **Entra**: 常にモック（`lib/auth/` のクライアント境界でスタブ）。実トークンをテストで使わない。
  - **DB**: ユニットはクライアントをモック / インメモリ。統合は **テスト DB**（docker compose の `db`、専用 DB or スキーマ）に対して実行し、各テストで初期化・クリーンアップする。
- サービスは**クライアントを引数で受ける**設計のため（[`service-layer.md`](service-layer.md) §2）、テストではモック / トランザクションを差し替えて検証する。
- **テストデータはファクトリ**（`tests/factories/` など）に集約し、各テストで必要分だけ上書きする。巨大な固定 JSON を散らさない。
- ネットワーク・時刻・乱数など非決定要素は固定する（タイマー / シードのモック）。

```ts
// features/score/server/submitScore.test.ts（イメージ）
import { describe, it, expect, vi } from "vitest";

describe("submitScore", () => {
  it("評価項目が空のとき ValidationError を投げる", async () => {
    const db = makeDbMock();
    await expect(submitScore(db, { items: [] })).rejects.toThrowError(/必須/);
  });
});
```

## 5. 配置・命名

- テストは**ソース隣接**（co-location）。`*.test.ts` / `*.test.tsx` を対象ファイルの隣に置く。
  - 例: `features/score/server/submitScore.ts` → `features/score/server/submitScore.test.ts`
  - 例: `features/score/components/ScoreForm.tsx` → `features/score/components/ScoreForm.test.tsx`
- e2e は `e2e/`（または `tests/e2e/`）に集約し、`*.spec.ts` とする（暫定）。
- ファクトリ・テストユーティリティは `tests/`（`tests/factories/` / `tests/helpers/`）にまとめる。
- **テスト名は日本語可**。受け入れ条件をそのまま記述する（例: 「確定済みの評価は編集できない」）。

## 6. カバレッジ

- カバレッジ目標は **暫定 80%（line）**。`vitest run --coverage` で計測する。
- CI でカバレッジゲートを敷く（**Issue #6 と連携**して閾値・対象を確定）。生成物・型定義・設定ファイル等は計測対象から除外する。
- 数値達成のための無意味なテストは書かない。未カバーの**分岐・異常系**を優先して埋める。

## 7. e2e のコスト最適化

- e2e は実行コストが高いため**実行タイミングを絞る**（CI 側 **Issue #6** と整合させる、暫定）。
  - **`main` 宛て PR**（develop → main のリリース PR）で実行。
  - **nightly**（定期実行）でフルスイートを実行。
  - 通常の feature → develop の PR では実行せず、ユニット / 統合で品質を担保する。
- e2e は主要業務フローに限定し、細かな分岐はユニット / 統合へ寄せる。Chromium のみ（暫定）。

## 8. 関連

- アプリ規約（テスト前提 / 1 受け入れ条件 = 1 テスト）: [`app.md`](app.md)
- サービス層 / トランザクション（モック差し替え設計）: [`service-layer.md`](service-layer.md)
- バリデーション（スキーマ単位テスト）: [`validation.md`](validation.md)
- API / エラー形式（異常系の期待値）: [`api-response.md`](api-response.md)
- CI / PR 運用: [`git-workflow.md`](git-workflow.md)
