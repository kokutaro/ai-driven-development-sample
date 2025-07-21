import type {
  DeserializeResult,
  EventSerializer,
  EventTypeRegistry,
  JsonEventSerializerConfig,
  SerializedEventData,
  SerializeResult,
} from '../interfaces/event-serializer.interface'
import type { DomainEvent } from '@/domain/events/domain-events'

/**
 * イベントタイプレジストリの実装
 */
class EventTypeRegistryImpl implements EventTypeRegistry {
  private readonly eventTypes = new Map<
    string,
    new (...args: unknown[]) => DomainEvent
  >()

  getAllEventTypes(): string[] {
    return [...this.eventTypes.keys()]
  }

  getConstructor<T extends DomainEvent>(
    eventType: string
  ): (new (...args: unknown[]) => T) | undefined {
    return this.eventTypes.get(eventType) as
      | (new (...args: unknown[]) => T)
      | undefined
  }

  isRegistered(eventType: string): boolean {
    return this.eventTypes.has(eventType)
  }

  register<T extends DomainEvent>(
    eventType: string,
    constructor: new (...args: unknown[]) => T
  ): void {
    this.eventTypes.set(eventType, constructor)
  }
}

/**
 * JSONベースのEventSerializer実装
 *
 * ドメインイベントをJSON形式でシリアライズ・デシリアライズします。
 * EventStoreでの永続化時に使用されます。
 */
export class JsonEventSerializer implements EventSerializer {
  private readonly config: Required<JsonEventSerializerConfig>
  private readonly registry: EventTypeRegistry

  constructor(config: JsonEventSerializerConfig = {}) {
    this.registry = new EventTypeRegistryImpl()
    this.config = {
      customMetadataExtractor: config.customMetadataExtractor ?? (() => ({})),
      debug: config.debug ?? false,
      includeStackTrace: config.includeStackTrace ?? false,
      prettyPrint: config.prettyPrint ?? false,
      stringifyDates: config.stringifyDates ?? true,
    }
  }

  deserialize<T extends DomainEvent = DomainEvent>(
    eventType: string,
    eventData: string,
    metadata: string
  ): DeserializeResult<T> {
    try {
      // イベントタイプのコンストラクタを取得
      const EventConstructor = this.registry.getConstructor<T>(eventType)
      if (!EventConstructor) {
        return {
          error: `Unknown event type: ${eventType}`,
          success: false,
        }
      }

      // JSONデータをパース
      const parsedEventData = JSON.parse(eventData)
      const parsedMetadata = JSON.parse(metadata)

      // イベントの再構築
      // 型安全な occurredAt の処理
      let occurredAt: Date
      if (
        this.config.stringifyDates &&
        typeof parsedEventData.occurredAt === 'string'
      ) {
        occurredAt = new Date(parsedEventData.occurredAt as string)
      } else if (parsedEventData.occurredAt instanceof Date) {
        occurredAt = parsedEventData.occurredAt
      } else {
        // フォールバック: 文字列として扱って Date に変換
        occurredAt = new Date(String(parsedEventData.occurredAt))
      }

      const event = new EventConstructor(
        parsedEventData.aggregateId,
        parsedEventData.payload,
        occurredAt
      )

      if (this.config.debug) {
        console.log('Deserialized event:', {
          aggregateId: parsedEventData.aggregateId,
          eventType,
          metadata: parsedMetadata,
        })
      }

      return {
        event,
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown deserialization error'

      if (this.config.debug) {
        console.error('Deserialization error:', error)
      }

      return {
        error: `Failed to deserialize event: ${errorMessage}`,
        success: false,
      }
    }
  }

  extractMetadata(event: DomainEvent): Record<string, unknown> {
    const baseMetadata: Record<string, unknown> = {
      aggregateId: event.aggregateId,
      className: event.constructor.name,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      payloadSize: JSON.stringify(event.payload).length,
      timestamp: new Date().toISOString(),
    }

    // カスタムメタデータの追加
    const customMetadata = this.config.customMetadataExtractor(event)

    // スタックトレースの追加（デバッグ用）
    if (this.config.includeStackTrace) {
      baseMetadata.stackTrace = new Error(
        'Stack trace for event serialization'
      ).stack
    }

    return {
      ...baseMetadata,
      ...customMetadata,
    }
  }

  /**
   * 設定を取得します
   */
  getConfig(): JsonEventSerializerConfig {
    return { ...this.config }
  }

  getRegistry(): EventTypeRegistry {
    return this.registry
  }

  /**
   * すべての標準ドメインイベントタイプを自動登録します
   *
   * @param events - 登録するイベントクラスの配列
   */
  registerStandardEvents(
    events: Array<{
      constructor: new (...args: unknown[]) => DomainEvent
      eventType: string
    }>
  ): void {
    for (const { constructor, eventType } of events) {
      this.registry.register(eventType, constructor)
    }

    if (this.config.debug) {
      console.log(
        'Registered standard events:',
        events.map((e) => e.eventType)
      )
    }
  }

  serialize(event: DomainEvent): SerializeResult {
    try {
      // イベントデータの構築
      const eventData = {
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        occurredAt: this.config.stringifyDates
          ? event.occurredAt.toISOString()
          : event.occurredAt,
        payload: event.payload,
      }

      // メタデータの構築
      const metadata = this.extractMetadata(event)

      // JSON文字列への変換
      const eventDataJson = this.config.prettyPrint
        ? // eslint-disable-next-line unicorn/no-null
          JSON.stringify(eventData, null, 2)
        : JSON.stringify(eventData)

      const metadataJson = this.config.prettyPrint
        ? // eslint-disable-next-line unicorn/no-null
          JSON.stringify(metadata, null, 2)
        : JSON.stringify(metadata)

      const serializedData: SerializedEventData = {
        eventData: eventDataJson,
        metadata: metadataJson,
      }

      if (this.config.debug) {
        console.log('Serialized event:', {
          aggregateId: event.aggregateId,
          dataSize: eventDataJson.length,
          eventType: event.eventType,
          metadataSize: metadataJson.length,
        })
      }

      return {
        data: serializedData,
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown serialization error'

      if (this.config.debug) {
        console.error('Serialization error:', error)
      }

      return {
        error: `Failed to serialize event: ${errorMessage}`,
        success: false,
      }
    }
  }

  validate(): { errors: string[]; valid: boolean } {
    const errors: string[] = []

    // 登録されたイベントタイプのチェック
    const eventTypes = this.registry.getAllEventTypes()
    if (eventTypes.length === 0) {
      errors.push('No event types registered')
    }

    // 各イベントタイプのコンストラクタチェック
    for (const eventType of eventTypes) {
      const constructor = this.registry.getConstructor(eventType)
      if (!constructor) {
        errors.push(`Event type '${eventType}' has no constructor`)
      }
    }

    // 設定の妥当性チェック
    if (this.config.prettyPrint && this.config.debug) {
      // パフォーマンス警告
      errors.push('Warning: Pretty print and debug mode may impact performance')
    }

    return {
      errors,
      valid: errors.length === 0,
    }
  }
}
