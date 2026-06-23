---
description: "セキュリティ規約（機微情報の分類・Claude 送信前のマスキング/匿名化・シークレット管理・通信・入力サニタイズ・依存脆弱性）"
paths: "app/**,lib/**,components/**,features/**,.claude/rules/**"
---

# セキュリティ規約

reader-eval（リーダー研修 評価システム）における **機微情報の取り扱い・シークレット管理・通信・入力サニタイズ・依存脆弱性** の方針を定める。
**評価情報は機微情報** であり、データ所在は **社内 IDC（オンプレ）に閉じ、外部へ出さない**ことを大前提とする。

## 1. 機微情報の分類

| 区分 | 内容（例） | 取り扱い |
| --- | --- | --- |
| 機微（高） | 評価情報（スコア・評価コメント・360°評価の入力内容・集計結果）、人事考課に関わる情報 | 社内 IDC に閉じる。最小権限で扱う（[`authz.md`](authz.md)）。Claude 送信時は §2 のマスキング必須 |
| 個人特定情報（PII） | 氏名・所属・社員 ID・メールアドレス・役職等 | 外部送信前に除去 / 匿名化（§2）。ログ・レスポンスへの不要な露出を避ける |
| シークレット | API キー・クライアントシークレット・接続文字列・トークン | §3。コミット禁止・クライアント露出禁止 |
| 公開可 | 画面ラベル・マスタの一般項目名等 | 通常の取り扱い |

- **評価情報は機微** として扱い、データは **社内 IDC（オンプレ）から外部に出さない**。外部 SaaS への保存・転送をしない（Claude API への送信は §2 のマスキングを前提に必要最小限のみ）。
- 不要な機微情報を画面・ログ・レスポンスに載せない（[`api-response.md`](api-response.md) §4 / [`error-handling.md`](error-handling.md) §5）。

## 2. Claude（Anthropic API）送信前のマスキング / 匿名化

> **本ファイルがマスキング方針の「正」。** 具体的な実装・プロンプト設計は `ai.md`（後続）と連携するが、**何を除去し何を送ってよいか** は本ファイルを基準とする。

- Claude へは **必要最小限のテキストのみ** を送信する。判断・処理に不要な情報は送らない。
- 送信前に **個人特定情報（氏名・所属・社員 ID・メールアドレス・役職・固有名詞 等）を除去 / 匿名化** する。評価対象者・評価者が誰であるかを推測できる情報を残さない。
- **マスキング層を `lib/claude/` に置く**（[`app.md`](app.md) §Claude 連携 / [`shared.md`](shared.md) §3）。Anthropic クライアント呼び出しは **必ずマスキング層を経由** させ、生の機微情報を直接プロンプトに渡さない。
- 360°評価では **匿名性を破らない**（[`authz.md`](authz.md) §6）。入力者を特定し得る形で本文を送らない。
- 送信内容（プロンプト）に **シークレット・内部識別子・他者の評価** を混入させない。
- マスキングは **サーバ側でのみ** 行う（Claude 呼び出し自体がサーバ側限定。API キーをクライアントへ露出しない）。

```ts
// lib/claude/masking.ts（方針イメージ）
// 個人特定情報を除去・匿名化してからプロンプトへ渡す。生データを直接送らない
export function maskForPrompt(text: string, ctx: MaskContext): string {
  // 氏名 / 所属 / 社員 ID / メール 等を除去・プレースホルダ化
}
```

```ts
// lib/claude/client.ts（方針イメージ）
// クライアント呼び出しは必ずマスキング層を経由
const masked = maskForPrompt(rawInput, ctx);
const res = await anthropic.messages.create({ model: ANTHROPIC_MODEL, ... });
```

- 失敗時の文言・ログ方針は [`error-message.md`](error-message.md) §3.5 / [`error-handling.md`](error-handling.md) §6 に従う（内部事情をユーザーへ出さない）。

## 3. シークレット管理

