import type { Query } from '../query.interface'

/**
 * TODO統計情報取得クエリ結果
 */
export interface GetTodoStatsQueryResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * 統計情報
   */
  stats?: TodoStats

  /**
   * 実行成功フラグ
   */
  success: boolean
}

/**
 * TODO統計情報
 */
export interface TodoStats {
  /**
   * 今日締切のタスク数
   */
  dueToday: number

  /**
   * 重要なタスク数
   */
  important: number

  /**
   * 期限切れタスク数
   */
  overdue: number

  /**
   * 未完了タスク数
   */
  pending: number

  /**
   * 完了タスク数
   */
  total: number

  /**
   * 今後の予定タスク数
   */
  upcoming: number
}

/**
 * TODO統計情報取得クエリ
 *
 * ユーザーのTODO統計情報を取得するクエリです。
 */
export class GetTodoStatsQuery implements Query {
  /**
   * クエリの実行時刻
   */
  readonly timestamp: Date

  /**
   * GetTodoStatsQueryを作成します
   *
   * @param userId - ユーザーID
   */
  constructor(public readonly userId: string) {
    this.timestamp = new Date()
  }
}
