# reader-eval — リーダー研修 評価システム

「ジョブ型エンジニア」評価の仕組みを構築するプロジェクトのリポジトリです。リーダー研修の成果物として、自己評価・360°評価・集計・人事考課委員会向け出力までを扱う社内向け評価システムを開発します。

- **ステータス**: アプリ実装フェーズ（要件定義の正本あり）
- **最終更新**: 2026-06-23

> 要件は [`docs/requirements/要件定義書.md`](docs/requirements/要件定義書.md) を正本とします。ドキュメント全体の索引は [`docs/INDEX.md`](docs/INDEX.md) を参照してください。

---

## プロジェクト概要

- リーダー研修の成果物として「ジョブ型エンジニア」評価の仕組みを構築する
- 人事考課委員会への提出資料を作成しやすくする
- 部の評価軸から脱却できる汎用的・組織非依存の評価の仕組みを提示する
- メンバーの伸びしろを可視化する
- スモールスタート（2 部署程度）→ 全社展開を見据える。**外販プロダクト化・クラウド移行は現状スコープ外**

### マイルストーン

- **8 月**: 一部部署でのスモールスタート稼働
- **4Q**: 人事考課委員会への提出に合わせた本運用

---

## 技術スタック

**Next.js（App Router）フルスタック 1 本**で構成する（独立したバックエンドは持たない。UI と API route handlers / server actions を同一アプリで実装）。

| 区分           | 採用技術                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| フレームワーク | Next.js (App Router / SSR) ・ TypeScript（strict）・ React 19                  |
| スタイリング   | Tailwind CSS                                                                   |
| API            | route handlers（`app/api/**/route.ts`）/ server actions                        |
| DB / ORM       | PostgreSQL ＋ Prisma（スキーマは Issue #5 で導入）                             |
| バリデーション | Zod（サーバ側検証を正とする）                                                  |
| AI / LLM       | Claude（Anthropic API）/ 既定 `claude-opus-4-8` / SDK `@anthropic-ai/sdk`      |
| ログ           | pino（構造化ログ）                                                             |
| 認証           | M365（Microsoft Entra ID）SSO                                                  |
| テスト         | Vitest + Testing Library（unit）/ Playwright（e2e）                            |
| 品質           | ESLint / Prettier / tsc ・ husky + lint-staged                                 |
| インフラ       | オンプレ Ubuntu VM + Docker、Coolify（CI/CD）、Cloudflare Tunnel（必要時のみ） |

---

## セットアップ

```bash
# 1. 依存インストール（Node.js >= 22）
npm install

# 2. 環境変数: .env.example をコピーして編集
cp .env.example .env

# 3. ローカル依存サービス（PostgreSQL 等）を起動
docker compose up -d

# 4. 開発サーバ起動
npm run dev
```

> `.env*` は Git 管理対象外・Claude からの読み取り禁止（[`.claude/settings.json`](.claude/settings.json) で deny 済み）。

> **認証（M365 / Entra ID SSO）**: ログインを動かすには Entra アプリ登録と `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AUTH_SECRET` が必要です。手順は [`docs/runbooks/auth-entra-id.md`](docs/runbooks/auth-entra-id.md) を参照（`AUTH_SECRET` は `openssl rand -base64 32` で生成）。本番は起動時に認証 env を検証し fail-fast します。

---

## 主要コマンド

| コマンド                                                     | 内容                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `npm run dev`                                                | 開発サーバ起動                                             |
| `npm run build`                                              | 本番ビルド                                                 |
| `npm run lint`                                               | ESLint                                                     |
| `npm run typecheck`                                          | 型チェック（`tsc --noEmit`）                               |
| `npm run test`                                               | 単体テスト（Vitest）                                       |
| `npm run test:e2e`                                           | E2E テスト（Playwright）                                   |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | DB マイグレーション・seed・閲覧（Prisma。Issue #5 で導入） |

> PR 作成前に `lint` / `typecheck` / `test` / `build` をすべて通すこと。

---

## ビルドと起動

### 開発（ホットリロード）

```bash
npm install          # 初回のみ（Node.js >= 22）
npm run dev          # http://localhost:3000
```

### 本番ビルド & 起動

```bash
npm run build        # 本番ビルド（standalone 出力。.next/ を生成）
npm start            # 本番サーバ起動（既定 http://localhost:3000）
# ポートを変える場合: PORT=3100 npm start
```

> 型チェック / ビルドは Prisma Client を参照するため、CI と同様に必要に応じて `npx prisma generate` を先に実行する。

