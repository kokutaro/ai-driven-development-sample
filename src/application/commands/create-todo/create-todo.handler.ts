import { type CreateTodoCommandResult } from './create-todo.command'

import type { CommandHandler } from '../command.interface'
import type { CreateTodoCommand } from './create-todo.command'
import type { TodoRepository } from '@/domain/repositories/todo-repository'

import { TodoEntity } from '@/domain/entities/todo-entity'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

/**
 * TODO作成コマンドハンドラー
 *
 * CreateTodoCommandを処理して新しいTODOエンティティを作成します。
 * ドメインルールに従って検証を行い、リポジトリに永続化します。
 */
export class CreateTodoCommandHandler
  implements CommandHandler<CreateTodoCommand, CreateTodoCommandResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * TODO作成コマンドを実行します
   *
   * @param command - TODO作成コマンド
   * @returns 作成結果
   */
  async handle(command: CreateTodoCommand): Promise<CreateTodoCommandResult> {
    try {
      // 入力値の基本検証
      if (!command.title || command.title.trim() === '') {
        return {
          error: 'タイトルは必須です',
          success: false,
        }
      }

      if (!command.userId || command.userId.trim() === '') {
        return {
          error: 'ユーザーIDは必須です',
          success: false,
        }
      }

      // TodoEntityを作成
      const todoEntity = TodoEntity.create({
        description: command.description?.trim(),
        dueDate: command.dueDate,
        id: TodoId.generate(),
        priority: command.priority ?? Priority.NORMAL(),
        status: TodoStatus.PENDING(),
        title: command.title.trim(),
        userId: command.userId,
      })

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
        error: `TODO作成に失敗しました: ${errorMessage}`,
        success: false,
      }
    }
  }
}
