import type { Command } from '../command.interface'

/**
 * TODO削除コマンド実行結果
 */
export interface DeleteTodoCommandResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 実行成功フラグ
   */
  success: boolean

  /**
   * 削除されたTODOのID
   */
  todoId?: string
}

/**
 * TODO削除コマンド
 *
 * 既存のTODOタスクを削除するためのコマンドです。
 */
export class DeleteTodoCommand implements Command {
  /**
   * コマンドの実行時刻
   */
  readonly timestamp: Date

  /**
   * DeleteTodoCommandを作成します
   *
   * @param todoId - 削除対象のTODO ID
   * @param userId - ユーザーID（認可用）
   */
  constructor(
    public readonly todoId: string,
    public readonly userId: string
  ) {
    this.timestamp = new Date()
  }
}
