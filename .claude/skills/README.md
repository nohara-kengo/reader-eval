# .claude/skills/ — Claude Code スキル

reader-eval（リーダー研修 評価システム）の Claude Code スキル置き場。リポジトリにコミットして **チームで共有** する。

## スキル一覧

| スキル | 役割 |
| --- | --- |
| [`create-issue`](create-issue/SKILL.md) | 対話で要件を詰めて、Issue テンプレ（feature / bug / ops）に沿った GitHub Issue を作成 |
| [`design-from-plan`](design-from-plan/SKILL.md) | plan / Issue を入力に `docs/design/<issue>/{sequence,flow,acceptance,files}.md` を生成 |
| [`tdd-implement`](tdd-implement/SKILL.md) | 受け入れ条件を起点に Red → Green → Refactor で Vitest 実装（route handler / UI / lib 各層） |

> 上記 3 スキルに加え、運用フローでは以下のスキルも併用する想定（このディレクトリに既存／今後追加）:
> `exec-issue`（Issue → 設計 → TDD 実装 → PR の一気通貫）/ `smart-commit`（差分を論理単位に分割提案）/ `pr-description`（PR 本文をテンプレに沿って作成）/ `pr-review-ai`（受け入れ条件 vs 実装の AI 一次レビュー）。

## 全体フロー

「プラン → Issue → 設計 → 実装 → コミット → PR → レビュー」を以下のスキルで回す。

```
plan（自然言語の要望 / 議事録 / 要件定義書）
   │
   ▼
create-issue        ← 対話で要件を詰めて GitHub Issue を作成（受け入れ条件は人手＋AI の両軸）
   │
   ▼
exec-issue          ← Issue を起点に以下を束ねて一気通貫で遂行（ベース develop）
   ├─ design-from-plan   docs/design/<issue>/{sequence,flow,acceptance,files}.md を生成
   ├─ tdd-implement      acceptance.md から Red → Green → Refactor
   ├─ smart-commit       差分を論理単位に分割してコミット提案
   ├─ pr-description     PR 本文を作成（Closes #<issue> / 設計成果物リンク）
   └─ pr-review-ai       受け入れ条件 vs 実装を AI 視点でセルフレビュー
```

軽微な変更（タイポ・1 ファイル修正等）は `design-from-plan` をスキップしてよい。設計成果物は **必ずユーザーレビュー** を経てから実装へ進む。

## 配置と運用

- 配置: **リポジトリ内 `.claude/skills/`**（個人ローカルの `~/.claude/` ではない）
- バージョン管理: git でリポジトリと一緒に
- 更新プロセス: スキル変更も通常の PR フローに乗せる（人レビュー必須）

## このプロジェクトの前提（スキル共通）

- **構成**: Next.js（App Router）フルスタック 1 本。UI は SSR、API は route handlers（`app/api/...`）。独立バックエンドは無し。
- **言語/基盤**: TypeScript strict / Tailwind CSS / Node 22 / PostgreSQL（Prisma か Drizzle かは未確定）。
- **AI**: Claude（`@anthropic-ai/sdk`、既定モデル `claude-opus-4-8`）。
- **認証**: Microsoft Entra ID（M365 SSO）。
- **インフラ**: Docker + Coolify（GitHub 連携 CI/CD）、外部公開は Cloudflare Tunnel（必要時のみ）。
- **Git flow**: デフォルトブランチ `develop` / リリース `main`。作業ブランチは `feature/{issue番号}-{説明}` を `develop` から作成。`feature → develop` は Squash、`develop → main` は Merge commit。**直 push / force-push / CI バイパス禁止**。
- **品質コマンド**: `npm test`（Vitest）/ `npm run lint` / `npm run typecheck` / `npm run build` / `npm run test:e2e`（Playwright）。
- **TDD**: 1 受け入れ条件 = 1 テスト、Red → Green → Refactor を厳守。
- **設計成果物**: `docs/design/<issue番号>/` に保存。
- **gh CLI**: 未インストールの可能性あり。Issue / PR の取得・作成は **gh があれば gh、無ければ GitHub REST API（curl）** を使う。

## 注意事項（スキル共通）

- 出力・記述はすべて **日本語**。
- ユーザー承認なしに Issue / コミット / PR を作成しない。
- 機微情報（トークン・本番 URL・PII・実 Entra テナント ID / クライアントシークレット・Cloudflare トークン・`.env` 実値）を本文やコミットに含めない。
