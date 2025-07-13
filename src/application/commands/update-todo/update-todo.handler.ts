import { type UpdateTodoCommandResult } from './update-todo.command'

import type { CommandHandler } from '../command.interface'
import type { UpdateTodoCommand } from './update-todo.command'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { TodoId } from '@/domain/value-objects/todo-id'

/**
 * TODO更新コマンドハンドラー
 *
 * UpdateTodoCommandを処理して既存のTODOエンティティを更新します。
 * 認可チェックを行い、ドメインルールに従って更新します。
 */
export class UpdateTodoCommandHandler
  implements CommandHandler<UpdateTodoCommand, UpdateTodoCommandResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO更新コマンドを実行します
   *
   * @param command - TODO更新コマンド
   * @returns 更新結果
   */
  async handle(command: UpdateTodoCommand): Promise<UpdateTodoCommandResult> {
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
          error: 'このTODOを更新する権限がありません',
          success: false,
        }
      }

      // 更新処理
      if (command.title !== undefined) {
        todoEntity.updateTitle(command.title)
      }

      if (command.description !== undefined) {
        todoEntity.updateDescription(command.description)
      }

      if (command.dueDate !== undefined) {
        todoEntity.updateDueDate(command.dueDate)
      }

      if (command.priority !== undefined) {
        todoEntity.updatePriority(command.priority)
      }

      // リポジトリに保存
      const savedTodo = await this.todoRepository.save(todoEntity)

      // ドメインイベントをクリア（永続化後）
      savedTodo.clearUncommittedEvents()

      return {
        success: true,
        todoId: savedTodo.id.value,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラー'

      return {
        error: `TODO更新に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }
}
