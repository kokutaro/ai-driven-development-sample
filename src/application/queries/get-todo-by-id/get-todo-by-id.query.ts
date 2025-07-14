import type { Query } from '../query.interface'
import type { TodoEntity } from '@/domain/entities/todo-entity'

/**
 * TODO詳細取得クエリ結果
 */
export interface GetTodoByIdQueryResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean

  /**
   * TODOデータ
   */
  todo?: TodoEntity
}

/**
 * TODO詳細取得クエリ
 *
 * 指定されたIDのTODO詳細を取得するクエリです。
 */
export class GetTodoByIdQuery implements Query {
  /**
   * クエリの実行時刻
   */
  readonly timestamp: Date

  /**
   * GetTodoByIdQueryを作成します
   *
   * @param todoId - TODO ID
   * @param userId - ユーザーID（認可チェック用）
   */
  constructor(
    public readonly todoId: string,
    public readonly userId: string
  ) {
    this.timestamp = new Date()
  }
}
