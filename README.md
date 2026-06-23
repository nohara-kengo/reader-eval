# reader-eval — リーダー研修 評価システム

「ジョブ型エンジニア」評価の仕組みを構築するプロジェクトのリポジトリです。リーダー研修の成果物として、自己評価・360°評価・集計・人事考課委員会向け出力までを扱う社内向け評価システムを開発します。

- **ステータス**: 一次案（要件定義フェーズ / たたき台）
- **最終更新**: 2026-06-23
- **担当**: 折登さん・野原さん（非機能・AI活用） / 本荘さん・幡野さん（機能要件）

> 詳細は [`docs/requirements/要件定義書.md`](docs/requirements/要件定義書.md) を正本とします。本READMEは全体の入口・索引です。

---

## 概要

- リーダー研修の成果物として「ジョブ型エンジニア」評価の仕組みを構築する
- 人事考課委員会への提出資料を作成しやすくする
- 部の評価軸から脱却できる汎用的・組織非依存の評価の仕組みを提示する
- メンバーの伸びしろを可視化する
- スモールスタート（2部署程度）→ 全社展開を見据える。**外販プロダクト化・クラウド移行は現状スコープ外**

## マイルストーン

- **8月**: 一部部署でのスモールスタート稼働
- **4Q**: 人事考課委員会への提出に合わせた本運用

---

## 技術スタック（要点）

| 区分 | 採用技術 |
|---|---|
| フロントエンド | Next.js (App Router / SSR) |
| スタイリング | Tailwind CSS |
| バックエンド | TypeScript (Node.js) の REST API |
| AI / LLM | Claude（Anthropic API）/ 既定 `claude-opus-4-8` / SDK `@anthropic-ai/sdk` |
| 認証 | M365（Microsoft Entra ID）SSO 第一候補 |
| インフラ | 社内IDC（オンプレ）: Windows Server 上の Hyper-V に Ubuntu VM、Docker 運用 |
| コンテナ管理 | Coolify（リバースプロキシ + Docker管理 + GitHub連携 + CI/CD） |
| 外部公開 | Cloudflare Tunnel（必要時のみ・特定ポート） |
| ドメイン | `*.comthink.co.jp` / `*.dev-nct.jp` |

構築方針: **WSL（Ubuntu）で検証 → コマンドベースで再現可能に構築 → GitHub `main`/`dev` から Coolify CI/CD で自動デプロイ**。詳細は要件定義書 3章を参照。

---

## ドキュメント構成

```
docs/
├── requirements/        要件定義
│   ├── 要件定義書.md           ← 正本（v0.2）
│   └── archive/
│       └── 要件定義書_初版.md   ← 初版（社内環境・Javaバックエンド想定。経緯保存用）
├── design/              制度・プログラム設計
│   ├── ジョブ型リーダー研修_設計案.md
│   └── ジョブ型エンジニア評価制度.md
├── background/          背景・分析
│   ├── 自社戦略・環境分析.md
│   └── 現状分析_SWOT.md
├── research/            調査
│   └── インタビュー質問.md
├── meetings/            議事録
│   └── 議事録_2026-05-12.md
└── 課題管理表.md         論点・課題の管理表
```

索引は [`docs/INDEX.md`](docs/INDEX.md) を参照。

> 人事考課ブック等の参考 Office ファイル（xlsx/pptx）は重量バイナリのためリポジトリには含めていません（社内の元資料を参照）。

---

## リポジトリの今後の構成（予定）

アプリ実装フェーズで以下を追加予定（未着手）。

```
app/        Next.js フロント + TypeScript API（構成は実装時に確定）
infra/      docker-compose / Coolify 定義 / VM セットアップスクリプト
.github/    CI/CD（GitHub Actions、Coolify 連携）
```

ブランチ運用は Git Flow（`main` = 本番 / `dev` = 開発）に準拠予定。

---

## 関連

- 要件定義の正本: [`docs/requirements/要件定義書.md`](docs/requirements/要件定義書.md)
- 主要な未決事項: 要件定義書「6. 要確認事項」/ [`docs/課題管理表.md`](docs/課題管理表.md)
