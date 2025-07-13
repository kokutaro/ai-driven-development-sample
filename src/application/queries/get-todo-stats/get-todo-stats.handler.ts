import type { QueryHandler } from '../query.interface'
import type {
  GetTodoStatsQuery,
  GetTodoStatsQueryResult,
  TodoStats,
} from './get-todo-stats.query'
import type { TodoEntity } from '@/domain/entities/todo-entity'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { TodoStatus } from '@/domain/value-objects/todo-status'

/**
 * TODO統計情報取得クエリハンドラー
 *
 * GetTodoStatsQueryを処理してTODO統計情報を計算します。
 */
export class GetTodoStatsQueryHandler
  implements QueryHandler<GetTodoStatsQuery, GetTodoStatsQueryResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO統計情報取得クエリを実行します
   *
   * @param query - TODO統計情報取得クエリ
   * @returns 統計情報取得結果
   */
  async handle(query: GetTodoStatsQuery): Promise<GetTodoStatsQueryResult> {
    try {
      // 入力値の基本検証
      if (!query.userId || query.userId.trim() === '') {
        return {
          error: 'ユーザーIDは必須です',
          success: false,
        }
      }

      // 全TODOを取得
      const todos = await this.todoRepository.findAllByUserId(query.userId)

      // 統計情報を計算
      const stats = this.calculateStats(todos)

      return {
        stats,
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー'

      return {
        error: `TODO統計情報の取得に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }

  /**
   * TODO一覧から統計情報を計算します
   *
   * @param todos - TODO一覧
   * @returns 統計情報
   */
  private calculateStats(todos: TodoEntity[]): TodoStats {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 今日の終わり

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      dueToday: todos.filter((todo) => {
        if (!todo.dueDate) return false
        const dueDate = todo.dueDate.toDate()
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)
        return dueDate >= todayStart && dueDate <= today
      }).length,
      important: todos.filter((todo) => todo.priority?.isHigh()).length,
      overdue: todos.filter((todo) => {
        if (typeof todo.isOverdue === 'function') {
          return todo.isOverdue()
        }
        return false
      }).length,
      pending: todos.filter(
        (todo) => !todo.status.equals(TodoStatus.COMPLETED())
      ).length,
      total: todos.length,
      upcoming: todos.filter((todo) => {
        if (!todo.dueDate) return false
        const dueDate = todo.dueDate.toDate()
        return (
          dueDate >= tomorrow && !todo.status.equals(TodoStatus.COMPLETED())
        )
      }).length,
    }
  }
}
