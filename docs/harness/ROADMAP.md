# 開発ハーネス整備ロードマップ

`NIHON-COMTHINK/nct-ihsp-adt` のハーネスを参考に、reader-eval（TypeScript/Next.js + Node、オンプレ Docker/Coolify、小規模・Claude活用）向けに右サイズ化した整備計画。

## 参照との差分方針

| 観点 | 参照 (nct-ihsp-adt) | reader-eval |
|---|---|---|
| アプリ構成 | フロント(Vite/React)＋別Java/Springバックエンド | **Next.js (App Router) フルスタック1本**（UI＋API route handlers、独立バックエンド無し。ランタイム Node/TS） |
| DBマイグレーション | Liquibase (YAML) | **Prisma / Drizzle**（ADRで選定） |
| デプロイ先 | AWS ECS/ECR + Terraform | **オンプレ Ubuntu VM + Docker + Coolify**（AWS/Terraform系は不採用） |
| 認証 | AWS Cognito | **M365 Entra ID（SSO）** |
| 外部公開 | ALB/CloudFront | **Cloudflare Tunnel**（特定ポートのみ） |
| pre-commit hook | なし | **husky + lint-staged を追加**（改善） |
| ブランチ運用 | develop→main 強制 / Squash・Merge使い分け | 同方針を踏襲 |
| Claudeハーネス | CLAUDE.md + .claude/(rules, skills, settings) | 同構成をTS/オンプレ向けに翻案 |

## 整備項目（Issue化）

1. Next.js (App Router) フルスタックアプリ雛形（UI＋API route handlers、共通設定）
2. ローカル開発環境（Docker Compose: db/api/frontend ＋ .env.example）
3. コード品質ハーネス（ESLint/Prettier/型 + husky + lint-staged）
4. テストハーネス（Vitest + Testing Library + Playwright + API統合）
5. DBスキーマ・マイグレーション基盤（Prisma/Drizzle 選定 + seed）
6. CI（GitHub Actions: lint/型/unit/build、e2e、actionlint、develop→main強制）
7. CD（production Dockerfile + Coolify自動デプロイ + Cloudflare Tunnel）
8. GitHub運用整備（PR/Issueテンプレ + Repository Rulesets ブランチ保護）
9. Claudeエージェントハーネス（CLAUDE.md + .claude/rules + .claude/skills + settings.json）
10. API/エラー規約 & ドキュメント構成（ErrorResponse形式・文言規約・docs構成・README更新）

## ハーネス対象外（後続のアプリ機能Issue）

- M365 Entra ID 認証の実装本体
- Claude API 連携の実装本体（機微情報マスキング含む。3.6/3.7参照）
- 評価機能（自己評価/360°/集計/出力）各機能

> 進捗は GitHub Issues（label: `harness`）で管理。Epicに一覧を集約。
