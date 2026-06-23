---
name: exec-issue
description: GitHub Issue を起点に「事前チェック → ブランチ作成 → 設計(任意) → TDD 実装 → PR前チェック → コミット → PR」までを一気通貫で遂行するマスターオーケストレータ。
---

# Exec Issue スキル（reader-eval / マスターオーケストレータ）

GitHub Issue に基づき、開発フローに沿って TDD で実装し、`develop` を base とする PR を作成するまでを統括する。
配下で `design-from-plan`（任意）/ `smart-commit` / `pr-description` / `pr-review-ai` を順に呼び出す。

対象スタック: Next.js (App Router) / TypeScript strict / Tailwind / Node 22 / PostgreSQL（Prisma|Drizzle）/ Claude API / Entra ID / Docker+Coolify / Cloudflare Tunnel。
品質ゲート: `npm test`(Vitest) / `npm run lint` / `npm run typecheck` / `npm run build` / `npm run test:e2e`(Playwright)。

## gh / REST API の使い分け（全工程共通）

`gh` CLI は **未インストールの可能性あり**。GitHub 操作は常に「`gh` があれば `gh`、無ければ GitHub REST API(curl)」で行う。
```bash
command -v gh >/dev/null 2>&1 && echo "gh あり" || echo "gh なし → REST API（要 GITHUB_TOKEN）"
```

## 前提チェック

- `$ARGUMENTS` が空または数値でない場合はエラーを表示して終了する
- カレントディレクトリが `reader-eval` のリポジトリルートであることを確認する

## 手順

### 1. 事前チェック

1. **Issue 存在確認**: Issue を取得し、要件・受け入れ条件を理解する
   ```bash
   # gh
   gh issue view $ARGUMENTS --json title,body,labels,state
   # REST
   curl -sS -H "Authorization: Bearer ${GITHUB_TOKEN}" -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/${OWNER}/${REPO}/issues/$ARGUMENTS"
   ```
   - クローズ済み・存在しない場合はユーザーに報告して終了する
2. **作業ツリー clean 確認**:
   ```bash
   git status --short    # 出力があれば未コミット変更あり
   ```
   - 未コミット変更がある場合はユーザーに報告し、続行可否を確認する（勝手に stash / discard しない）
3. **develop 同期**:
   ```bash
   git checkout develop && git pull --ff-only origin develop
   ```
4. **docker 稼働確認**:
   ```bash
   docker compose ps    # 必要サービス（PostgreSQL 等）が up か確認
   ```
   - 動いていなければ起動を提案する: `docker compose up -d`

### 2. 作業ブランチの作成

- `develop` から `feature/$ARGUMENTS-<簡潔な説明>` を作成・チェックアウトする
  ```bash
  git checkout -b feature/$ARGUMENTS-<説明>
  ```
- 同名ブランチが既にある場合はユーザーに確認する
- main / develop へ直接コミットしない（必ず feature ブランチで作業）

### 3. 設計フェーズ（design-from-plan、任意）

大きめの Issue（複数フェーズ / DB スキーマ追加 / Claude API・Entra ID 連携あり）の場合、`design-from-plan` スキルを起動して `docs/design/$ARGUMENTS/` に出力する。

- `sequence.md` — シーケンス図（Mermaid）
- `flow.md` — フロー図（Mermaid）
- `acceptance.md` — 受け入れ条件（人手確認 / AI 自動チェックの両軸）
- `files.md` — 修正・追加予定ファイル一覧

軽微な変更（タイポ・1 ファイル修正等）はスキップしてよい。設計成果物はユーザーレビューを経てから実装に進む。

### 4. TDD 実装ループ

受け入れ条件ごとに Red → Green → Refactor を回す。

1. **Red**: 受け入れ条件から失敗するテスト（Vitest）を書く
2. **Green**: 通る最小実装
3. **Refactor**: 責務分離（route handler を薄く・データ層分離）/ 命名 / ガード節 / Server・Client 境界の整理

各サイクルで以下を回す:
```bash
npm test -- <対象ファイル>     # 該当テストのみ
npm run typecheck              # 型（TypeScript strict）
npm run lint                   # ESLint
```

- E2E は Playwright（`npm run test:e2e`）。UI フローに関わる場合に追加する
- 中止条件: テストが Red のまま新規テストの Green を取りに行かない（根本原因を共有して中止）

### 5. PR 前チェック（すべて緑にする）

PR 作成前に **すべて** 通す。失敗があれば修正してから次へ進む。
```bash
npm test            # Vitest 全テスト緑
npm run lint        # ESLint 0 violations
npm run typecheck   # tsc 型エラーなし
npm run build       # Next.js build 成功
npm run test:e2e    # Playwright（該当なし / 緑）
```

加えて秘匿情報の未ステージを確認する。
- `.env` / `.env.local` / `.env.production` 実値、証明書・鍵（`*.pem` / `*.key`）
- Claude API キー / Entra ID クライアントシークレット / DB 接続文字列 / Cloudflare Tunnel トークン
- `NEXT_PUBLIC_` への秘匿値混入がないか

### 6. コミット（smart-commit）

- `smart-commit` スキルを起動し、論理単位の分割提案を受ける
- 秘匿情報混入チェックを通す
- ユーザー承認後に実コミットする（prefix: `feat: / fix: / refactor: / test: / docs: / ci: / chore:`）
- DB スキーマ変更とマイグレーション、`package.json` と `package-lock.json` はそれぞれ同コミットに含める

### 7. PR 作成（pr-description）

- push・PR 作成の前に、差分サマリ・テスト結果・スクリーンショット URL 等を提示し続行確認を取る
- `pr-description` スキルを起動して PR 説明文をドラフトし、**base=`develop`** で PR を作成する（gh / REST API の使い分けは pr-description 内に従う）
- description に **`Closes #$ARGUMENTS`** を必ず含める
- 設計成果物がある場合は `docs/design/$ARGUMENTS/` へのリンクを貼る
- force-push しない。develop→main は別運用（Merge Commit）なのでここでは扱わない

### 8. AI セルフレビュー（pr-review-ai、推奨）

- PR 作成後、`pr-review-ai` スキルで「受け入れ条件 vs 実装」の対応を AI 視点で確認し、不足があれば TDD ループに戻って追加コミットする

## 中止条件

- Issue の受け入れ条件が不明確 → ユーザーに確認し、確定するまで実装に入らない
- 設計成果物にユーザー承認が得られない → 実装に入らない
- PR 前チェック（test / lint / typecheck / build / e2e）のいずれかが赤のまま → PR を作成しない
- 秘匿情報の混入が解消できない → コミット・PR を行わない
