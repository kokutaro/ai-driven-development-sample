import type { Query } from '../query.interface'
import type { TodoEntity } from '@/domain/entities/todo-entity'

/**
 * TODO一覧取得クエリ結果
 */
export interface GetTodosQueryResult {
  /**
   * エラーメッセージ（失敗時）
   */
  error?: string

  /**
   * ページング情報
   */
  pagination?: {
    hasNext: boolean
    hasPrevious: boolean
    limit: number
    page: number
    total: number
    totalPages: number
  }

  /**
   * 実行成功フラグ
   */
  success: boolean

  /**
   * TODO一覧データ
   */
  todos?: TodoEntity[]
}

/**
 * ページング設定
 */
export interface PaginationSettings {
  /**
   * 1ページあたりの件数
   */
  limit: number

  /**
   * スキップするレコード数
   */
  offset?: number

  /**
   * ページ番号（1から開始）
   */
  page: number
}

/**
 * ソート設定
 */
export interface SortSettings {
  /**
   * ソート方向
   */
  direction: 'asc' | 'desc'

  /**
   * ソートフィールド
   */
  field: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'updatedAt'
}

/**
 * TODO一覧取得フィルター
 */
export interface TodoFilter {
  /**
   * カテゴリID
   */
  categoryId?: string

  /**
   * 期限日範囲
   */
  dueDateRange?: {
    end?: Date
    start?: Date
  }

  /**
   * 完了状態
   */
  isCompleted?: boolean

  /**
   * 重要フラグ
   */
  isImportant?: boolean

  /**
   * 検索キーワード
   */
  searchTerm?: string
}

/**
 * TODO一覧取得クエリ
 *
 * 指定された条件でTODO一覧を取得するクエリです。
 */
export class GetTodosQuery implements Query {
  /**
   * クエリの実行時刻
   */
  readonly timestamp: Date

  /**
   * GetTodosQueryを作成します
   *
   * @param userId - ユーザーID
   * @param filter - フィルター条件（任意）
   * @param pagination - ページング設定（任意）
   * @param sort - ソート設定（任意）
   */
  constructor(
    public readonly userId: string,
    public readonly filter?: TodoFilter,
    public readonly pagination?: PaginationSettings,
    public readonly sort?: SortSettings
  ) {
    this.timestamp = new Date()
  }
}
