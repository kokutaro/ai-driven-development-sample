import type {
  EventFilter,
  EventStreamResult,
  StoredEvent,
} from './stored-event.interface'
import type { DomainEvent } from '@/domain/events/domain-events'

// 例外クラスは別ファイルからインポート
export {
  AggregateNotFoundException,
  ConcurrencyException,
  EventSerializationException,
  EventStoreConfigurationException,
  EventStoreException,
} from '../exceptions/event-store-exceptions'

/**
 * イベント追加結果
 */
export interface AppendEventsResult {
  readonly error?: string
  readonly insertedCount: number
  readonly lastVersion: number
  readonly success: boolean
}

/**
 * EventStoreインターフェース
 *
 * ドメインイベントの永続化・取得・再生機能を提供します。
 * CQRS/Event Sourcingパターンの中核となるコンポーネントです。
 */
export interface EventStore {
  /**
   * アグリゲートにイベントを追加します
   *
   * @param aggregateId - アグリゲートの識別子
   * @param events - 追加するドメインイベントの配列
   * @param expectedVersion - 期待されるアグリゲートのバージョン（楽観的ロック）
   * @returns 追加結果
   * @throws ConcurrencyException - バージョンの競合が発生した場合
   * @throws EventStoreException - その他のエラーが発生した場合
   */
  appendEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<AppendEventsResult>

  /**
   * すべてのイベントを取得します（主にEvent Bus用）
   *
   * @param fromPosition - 開始位置（省略時は先頭から）
   * @param limit - 取得件数制限（省略時は100件）
   * @returns すべてのイベント
   * @throws EventStoreException - エラーが発生した場合
   */
  getAllEvents(fromPosition?: number, limit?: number): Promise<StoredEvent[]>

  /**
   * アグリゲートの現在のバージョンを取得します
   *
   * @param aggregateId - アグリゲートの識別子
   * @returns 現在のバージョン（イベントが存在しない場合は0）
   * @throws EventStoreException - エラーが発生した場合
   */
  getCurrentVersion(aggregateId: string): Promise<number>

  /**
   * フィルタ条件に基づいてイベントを取得します
   *
   * @param filter - フィルタ条件
   * @returns フィルタリングされたイベント
   * @throws EventStoreException - エラーが発生した場合
   */
  getEvents(filter: EventFilter): Promise<EventStreamResult>

  /**
   * 特定のイベントタイプのイベントを取得します
   *
   * @param eventTypes - 取得するイベントタイプの配列
   * @param fromDate - 開始日時（省略時は先頭から）
   * @param limit - 取得件数制限（省略時は100件）
   * @returns 指定されたタイプのイベント
   * @throws EventStoreException - エラーが発生した場合
   */
  getEventsByType(
    eventTypes: string[],
    fromDate?: Date,
    limit?: number
  ): Promise<StoredEvent[]>

  /**
   * アグリゲートのイベントストリームを取得します
   *
   * @param aggregateId - アグリゲートの識別子
   * @param fromVersion - 開始バージョン（省略時は1から）
   * @param toVersion - 終了バージョン（省略時は最新まで）
   * @returns イベントストリーム
   * @throws EventStoreException - エラーが発生した場合
   */
  getEventStream(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<EventStreamResult>

  /**
   * 統計情報を取得します
   *
   * @returns EventStoreの統計情報
   */
  getStatistics(): Promise<
    EventStoreResult<{
      eventsByType: Record<string, number>
      lastEventDate: Date | null
      totalAggregates: number
      totalEvents: number
    }>
  >

  /**
   * EventStoreの健全性をチェックします
   *
   * @returns 健全性チェック結果
   */
  healthCheck(): Promise<
    EventStoreResult<{ connected: boolean; latency: number }>
  >
}

// 他のファイルから利用可能にするため再エクスポート
export type {
  CreateStoredEventData,
  EventFilter,
  EventStreamResult,
  StoredEvent,
} from './stored-event.interface'

/**
 * EventStore設定
 */
export interface EventStoreConfig {
  /**
   * データベース接続文字列
   */
  readonly connectionString: string

  /**
   * デバッグモード
   */
  readonly debug?: boolean

  /**
   * 接続プールの最大サイズ
   */
  readonly maxConnections?: number

  /**
   * クエリタイムアウト（ミリ秒）
   */
  readonly queryTimeout?: number

  /**
   * スキーマ名（PostgreSQL用）
   */
  readonly schema?: string

  /**
   * イベントテーブル名（デフォルト: "event_store"）
   */
  readonly tableName?: string
}

/**
 * EventStore操作結果
 */
export interface EventStoreResult<T = void> {
  readonly data?: T
  readonly error?: string
  readonly success: boolean
}
