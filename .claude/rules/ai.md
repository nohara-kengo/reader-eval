---
description: "AI 方針 — アプリは Claude/Anthropic API を呼ばない（Claude は開発者ツールのみ）"
paths: "app/**,features/**,lib/**,.claude/rules/**"
---

# AI 利用方針

reader-eval（リーダー研修 評価システム）の AI 方針を定める。

## 1. 原則：システムからは AI（Claude/Anthropic API）を呼ばない

- **アプリ（システム）は実行時に Claude / Anthropic API を呼び出さない。** route handlers / server actions / `lib/` から外部 LLM API を叩かない。
- `@anthropic-ai/sdk` などの LLM クライアント SDK を**アプリの依存に追加しない**。
- 評価コメントの要約・分析・ドラフト生成などの「AI による自動評価支援」は**現状スコープ外**。必要になった場合は改めて要件化し、本方針を更新する（要件定義書 2.1 / 3.6）。

## 2. Claude は開発者のツールとしてのみ

- Claude（Claude Code 等）は**開発者が開発時に使うツール**として利用してよい（設計・実装・レビュー補助など）。
- 開発で Claude にコードや情報を渡す際は、**評価対象の実データ・個人特定情報（氏名・所属・社員 ID・メール等）を入力しない**（ダミー化／マスキング）。機微情報の取り扱いは [`security.md`](security.md) を正とする。
- `.env` / シークレット等の機微ファイルは Claude から読み取らせない（[`.claude/settings.json`](../settings.json) で deny 済み）。

## 3. 結果として

- 評価情報を外部 API（Anthropic 等）へ送信することはない。データは社内 IDC に閉じる。
- 「送信前マスキング層（`lib/claude/`）」のようなアプリ内 AI 連携は**設けない**。

## 関連

- 要件: 要件定義書 2.1 / 3.6
- セキュリティ・機微情報: [`security.md`](security.md)
- アプリ規約: [`app.md`](app.md)
- 全体方針: [`../../CLAUDE.md`](../../CLAUDE.md)
