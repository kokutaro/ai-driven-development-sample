/**
 * EventStore Infrastructure Module
 *
 * Event Sourcing用のEventStore実装を提供します。
 * CQRS/Event Sourcingパターンの実装において、
 * ドメインイベントの永続化・取得・再生を行います。
 */

// 例外
export {
  AggregateNotFoundException,
  ConcurrencyException,
  EventSerializationException,
  EventStoreConfigurationException,
  EventStoreException,
} from './exceptions/event-store-exceptions'

export { JsonEventSerializer } from './implementations/json-event-serializer'

// 実装
export { PostgreSQLEventStore } from './implementations/postgresql-event-store'

export type {
  DeserializeResult,
  EventSerializer,
  EventTypeRegistry,
  JsonEventSerializerConfig,
  SerializedEventData,
  SerializeResult,
} from './interfaces/event-serializer.interface'
// インターフェース
export type {
  AppendEventsResult,
  EventStore,
  EventStoreConfig,
  EventStoreResult,
} from './interfaces/event-store.interface'

export type {
  CreateStoredEventData,
  EventFilter,
  EventStreamResult,
  StoredEvent,
} from './interfaces/stored-event.interface'

export { setupStandardEvents } from './utils/event-registration'
// ユーティリティ関数
export { createEventStore } from './utils/event-store-factory'