### 疎通確認（フロント ↔ バックエンド）

本アプリは **Next.js フルスタック 1 本**（独立バックエンドを持たない。UI と API route handlers を同一アプリで実装）。フロント（UI）とバックエンド（`app/api/.../route.ts`）の疎通は次の 2 通りで確認できる。

- **画面から**: ブラウザで `/` を開くと「バックエンド疎通確認（/api/health）」欄に **疎通 OK（status: ok）** が表示される（UI が同一アプリの `/api/health` を fetch する）。
- **API を直接**:

  ```bash
  curl http://localhost:3000/api/health
  # => {"status":"ok"}
  ```

---

## ディレクトリ概観

| パス          | 内容                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `app/`        | Next.js App Router（画面・レイアウト・`app/api/**/route.ts`）                                    |
| `lib/`        | ドメイン / サービス / 各種クライアント（`lib/shared/errors.ts`・`lib/api/error-response.ts` 等） |
| `components/` | 汎用 UI コンポーネント                                                                           |
| `features/`   | 機能単位のまとまり（`components` / `hooks` / `server` / `types`）                                |
| `prisma/`     | Prisma スキーマ・マイグレーション（Issue #5 で導入）                                             |
| `docs/`       | ドキュメント（要件・設計・API・DB・Runbook・アーキ）                                             |
| `.claude/`    | Claude エージェントハーネス（`rules/`・`skills/`・`settings.json`）                              |

---

## 開発フロー

- 開発は `.claude/skills/` のスキルで「プラン → Issue → 設計 → 実装 → コミット → PR → レビュー」を回す（[`.claude/skills/README.md`](.claude/skills/README.md)）。中心は [`exec-issue`](.claude/skills/exec-issue/SKILL.md)（Issue を起点に設計 → TDD 実装 → PR まで一気通貫）。
- ブランチ運用は Git Flow。`main` = 本番 / `develop` = 開発（デフォルト）。機能は `feature/{issue番号}-{概要}` を **develop から分岐**し、Squash Merge で develop へ。develop → main は Merge Commit（詳細: [`.claude/rules/git-workflow.md`](.claude/rules/git-workflow.md)）。
- 横断規約は `.claude/rules/` を正本とする（API / エラー / 検証 / 認可 / DB / ログ等）。コメントは日本語、`any` / `var` 禁止。

---

## ドキュメント索引

| カテゴリ           | 入口                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| 全ドキュメント索引 | [`docs/INDEX.md`](docs/INDEX.md)                                     |
| アーキテクチャ概要 | [`docs/architecture/README.md`](docs/architecture/README.md)         |
| API 規約           | [`docs/api/README.md`](docs/api/README.md)                           |
| DB                 | [`docs/db/README.md`](docs/db/README.md)                             |
| 運用 Runbook       | [`docs/runbooks/README.md`](docs/runbooks/README.md)                 |
| 整備ロードマップ   | [`docs/harness/ROADMAP.md`](docs/harness/ROADMAP.md)                 |
| 要件定義（正本）   | [`docs/requirements/要件定義書.md`](docs/requirements/要件定義書.md) |

`docs/` 配下の詳細な一覧（設計・背景・調査・議事録・参考資料・課題管理表）は [`docs/INDEX.md`](docs/INDEX.md) に集約しています。

### `.claude/rules/`（横断規約）

[api-response](.claude/rules/api-response.md) ・ [error-handling](.claude/rules/error-handling.md) ・ [error-message](.claude/rules/error-message.md) ・ [validation](.claude/rules/validation.md) ・ [service-layer](.claude/rules/service-layer.md) ・ [authz](.claude/rules/authz.md) ・ [db](.claude/rules/db.md) ・ [logging](.claude/rules/logging.md) ・ [security](.claude/rules/security.md) ・ [naming-conventions](.claude/rules/naming-conventions.md) ・ [app](.claude/rules/app.md) ・ [shared](.claude/rules/shared.md) ・ [config](.claude/rules/config.md) ・ [ai](.claude/rules/ai.md) ・ [testing](.claude/rules/testing.md) ・ [git-workflow](.claude/rules/git-workflow.md)

---

## 関連

- 要件定義の正本: [`docs/requirements/要件定義書.md`](docs/requirements/要件定義書.md)
- 主要な未決事項: 要件定義書「6. 要確認事項」/ [`docs/課題管理表.md`](docs/課題管理表.md)
