---
name: create-issue
description: 対話で要件を詰め、Issue テンプレ（feature / bug / ops）に沿って reader-eval の GitHub Issue を作成する。受け入れ条件（人手＋AI）チェックリストを必ず含める。gh が無ければ REST API(curl) を使う。
---

# Issue 作成スキル（reader-eval）

対話形式で要件を整理し、種別テンプレ（feature / bug / ops）に沿った GitHub Issue を作成する。

## ワークフロー

### 1. ヒアリング

`$ARGUMENTS` が指定されていれば初期コンテキストとして使う。なければ以下を順に質問。

**必須項目:**

- 何が問題か / 何を実現したいか（1〜2 文）
- 種別:
  - `feature`（機能追加・改善: 評価入力 / 集計 / 出力 / 認証 / AI 連携 など）
  - `bug`（バグ報告）
  - `ops`（インフラ / CI/CD / Coolify / Docker / Cloudflare Tunnel / 運用作業）

**種別ごとの追加質問:**

#### feature
- 背景・動機（なぜ必要か）
- 具体的な変更イメージ（画面 / route handler API / データモデル / Claude 連携）
- 影響範囲（評価者 / 被評価者 / 人事考課委員会 / 認証フロー / 集計）

#### bug
- 現在の挙動 / 期待する挙動
- 再現手順
- 環境（local / Coolify dev / 本番）と発生頻度
- ログ・スタックトレースの有無

#### ops
- 対象（Docker / Coolify / GitHub Actions / Cloudflare Tunnel / PostgreSQL / Entra ID 設定 / VM セットアップ 等）
- 環境（local / dev / 本番）
- 安全性（破壊的変更か / DB マイグレーション伴うか / 稼働中サービスへの影響）

### 2. コードベース調査

ユーザーの回答をもとに、関連コードを調査（実装フェーズ以降）:

- UI（SSR）: `app/**/page.tsx` / `app/**/layout.tsx` / コンポーネント
- API（route handlers）: `app/api/**/route.ts`
- ロジック / 外部連携: `lib/`（DB アクセス、Claude SDK 呼び出し、Entra 認証ユーティリティ等）
- データモデル: Prisma なら `prisma/schema.prisma`、Drizzle なら `lib/db/schema.ts`（採用ツールに合わせる）
- 影響範囲の把握（UI / API / 認証フロー / 集計バッチ / Claude API 呼び出し）

調査結果をユーザーに共有し、認識を合わせる。

> 実装未着手の段階では、`docs/requirements/要件定義書.md`（正本）と `docs/design/` を参照して影響範囲を見積もる。

### 3. 受け入れ条件の提案

実装完了の判断基準として、以下の **2 軸** で具体項目を提案する。

- **人手確認項目**: 画面表示・遷移 / Entra ID（M365 SSO）ログインフロー / 評価入力・集計結果の妥当性 / Claude 出力の内容確認 / 人事考課委員会向け出力の体裁 等
- **AI 自動チェック項目**: `npm test`（Vitest）/ `npm run typecheck` / `npm run lint` / `npm run build` / 必要なら `npm run test:e2e`（Playwright）

ユーザーに過不足を確認し、調整する。1 受け入れ条件 = 1 テストを意識する。

### 4. Issue 下書きの提示

種別テンプレに沿って下書きを作成し提示する。`.github/ISSUE_TEMPLATE/` がリポジトリにあればそれに従い、無ければ以下の最小テンプレを使う。

```markdown
## 概要
（何を実現する / 直すか。1〜2 文）

## 背景・動機
（feature: なぜ必要か / bug: 現在と期待する挙動 / ops: 対象と目的）

## 詳細
（feature: 変更イメージ 画面・API・データモデル・AI 連携）
（bug: 再現手順 / 環境 / ログ）
（ops: 対象リソース / 環境 / 破壊的変更の有無）

## 影響範囲
（評価者 / 被評価者 / 人事考課委員会 / 認証 / 集計 / 外部連携）

## 受け入れ条件
### 人手確認項目
- [ ] …
### AI 自動チェック項目
- [ ] `npm test` 緑（正常 + 異常 + Edge）
- [ ] `npm run typecheck` 0 error
- [ ] `npm run lint` 0 違反
- [ ] `npm run build` 成功
- [ ] （該当時）`npm run test:e2e` 緑

## 関連
（関連 Issue / 要件定義書 / docs/design へのリンク）
```

### 5. ユーザー確認と調整

- 内容の誤り・不足
- タイトル（プレフィックスは `[feature]` / `[bug]` / `[ops]`）
- ラベル（`enhancement` / `bug` / `ops` / `security` / `docs` 等）
- 担当者・マイルストーン（例: 8月スモールスタート / 4Q 本運用）
- 関連 Issue / ドキュメント URL

### 6. Issue 作成

ユーザー承認後に作成する。**gh があれば gh、無ければ REST API(curl)**。

まず gh の有無を確認:

```bash
command -v gh && gh auth status
```

#### gh がある場合

```bash
gh issue create \
  --title "[feature] 360°評価の自己評価入力フォーム" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
（テンプレに沿った本文）
EOF
)"
```

#### gh が無い場合（GitHub REST API + curl）

`OWNER/REPO` は `git remote get-url origin` から確認。トークンは環境変数（例 `$GITHUB_TOKEN`）から渡し、**本文・コマンド履歴にトークンを直書きしない**。

```bash
# 本文を JSON 安全にするため jq で組み立てる
BODY=$(cat <<'EOF'
（テンプレに沿った本文）
EOF
)
jq -n --arg t "[feature] 360°評価の自己評価入力フォーム" \
      --arg b "$BODY" \
      '{title:$t, body:$b, labels:["enhancement"]}' \
| curl -sS -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -d @- \
    "https://api.github.com/repos/OWNER/REPO/issues"
```

作成後、Issue URL（または API レスポンスの `html_url`）を報告する。

## 注意事項

- 日本語で記述する
- ユーザー承認なしに Issue を作成しない
- 受け入れ条件は **必ず** 含める（人手 / AI の両軸）
- 1 Issue に複数の課題を詰め込まない。大きすぎる場合は分割を提案する（1 Issue = 1 シナリオが原則）
- 機微情報（GitHub トークン・本番 URL・PII・実 Entra テナント ID / クライアントシークレット・Cloudflare トークン）を本文に貼らない
