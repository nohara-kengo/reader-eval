# アーキテクチャ概要

reader-eval は **Next.js（App Router）フルスタック 1 本**で構成する。独立したバックエンドを持たず、UI（React Server / Client Components）と API（route handlers）・サーバ処理（server actions）を同一アプリ・同一リポジトリで実装する。ランタイムは Node.js / TypeScript。

## レイヤ構成

| レイヤ | 配置 | 役割 |
|---|---|---|
| プレゼンテーション | `app/`, `components/`, `features/` | 画面・UI コンポーネント・機能単位のまとまり |
| API / エントリ | `app/api/**/route.ts`（route handlers）/ server actions | HTTP 入口。入力検証・共通エラーハンドラ・DTO 整形 |
| ドメイン / サービス | `lib/` | 業務ロジック。ドメインエラーを投げる。HTTP を知らない |
| 共有 | `lib/shared/` | エラー型・共通ユーティリティ等の横断要素 |
| 永続化 | Prisma（`prisma/`・Issue #5 で導入） | DB アクセス。スキーマ / マイグレーション |

## 方針

- API は共通エンベロープを持たず、ドメイン層の戻り値を DTO へ整形して直返しする（[`api-response.md`](../../.claude/rules/api-response.md)）。
- 例外は `lib/shared/errors.ts` の `AppError` 派生型で表現し、route handler 入口の共通ハンドラ（`withErrorHandler`）で `ErrorResponse` に変換する（[`error-handling.md`](../../.claude/rules/error-handling.md)）。
- 認証は M365（Microsoft Entra ID）SSO を第一候補とする。
- デプロイはオンプレ Ubuntu VM + Docker + Coolify。

## 横断規約（`.claude/rules/`）への索引

| 規約 | 内容 |
|---|---|
| [api-response.md](../../.claude/rules/api-response.md) | API レスポンス・エラー形式の統一（`ErrorResponse`・`code` 語彙） |
| [error-handling.md](../../.claude/rules/error-handling.md) | 例外分類・カスタムエラー型・捕捉/変換・ログ |
| [error-message.md](../../.claude/rules/error-message.md) | ユーザー向けエラーメッセージ文言 |
| [validation.md](../../.claude/rules/validation.md) | 入力検証（Zod 等） |
| [service-layer.md](../../.claude/rules/service-layer.md) | サービス層・トランザクション・外部サービス連携 |
| [authz.md](../../.claude/rules/authz.md) | 認証・認可 |
| [db.md](../../.claude/rules/db.md) | DB / Prisma 運用 |
| [logging.md](../../.claude/rules/logging.md) | 構造化ログ・監査ログ・ヘルスチェック |
| [security.md](../../.claude/rules/security.md) | セキュリティ要件 |
| [naming-conventions.md](../../.claude/rules/naming-conventions.md) | 命名規約 |
| [app.md](../../.claude/rules/app.md) / [shared.md](../../.claude/rules/shared.md) / [config.md](../../.claude/rules/config.md) / [ai.md](../../.claude/rules/ai.md) / [testing.md](../../.claude/rules/testing.md) / [git-workflow.md](../../.claude/rules/git-workflow.md) | アプリ / 共有 / 設定 / AI 活用 / テスト / Git 運用 |

## 関連ドキュメント

- API 規約: [`../api/README.md`](../api/README.md)
- DB: [`../db/README.md`](../db/README.md)
- 運用 Runbook: [`../runbooks/README.md`](../runbooks/README.md)
- 整備ロードマップ: [`../harness/ROADMAP.md`](../harness/ROADMAP.md)
