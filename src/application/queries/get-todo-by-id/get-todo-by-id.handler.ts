import type { QueryHandler } from '../query.interface'
import type {
  GetTodoByIdQuery,
  GetTodoByIdQueryResult,
} from './get-todo-by-id.query'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { TodoId } from '@/domain/value-objects/todo-id'

/**
 * TODO詳細取得クエリハンドラー
 *
 * GetTodoByIdQueryを処理してTODO詳細データを取得します。
 * ユーザー認可チェックも実行します。
 */
export class GetTodoByIdQueryHandler
  implements QueryHandler<GetTodoByIdQuery, GetTodoByIdQueryResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO詳細取得クエリを実行します
   *
   * @param query - TODO詳細取得クエリ
   * @returns 詳細取得結果
   */
  async handle(query: GetTodoByIdQuery): Promise<GetTodoByIdQueryResult> {
    try {
      // 入力値の基本検証
      if (!query.todoId || query.todoId.trim() === '') {
        return {
          error: 'TODO IDは必須です',
          success: false,
        }
      }

      if (!query.userId || query.userId.trim() === '') {
        return {
          error: 'ユーザーIDは必須です',
          success: false,
        }
      }

      // リポジトリからTODOを取得
      const todoId = TodoId.fromString(query.todoId)
      const todo = await this.todoRepository.findById(todoId)

      // TODOが見つからない場合
      if (!todo) {
        return {
          error: 'TODOが見つかりません',
          success: false,
        }
      }

      // ユーザー認可チェック
      if (todo.userId !== query.userId) {
        return {
          error: 'このTODOにアクセスする権限がありません',
          success: false,
        }
      }

      return {
        success: true,
        todo,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー'

      return {
        error: `TODO詳細の取得に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }
}
