---
name: smart-commit
description: 現在の作業差分を分析し論理単位に分割したコミットを提案、承認後に実コミットする。秘匿情報の混入をチェックし、コミットプレフィクス規約に従う。
---

# Smart Commit スキル（reader-eval）

作業差分を分析し、論理的単位でコミットを分割提案する。ユーザー承認後に実コミットを行う。
対象は **Next.js (App Router) フルスタック1本** / TypeScript strict / Tailwind / Prisma|Drizzle / PostgreSQL。

## ワークフロー

### 1. 差分の取得

```bash
git status --short
git diff HEAD
```

未追跡の新規ファイルがある場合は内容も確認する。

> **方針**: `git add .` / `git add -A` は **使わない**。提案・実コミットとも、意図して触ったファイルだけを `git add <パス>` で明示ステージする。

### 2. 変更の分類

各ファイルの変更を以下の観点でグルーピングする。

- **機能単位**: 同じ機能に関する変更はまとめる（例: route handler `app/api/...` + Server Component/Page + Prisma|Drizzle スキーマ/マイグレーション + テスト）
- **関心の分離**: 設定変更 / リファクタ / 新機能 / バグ修正は分ける
- **依存関係**: 後のコミットが前に依存する場合、依存される側を先に

#### 分割の粒度ガイドライン

- 1 コミット = 1 つの論理的変更（「なぜ」を 1 文で説明できる単位）
- テストは対応する実装と **同じコミット** にする
- DB スキーマ変更（Prisma `schema.prisma` + `prisma/migrations/` / Drizzle スキーマ + `drizzle/` マイグレーション）は対応する実装と **同じコミット** にする
- Lint / format（ESLint / Prettier）のみの修正は **独立コミット** にする
- ファイル削除は、その理由となる変更と同じコミットにまとめる
- `package.json` と `package-lock.json` は **同じコミット** にする
- ランタイム/基盤更新（Node 22 / PostgreSQL / Next.js）は **同一 PR / 同一コミット** で `Dockerfile` / `docker-compose.yml` / CI workflow / `.nvmrc`（または `.tool-versions`）を揃える

### 3. コミットメッセージの生成

- 日本語、prefix は `feat: / fix: / refactor: / test: / docs: / ci: / chore:`
- 「なぜ」を簡潔に。「何を」はコミット差分が語る

### 4. 提案の出力

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コミット 1/N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
メッセージ: <prefix: 何を / なぜ>

対象ファイル:
  A  app/api/evaluations/route.ts
  A  app/api/evaluations/route.test.ts
  M  app/(dashboard)/evaluations/page.tsx
  A  prisma/migrations/20260623_add_evaluation/migration.sql
  M  prisma/schema.prisma

変更概要: <1 行説明>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

ステータス記号: `A` 新規 / `M` 変更 / `D` 削除

### 5. 秘匿情報の混入チェック（必須）

提案前に、ステージ予定ファイルに以下が含まれないか確認する。

- `.env` / `.env.local` / `.env.production` 等の実値
- 証明書・鍵（`*.pem` / `*.key` / `*.crt` / `*.p12`）
- Claude API キー / Entra ID クライアントシークレット / DB 接続文字列の実値
- Cloudflare Tunnel トークン、その他アクセストークン文字列

混入が見つかった場合は **コミットせず警告し、ユーザー判断を仰ぐ**。`.gitignore` 追加も提案する。

### 6. 承認とコミット実行

全コミットを提案し、ユーザー承認を得てから実行する。各コミットは:

```bash
# コミット 1/N: <メッセージ>
git add <files...>     # 必ずパスを明示。`.` や `-A` は使わない
git commit -m "<メッセージ>

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- main / develop への直接コミットは禁止。現在ブランチが `main` / `develop` の場合は警告し、`feature/<issue>-<説明>` への切替を促す
- force-push は行わない

### 7. フィードバック対応

- 統合 / 分割 / メッセージ修正 / ファイルの振り分け変更
- 調整完了後、更新内容を再提示し、再承認を得てから実行する

## 注意事項

- `$ARGUMENTS` が指定された場合、変更の背景コンテキストとして活用する
- ユーザー承認なしに実コミットしない
- 秘匿情報（`.env` / 証明書 / 各種シークレット）をステージしない
