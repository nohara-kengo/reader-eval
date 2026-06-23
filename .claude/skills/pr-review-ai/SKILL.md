---
name: pr-review-ai
description: PR の差分と Issue 受け入れ条件を突き合わせ、不足・逸脱を AI 視点で指摘し修正提案する一次レビュー。人レビューの置き換えではなく抜け漏れフィルタ。
---

# PR Review AI スキル（reader-eval）

PR の差分・コミット履歴を読み、Issue の受け入れ条件と実装の対応を AI 視点で検証する。
人レビューを置き換えるものではなく、見落としの **一次フィルタ** として使う。
対象スタック: Next.js (App Router) / TypeScript strict / Tailwind / Prisma|Drizzle / PostgreSQL / Claude API / Entra ID。

## 入力

- `$ARGUMENTS`: PR 番号 / URL（無ければオープン PR 一覧を提示して選んでもらう）
- `gh` 未インストールの可能性あり → 「`gh` があれば `gh`、無ければ REST API(curl)」で取得する。

## ワークフロー

### 1. PR と関連 Issue の取得

**gh がある場合:**
```bash
gh pr view <PR番号> --json title,body,baseRefName,headRefName,commits,labels,number,files
gh pr diff <PR番号>
```

**gh が無い場合（REST API）:**
```bash
OWNER=<owner>; REPO=<repo>; PR=<PR番号>
curl -sS -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/pulls/${PR}"
# 差分は diff メディアタイプで取得
curl -sS -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3.diff" \
  "https://api.github.com/repos/${OWNER}/${REPO}/pulls/${PR}"
```

PR 本文の `Closes #<n>` から Issue 番号を抽出し、Issue を取得する。

**Issue 取得（gh / REST）:**
```bash
gh issue view <n> --json title,body,labels
# または
curl -sS -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/issues/<n>"
```

設計成果物がある場合（`docs/design/<n>/acceptance.md`）はそちらを正とする。

### 2. 対応マトリクスの作成

| 受け入れ条件 | 種別 | 対応する変更 | 検証コマンド / 観点 | 判定 |
| --- | --- | --- | --- | --- |
| 〜画面で〜できる | 人手確認 | `app/(dashboard)/.../page.tsx` | スクリーンショット要求 | 要確認 |
| API が成功時に評価レコードを保存 | AI | `app/api/.../route.ts` + テスト | `npm test -- <file>` | 緑 |

### 3. AI 観点でのチェック項目

#### 受け入れ条件カバレッジ

- 受け入れ条件の各項目に対応する実装 / テストがあるか
- 異常系・Edge ケースが網羅されているか（`acceptance.md` に記載があれば必ず照合）

#### Next.js (App Router) / TypeScript 固有

- Server / Client の境界が適切か（`"use client"` の付け過ぎ・付け忘れ、Client への秘匿情報漏れ）
- route handler（`app/api/.../route.ts`）が薄く、ロジックが分離されているか
- データアクセスが route handler / Server Component 直書きでなく、データ層（lib/repository 等）経由か
- `any` の使用箇所（TypeScript strict 前提）
- `useEffect` の依存配列網羅
- Server Action の入力検証（zod 等）と認可
- `console.log` の本番残留がないか
- Tailwind 任意値の濫用や独自 CSS の混入がないか

#### データ（Prisma / Drizzle）固有

- スキーマ変更（`schema.prisma` / Drizzle スキーマ）と対応するマイグレーションが同コミットか
- マイグレーションファイルが生成・コミットされているか（破壊的変更の確認）
- N+1（必要な include / join / relation 読み込み）
- トランザクションの漏れ（複数レコード更新）

#### セキュリティ

- 認可漏れ（Entra ID トークン検証 / route handler・Server Action でのセッション/ロールチェック）
- 入力検証（API / Server Action の zod 等スキーマ検証漏れ）
- SQL インジェクション（生 SQL / `$queryRaw` / `sql.raw` の使用箇所）
- XSS（`dangerouslySetInnerHTML` の使用箇所）
- シークレット混入（`.env` 実値 / `*.pem` / `*.key` / Claude API キー / Entra ID シークレット / Cloudflare Tunnel トークン）
- 外部 API（Claude API）呼び出しのタイムアウト・エラーハンドリング・リトライ
- 環境変数の Client 露出（`NEXT_PUBLIC_` への秘匿値混入）

#### CI / テスト

- 新規実装に対応するテスト（Vitest）が追加されているか
- `npm test` / `npm run lint` / `npm run typecheck` / `npm run build` / `npm run test:e2e` の通過状況（CI ログから）

#### ドキュメント

- 公開 API / 画面 / Job の挙動変更が `CLAUDE.md` / `README.md` / `docs/` に反映されているか
- 設計成果物（`docs/design/<n>/`）と実装の乖離

### 4. レポート出力

```markdown
# AI レビュー結果 — PR #<n>

## サマリ
- 受け入れ条件カバレッジ: X / Y 項目
- Critical: 0 件
- 要確認: N 件

## 対応マトリクス
| 受け入れ条件 | 対応 | 判定 |
| --- | --- | --- |
...

## 指摘
### Critical
（必ず修正。修正提案を添える）
### 要確認
（人レビュワーの判断を要する）
### Nit
（任意改善）

## 良かった点
（褒めポイント）
```

### 5. 反映

ユーザー希望があれば PR にコメントする。

**gh がある場合:**
```bash
gh pr review <PR番号> --comment --body "$(cat /tmp/review.md)"
```

**gh が無い場合（REST API）:**
```bash
jq -n --arg b "$(cat /tmp/review.md)" '{body:$b}' > /tmp/review.json
curl -sS -X POST -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/issues/<PR番号>/comments" \
  -d @/tmp/review.json
```

Critical があれば修正を実装（TDD ループに従う）し、`smart-commit` で追加コミットする。

## 注意事項

- 人レビューは必須。AI レビューはあくまで一次フィルタ
- 「受け入れ条件にないが直すべき」と感じた点は **Nit** に分類し、勝手に Critical にしない
- セキュリティ Critical を見つけた場合は **PR コメントの前に** ユーザーへ報告する
