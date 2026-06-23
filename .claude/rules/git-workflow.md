# Git ワークフロー

reader-eval（リーダー研修 評価システム）のブランチ運用 / PR 運用ルール。

## ブランチモデル

**`main` + `develop` の 2 本柱**。

```
main    ─────────●───────────────●───→
                  ↑                    ↑
develop ───●───●───●───●───●───●───→
            \     /     \     /
             feat/A      feat/B
```

- `main` は本番デプロイ可能な状態を維持する（Coolify が `main` を本番にデプロイ）
- `develop` は開発の統合ブランチ（**デフォルトブランチ**。Coolify が `develop` を開発環境にデプロイ）
- 機能開発は `develop` から分岐し、`develop` にマージする
- `develop` → `main` のマージでリリースする

## ブランチ命名規則

```
feature/{issue番号}-{説明}
```

- `説明` は **英語 kebab-case** で簡潔に
- Issue 番号を含める（例: `feature/14-score-input-form`）

| type | 用途 | 分岐元 | マージ先 |
| --- | --- | --- | --- |
| `feature/` | 新機能・改修 | `develop` | `develop` |
| `fix/` | バグ修正 | `develop` | `develop` |
| `docs/` | ドキュメント | `develop` | `develop` |
| `refactor/` | リファクタリング | `develop` | `develop` |
| `chore/` | 依存更新・設定変更 | `develop` | `develop` |

例:

- `feature/14-score-input-form`
- `fix/23-login-redirect-error`
- `chore/31-update-dependencies`

## マージ戦略

| 経路 | 戦略 |
| --- | --- |
| feature → develop | **Squash Merge**（標準。1 PR = 1 コミット） |
| develop → main | **Merge Commit**（リリースのマージポイントを履歴に残す） |
| Rebase Merge | **使用しない** |

- Squash Merge により `develop` の履歴は **1 PR = 1 コミット**
- PR タイトルがコミットメッセージになる

## PR 運用

- **1 PR = 1 関心事**。リファクタリングと機能追加は別 PR に分ける。大きな機能は分割する
- PR サイズの目安: 〜400 行を推奨、800 行超は原則分割
- マージ前に `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` をすべて通す
- PR description は変更の概要・背景・確認手順を記載する
- レビューは一次フィルタに AI を使ってもよいが、人レビューを置き換えない

## 禁止事項

- **`main` / `develop` への直接 push**
- **`feature` / `fix` 等を `main` へ直接マージ・直接 PR する**（必ず `develop` を経由）
- **CI チェックが未通過の PR をマージする**（`--admin` 等でのバイパス禁止。AI エージェント・人間を問わず、bypass / `--dangerously-skip-permissions` モードでも不可）
- `git push --force` / `git reset --hard` のユーザー無断実行
- `--amend` / `--no-verify` の無断使用（hooks をスキップしない）
- 1 PR で複数の関心事を混ぜる

## 関連

- アプリ規約: [`app.md`](app.md)
- 共通化・パーツ化: [`shared.md`](shared.md)
- 命名規約: [`naming-conventions.md`](naming-conventions.md)
