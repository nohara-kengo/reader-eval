---
name: tdd-implement
description: 受け入れ条件（acceptance.md）をもとに、Vitest → 実装 → リファクタの TDD ループを Next.js（App Router）/ TypeScript strict 文脈で回す。route handler / UI / lib 各層のテスト指針つき。
---

# TDD Implement スキル（reader-eval）

受け入れ条件を起点に Red → Green → Refactor のサイクルを回す。Next.js（App Router）/ TypeScript strict / Tailwind / Node 22 / Vitest 前提。

## 入力

- `$ARGUMENTS`: Issue 番号（あれば `docs/design/<n>/acceptance.md` を読み込む）
- なければ、対象 Issue 番号 / 受け入れ条件をユーザーに確認

## 前提

- `develop` ベースの作業ブランチ `feature/<issue番号>-<説明>` にいること（`git status` / `git branch --show-current` で確認）
- `docs/design/<n>/files.md` に修正予定ファイルが列挙されていること（任意）
- DB を使うテストは Prisma / Drizzle どちらの採用かを確認（スキーマ・クライアントの参照先が変わる）

## ループ

### Step 1: Red — 失敗するテストを書く

受け入れ条件 1 項目に対し **1 テスト** を書く。テストは実装と同じディレクトリの `*.test.ts` / `*.test.tsx` に置く。

| レイヤ | 配置 | テスト観点 |
| --- | --- | --- |
| route handler | `app/api/<feature>/route.test.ts` | `GET`/`POST` 等の関数を `Request` を渡して直接呼び、`Response` の status / JSON を検証。未認証・入力不正・正常の各ケース。DB / Claude SDK はモック |
| lib（業務ロジック / 集計 / 外部連携ラッパ） | `lib/<feature>/xxx.test.ts` | 純関数として入出力・境界値・異常系を検証。DB アクセスと `@anthropic-ai/sdk` はモック |
| UI（Component） | `components/<feature>/Xxx.test.tsx` | React Testing Library で描画・操作・条件分岐表示を検証。Server Component はロジックを lib に切り出してそちらをテスト |

実行して **赤** であることを確認:

```bash
npm test -- app/api/evaluations/route.test.ts
# 単一テスト名で絞る場合
npm test -- lib/aggregation/score.test.ts -t "境界値"
```

#### テストの基本方針

- **外部 I/O はモック**: DB クライアント（Prisma/Drizzle）、`@anthropic-ai/sdk`、Entra 認証セッションは Vitest の `vi.mock` でモックし、ユニットテストを決定論的に保つ。
- **route handler は関数を直接呼ぶ**: HTTP サーバを立てず、`route.ts` の export 関数に `new Request(url, { method, body })` を渡して検証する。
- **Server Component はロジックを lib へ**: SSR コンポーネント本体は薄く保ち、データ取得・整形・判定を `lib/` に出してユニットテストする。
- E2E（Entra ログイン込みのシナリオ）は Playwright（`npm run test:e2e`、配置 `e2e/`）で別途カバーする。

### Step 2: Green — 通す最小実装

#### route handler（`app/api/.../route.ts`）

- ハンドラは薄く。検証・業務ロジック・外部連携は `lib/` に分離する。
- 入力は zod 等でスキーマ検証し、失敗は 4xx（401 未認証 / 403 認可 / 422 バリデーション）。
- 認証は Entra ID セッションを `lib/auth` 経由で検証してから処理に入る。
- 例外を握りつぶさない。ログ + 適切な status で返す。`console.log` は残さない。

#### lib

- 関数は単一責務・純粋寄りに保つ（副作用は引数で注入できると望ましい）。
- DB アクセスは採用ツール（Prisma/Drizzle）のクライアントを 1 箇所に集約。
- Claude 呼び出しは `lib/<...>/claude.ts` 等のラッパに集約し、モデル ID（既定 `claude-opus-4-8`）・タイムアウト・リトライをここで扱う。

#### UI（Component）

- 関数コンポーネント + hooks。クライアント挙動が必要なときだけ `"use client"`。
- データ取得は Server Component / route handler 側で行い、Component は表示に専念。
- Tailwind のユーティリティクラスでスタイリング。
- `any` 禁止（TypeScript strict）。型は近接する `types.ts` か共有の型定義に置く。

実行して **緑**:

```bash
npm test -- app/api/evaluations
npm test -- lib/aggregation
```

### Step 3: Refactor — 整理

- ガード節で早期リターン、ネストを浅く保つ
- 命名: コンポーネント PascalCase / 関数・変数 camelCase / 定数 UPPER_SNAKE / ファイルは規約に合わせる
- route handler / lib / UI の責務分離を維持（ハンドラに業務ロジックを戻さない）
- 重複したフェッチ・整形は lib のユーティリティに集約
- `any` / 非 null アサーション `!` の濫用を避ける

実行して **緑** のまま:

```bash
npm test
```

## 全条件達成後の最終チェック

PR へ進む前に **すべて** 通すこと:

```bash
npm test          # Vitest 全テスト緑
npm run typecheck # 型エラー 0（TypeScript strict）
npm run lint      # 0 違反
npm run build     # Next.js ビルド成功
```

E2E が必要な受け入れ条件がある場合:

```bash
npm run test:e2e  # Playwright
```

DB スキーマを変更した場合は、採用ツールのマイグレーションを生成・適用し、関連の型・クライアント更新を同コミットに含める（Prisma 例: `npx prisma migrate dev` / `npx prisma generate`。Drizzle 例: `npx drizzle-kit generate`）。

## ループ離脱条件

- 受け入れ条件が実装で満たされ、上記の自動チェックがすべて緑
- 想定外の失敗で Red のままなら **コミット / PR に進まず** ユーザーに状況を共有する

## 注意事項

- **Red のまま既存の緑テストを上書きしない**（既存緑を壊す変更が必要なら一度コミットを切る）
- セキュリティ観点（Entra ID セッション検証 / route handler の認可 / 入力検証 / SQL は ORM 経由でパラメータ化 / Claude API のタイムアウト・レート制限）は受け入れ条件に項目が無くても **必ず** 1 通り点検する
- `console.log` をコミットしない
- `.env*`（実値）/ Entra クライアントシークレット / Cloudflare トークン / 証明書ファイルを読み取らない・コミットしない
- `develop` への直 push / force-push / CI バイパスは禁止。実装は `feature/<issue番号>-<説明>` ブランチで行う
