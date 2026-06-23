---
description: "構造化ログ・監査ログ・相関ID・可観測性（ヘルスチェック）の方針"
paths: "app/**,lib/**,components/**,features/**,.claude/rules/**"
---

# ログ・監査ログ・可観測性規約

reader-eval（リーダー研修 評価システム / 内部ツール）における **アプリケーションログ・監査ログ・可観測性** の方針を定める。
エラーの捕捉・変換・境界は [`error-handling.md`](error-handling.md)、レスポンス形式は [`api-response.md`](api-response.md) を正とし、本ファイルは **「何を・どこに・どう記録するか」** を扱う。

> ロガー実装は **仮決め（暫定）で `pino`**（構造化 JSON ログ）。確定は ADR による。本ファイルの方針はロガー実装に依存しない。

## 1. 基本方針

- ログは **構造化ログ（JSON）** で出力する。`message` 文字列だけに情報を埋め込まず、**フィールド（key/value）** で持たせる（検索・集計可能にする）。
- ロガーは **`lib/logger/`（仮）に集約**し、各所で直接ロガーを生成しない。`lib/` の確立済みロガー経由でのみログを出す。
- **本番コードでの `console.*` 直書きは禁止**（[`app.md`](app.md) / [`error-handling.md`](error-handling.md)）。一時的なデバッグ出力もコミットしない。ロガー（`lib/logger/`）を使う。
- 出力先は標準出力（stdout / stderr）とし、**収集はインフラ層（Docker / Coolify）に委ねる**（§6）。アプリ側でファイルローテーション等を実装しない。

## 2. ログレベル方針

| レベル | 用途 | 例 |
| --- | --- | --- |
| `error` | 想定外・即時対応が要る障害 | 未捕捉例外 / DB 障害 / 外部 API 失敗（Claude・Entra） |
| `warn` | 異常ではないが注視すべき事象 | リトライ発生 / 想定内のドメインエラーのうち頻発が問題になるもの / 非推奨経路の利用 |
| `info` | 通常運用の節目 | 起動・終了 / 主要ユースケースの完了 / 外部呼び出しの成否サマリ |
| `debug` | 開発時の詳細追跡 | 分岐・中間値（**本番では原則無効**） |

- 本番の既定レベルは **`info`**（環境変数で切替＝[`config.md`](config.md)）。`debug` は本番で常用しない。
- 想定内のドメインエラー（バリデーション・権限・not found 等）は原則 `warn` 以下。`error` は **想定外** に限定し、アラート対象を汚さない。

## 3. 共通フィールド・相関ID

### 3.1 相関ID（`x-request-id`）

- リクエスト単位の **相関ID** を発番・伝播し、**そのリクエスト中の全ログに付与**する。
- 入口（middleware / route handler / server action）で `x-request-id` ヘッダを確認し、**無ければ発番**（`crypto.randomUUID()`）、**有れば踏襲**する。レスポンスヘッダにも `x-request-id` を返す。
- サービス層・DB・外部呼び出しまで相関IDを引き回す（リクエストスコープのロガー＝子ロガーを渡す等）。1 リクエストの足跡を ID で追跡できる状態を保つ。

### 3.2 全ログ共通の推奨フィールド

| フィールド | 説明 |
| --- | --- |
| `level` / `time` / `message` | レベル / タイムスタンプ（ISO8601 / UTC） / 要約 |
| `requestId` | 相関ID（`x-request-id`） |
| `userId` | 操作主体（認証済みのみ。未認証は付与しない） |
| `route` / `method` | エンドポイント / HTTP メソッド |
| `event` | イベント種別（例: `evaluation.submit` / `external.claude.call`） |
| `durationMs` | 処理時間（外部呼び出し・主要ユースケース） |

## 4. 監査ログ（重要）

要件 **3.6 / 3.8** に対応。**「誰が・いつ・何を・どの対象に対して」** 行ったかを、アプリログとは別に確実に記録する。

### 4.1 対象操作（最低限）

- **評価入力**（作成 / 更新 / 確定 / 削除）
- **閲覧**（評価データ・参加者個人情報など、機微なデータへのアクセス）
- **エクスポート**（CSV / 帳票等の出力・ダウンロード）
- **権限・マスタ変更**（ロール付与 / 剝奪、参加者・研修・評価項目等のマスタ更新）

### 4.2 記録項目

