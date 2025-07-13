import type { QueryRegistry } from './query-bus.interface'
import type { Query, QueryHandler } from '../queries/query.interface'

/**
 * Query Registry実装
 *
 * クエリタイプとハンドラーのマッピングを管理します。
 */
export class QueryRegistryImpl implements QueryRegistry {
  private readonly handlers = new Map<
    new (...args: never[]) => Query,
    QueryHandler<Query, unknown>
  >()

  /**
   * 登録されているすべてのハンドラーを取得します
   *
   * @returns ハンドラーのコピー
   */
  getAllHandlers(): Map<
    new (...args: never[]) => Query,
    QueryHandler<Query, unknown>
  > {
    return new Map(this.handlers)
  }

  /**
   * クエリタイプに対応するハンドラーを取得します
   *
   * @param queryType - クエリのタイプ（コンストラクタ関数）
   * @returns ハンドラーまたはundefined
   */
  getHandler<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery
  ): QueryHandler<TQuery, TResult> | undefined {
    return this.handlers.get(queryType) as
      | QueryHandler<TQuery, TResult>
      | undefined
  }

  /**
   * ハンドラーを登録します
   *
   * @param queryType - クエリのタイプ（コンストラクタ関数）
   * @param handler - クエリハンドラー
   */
  registerHandler<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler)
  }
}
