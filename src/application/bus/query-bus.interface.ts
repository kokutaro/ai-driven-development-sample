import type { Query, QueryHandler } from '../queries/query.interface'

/**
 * Query Busインターフェース
 *
 * クエリの実行を抽象化し、適切なハンドラーに委譲します。
 */
export interface QueryBus {
  /**
   * クエリを実行します
   *
   * @param query - 実行するクエリ
   * @returns 実行結果
   */
  execute<TQuery extends Query, TResult>(query: TQuery): Promise<TResult>

  /**
   * クエリハンドラーを登録します
   *
   * @param queryType - クエリのタイプ（コンストラクタ関数）
   * @param handler - クエリハンドラー
   */
  register<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void
}

/**
 * Query Dispatcherインターフェース
 *
 * クエリを受信し、適切なハンドラーに配信します。
 */
export interface QueryDispatcher {
  /**
   * クエリを配信します
   *
   * @param query - 配信するクエリ
   * @returns 配信結果
   */
  dispatch<TQuery extends Query, TResult>(query: TQuery): Promise<TResult>
}

/**
 * Query Registry
 *
 * クエリタイプとハンドラーのマッピングを管理します。
 */
export interface QueryRegistry {
  /**
   * 登録されているすべてのハンドラーを取得します
   */
  getAllHandlers(): Map<
    new (...args: never[]) => Query,
    QueryHandler<Query, unknown>
  >

  /**
   * クエリタイプに対応するハンドラーを取得します
   */
  getHandler<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery
  ): QueryHandler<TQuery, TResult> | undefined

  /**
   * ハンドラーを登録します
   */
  registerHandler<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void
}
