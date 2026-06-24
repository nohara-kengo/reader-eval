---
description: "環境変数・設定の規約（.env.example 唯一ソース / 起動時バリデーション / 環境別・Coolify 設定）"
paths: "app/**,lib/**,features/**,.env.example,.claude/rules/**"
---

# 設定・環境変数規約

reader-eval（リーダー研修 評価システム / 内部ツール）における **設定・環境変数** の扱いを定める。
秘匿値そのものの取り扱いは security.md（後続）に準拠し、命名は [`naming-conventions.md`](naming-conventions.md) を正とする。

## 1. 基本方針

- **設定はすべて環境変数で渡す**（コードへのハードコード禁止）。値は `.env`（ローカル）/ Coolify の環境変数・シークレット（dev / 本番）から注入する。
- **`.env.example` を唯一のソース（single source of truth）** とする。新しい環境変数を導入したら **必ず `.env.example` にキーとコメント（用途）を追記**する。**値は書かない**（プレースホルダのみ）。
- `.env` / `.env.local` / `.env.production` 等の **実値ファイルは Git コミット禁止・Claude からの読み取り禁止**（[`.claude/settings.json`](../settings.json) で deny 済み。[`CLAUDE.md`](../../CLAUDE.md) 参照）。`.env.example` のみコミット対象。

```
.env.example   ← コミットする（キー + 用途コメントのみ、値なし）
.env*          ← コミット / 読み取り禁止（実値を保持）
```

## 2. 命名

- 環境変数は **`UPPER_SNAKE_CASE`**（[`naming-conventions.md`](naming-conventions.md) §6）。
- 用途が分かる名前にし、プレフィックスでグルーピングする（`AZURE_AD_*` 等）。
- 真偽値は `true` / `false` 文字列、数値は数値文字列で受け、§3 のバリデーションで型変換する。

## 3. 起動時バリデーション

> 仮決め（暫定）: **Zod で `process.env` を検証する `lib/config`（仮）** を置く。確定は ADR による。

- アプリ起動時（最初の読み込み時）に **必須キーの存在・形式を検証**し、不足・不正があれば **即座に起動を失敗させる**（fail-fast）。本番で設定不備のまま稼働しない。
- 検証済みの **型付き設定オブジェクト**を `lib/config` から公開し、各所で `process.env.XXX` を直接参照しない（参照箇所を 1 か所に集約）。
- **必須 / 任意を明示**し、任意キーには既定値を与える。秘匿値は `lib/config` から先へ広く撒かず、必要な層（`lib/auth/` 等）でのみ参照する。

```ts
// lib/config（方針イメージ・暫定 Zod）
import { z } from "zod";

const schema = z.object({
  // DB
  DATABASE_URL: z.string().url(),
  // 認証（Entra ID / M365 SSO）
  AZURE_AD_TENANT_ID: z.string().min(1),
  AZURE_AD_CLIENT_ID: z.string().min(1),
  AZURE_AD_CLIENT_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  // アプリ
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  APP_BASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// 起動時に検証（失敗時は throw して起動を止める）
export const config = schema.parse(process.env);
```

## 4. 主要キー（グルーピング）

> 用途のみ記載し、**値は載せない**。実キー名は実装時に確定（[`CLAUDE.md`](../../CLAUDE.md) の暫定キーに合わせる）。

| グループ | キー                     | 用途                                                                                       | 必須 |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------ | ---- |
| DB       | `DATABASE_URL`           | PostgreSQL 接続文字列                                                                      | ◯    |
| 認証     | `AZURE_AD_TENANT_ID`     | Entra ID テナント ID                                                                       | ◯    |
| 認証     | `AZURE_AD_CLIENT_ID`     | アプリ（クライアント）ID                                                                   | ◯    |
| 認証     | `AZURE_AD_CLIENT_SECRET` | クライアントシークレット（**秘匿**）                                                       | ◯    |
| 認証     | `AUTH_SECRET`            | セッション（JWT Cookie）暗号化シークレット（**秘匿**。`openssl rand -base64 32` 等で生成） | ◯    |
| アプリ   | `NODE_ENV`               | 実行環境（development / production / test）                                                | 任意 |
| アプリ   | `PORT`                   | 待受ポート（暫定 3000）                                                                    | 任意 |
| アプリ   | `APP_BASE_URL`           | アプリのベース URL（SSO リダイレクト等で使用）                                             | ◯    |
| ログ     | `LOG_LEVEL`              | ログ出力レベル（[`logging.md`](logging.md)）                                               | 任意 |

- **秘匿（Secret）** マーク（`AZURE_AD_CLIENT_SECRET` / `AUTH_SECRET`）の値はログ・レスポンスに出さない（[`logging.md`](logging.md) §5）。
- クライアント（ブラウザ）へ露出してよいのは公開前提の値のみ。Next.js の `NEXT_PUBLIC_` プレフィックスは **公開前提の非秘匿値に限定**し、秘匿値には絶対に付けない。

## 5. 環境別の設定（dev / 本番）と Coolify

- 環境差分（`develop` → 開発環境 / `main` → 本番環境）は **環境変数の値で吸収**する。環境別のコード分岐を増やさない。
- **Coolify** に環境変数 / シークレットを設定して各環境へ注入する:
  - 非秘匿の構成値は **環境変数**として設定。
  - 秘匿値（API キー・クライアントシークレット・`DATABASE_URL` 等）は Coolify の **シークレット**として設定し、ログ・PR・画面に残さない。
  - 新規キーを追加したら `.env.example` への追記（§1）と **dev / 本番両方の Coolify 設定**を忘れない（設定漏れは起動時バリデーション §3 で検知される）。
- 秘匿値の生成・ローテーション・配布の手順は security.md（後続）に準拠する。

## 関連

- ログ・監査（`LOG_LEVEL` / 秘匿マスキング）: [`logging.md`](logging.md)
- 命名規約（環境変数 `UPPER_SNAKE`）: [`naming-conventions.md`](naming-conventions.md)
- アプリ規約: [`app.md`](app.md)
- 全体方針 / 設定の前提: [`../../CLAUDE.md`](../../CLAUDE.md)
- 秘匿値の取り扱い: security.md（後続プランで作成予定）
