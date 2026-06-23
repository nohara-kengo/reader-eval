/**
 * カスタムエラー型（error-handling.md §2 準拠）
 *
 * ドメイン層（lib/）・サービス層は意味のある業務例外をここで定義した型で投げる。
 * 各型は api-response.md の `code` 語彙と HTTP ステータスを保持する。
 * レスポンスへの変換は `lib/api/error-response.ts` の共通ヘルパに集約する。
 */

/**
 * 全アプリケーション例外の基底クラス。
 *
 * - `code`: api-response.md の UPPER_SNAKE_CASE エラー分類コード（派生型が readonly 実装）
 * - `status`: 対応する HTTP ステータス（派生型が readonly 実装）
 * - `errors`: フィールド別エラーメッセージ（入力バリデーション時など任意）
 */
export abstract class AppError extends Error {
  /** api-response.md の `code` 語彙（例: "VALIDATION_ERROR"） */
  abstract readonly code: string;
  /** HTTP ステータス（例: 400） */
  abstract readonly status: number;
  /** フィールド別エラーメッセージ（任意。キー＝フィールド名 / 値＝日本語メッセージ） */
  readonly errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    // Error 継承時のプロトタイプチェーン維持（instanceof を機能させる）
    this.name = new.target.name;
    this.errors = errors;
    // ターゲットのプロトタイプを明示設定（トランスパイル環境での instanceof 対策）
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 入力スキーマ検証エラー（400）。`errors` にフィールド別メッセージを付与できる。 */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;

  constructor(
    message = "入力値が不正です",
    errors?: Record<string, string>,
  ) {
    super(message, errors);
  }
}

/** 未認証（401）。原則 middleware / 認証層が返す。 */
export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED";
  readonly status = 401;

  constructor(message = "認証が必要です") {
    super(message);
  }
}

/** 認可不可（403。権限不足）。 */
export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "この操作を行う権限がありません") {
    super(message);
  }
}

/** 指定リソースが存在しない（404）。 */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly status = 404;

  constructor(message = "対象が見つかりません") {
    super(message);
  }
}

/** 一意制約違反 / 状態不整合 / 重複登録（409）。 */
export class ConflictError extends AppError {
  readonly code = "CONFLICT";
  readonly status = 409;

  constructor(message = "競合が発生しました") {
    super(message);
  }
}

/**
 * 外部サービス失敗（Claude / DB / Entra / メール等）。
 *
 * レスポンス上は `INTERNAL_ERROR`（500）として扱い、内部詳細はログにのみ出す
 * （api-response.md §4）。`message` には原因を残してログ用途に使える。
 */
export class ExternalServiceError extends AppError {
  readonly code = "INTERNAL_ERROR";
  readonly status = 500;

  constructor(message = "外部サービスとの通信に失敗しました") {
    super(message);
  }
}
