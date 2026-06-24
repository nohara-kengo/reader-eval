# 認証セットアップ（M365 / Microsoft Entra ID SSO）

reader-eval のログインは **Auth.js（NextAuth v5）+ Microsoft Entra ID プロバイダ**で実装している（実装: [`lib/auth/`](../../lib/auth/) / 規約: [`app.md`](../../.claude/rules/app.md) §認証）。本書は **Entra アプリ登録と環境変数の設定手順**をまとめる。組織の M365（Entra ID）は利用可能である前提とする。

> 秘匿値（クライアントシークレット・`AUTH_SECRET`）は `.env`（ローカル）/ Coolify のシークレットにのみ保持し、**コミット・ログ・画面に出さない**（[`security.md`](../../.claude/rules/security.md) §3 / [`config.md`](../../.claude/rules/config.md)）。

## 1. Entra ID アプリ登録

Microsoft Entra 管理センター（または Azure ポータル）の「アプリの登録」で新規登録する。

1. **アプリの登録** → 名前（例: `reader-eval`）。サポートされるアカウントの種類は **この組織ディレクトリのみ（単一テナント）**。
2. **リダイレクト URI**（プラットフォーム = Web）を環境ごとに登録する。Auth.js のコールバックパスは `/api/auth/callback/microsoft-entra-id`:
   - 開発: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
   - 開発環境（develop）: `https://<dev ドメイン>/api/auth/callback/microsoft-entra-id`
   - 本番（main）: `https://<本番ドメイン>/api/auth/callback/microsoft-entra-id`
3. **証明書とシークレット** → 新しいクライアントシークレットを発行し、値を控える（**作成直後しか表示されない**）。
4. **API のアクセス許可**: 既定の `openid` / `profile` / `email`（OIDC）で足りる。組織ポリシーに応じて管理者同意を付与する。
5. 控える値:
   - **ディレクトリ（テナント）ID** → `AZURE_AD_TENANT_ID`
   - **アプリケーション（クライアント）ID** → `AZURE_AD_CLIENT_ID`
   - **クライアントシークレット値** → `AZURE_AD_CLIENT_SECRET`

## 2. 環境変数

`.env`（ローカルは [`.env.example`](../../.env.example) をコピー）/ Coolify シークレットに設定する。

| キー                     | 用途                                     | 秘匿 |
| ------------------------ | ---------------------------------------- | ---- |
| `AZURE_AD_TENANT_ID`     | ディレクトリ（テナント）ID               |      |
| `AZURE_AD_CLIENT_ID`     | アプリ（クライアント）ID                 |      |
| `AZURE_AD_CLIENT_SECRET` | クライアントシークレット                 | ◯    |
| `AUTH_SECRET`            | セッション（JWT Cookie）暗号化鍵         | ◯    |
| `APP_BASE_URL`           | アプリのベース URL（リダイレクト整合用） |      |

`AUTH_SECRET` の生成:

```bash
openssl rand -base64 32
```

> issuer はテナント ID から `https://login.microsoftonline.com/<tenant>/v2.0` を自動生成する（[`lib/auth/config.ts`](../../lib/auth/config.ts) `entraIssuer`）。

## 3. 起動時 fail-fast

本番（`NODE_ENV=production`）では起動時に認証 env を検証し、欠落・不正があれば**起動を停止**する（[`instrumentation.ts`](../../instrumentation.ts) → `parseAuthEnv`。[`config.md`](../../.claude/rules/config.md) §3）。設定不備のまま本番稼働しない。開発時（`development`）は検証をスキップし、未設定でもアプリ自体は起動できる（サインイン操作時に Auth.js がエラーになる）。

## 4. `trustHost` の前提

`lib/auth` は `trustHost: true` を設定している。これは `Host` / `X-Forwarded-*` ヘッダを信頼する設定であり、**信頼できるリバースプロキシ配下（Coolify / Cloudflare Tunnel）でのみ安全**である。アプリを生のインターネットへ直接公開せず、必ずトンネル/プロキシ経由で TLS 終端・特定ポート公開とする（[`security.md`](../../.claude/rules/security.md) §4）。

## 5. ローカルでの確認

```bash
# 認証 env（ダミー可。実ログインには実値が必要）と AUTH_SECRET を設定して起動
npm run build && npm start

# 未認証で保護ルートへ → /login へ 307 リダイレクト
curl -s -o /dev/null -w "%{http_code} %header{location}\n" http://localhost:3000/dashboard

# Auth.js のプロバイダ登録確認
curl -s http://localhost:3000/api/auth/providers
```

実テナントの資格情報を投入し、ブラウザで `/login` →「Microsoft でサインイン」→ 同意 → `/dashboard` 遷移、サインアウトまでを**ステージングで人手確認**する（実ログインのライブ確認はこの手順で実施する）。

## 関連

- 認証実装: [`lib/auth/`](../../lib/auth/) / ログイン画面 [`app/login/page.tsx`](../../app/login/page.tsx) / ダッシュボード [`app/dashboard/page.tsx`](../../app/dashboard/page.tsx)
- 認可・RBAC（後続）: [`authz.md`](../../.claude/rules/authz.md)
- 設定・環境変数: [`config.md`](../../.claude/rules/config.md) / セキュリティ: [`security.md`](../../.claude/rules/security.md)
- 設計: [`docs/design/31/`](../design/31/)
