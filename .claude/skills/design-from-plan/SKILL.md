---
name: design-from-plan
description: plan（自然言語の要望 / Issue 本文 / 議事録）を入力に、シーケンス図・フロー図・受け入れ条件・修正予定ファイル一覧を docs/design/<issue>/ に生成する。Next.js（App Router）/ route handlers / lib 前提。
---

# Design from Plan スキル（reader-eval）

plan（自然言語の要望 / Issue 本文 / 議事録 / 要件定義書の抜粋）を入力として受け取り、標準設計成果物を生成する。

設計成果物は **`docs/design/<issue番号>/`** に配置する。

## 入力

- `$ARGUMENTS`: Issue 番号 または plan のテキスト
  - 数値のみ → Issue 本文を取得して plan として扱う（取得は gh があれば `gh issue view`、無ければ REST API(curl)）
  - テキスト → 直接 plan として扱う（出力先 Issue 番号は対話で確認）

Issue 取得（gh が無い場合の例）:

```bash
curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/OWNER/REPO/issues/<n>" | jq -r '.title, .body'
```

## 出力

`docs/design/<issue番号>/` に以下 4 ファイルを生成:

| ファイル | 内容 |
| --- | --- |
| `sequence.md` | シーケンス図（Mermaid `sequenceDiagram`）。ユーザー / ブラウザ / Next.js Server Component / route handler / lib / DB / Claude API / Entra ID の相互作用 |
| `flow.md` | フロー図（Mermaid `flowchart`）。状態遷移 / エラー分岐 |
| `acceptance.md` | 受け入れ条件（人手確認 / AI 自動チェック の両軸） |
| `files.md` | 修正・追加予定ファイル一覧（パス / 種別 / 概要） |

## ワークフロー

### 1. plan の取り込み

- Issue 番号が渡された場合: 上記の方法で本文 + コメントを取得
- テキスト直渡しの場合: そのまま使用、出力先 Issue 番号をユーザーに確認

### 2. 既存コードの読み取り

plan の対象範囲を特定するため:

- UI（SSR）: 対象 `app/**/page.tsx` / `layout.tsx` / コンポーネント
- API: 対象 `app/api/**/route.ts`
- ロジック / 外部連携: `lib/`（DB アクセス、`@anthropic-ai/sdk` 呼び出し、Entra 認証ユーティリティ、集計ロジック等）
- データモデル: Prisma なら `prisma/schema.prisma`、Drizzle なら `lib/db/schema.ts`
- 既存テスト: `**/*.test.ts` / `**/*.test.tsx`、`e2e/`（Playwright）
- 実装未着手なら `docs/requirements/要件定義書.md`（正本）/ `docs/design/` を参照

### 3. 設計成果物の生成

#### `sequence.md`（テンプレ）

```markdown
# シーケンス図 — Issue #<n>

## アクター

- ユーザー（評価者 / 被評価者 / 人事考課委員会）
- ブラウザ
- Next.js Server Component / Page（SSR）
- route handler（`app/api/.../route.ts`）
- lib（DB アクセス / 認証 / 集計 / Claude SDK ラッパ）
- Entra ID（M365 SSO）
- Claude API（`@anthropic-ai/sdk`）
- DB（PostgreSQL）

## メイン

\`\`\`mermaid
sequenceDiagram
    participant U as 評価者
    participant B as ブラウザ
    participant P as Server Component (SSR)
    participant H as route handler (/api/...)
    participant L as lib
    participant E as Entra ID
    participant AI as Claude API
    participant D as DB (PostgreSQL)

    U->>B: 操作
    B->>P: ページ要求
    P->>E: セッション検証
    E-->>P: クレーム
    P->>H: POST /api/...（または Server Action）
    H->>L: 入力検証 + 業務ロジック
    L->>D: クエリ / 更新
    D-->>L: 結果
    L->>AI: messages.create（評価コメント生成 等）
    AI-->>L: 応答
    L-->>H: 結果
    H-->>P: 200 / 4xx
    P-->>B: SSR HTML
\`\`\`

## エラー経路

（未認証 401 / 入力不正 422 / DB 失敗 / Claude API タイムアウト・レート制限のリトライと補償）
```

#### `flow.md`（テンプレ）

```markdown
# フロー図 — Issue #<n>

\`\`\`mermaid
flowchart TD
    Start([開始]) --> Auth{Entra ID セッション検証}
    Auth -->|OK| Validate{入力検証}
    Auth -->|NG| Err401[401 返却 / ログイン誘導]
    Validate -->|OK| Persist[DB 永続化]
    Validate -->|NG| Err422[422 返却]
    Persist --> AI{Claude 連携あり?}
    AI -->|あり| Call[Claude API 呼び出し]
    AI -->|なし| Done([完了])
    Call --> Done
    Call -.失敗.-> Fallback[フォールバック / 再試行]
\`\`\`
```

#### `acceptance.md`（テンプレ）

```markdown
# 受け入れ条件 — Issue #<n>

## 想定シナリオ

1 Issue = 1 シナリオ。1 受け入れ条件 = 1 テスト。

## 人手確認項目

- [ ] 画面の表示・遷移（SSR / Entra ID ログインフロー）
- [ ] エラーメッセージの文言と表示位置
- [ ] 評価入力 / 集計結果の妥当性
- [ ] Claude 生成内容の妥当性（該当時）
- [ ] 人事考課委員会向け出力の体裁（該当時）

## AI 自動チェック項目

- [ ] `npm test -- <対象パス>` 緑（正常 + 異常 + Edge）
- [ ] `npm test` 全体緑
- [ ] `npm run typecheck` 0 error
- [ ] `npm run lint` 0 違反
- [ ] `npm run build` 成功
- [ ] （該当時）`npm run test:e2e` 緑
```

#### `files.md`（テンプレ）

```markdown
# 修正・追加予定ファイル — Issue #<n>

## 追加

| パス | 種別 | 概要 |
| --- | --- | --- |
| `app/<feature>/page.tsx` | Page (SSR) | 〜の画面 |
| `app/api/<feature>/route.ts` | route handler | 〜の API |
| `app/api/<feature>/route.test.ts` | Test | route handler の Vitest |
| `lib/<feature>/xxx.ts` | lib | 業務ロジック / 外部連携 |
| `lib/<feature>/xxx.test.ts` | Test | lib の Vitest |
| `components/<feature>/Xxx.tsx` | Component | UI 部品 |
| `prisma/schema.prisma` または `lib/db/schema.ts` | スキーマ | テーブル / カラム追加（採用ツールに合わせる） |

## 変更

| パス | 種別 | 概要 |
| --- | --- | --- |
| `app/<feature>/page.tsx` | Page | 表示項目追加 |
| `lib/auth.ts` | lib | 認可ロジック調整 |

## 削除

（なし）
```

### 4. ユーザーレビュー

- 4 ファイルを提示し、合意を得る
- 修正があれば反映
- 合意後に `tdd-implement` スキルへ受け渡す

## 注意事項

- Mermaid のシンタックスエラーに注意（特に `sequenceDiagram` の `note` / `alt` / `loop`、ノードラベル内の記号）
- 受け入れ条件は **人手 / AI の両軸** を必ず含める
- DB は Prisma / Drizzle 未確定。スキーマファイルのパスは採用ツールに合わせて 1 つに統一する（両方は書かない）
- 機微情報（実 Entra テナント ID / クライアントシークレット / 実顧客名 / PII / 実トークン）は記載しない
- 生成後は必ずユーザーレビューを経る。AI 単独で確定しない
