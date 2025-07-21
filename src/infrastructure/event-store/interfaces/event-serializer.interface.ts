import type { DomainEvent } from '@/domain/events/domain-events'

/**
 * デシリアライズ結果
 */
export interface DeserializeResult<T = DomainEvent> {
  readonly error?: string
  readonly event?: T
  readonly success: boolean
}

/**
 * EventSerializerインターフェース
 *
 * ドメインイベントのシリアライズ・デシリアライズを行います。
 * EventStoreでの永続化時にJSONとして保存・復元するために使用されます。
 */
export interface EventSerializer {
  /**
   * JSONからドメインイベントにデシリアライズします
   *
   * @param eventType - イベントタイプ
   * @param eventData - イベントデータ（JSON文字列）
   * @param metadata - メタデータ（JSON文字列）
   * @returns デシリアライズされたドメインイベント
   */
  deserialize<T extends DomainEvent = DomainEvent>(
    eventType: string,
    eventData: string,
    metadata: string
  ): DeserializeResult<T>

  /**
   * ドメインイベントから詳細なメタデータを抽出します
   *
   * @param event - ドメインイベント
   * @returns メタデータオブジェクト
   */
  extractMetadata(event: DomainEvent): Record<string, unknown>

  /**
   * イベントタイプレジストリを取得します
   *
   * @returns イベントタイプレジストリ
   */
  getRegistry(): EventTypeRegistry

  /**
   * ドメインイベントをJSONにシリアライズします
   *
   * @param event - シリアライズするドメインイベント
   * @returns シリアライズ結果
   */
  serialize(event: DomainEvent): SerializeResult

  /**
   * シリアライザの健全性をチェックします
   *
   * @returns チェック結果
   */
  validate(): { errors: string[]; valid: boolean }
}

/**
 * イベントタイプレジストリ
 *
 * イベントタイプ名からコンストラクタへのマッピングを管理します
 */
export interface EventTypeRegistry {
  /**
   * 登録されているすべてのイベントタイプを取得します
   *
   * @returns イベントタイプ名の配列
   */
  getAllEventTypes(): string[]

  /**
   * イベントタイプのコンストラクタを取得します
   *
   * @param eventType - イベントタイプ名
   * @returns コンストラクタ（登録されていない場合はundefined）
   */
  getConstructor<T extends DomainEvent>(
    eventType: string
  ): (new (...args: unknown[]) => T) | undefined

  /**
   * イベントタイプが登録されているかチェックします
   *
   * @param eventType - イベントタイプ名
   * @returns 登録されている場合はtrue
   */
  isRegistered(eventType: string): boolean

  /**
   * イベントタイプを登録します
   *
   * @param eventType - イベントタイプ名
   * @param constructor - イベントクラスのコンストラクタ
   */
  register<T extends DomainEvent>(
    eventType: string,
    constructor: new (...args: unknown[]) => T
  ): void
}

/**
 * JSONベースのEventSerializer設定
 */
export interface JsonEventSerializerConfig {
  /**
   * カスタムメタデータの抽出関数
   */
  readonly customMetadataExtractor?: (
    event: DomainEvent
  ) => Record<string, unknown>

  /**
   * デバッグモード
   */
  readonly debug?: boolean

  /**
   * メタデータにスタックトレースを含めるかどうか
   */
  readonly includeStackTrace?: boolean

  /**
   * 美しく整形されたJSONを出力するかどうか
   */
  readonly prettyPrint?: boolean

  /**
   * dateを文字列として保存するかどうか
   */
  readonly stringifyDates?: boolean
}

/**
 * シリアライズされたイベントデータ
 */
export interface SerializedEventData {
  /**
   * イベントデータ（JSON文字列）
   */
  readonly eventData: string

  /**
   * メタデータ（JSON文字列）
   */
  readonly metadata: string
}

/**
 * シリアライズ結果
 */
export interface SerializeResult {
  readonly data?: SerializedEventData
  readonly error?: string
  readonly success: boolean
}
