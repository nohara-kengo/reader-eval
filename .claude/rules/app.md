# アプリケーション規約（Next.js App Router / TypeScript / Tailwind / PostgreSQL / Claude）

reader-eval は **Next.js（App Router）フルスタック1本** の構成。UI は SSR（Server Components 中心）、API は同一アプリ内の **route handlers（`app/api/...`）/ server actions** で実装する。**独立したバックエンドサービス（Express / Nest 等）は持たない。**

## 技術スタック

- **言語**: TypeScript（strict）、Node.js 22
- **フレームワーク**: Next.js（App Router）
- **スタイル**: Tailwind CSS のみ
- **DB**: PostgreSQL。ORM / マイグレーションは Prisma か Drizzle を **ADR で選定予定（未確定）**。決定までは ADR を正とする
- **AI**: Claude（Anthropic API、`@anthropic-ai/sdk`、既定 `claude-opus-4-8`）。**Next.js のサーバ側からのみ**呼ぶ
- **認証**: M365 Entra ID（SSO）
- **テスト**: Vitest

## ディレクトリ方針

```
app/
├── (各ルート)/            # UI: ページ / レイアウト（Server Components 中心）
│   ├── page.tsx
│   └── layout.tsx
└── api/
    └── <resource>/route.ts   # route handlers（API 層）

lib/                          # ドメイン・サービス・各種クライアント
├── db/                       # DB クライアント / クエリ（Prisma or Drizzle）
├── claude/                   # Anthropic クライアント / プロンプト / マスキング
├── auth/                     # Entra ID 認証クライアント / セッション
└── shared/                   # 機能横断の汎用ロジック（shared.md 参照）

components/                   # 汎用 UI コンポーネント
features/
└── <feature>/               # 機能単位（components / hooks / api クライアント / types / server）
    ├── components/
    ├── hooks/
    ├── server/              # その機能の server action / サービス
    └── types.ts
```

- 新規実装は **`features/<feature>/`** で開始する
- ドメインロジック・外部サービス連携（DB / Claude / Entra）は `lib/` または `features/<feature>/server/` に置き、UI コンポーネントに直書きしない

## データ取得・更新

- **読み取り**: Server Components から `lib/` のサービス / DB クエリを直接呼ぶ。クライアントへ DB 接続を露出しない
- **書き込み / 変更**: **server actions** または **route handlers**（`app/api/...`）で行う
- **外部公開・他クライアント連携が必要な API** のみ route handler を切る。画面内のフォーム送信は server action を優先
- クライアントから `fetch` を直書きせず、機能単位の API クライアント（`features/<feature>/`）に集約する

## UI 層と API 層（route handlers / server actions）の責務分離

- **UI 層（`app/`・`components/`・`features/*/components/`）**: 表示とユーザー操作のみ。ビジネスロジックを持たない
- **API 層（route handlers / server actions）**: 入力検証 → ドメインサービス呼び出し → 結果整形。**薄く保つ**。ロジックは `lib/` / `features/*/server/` のサービスに分離する
- Entity / DB 行をそのまま外に出さず、必要な形（DTO 相当の型）に整形して返す

## フォーム / バリデーション

- フォームは React Hook Form + Zod 等の利用を推奨する（**具体的な選定はチームに委ねる**）
- **サーバ側検証を正**とする。server action / route handler の入口で必ず検証する（推奨: Zod スキーマ）
- クライアント側検証は **UX 補助**（即時フィードバック・submit 制御）に留め、サーバ検証を置き換えない

## スタイル

- **Tailwind CSS のユーティリティクラスのみ**で統一する
- CSS Module / CSS-in-JS / 外部 CSS フレームワークは持ち込まない
- インラインスタイル（`style={{ ... }}`）は Tailwind で書きづらい場面のみ最小限
- 独自テーマ・色は `tailwind.config.ts` の拡張範囲に留める

## TypeScript / コーディング

- **strict**。`any` 禁止（不明型は `unknown` + ナローイング）、`var` 禁止（`const` / `let`）
- enum は文字列ユニオン型 / `as const` を優先
- 関数コンポーネント + hooks。クラスコンポーネント禁止
- `useEffect` の依存配列を網羅（`react-hooks/exhaustive-deps` を尊重）
- イベントハンドラ命名: `handle<Event>`（`handleSubmit` / `handleClick`）
- ガード節で早期リターン、ネストを浅く。マジックナンバーは定数化
- **コメントは日本語**

## Claude（Anthropic API）連携

- Anthropic クライアントは `lib/claude/` に集約し、**サーバ側からのみ**呼ぶ（API キーをクライアントへ露出しない）
- 既定モデルは `claude-opus-4-8`
- **機微情報はマスキング**してからプロンプトに渡す（評価対象者の個人情報等）
- 外部 API 呼び出しはタイムアウト・エラーハンドリングを必須にする

## 認証（Entra ID）

- M365 Entra ID（SSO）。認証クライアント / セッション処理は `lib/auth/` に集約
- トークン検証はサーバ側で行う。route handler / server action は認可を必須にする

## テスト（Vitest）

```bash
npm test                       # 全テスト
npm test -- features/score/ScoreForm.test.tsx   # 特定ファイル
```

- **1 受け入れ条件 = 1 テスト**（最低限）
- 正常系 + 異常系 + Edge ケースを網羅
- 外部依存（DB / Claude / Entra）はモックする（実 API を叩かない）
- テスト名は日本語可

## 開発コマンド

```bash
docker compose up -d   # 依存（PostgreSQL 等）起動
npm run dev            # 開発サーバ
npm test               # テスト
npm run lint           # ESLint
npm run format         # Prettier 適用
npm run typecheck      # 型チェック
npm run build          # 本番ビルド
```

PR 作成前に lint / typecheck / test / build をすべて通すこと。

## インフラ / デプロイ（前提）

- 社内 IDC（オンプレ）、Docker + Coolify。外部公開は Cloudflare Tunnel
- デプロイは Coolify CI/CD: `main` → 本番 / `develop` → 開発

## 禁止事項

- 独立したバックエンドサービス（Express / Nest 等）の導入
- Anthropic API キー / Entra シークレットのクライアント露出、機微情報の未マスキング送信
- `any` 型 / `var`
- UI コンポーネントへの `fetch` 直書き・ビジネスロジック直書き
- Server Component / クライアントへの DB 接続・シークレットの露出
- 本番コードでの `console.log` 残留
- Bootstrap 等 Tailwind 以外の CSS フレームワーク / CSS Module / CSS-in-JS
- `.env` / シークレット類のコミット・読み取り
- `dangerouslySetInnerHTML` の安易な使用

## 関連

- 共通化・パーツ化: [`shared.md`](shared.md)
- 命名規約: [`naming-conventions.md`](naming-conventions.md)
- PR 運用: [`git-workflow.md`](git-workflow.md)
