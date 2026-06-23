# reader-eval - 開発ガイド

## プロジェクト概要

リーダー研修 評価システム（reader-eval）。社内向けの研修評価ツール。

研修参加者（リーダー候補）の評価データを管理し、Claude（Anthropic API）を用いた評価支援・要約・分析を行う内部システム。

## 技術スタック

- **アーキテクチャ**: **Next.js（App Router）フルスタック 1 本**。UI は SSR、API は同一アプリの route handlers（`app/api/...`）/ server actions として実装する。**独立したバックエンドは持たない**。
- **言語 / UI**: TypeScript（`strict`）/ Tailwind CSS / Node.js 22
- **データベース**: PostgreSQL（ORM は Prisma または Drizzle。**選定は ADR で決定＝未確定**）
- **AI**: Claude（Anthropic API、`@anthropic-ai/sdk`、既定モデル `claude-opus-4-8`）
- **認証**: Microsoft 365 Entra ID（SSO）
- **インフラ**: オンプレ IDC、Docker + Coolify、Cloudflare Tunnel
  - デプロイ: `main` → 本番環境 / `dev` → 開発環境

## ローカル開発

### Docker Compose サービス

| サービス | 説明 | 備考 |
| --- | --- | --- |
| `web` | Next.js（UI + API route handlers） | アプリ本体 |
| `db` | PostgreSQL | 開発用 DB |
| `adminer` | DB 管理 UI | 任意 |
| `mailhog` | メール送信テスト | 任意 |

### 起動・停止

```bash
docker compose up -d     # 全サービス起動
docker compose down      # 停止
docker compose ps        # 稼働状況
docker compose logs -f web   # ログ追従
```

### npm scripts

```bash
npm run dev        # Next.js 開発サーバー
npm test           # テスト
npm run lint       # Lint（ESLint）
npm run format     # フォーマット（Prettier）
npm run typecheck  # 型チェック（tsc --noEmit）
npm run build      # 本番ビルド
```

### 環境変数

`.env` ファイル（`.env.example` をコピーして作成）。`.env*` は **Git 管理対象外・Claude からの読み取り禁止**（[`.claude/settings.json`](.claude/settings.json) で deny 済み）。

主な変数（実際のキー名は実装時に確定）:

- `DATABASE_URL` — PostgreSQL 接続文字列
- `ANTHROPIC_API_KEY` — Claude API キー
- `ANTHROPIC_MODEL` — 既定 `claude-opus-4-8`
- Entra ID（M365 SSO）: `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` 等

## ディレクトリ概観

Next.js App Router の標準構成を基本とする（実装に応じて調整）。

```
app/
  (routes)/          # 画面（SSR / Server Components）
  api/.../route.ts   # API route handlers（同一アプリ内）
  actions/           # server actions
lib/                 # ドメインロジック / DB アクセス / Claude クライアント
components/           # UI コンポーネント（Tailwind）
prisma/ or drizzle/  # スキーマ・マイグレーション（ORM 選定後）
.claude/
  rules/             # 横断ルール（下記参照）
  skills/            # Claude Code スキル（下記参照）
  settings.json      # 権限・拒否設定
```

API は独立サーバーではなく **同一アプリの route handlers / server actions** に実装する。`fetch` をコンポーネントへ直書きせず、`lib/` のクライアント層を経由する。

## 開発プロセス

### 重要: プラン承認後は Issue 登録を優先すること

**Plan Mode でプランが承認されても、即座に実装へ着手してはならない。** 以下の手順を厳守する:

1. Plan Mode でプランを作成し、承認を得る
2. 承認後、GitHub Issue にプラン内容を登録する（**この段階では実装しない**）
3. ユーザーが `exec-issue`（`/exec-issue {番号}`）を実行するまで実装に着手しない

> **gh CLI について**: 本環境では `gh` が未インストールの可能性がある。Issue / PR 操作は **`gh` があれば `gh`、無ければ GitHub REST API（`curl`）** を用いること。

### 実装フロー（プランニング → Issue 登録 → 設計 → TDD → PR）

