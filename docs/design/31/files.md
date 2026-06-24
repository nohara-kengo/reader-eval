# 修正・追加予定ファイル — Issue #31

ライブラリ: Auth.js（NextAuth v5）+ Microsoft Entra ID。認証は `lib/auth/` に集約し、route handler / middleware は薄く保つ。

## 追加

| パス                                  | 種別          | 概要                                                                                                                                                                      |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/auth/index.ts`                   | lib           | `NextAuth({ providers: [MicrosoftEntraID(...)], session, callbacks })` を構成し `{ handlers, auth, signIn, signOut }` を export。設定値は `lib/auth/config.ts` 経由で注入 |
| `lib/auth/config.ts`                  | lib           | Entra 設定（tenantId / clientId / clientSecret / issuer / AUTH_SECRET）の env 読み出し + Zod 検証（`config.md` §3。fail-fast）                                            |
| `lib/auth/session.ts`                 | lib           | `getSession()` / `requireSession()`（未認証は判定のみ。HTTP 変換は呼び出し側）。`authz.md` の既定拒否方針                                                                 |
| `lib/auth/index.test.ts`              | Test          | セッション判定・コールバックの単体テスト（Entra はモック、実 API を叩かない）                                                                                             |
| `lib/auth/session.test.ts`            | Test          | `requireSession` の正常 / 未認証分岐                                                                                                                                      |
| `app/api/auth/[...nextauth]/route.ts` | route handler | `export const { GET, POST } = handlers`（Auth.js 規約。ロジックを持たない）                                                                                               |
| `middleware.ts`                       | middleware    | `/dashboard` 配下を保護。未認証は `/login` へリダイレクト（`matcher` で対象限定）                                                                                         |
| `app/login/page.tsx`                  | Page (SSR)    | ログイン画面。「Microsoft でサインイン」導線（`signIn("microsoft-entra-id")`）。認証済みなら `/dashboard` へ                                                              |
| `app/login/page.test.tsx`             | Test          | サインイン導線の表示・認証済みリダイレクトの分岐（auth をモック）                                                                                                         |
| `app/dashboard/page.tsx`              | Page (SSR)    | 認証済みホーム。**空のプレースホルダ**（ログイン済みが分かる最小表示 + サインアウト導線）                                                                                 |
| `app/dashboard/page.test.tsx`         | Test          | 認証済み=表示 / 未認証=リダイレクト（auth をモック）                                                                                                                      |
| `components/auth/SignOutButton.tsx`   | Component     | サインアウト用クライアントボタン（`signOut()`）。2 機能目で使うまでは `app/dashboard` 内配置でも可                                                                        |
| `docs/design/31/*`                    | Docs          | 本設計成果物（sequence / flow / acceptance / files）                                                                                                                      |

## 変更

| パス                      | 種別   | 概要                                                                                                                                                                                      |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`            | 依存   | `next-auth@5`（Auth.js）を追加。`AUTH_SECRET` 等の前提を反映                                                                                                                              |
| `.env.example`            | 設定   | `AUTH_SECRET`（セッション暗号化鍵）、必要なら `AUTH_MICROSOFT_ENTRA_ID_ISSUER` を追記。既存の `AZURE_AD_*` とのキー名整合を `config.md` に合わせ確定（命名は `naming-conventions.md` §6） |
| `app/layout.tsx`          | Layout | 必要に応じてセッション前提の調整（最小限）                                                                                                                                                |
| `CLAUDE.md` / `README.md` | Docs   | 認証セットアップ手順（Entra アプリ登録の前提・env）を追記                                                                                                                                 |

## 削除

（なし）

## 補足・要確認

- **env キー名の整合**: 既存 `.env.example` は `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET`。Auth.js の Entra プロバイダ規約（`AUTH_MICROSOFT_ENTRA_ID_*`）と既存キーのどちらを正にするか実装時に統一する（`config.md` の主要キー表も更新）。
- **前提（ブロッカー）**: Entra アプリ登録（リダイレクト URI `${APP_BASE_URL}/api/auth/callback/microsoft-entra-id` を含む）と実資格情報。未確定の「M365 SSO 利用可否」（要件 6章）の確定後に実ログイン検証が可能。
- DB（Prisma）への user/セッション永続化は本 Issue では行わない（JWT Cookie セッション）。DB アダプタ採用は後続 Issue で検討。

```

```
