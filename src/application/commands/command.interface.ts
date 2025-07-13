/**
 * Command基底インターフェース
 *
 * すべてのCommandはこのインターフェースを実装します。
 * CQRSパターンにおけるCommand側の操作を表現します。
 */
export interface Command {
  /**
   * コマンドの実行時刻
   */
  readonly timestamp: Date
}

/**
 * CommandHandler基底インターフェース
 *
 * 各CommandHandlerは対応するCommandを処理します。
 */
export interface CommandHandler<TCommand extends Command, TResult = void> {
  /**
   * コマンドを実行します
   *
   * @param command - 実行するコマンド
   * @returns 実行結果
   */
  handle(command: TCommand): Promise<TResult>
}

/**
 * Command実行結果の基底インターフェース
 */
export interface CommandResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean
}
