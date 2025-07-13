import type { Command } from '../command.interface'
import type { DueDate } from '@/domain/value-objects/due-date'
import type { Priority } from '@/domain/value-objects/priority'

/**
 * TODO更新コマンド実行結果
 */
export interface UpdateTodoCommandResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean

  /**
   * 更新されたTODOのID
   */
  todoId?: string
}

/**
 * TODO更新コマンド
 *
 * 既存のTODOタスクを更新するためのコマンドです。
 */
export class UpdateTodoCommand implements Command {
  /**
   * コマンドの実行時刻
   */
  readonly timestamp: Date

  /**
   * UpdateTodoCommandを作成します
   *
   * @param todoId - 更新対象のTODO ID
   * @param userId - ユーザーID（認可用）
   * @param title - TODOタイトル（任意）
   * @param description - 説明（任意）
   * @param dueDate - 期限日（任意）
   * @param priority - 優先度（任意）
   * @param categoryId - カテゴリID（任意）
   */
  constructor(
    public readonly todoId: string,
    public readonly userId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly dueDate?: DueDate,
    public readonly priority?: Priority,
    public readonly categoryId?: string
  ) {
    this.timestamp = new Date()
  }
}
