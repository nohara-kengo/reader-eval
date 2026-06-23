# 命名規約 / 表記統一

> **本ファイルは骨組みを含む。日本語の表記ゆれ・用語統一（§1 / §2 / §7）は後続タスクで確定値を埋める。**
>
> 個別領域の命名規約は [`app.md`](app.md) を正とし、本ファイルはそれを横断する **表記ゆれ・用語統一** を扱う。重複時は領域別ルールを正とし、本ファイルは差分のみを記述する。

## 1. 日本語表記ゆれ

> TODO: 以下のどちらに統一するかを決める（社内ガイドライン / 既存ドキュメントとの整合を確認）。**太字が暫定の採用候補**。

- サーバ / **サーバー**
- ユーザ / **ユーザー**
- データベース / データーベース
- E メール / メール / e-mail
- ID / Id / id（地の文での表記）
- ログイン / ログオン / サインイン
- 半角カナ / 全角カナの混在禁止

## 2. 英日混在の方針

> TODO: 地の文での英単語の扱い（半角スペースで囲む / 囲まない、カタカナ化する語の境界）を決める。

- 例: 「Next.js アプリ」と「Next.jsアプリ」
- 固有名詞（Next.js / Claude / Entra ID / Coolify / Cloudflare / PostgreSQL 等）は **英字のまま**
- 動詞化された外来語（マージ / プッシュ / リバート）は カタカナ

## 3. コード命名

| 対象 | 規約 |
| --- | --- |
| クラス / コンポーネント / 型 | PascalCase |
| メソッド / 関数 / 変数 | camelCase |
| 定数 | UPPER_SNAKE_CASE |
| React コンポーネントファイル | PascalCase（`ScoreForm.tsx`） |
| hook / util ファイル | camelCase（`usePaginatedList.ts` / `formatDate.ts`） |
| ディレクトリ | kebab-case |
| 真偽値 | `is` / `has` プレフィックス（`isActive` / `hasPermission`）。DB カラムは `is_` |

- enum は文字列ユニオン型 / `as const` を優先（[`app.md`](app.md)）

## 4. DB 命名

> ORM / マイグレーションツール（Prisma or Drizzle）は ADR で選定予定。確定後にツール依存の細則を追記する。

- テーブル名: **複数形・snake_case**（TODO: 単複方針を ADR と整合させ確定）
- カラム: snake_case。日時 `_at` / 日付 `_on` / 真偽値 `is_` / 件数 `_count`
- インデックス: `idx_{table}_{columns}`
- FK: `fk_{table}_{ref}`
- unique: `uniq_{table}_{columns}`
- 論理削除カラム: TODO（`deleted_at` / `is_deleted` のどちらか）

## 5. URL / API パス / リソース名

- URL は **kebab-case**（`/admin/audit-logs`）
- API パス（route handlers）は `/api/...`。バージョニングの要否は TODO
- リソース名は **複数形**
- Query parameter のケース統一: TODO（camelCase / snake_case）

## 6. ID 命名

- DB カラム: `report_id` / `user_id`
- TypeScript 変数 / JSON キー: `reportId` / `userId`
- 環境変数: `UPPER_SNAKE`（`DATABASE_URL` / `ANTHROPIC_API_KEY`）

## 7. 用語統一表（スケルトン）

> TODO: reader-eval（リーダー研修 評価システム）の業務用語を確定する。要件定義の用語集に基づき、以下の表を埋める。

| 用語 | 採用 | 採用しない | 英語 / DB 値 | 備考 |
| --- | --- | --- | --- | --- |
| （評価対象者） | TODO | — | TODO | — |
| （評価者） | TODO | — | TODO | — |
| （研修） | TODO | — | TODO | — |
| （評価 / スコア） | TODO | — | TODO | — |
| reader-eval | reader-eval | TODO | — | プロジェクト名、表記固定（TODO: 日本語名「リーダー研修 評価システム」の正式表記） |

### 7.1 廃止語（使用禁止）

> TODO: 旧称・廃止された用語が出た場合にここへ追記する。

## 8. ファイル / ディレクトリ命名（横断）

- `.claude/rules/`: 領域名 kebab-case（`app.md` / `git-workflow.md`）
- `.claude/skills/<name>/SKILL.md`: ディレクトリ名 kebab-case
- `docs/` 配下: TODO（番号 + snake_case 等の方針）

## 9. コミットメッセージ

> 詳細は [`git-workflow.md`](git-workflow.md) を参照。

- prefix: `feat: / fix: / refactor: / docs: / ci: / chore: / test:` 等
- 言語: 日本語（TODO: 確定）

## 関連

- アプリ規約: [`app.md`](app.md)
- 共通化・パーツ化: [`shared.md`](shared.md)
- PR 運用: [`git-workflow.md`](git-workflow.md)
