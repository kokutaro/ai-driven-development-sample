/**
 * TODO Read Model インターフェース
 *
 * クエリ最適化のための読み取り専用データ構造を定義します。
 * ドメインエンティティとは異なり、クエリパフォーマンスに特化した構造です。
 */

/**
 * TODO Read Model
 *
 * クエリ処理に最適化されたTODOデータ構造
 */
export interface TodoReadModel {
  /**
   * カテゴリ情報（非正規化）
   */
  category?: {
    color: string
    id: string
    name: string
  }

  /**
   * 完了済みサブタスク数
   */
  completedSubTaskCount: number

  /**
   * 作成日時
   */
  createdAt: Date

  /**
   * 説明
   */
  description?: string

  /**
   * 期限日
   */
  dueDate?: Date

  /**
   * TODO ID
   */
  id: string

  /**
   * 完了フラグ
   */
  isCompleted: boolean

  /**
   * 重要フラグ
   */
  isImportant: boolean

  /**
   * 期限切れフラグ（計算済み）
   */
  isOverdue: boolean

  /**
   * 優先度（文字列表現）
   */
  priority: string

  /**
   * ステータス（文字列表現）
   */
  status: string

  /**
   * サブタスク数
   */
  subTaskCount: number

  /**
   * タイトル
   */
  title: string

  /**
   * 更新日時
   */
  updatedAt: Date

  /**
   * ユーザーID
   */
  userId: string
}

/**
 * TODO Read Model フィルター
 */
export interface TodoReadModelFilter {
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
   * 期限切れフラグ
   */
  isOverdue?: boolean

  /**
   * 検索キーワード
   */
  searchTerm?: string

  /**
   * ステータス
   */
  status?: string
}

/**
 * Read Model Repository インターフェース
 *
 * Read Model専用のデータアクセス抽象化
 */
export interface TodoReadModelRepository {
  /**
   * TODO Read Modelを削除します
   *
   * @param id - TODO ID
   */
  delete(id: string): Promise<void>

  /**
   * TODO Read Modelを取得します
   *
   * @param id - TODO ID
   * @returns TODO Read Model
   */
  findById(id: string): Promise<TodoReadModel | undefined>

  /**
   * ユーザーのTODO Read Model一覧を取得します
   *
   * @param userId - ユーザーID
   * @param options - クエリオプション
   * @returns TODO Read Model一覧
   */
  findByUserId(
    userId: string,
    options?: {
      filter?: TodoReadModelFilter
      pagination?: {
        limit: number
        page: number
      }
      sort?: {
        direction: 'asc' | 'desc'
        field: keyof TodoReadModel
      }
    }
  ): Promise<TodoReadModel[]>

  /**
   * ユーザーのTODO統計を取得します
   *
   * @param userId - ユーザーID
   * @returns TODO統計 Read Model
   */
  getStats(userId: string): Promise<TodoStatsReadModel>

  /**
   * 統計情報を再計算・更新します
   *
   * @param userId - ユーザーID
   */
  refreshStats(userId: string): Promise<void>

  /**
   * TODO Read Modelを保存します（ドメインイベントからの更新）
   *
   * @param todoReadModel - TODO Read Model
   */
  save(todoReadModel: TodoReadModel): Promise<void>
}

/**
 * TODO統計 Read Model
 *
 * ダッシュボード表示用の統計データ
 */
export interface TodoStatsReadModel {
  /**
   * カテゴリ別統計
   */
  categoryStats: Array<{
    categoryId: string
    categoryName: string
    completedCount: number
    totalCount: number
  }>

  /**
   * 完了タスク数
   */
  completedCount: number

  /**
   * 完了率（％）
   */
  completionRate: number

  /**
   * 今日締切タスク数
   */
  dueTodayCount: number

  /**
   * 重要タスク数
   */
  importantCount: number

  /**
   * 最終更新日時
   */
  lastUpdated: Date

  /**
   * 期限切れタスク数
   */
  overdueCount: number

  /**
   * 未完了タスク数
   */
  pendingCount: number

  /**
   * 全タスク数
   */
  totalCount: number

  /**
   * 今後の予定タスク数
   */
  upcomingCount: number

  /**
   * ユーザーID
   */
  userId: string
}
