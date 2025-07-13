import type { Command } from '../command.interface'
import type { DueDate } from '@/domain/value-objects/due-date'
import type { Priority } from '@/domain/value-objects/priority'

/**
 * TODO作成コマンド実行結果
 */
export interface CreateTodoCommandResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean

  /**
   * 作成されたTODOのID
   */
  todoId?: string
}

/**
 * TODO作成コマンド
 *
 * 新しいTODOタスクを作成するためのコマンドです。
 */
export class CreateTodoCommand implements Command {
  /**
   * コマンドの実行時刻
   */
  readonly timestamp: Date

  /**
   * CreateTodoCommandを作成します
   *
   * @param title - TODOタイトル
   * @param userId - ユーザーID
   * @param description - 説明（任意）
   * @param dueDate - 期限日（任意）
   * @param priority - 優先度（任意）
   * @param categoryId - カテゴリID（任意）
   */
  constructor(
    public readonly title: string,
    public readonly userId: string,
    public readonly description?: string,
    public readonly dueDate?: DueDate,
    public readonly priority?: Priority,
    public readonly categoryId?: string
  ) {
    this.timestamp = new Date()
  }
}
