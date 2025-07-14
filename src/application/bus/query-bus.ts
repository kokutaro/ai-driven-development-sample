import type { QueryBus, QueryRegistry } from './query-bus.interface'
import type { Query, QueryHandler } from '../queries/query.interface'

/**
 * Query Bus実装
 *
 * クエリの実行を管理し、適切なハンドラーに委譲します。
 */
export class QueryBusImpl implements QueryBus {
  constructor(private readonly registry: QueryRegistry) {}

  /**
   * クエリを実行します
   *
   * @param query - 実行するクエリ
   * @returns 実行結果
   */
  async execute<TQuery extends Query, TResult>(
    query: TQuery
  ): Promise<TResult> {
    // 入力値検証
    if (query === null || query === undefined) {
      throw new Error('Query cannot be null or undefined')
    }

    // クエリタイプを取得
    const queryType = query.constructor as new (...args: never[]) => TQuery

    // ハンドラーを取得
    const handler = this.registry.getHandler<TQuery, TResult>(queryType)

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryType.name}`)
    }

    // ハンドラーを実行
    return await handler.handle(query)
  }

  /**
   * クエリハンドラーを登録します
   *
   * @param queryType - クエリのタイプ（コンストラクタ関数）
   * @param handler - クエリハンドラー
   */
  register<TQuery extends Query, TResult>(
    queryType: new (...args: never[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    // 入力値検証
    if (handler === null || handler === undefined) {
      throw new Error('Handler cannot be null or undefined')
    }

    this.registry.registerHandler(queryType, handler)
  }
}
