import { type DeleteTodoCommandResult } from './delete-todo.command'

import type { CommandHandler } from '../command.interface'
import type { DeleteTodoCommand } from './delete-todo.command'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { TodoId } from '@/domain/value-objects/todo-id'

/**
 * TODO削除コマンドハンドラー
 *
 * DeleteTodoCommandを処理して既存のTODOエンティティを削除します。
 * 認可チェックを行い、安全に削除を実行します。
 */
export class DeleteTodoCommandHandler
  implements CommandHandler<DeleteTodoCommand, DeleteTodoCommandResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO削除コマンドを実行します
   *
   * @param command - TODO削除コマンド
   * @returns 削除結果
   */
  async handle(command: DeleteTodoCommand): Promise<DeleteTodoCommandResult> {
    try {
      // TodoIDの検証
      let todoId: TodoId
      try {
        todoId = TodoId.fromString(command.todoId)
      } catch {
        return {
          error: '無効なTODO IDです',
          success: false,
        }
      }

      // TODOの取得
      const todoEntity = await this.todoRepository.findById(todoId)
      if (!todoEntity) {
        return {
          error: 'TODOが見つかりません',
          success: false,
        }
      }

      // 認可チェック
      if (todoEntity.userId !== command.userId) {
        return {
          error: 'このTODOを削除する権限がありません',
          success: false,
        }
      }

      // 削除実行
      const deleteSuccess = await this.todoRepository.delete(todoId)
      if (!deleteSuccess) {
        return {
          error: 'TODOの削除に失敗しました',
          success: false,
        }
      }

      return {
        success: true,
        todoId: todoEntity.id.value,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー'

      return {
        error: `TODO削除に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }
}
