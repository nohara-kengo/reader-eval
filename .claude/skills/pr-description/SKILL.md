---
name: pr-description
description: ブランチ差分・コミット履歴を分析し PR 説明文を自動ドラフトする。gh があれば gh、無ければ GitHub REST API(curl) で base=develop の PR を作成する。
---

# PR Description 作成スキル（reader-eval）

現在の feature ブランチの差分・コミット履歴を分析し、PR 説明文をドラフトする。
ベースブランチは原則 **`develop`**（develop→main は別途 Merge Commit 運用）。

## 前提

- `gh` CLI は **未インストールの可能性あり**。各 GitHub 操作は「`gh` があれば `gh`、無ければ GitHub REST API(curl)」で行う。
  ```bash
  command -v gh >/dev/null 2>&1 && echo "gh あり" || echo "gh なし → REST API を使う"
  ```
- REST API 利用時は環境変数を確認する: `GITHUB_TOKEN`（または `GH_TOKEN`）、`OWNER`、`REPO`。
  ```bash
  : "${GITHUB_TOKEN:?GITHUB_TOKEN が未設定}"
  REMOTE_URL=$(git config --get remote.origin.url)   # owner/repo 推定に利用
  ```

## ワークフロー

### 1. ブランチ情報の取得

```bash
git rev-parse --abbrev-ref HEAD                 # 現在ブランチ（feature/<issue>-...）
git log origin/develop..HEAD --oneline          # develop との差分コミット
git diff origin/develop...HEAD --stat           # 変更ファイル概要
git diff origin/develop...HEAD                   # 詳細差分
```

- ブランチ名 `feature/<issue>-...` から Issue 番号を抽出する
- ベースが `develop` でない意図がある場合（main 等）はユーザーに確認する

### 2. 差分の分析

- 変更ファイルとその種類（新規 / 変更 / 削除）
- 実装の目的と内容（コミットメッセージ / Issue 番号から推測）
- 影響範囲:
  - UI: Page / Layout / Server Component / Client Component / Server Action
  - API: route handler（`app/api/.../route.ts`）
  - データ: Prisma|Drizzle スキーマ / マイグレーション
  - 連携: Claude API / Entra ID（認証）
  - infra / CI: GitHub Actions / `Dockerfile` / `docker-compose.yml` / Coolify / Cloudflare Tunnel
- セキュリティ観点（認可 / SQL / 外部 API / シークレット混入 / Entra ID トークン検証）

### 3. 下書きの作成

`.github/PULL_REQUEST_TEMPLATE.md` があればそれに従う。無ければ以下の雛形を使う。

```markdown
## 概要
<!-- 何をしたかを 1〜3 行で -->

## 変更内容
<!-- 実装の中身を箇条書き -->

## 受け入れ条件
### 人手確認
- [ ] <画面・操作で確認する項目>
### AI 自動チェック
- [ ] <テスト・型・lint で機械的に確認できる項目>

## テスト結果
- [ ] `npm test`（Vitest）緑
- [ ] `npm run lint`（ESLint）0 violations
- [ ] `npm run typecheck`（tsc）緑
- [ ] `npm run build`（Next.js build）成功
- [ ] `npm run test:e2e`（Playwright）: 該当なし / 緑
- [ ] CI（GitHub Actions）緑

## セキュリティ
<!-- 認可 / 入力検証 / 外部 API / シークレット混入の有無。変更がある場合は必須 -->

## 動作確認
<!-- レビュワー手順。URL / シナリオ / Entra ID ログイン等 -->

## スクリーンショット
<!-- UI 変更がある場合は必須 -->

## 設計成果物
<!-- docs/design/<issue番号>/ がある場合はリンク -->

## その他
Closes #<issue番号>
```

### 4. 対話による補完

- Issue 番号の確認（ブランチ名から推測できない場合は質問）
- 受け入れ条件の過不足
- スクリーンショットの要否（UI 変更がある場合は要求）
- 動作確認手順の具体性

### 5. PR の作成

push 前に差分サマリ・テスト結果・PR 本文を提示し、続行確認を取る。

```bash
git push -u origin "$(git rev-parse --abbrev-ref HEAD)"   # force-push は禁止
```

**gh がある場合:**
```bash
gh pr create --base develop --head "$(git rev-parse --abbrev-ref HEAD)" \
  --title "<タイトル>" \
  --body "$(cat /tmp/pr-body.md)"
```

**gh が無い場合（REST API）:**
```bash
OWNER=<owner>; REPO=<repo>; HEAD_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
# 本文 JSON は jq でエスケープして組み立てる
jq -n --arg t "<タイトル>" --arg b "$(cat /tmp/pr-body.md)" \
      --arg h "$HEAD_BRANCH" --arg base "develop" \
  '{title:$t, body:$b, head:$h, base:$base}' > /tmp/pr.json

curl -sS -X POST \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${OWNER}/${REPO}/pulls" \
  -d @/tmp/pr.json
```

### 6. 最終出力

- 作成された PR の URL を提示する
- PR を作成しない場合は、本文をマークダウンコードブロックでコピー可能に提示する

## 注意事項

- 日本語で記述する
- 差分から読み取れる事実に基づく。推測は明示する
- セキュリティ観点（認可漏れ / シークレット混入 / 外部 API 呼び出し）に変更がある場合は **必ず**「セキュリティ」セクションを記入する
- `Closes #<issue番号>` の番号が正しいか確認する
- base は `develop`。main を base にする場合はユーザーの明示確認を取る
- main / develop への直接 push・force-push は行わない
