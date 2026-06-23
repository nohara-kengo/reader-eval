---
description: "DB 設計・マイグレーション運用規約 — ORM(暫定 Prisma) / マイグレーション / seed / バックアップ"
paths: "prisma/**,lib/db/**,app/**,features/**,.claude/rules/**"
---

# DB 設計・マイグレーション運用規約

reader-eval（リーダー研修 評価システム）の **PostgreSQL** に対する設計・マイグレーション・運用の規約を定める。データは社内 IDC（オンプレ）に保持し、**外部に出さない**。

スキーマの命名は [`naming-conventions.md`](naming-conventions.md) §4 を正とし、トランザクション境界は [`service-layer.md`](service-layer.md) を正とする。本ファイルは ORM 運用・マイグレーション・バックアップを扱う。

## 1. ORM（暫定 Prisma）

- ORM / マイグレーションツールは **暫定で Prisma** とする（**ADR 未確定**）。
- ADR 確定後、**Drizzle 等へ置換しうる**。本ファイル・[`naming-conventions.md`](naming-conventions.md) §4・[`service-layer.md`](service-layer.md) のツール依存記述は確定後に更新する。
- DB クライアント・クエリは **`lib/db/` に集約**する（[`app.md`](app.md)）。features / コンポーネントから ORM クライアントを直接 import しない。
- Server Component / クライアントへ DB 接続を露出しない（[`app.md`](app.md) 禁止事項）。

## 2. スキーマ設計（命名は naming-conventions.md §4 を正）

[`naming-conventions.md`](naming-conventions.md) §4 を正とする。要点（重複定義しない・差分のみ）:

- テーブル名: **複数形・snake_case**
- カラム: snake_case。日時 `_at` / 日付 `_on` / 真偽値 `is_` / 件数 `_count`
- インデックス: `idx_{table}_{columns}` / FK: `fk_{table}_{ref}` / unique: `uniq_{table}_{columns}`
- 論理削除カラム（`deleted_at` / `is_deleted`）は [`naming-conventions.md`](naming-conventions.md) の確定に従う

設計の補足:

- Prisma のモデル名は PascalCase（[`naming-conventions.md`](naming-conventions.md) §3）、DB 物理名は `@@map` / `@map` で snake_case の命名規約へマッピングする。
- 主キーは原則サロゲートキー。型（連番 / UUID）は ADR / 確定時に統一する（暫定）。
- 評価データは機微情報を含む。アクセスは認可必須（[`app.md`](app.md)）、操作は監査対象（[`error-handling.md`](error-handling.md) §5 / `logging.md`）。

## 3. マイグレーション運用

- マイグレーションは **`prisma/migrations/`** で管理し、Git 管理・PR レビュー対象とする。
- **1 変更 = 1 マイグレーション**。無関係な複数のスキーマ変更を 1 マイグレーションに混ぜない（[`git-workflow.md`](git-workflow.md) の「1 PR = 1 関心事」と整合）。
- 命名: `prisma migrate dev --name {変更概要}`。`{変更概要}` は **英語 kebab-case** で簡潔に（例: `add-evaluation-comment-table`）。タイムスタンプは Prisma が付与する。
- **手動 DDL（本番 DB への直接 `ALTER` / `CREATE` 等）は禁止**。スキーマ変更は必ずマイグレーションファイル経由で行う。
- **本番適用はデプロイ時に `prisma migrate deploy`**（**暫定フロー**）。`migrate deploy` は適用のみを行い、スキーマを書き換えない（開発時の `migrate dev` を本番で使わない）。
- 開発環境（`develop`）で適用・検証してから本番（`main`）へ反映する（[`git-workflow.md`](git-workflow.md) のブランチモデルに従う）。
- 破壊的変更（列削除・型変更・NOT NULL 追加等）は段階移行（追加 → バックフィル → 切替 → 削除）を検討し、ダウンタイム・データ欠落を避ける。

> **ハーネス Issue #5（DB マイグレーション基盤）と整合**させること。基盤側の決定（CI での検証手順・適用タイミング等）が確定したら本ファイルを更新する。

## 4. seed / テスト DB

- 開発用シードは **`prisma/seed.ts`**（暫定）に置き、`prisma db seed` で投入する。冪等に書く（再実行で壊れない）。
- シードに **本番の実データ・実在の個人情報を入れない**（ダミーデータを用いる）。
- テスト DB は **docker compose**（[CLAUDE.md](../../CLAUDE.md) の `db` サービス）を用いる。テストは実本番 DB を叩かない（[`app.md`](app.md) テスト方針）。
- マイグレーションを当てた状態でテストを実行し、スキーマとコードの乖離を検出する。

## 5. バックアップ（要件 3.7）

- **`pg_dump` による定期バックアップ** + **VM スナップショット**の二重化（要件 3.7）。
- データ所在は **社内 IDC**。バックアップを含め **外部（クラウド等）へ持ち出さない**。
- リストア手順を文書化し、定期的に復元テストを行う（暫定: 運用手順は別途整備）。
- バックアップにも機微情報が含まれる。保管先のアクセス制御・暗号化方針は [`security.md`](security.md) を正とする。

## 6. トランザクション

- トランザクション境界・パターンは [`service-layer.md`](service-layer.md) を正とする（**1 業務操作 = 1 トランザクション**、境界はサービス層が所有、内部で外部 I/O を行わない）。本ファイルでは重複定義しない。

## 7. ロールバック / 前方修正（暫定）

- **前方修正（roll-forward）を基本**とする。誤ったマイグレーションは、打ち消す新規マイグレーションを追加して修正する（適用済みマイグレーションの履歴を改変しない）。
- データ欠損を伴う重大事故時のみ、§5 のバックアップからリストアする。
- 本番適用前の検証で問題を検出することを最優先とし、本番でのロールバック運用に依存しない（暫定方針。Issue #5 の基盤確定後に見直す）。

## 関連

- 命名規約（スキーマ命名の正）: [`naming-conventions.md`](naming-conventions.md)
- サービス層 / トランザクション（正）: [`service-layer.md`](service-layer.md)
- 設定 / 環境変数: [`config.md`](config.md)
- 機微情報・バックアップ保護: [`security.md`](security.md)
- アプリ規約: [`app.md`](app.md)
- PR / ブランチ運用: [`git-workflow.md`](git-workflow.md)
