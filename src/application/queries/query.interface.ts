/**
 * Query基底インターフェース
 *
 * すべてのQueryはこのインターフェースを実装します。
 * CQRSパターンにおけるQuery側の操作を表現します。
 */
export interface Query {
  /**
   * クエリの実行時刻
   */
  readonly timestamp: Date
}

/**
 * QueryHandler基底インターフェース
 *
 * 各QueryHandlerは対応するQueryを処理します。
 */
export interface QueryHandler<TQuery extends Query, TResult> {
  /**
   * クエリを実行します
   *
   * @param query - 実行するクエリ
   * @returns 実行結果
   */
  handle(query: TQuery): Promise<TResult>
}

/**
 * Query実行結果の基底インターフェース
 */
export interface QueryResult<T> {
  /**
   * データ（成功時）
   */
  data?: T

  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean
}