- API キー・クライアントシークレット・接続文字列・トークンは **Coolify の環境変数で保持** する（[`app.md`](app.md) §インフラ）。
- **`.env*` はコミット禁止・読み取り禁止**（[`.claude/settings.json`](../settings.json) の deny 済み / CLAUDE.md §環境変数）。`.env.example` にはキー名のみ置き、実値を書かない。
- シークレットは **クライアント（ブラウザ）へ露出しない**。`NEXT_PUBLIC_` 接頭辞にシークレットを入れない。Anthropic API キー / Entra クライアントシークレットはサーバ側のみで参照する（[`app.md`](app.md) §禁止事項）。
- シークレットを **コード・ログ・エラーレスポンス・コミット履歴に残さない**。誤って混入した場合はローテーション（再発行）する。
- 環境変数名は `UPPER_SNAKE_CASE`（[`naming-conventions.md`](naming-conventions.md) §6）。

## 4. 通信・公開経路

- 通信は **TLS** を用いる（HTTP 平文での機微情報送受信をしない）。
- 外部公開は **Cloudflare Tunnel 経由のみ**（特定ポートのみ公開）。アプリ / DB を直接インターネットへ公開しない（[`app.md`](app.md) §インフラ）。
- DB（PostgreSQL）等のバックエンドは社内ネットワーク内に閉じ、外部から到達不可にする。

## 5. 入力サニタイズ / Web アプリ脆弱性対策

- **入力検証はサーバ側を正**とする（[`app.md`](app.md) §フォーム / [`api-response.md`](api-response.md)）。route handler / server action の入口で必ず検証する（推奨: Zod）。
- **XSS**: `dangerouslySetInnerHTML` は **原則禁止**（[`app.md`](app.md) §禁止事項）。やむを得ず使う場合はサニタイズ（許可リスト方式）を必須とし、レビューで根拠を明示する。出力は React の標準エスケープに任せる。
- **CSRF**: 変更系は **server actions（同一オリジン）** を基本とする（[`app.md`](app.md) §データ取得・更新）。外部公開 route handler を作る場合は同一オリジン / トークン検証で保護する。
- **認証・認可必須**: すべての変更系・機微情報アクセスは認証・認可を通す（[`authz.md`](authz.md) §4）。
- **SQL インジェクション**: 生 SQL 文字列連結をしない。ORM（Prisma / Drizzle、ADR 選定後）のパラメータ化クエリを用いる。
- **オープンリダイレクト / SSRF**: 外部から渡る URL を検証せずにリダイレクト・サーバ側リクエストへ用いない。
- エラーレスポンスに内部情報（スタックトレース・SQL・テーブル名）を載せない（[`api-response.md`](api-response.md) §4 / [`error-handling.md`](error-handling.md)）。

## 6. 依存脆弱性管理

- 依存パッケージの脆弱性を定期的に点検する: **`npm audit`**（CI / 定期）と **Dependabot**（自動 PR）を併用する。
- 重大度の高い脆弱性は優先的に解消する。依存更新は **`chore/` ブランチ** で機能変更と分けて行う（[`git-workflow.md`](git-workflow.md)）。
- ロックファイル（`package-lock.json`）をコミットし、再現性を保つ。

## 7. 禁止事項

- 評価情報・PII を **マスキングせず Claude へ送信** する / 不要なテキストを送る。
- マスキング層（`lib/claude/`）を経由せず生データをプロンプトに渡す。
- シークレットのコミット・ログ / レスポンス出力・クライアント露出（`NEXT_PUBLIC_` への格納を含む）。
- `.env*` のコミット / 読み取り。
- `dangerouslySetInnerHTML` の安易な使用、サニタイズ無しの HTML 挿入。
- 生 SQL 文字列連結、認証 / 認可を省いた機微情報アクセス。
- アプリ / DB のインターネット直公開（Cloudflare Tunnel + 特定ポート以外での公開）。

## 8. 関連

- 認可・RBAC / 匿名性: [`authz.md`](authz.md)
- アプリ規約 / Claude 連携 / インフラ: [`app.md`](app.md)
- エラーハンドリング / ログ: [`error-handling.md`](error-handling.md)
- API / エラー形式（内部情報の非露出）: [`api-response.md`](api-response.md)
- 設定（deny 済みパス）: [`.claude/settings.json`](../settings.json)
