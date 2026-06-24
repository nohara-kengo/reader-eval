# シーケンス図 — Issue #31（M365 Entra ID SSO ログイン + 空ダッシュボード）

ライブラリ: **Auth.js（NextAuth v5）+ Microsoft Entra ID プロバイダ**。セッションは暗号化 Cookie（JWT 戦略）、検証はサーバ側のみ。

## アクター

- ユーザー（社員）
- ブラウザ
- middleware（`middleware.ts` / 認証ガード）
- Server Component（`app/dashboard/page.tsx` 等）
- Auth.js route handler（`app/api/auth/[...nextauth]/route.ts`）
- lib（`lib/auth/` 認証設定・セッション取得）
- Entra ID（M365 SSO / OIDC 認可サーバ）

## メイン: 未認証 → SSO ログイン → ダッシュボード表示

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant B as ブラウザ
    participant M as middleware
    participant P as Server Component (/dashboard)
    participant H as Auth.js handler (/api/auth/*)
    participant L as lib/auth
    participant E as Entra ID (OIDC)

    U->>B: /dashboard へアクセス
    B->>M: GET /dashboard
    M->>L: auth() でセッション検証
    L-->>M: 未認証（session=null）
    M-->>B: 302 /login へリダイレクト
    B->>P: GET /login
    P-->>B: ログイン画面（「Microsoft でサインイン」）
    U->>B: サインイン押下
    B->>H: GET /api/auth/signin/microsoft-entra-id
    H->>E: 302 認可リクエスト（authorization code + state/PKCE）
    E-->>B: Microsoft ログイン画面
    U->>E: 資格情報入力・同意
    E-->>B: 302 /api/auth/callback/...（code）
    B->>H: GET /api/auth/callback/...（code, state）
    H->>E: コードをトークンへ交換（サーバ側）
    E-->>H: ID トークン / アクセストークン
    H->>L: クレーム検証・セッション（JWT Cookie）発行
    L-->>H: Set-Cookie（httpOnly/Secure/SameSite）
    H-->>B: 302 /dashboard
    B->>M: GET /dashboard（Cookie 付き）
    M->>L: auth() でセッション検証
    L-->>M: 認証済み（session 有）
    M-->>P: 通過
    P->>L: auth() で表示用クレーム取得
    L-->>P: session
    P-->>B: ダッシュボード（空のプレースホルダ）
```

## サインアウト

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant B as ブラウザ
    participant H as Auth.js handler
    participant L as lib/auth

    U->>B: サインアウト押下
    B->>H: POST /api/auth/signout（CSRF トークン付き）
    H->>L: セッション破棄（Cookie 失効）
    L-->>H: Set-Cookie（expired）
    H-->>B: 302 /login
```

## エラー経路

- **未認証で保護ルート**: middleware が 302 で `/login` へ（401 ボディは返さず UI 誘導）。
- **コールバック失敗 / state 不一致 / トークン交換失敗**: Auth.js のエラーページ（`/api/auth/error`）または `/login?error=...` へ誘導。文言は技術詳細を出さない（`error-message.md` §3.4）。詳細はサーバログのみ（`logging.md` §5）。
- **設定不備（env 欠落）**: 起動時バリデーションで fail-fast（`config.md` §3）。
- **相関 ID**: 入口で `x-request-id` を発番/踏襲しログに付与（`logging.md` §3.1）。

```

```