1. **プランニング**: Plan Mode で方針を固め、承認を得る
2. **Issue 登録**: プラン内容を Issue 化（`gh issue create`、無ければ REST API）
3. **`exec-issue` 起動**: ユーザーが `/exec-issue {番号}` で Issue 駆動開発を開始
4. **ブランチ作成**: 作成前に必ず `git pull --ff-only origin develop` を実行し、`feature/{issue番号}-{概要}` を **develop から分岐**
5. **設計**: 必要に応じて設計成果物を整理する
6. **TDD**: Red → Green → Refactor を厳守
7. **PR 作成**: **develop ブランチ宛て**に作成し、本文へ `Closes #{issue番号}` を記載。実装者と評価者を分離する（自分の PR を自分で approve しない）

## Git ワークフロー（要約）

- ブランチ:
  - `develop` — 統合ブランチ（**デフォルト**）
  - `main` — 本番ブランチ
  - `feature/{issue番号}-{概要}` — 機能ブランチ（**develop から分岐**）
- マージ戦略:
  - feature → develop: **Squash Merge**
  - develop → main: **Merge Commit**
- 禁止事項: `develop` / `main` への **直 push**、**force push**、**CI チェックのバイパス**（`--admin` 等での必須チェック回避を含む）
- マージは CI 全チェックが green になってから行う

## コーディング規約（要約）

- **コメントは日本語**で記述する
- **禁止**: `any` 型 / `var` の使用、本番コードへの `console.log` 残留
- TypeScript は `strict` 前提。型を緩めない
- UI は Tailwind CSS、API は route handlers / server actions に集約する

## 参照: `.claude/rules` と `.claude/skills`

横断ルールは [`.claude/rules/`](.claude/rules/) に置き、コードと同様に **Git 管理・PR レビュー必須**とする。

- [`.claude/rules/app.md`](.claude/rules/app.md) — 単一 Next.js アプリの規約（ディレクトリ / データ取得 / 責務分離 / TS / テスト）
- [`.claude/rules/service-layer.md`](.claude/rules/service-layer.md) — サービス層のコンポーネント化・**トランザクション管理**
- [`.claude/rules/error-handling.md`](.claude/rules/error-handling.md) — **エラーハンドリング**方針（分類 / カスタムエラー型 / 捕捉・変換・境界 / ログ）
- [`.claude/rules/api-response.md`](.claude/rules/api-response.md) — route handler の成功 / エラーレスポンス形式（`ErrorResponse` / `code` 語彙 / 例外変換方針）
- [`.claude/rules/error-message.md`](.claude/rules/error-message.md) — 日本語エラーメッセージ文言規約
- [`.claude/rules/authz.md`](.claude/rules/authz.md) — 認可・RBAC（ロール / 権限マトリクス / Entra連携 / 360°匿名性）
- [`.claude/rules/security.md`](.claude/rules/security.md) — セキュリティ・機微情報・**Claude送信前マスキング**・シークレット管理
- [`.claude/rules/logging.md`](.claude/rules/logging.md) — 構造化ログ・**監査ログ**・相関ID・ヘルスチェック
- [`.claude/rules/validation.md`](.claude/rules/validation.md) — 入力バリデーション（Zod / サーバ検証を正）
- [`.claude/rules/ai.md`](.claude/rules/ai.md) — Claude 利用（モデル選定 / プロンプト管理 / コスト / フォールバック）
- [`.claude/rules/db.md`](.claude/rules/db.md) — DB 設計・マイグレーション運用（ORM暫定Prisma / バックアップ）
- [`.claude/rules/config.md`](.claude/rules/config.md) — 環境変数・設定規約
- [`.claude/rules/testing.md`](.claude/rules/testing.md) — テスト戦略（Vitest / Playwright / カバレッジ）
- [`.claude/rules/shared.md`](.claude/rules/shared.md) / [`naming-conventions.md`](.claude/rules/naming-conventions.md) / [`git-workflow.md`](.claude/rules/git-workflow.md)

スキルは [`.claude/skills/`](.claude/skills/)（個人ローカルの `~/.claude/` ではなくリポジトリ内）に配置する。代表例:

| スキル | 役割 |
| --- | --- |
| `exec-issue` | Issue → 設計 → TDD → PR を一気通貫で実行 |

権限・拒否設定は [`.claude/settings.json`](.claude/settings.json) を参照。