| 項目 | 説明 |
| --- | --- |
| 誰が（`actor_id`） | 操作主体のユーザーID（Entra ID の一意識別子） |
| いつ（`occurred_at`） | 発生日時（UTC・サーバ時刻） |
| 何を（`action`） | 操作種別（`evaluation.create` / `export.csv` / `role.grant` 等の固定語彙） |
| 対象（`target_type` / `target_id`） | 対象リソース種別と識別子 |
| 結果（`result`） | `success` / `failure`（拒否・失敗も記録対象） |
| 文脈（`request_id` / `summary`） | 相関ID・補足（変更差分の要約等。**生の機微値は格納しない** §5） |

### 4.3 仮決めスキーマ（暫定）

> ORM（Prisma / Drizzle）未確定のため SQL 表現の暫定例。確定後にスキーマ定義へ移す（[`naming-conventions.md`](naming-conventions.md) の DB 命名に従う）。

```sql
-- 暫定: audit_logs（監査ログ）
CREATE TABLE audit_logs (
  id           BIGSERIAL PRIMARY KEY,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id     TEXT NOT NULL,            -- 誰が（Entra ID の oid 等）
  action       TEXT NOT NULL,            -- 何を（固定語彙）
  target_type  TEXT,                     -- 対象種別（evaluation / participant / role ...）
  target_id    TEXT,                     -- 対象識別子
  result       TEXT NOT NULL,            -- success / failure
  request_id   TEXT,                     -- 相関ID（x-request-id）
  summary      TEXT,                     -- 補足（機微な生値は入れない）
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs (target_type, target_id);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs (occurred_at);
```

### 4.4 書き込み方針

- 監査記録は **サービス層**（[`service-layer.md`](service-layer.md)）で行う。対象操作の **業務トランザクションと同一トランザクション内**で書き込み、操作成功と監査記録の整合を担保する（部分コミット禁止）。
- 失敗・拒否（権限不足での弾き等）も `result: failure` で記録する。
- アプリログ（§1〜§3）と監査ログは **別系統**。アプリログが消えても監査ログは DB に残す。

### 4.5 改ざん防止・保持期間（暫定）

- 監査ログは **追記のみ（append-only）**。アプリケーション経路からの **更新 / 削除を禁止**する（運用上の権限分離を ADR で確定）。
- 保持期間は **暫定 1 年**（要件・社内規程に合わせて確定）。期限経過分の取り扱い（アーカイブ / 削除）は ADR で決める。
- 改ざん検知（ハッシュ連鎖等）の要否は将来課題。まずは append-only と権限分離で担保する。

## 5. 秘匿情報・個人情報の扱い

- 秘匿情報・個人情報・スタックトレース等は **レスポンス・画面に出さず**、必要なものは **ログにのみ** 残す（[`error-handling.md`](error-handling.md) §5 / [`api-response.md`](api-response.md) §4 と連携）。
- ただし **ログにも生の機微情報を残さない**。以下はマスキング / 除外する:
  - 認証情報（API キー・トークン・`AZURE_AD_CLIENT_SECRET` 等）
  - 評価対象者の個人情報の生値（氏名等は必要に応じ ID で代替）、評価の具体内容の本文
  - Claude へ渡す / から返るプロンプト本文の機微部分（[`app.md`](app.md) のマスキング方針に従う）
- ロガー側に **共通の秘匿フィールド・マスキング（redaction）** を設定し、各所のログ呼び出しに依存しない仕組みで防ぐ。

## 6. 可観測性

### 6.1 ヘルスチェック

- **`/api/health`** を提供する。アプリの稼働に加え **DB 疎通**（軽量な `SELECT 1` 等）を確認する。
- 正常時 `200`、依存不良時は非 `2xx`（例: `503`）を返す。**内部詳細をレスポンスに含めない**（[`api-response.md`](api-response.md) §4）。Coolify / Cloudflare 側のヘルス監視に用いる。

### 6.2 メトリクス

- 定量メトリクス（リクエスト数 / レイテンシ / エラー率等）の収集は **将来課題**。まずは構造化ログ（`durationMs` 等）から事後集計できる形にしておく。

### 6.3 Docker / Coolify でのログ運用

- アプリは stdout / stderr に出力し、収集・保管は **Docker / Coolify のログ機構**に委ねる。
- 本番のログレベルは環境変数で制御する（[`config.md`](config.md)）。
- 監査ログ（§4）はインフラログとは別に **DB に保持**する（インフラログの保持ポリシーに左右されない）。

## 関連

- エラーハンドリング: [`error-handling.md`](error-handling.md)
- API / エラー形式: [`api-response.md`](api-response.md)
- サービス層 / トランザクション: [`service-layer.md`](service-layer.md)
- 設定・環境変数: [`config.md`](config.md)
- 命名規約（DB / 環境変数）: [`naming-conventions.md`](naming-conventions.md)
- アプリ規約: [`app.md`](app.md)
