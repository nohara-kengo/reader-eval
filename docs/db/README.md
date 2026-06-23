# データベース

reader-eval の DB ドキュメントの入口。運用方針の正本は横断規約 [`db.md`](../../.claude/rules/db.md) を参照。

> スキーマ・マイグレーション基盤（Prisma 選定 + seed）は **Issue #5** で導入予定。本ドキュメントは入口・索引であり、確定したスキーマ定義は導入後に追記する。

## 採用技術

- ORM / マイグレーション: **Prisma**（`@prisma/client` / `prisma`）。スキーマは `prisma/schema.prisma`（Issue #5 で追加）。
- DB エンジン: ローカルは Docker Compose で起動（[`../runbooks/README.md`](../runbooks/README.md)）。

## マイグレーション運用

`package.json` のスクリプトで操作する（運用詳細は [`db.md`](../../.claude/rules/db.md)）。

| コマンド | 用途 |
|---|---|
| `npm run db:migrate` | 開発: マイグレーション作成・適用（`prisma migrate dev`） |
| `npm run db:deploy` | 本番: 適用のみ（`prisma migrate deploy`） |
| `npm run db:seed` | 初期 / テストデータ投入（`prisma db seed`） |
| `npm run db:studio` | Prisma Studio でデータ閲覧（`prisma studio`） |

## バックアップ / リストア

オンプレ Ubuntu VM 上の DB を対象に定期バックアップを行う。具体的な手順・スケジュール・リストア検証は運用 Runbook（[`../runbooks/README.md`](../runbooks/README.md) の「バックアップ / リストア」）に記載する。

## 設計指針（[`db.md`](../../.claude/rules/db.md) より）

- DB の Entity をそのまま API レスポンスに返さない（DTO へ整形。[`../api/README.md`](../api/README.md)）。
- トランザクション内で外部 I/O を行わない（[`service-layer.md`](../../.claude/rules/service-layer.md)）。

## 関連

- DB 横断規約: [`db.md`](../../.claude/rules/db.md)
- サービス層 / トランザクション: [`service-layer.md`](../../.claude/rules/service-layer.md)
- アーキテクチャ概要: [`../architecture/README.md`](../architecture/README.md)
