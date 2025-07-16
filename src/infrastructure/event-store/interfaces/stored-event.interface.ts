/**
 * 新しいStoredEventを作成するためのデータ
 */
export interface CreateStoredEventData {
  readonly aggregateId: string
  readonly eventData: string
  readonly eventType: string
  readonly metadata: string
  readonly occurredAt: Date
  readonly version: number
}

/**
 * イベント取得時のフィルタ条件
 */
export interface EventFilter {
  /**
   * アグリゲートID
   */
  aggregateId?: string

  /**
   * 特定のイベントタイプのみを取得
   */
  eventTypes?: string[]

  /**
   * 指定日時以降のイベントを取得
   */
  fromDate?: Date

  /**
   * 指定バージョン以降のイベントを取得
   */
  fromVersion?: number

  /**
   * 取得件数の制限
   */
  limit?: number

  /**
   * オフセット
   */
  offset?: number

  /**
   * 指定日時までのイベントを取得
   */
  toDate?: Date

  /**
   * 指定バージョンまでのイベントを取得
   */
  toVersion?: number
}

/**
 * イベント取得結果
 */
export interface EventStreamResult {
  /**
   * 取得されたイベント
   */
  readonly events: StoredEvent[]

  /**
   * 次のページがあるかどうか
   */
  readonly hasMore: boolean

  /**
   * 最後のバージョン
   */
  readonly lastVersion: number

  /**
   * 総件数
   */
  readonly totalCount: number
}

/**
 * EventStore用の永続化されたイベントインターフェース
 */
export interface StoredEvent {
  /**
   * アグリゲートの識別子
   */
  readonly aggregateId: string

  /**
   * イベントデータ（JSON形式）
   */
  readonly eventData: string

  /**
   * イベントのタイプ
   */
  readonly eventType: string

  /**
   * イベントの一意識別子
   */
  readonly id: string

  /**
   * EventStore挿入日時
   */
  readonly insertedAt: Date

  /**
   * イベントメタデータ（JSON形式）
   */
  readonly metadata: string

  /**
   * イベント発生日時
   */
  readonly occurredAt: Date

  /**
   * アグリゲートのバージョン
   */
  readonly version: number
}
