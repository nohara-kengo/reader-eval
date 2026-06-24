# 運用 Runbook

reader-eval の運用手順集（雛形）。各見出しは具体手順を順次追記するスタブ。インフラはオンプレ Ubuntu VM + Docker + Coolify、外部公開は Cloudflare Tunnel（必要時のみ）。

## デプロイ（Coolify）

GitHub の `main`（本番）/ `develop`（開発）から Coolify の CI/CD で自動デプロイする。

- [ ] デプロイ前チェック（lint / typecheck / test / build が CI で green）
- [ ] Coolify でのデプロイトリガと進捗確認手順
- [ ] 環境変数（`.env` / Coolify シークレット）の反映確認
- [ ] ロールバック手順（直前のデプロイへ戻す）

## バックアップ / リストア

DB（[`../db/README.md`](../db/README.md)）のバックアップとリストア。

- [ ] バックアップのスケジュール・保存先・世代管理
- [ ] バックアップ取得コマンド（手動 / 自動）
- [ ] リストア手順とリストア検証（復元後の整合性確認）

## ヘルスチェック

アプリの稼働確認エンドポイント。

- エンドポイント: `GET /api/health` → `{ "status": "ok" }`（実装: [`app/api/health/route.ts`](../../app/api/health/route.ts)）
- [ ] 監視からの定期ポーリング設定（間隔・タイムアウト・通知先）
- [ ] DB 疎通を含む拡張（Issue #5 の DB 基盤導入後）

## 認証（M365 / Entra ID SSO）

ログインの Entra アプリ登録・環境変数・起動時 fail-fast・`trustHost` の前提。

- 手順: [`auth-entra-id.md`](auth-entra-id.md)
- 必要 env: `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AUTH_SECRET`（[`config.md`](../../.claude/rules/config.md)）

## インシデント初動

障害検知時の初動フロー。

- [ ] 検知 → 一次切り分け（アプリ / DB / ネットワーク / Coolify / Cloudflare Tunnel）
- [ ] ログ確認手順（構造化ログ / Coolify ログ。[`logging.md`](../../.claude/rules/logging.md)）
- [ ] 暫定対応（再起動 / ロールバック）と恒久対応の切り分け
- [ ] 連絡 / エスカレーション先と記録（ポストモーテム）

## 関連

- アーキテクチャ概要: [`../architecture/README.md`](../architecture/README.md)
- DB: [`../db/README.md`](../db/README.md)
- ログ規約: [`logging.md`](../../.claude/rules/logging.md)
