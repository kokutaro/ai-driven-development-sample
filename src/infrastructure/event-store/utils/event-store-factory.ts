import { EventStoreConfigurationException } from '../exceptions/event-store-exceptions'
import { JsonEventSerializer } from '../implementations/json-event-serializer'
import { PostgreSQLEventStore } from '../implementations/postgresql-event-store'

import { setupStandardEvents } from './event-registration'

import type { JsonEventSerializerConfig } from '../interfaces/event-serializer.interface'
import type {
  EventStore,
  EventStoreConfig,
} from '../interfaces/event-store.interface'
import type { PrismaClient } from '@prisma/client'

/**
 * EventStore作成オプション
 */
export interface CreateEventStoreOptions {
  /**
   * 標準イベントを自動登録するかどうか（デフォルト: true）
   */
  autoRegisterStandardEvents?: boolean

  /**
   * デバッグモード（デフォルト: false）
   */
  debug?: boolean

  /**
   * EventStore設定
   */
  eventStoreConfig?: EventStoreConfig

  /**
   * Prismaクライアント
   */
  prisma: PrismaClient

  /**
   * EventSerializer設定
   */
  serializerConfig?: JsonEventSerializerConfig
}

/**
 * 開発用のEventStoreインスタンスを作成します
 * デバッグ機能を有効にし、詳細なログを出力します。
 *
 * @param prisma - Prismaクライアント
 * @returns EventStoreインスタンス
 */
export function createDevelopmentEventStore(prisma: PrismaClient): EventStore {
  return createEventStore({
    debug: true,
    eventStoreConfig: {
      connectionString: '', // Prismaから取得するため空文字
      debug: true,
    },
    prisma,
    serializerConfig: {
      debug: true,
      includeStackTrace: true,
      prettyPrint: true,
    },
  })
}

/**
 * EventStoreインスタンスを作成します
 *
 * @param options - 作成オプション
 * @returns EventStoreインスタンス
 * @throws EventStoreConfigurationException - 設定に問題がある場合
 */
export function createEventStore(options: CreateEventStoreOptions): EventStore {
  const {
    autoRegisterStandardEvents = true,
    debug = false,
    eventStoreConfig,
    prisma,
    serializerConfig,
  } = options

  // Prismaクライアントの検証
  if (!prisma) {
    throw new EventStoreConfigurationException(
      'Prisma client is required',
      'prisma',
      prisma
    )
  }

  try {
    // EventSerializerの作成
    const serializer = new JsonEventSerializer({
      ...serializerConfig,
      debug,
    })

    // 標準イベントの自動登録
    if (autoRegisterStandardEvents) {
      setupStandardEvents(serializer)
    }

    // EventStoreの作成
    const eventStore = new PostgreSQLEventStore(prisma, serializer, {
      connectionString: '',
      ...eventStoreConfig,
      debug,
    })

    if (debug) {
      console.log('EventStore created successfully', {
        autoRegisterStandardEvents,
        registeredEventTypes: serializer.getRegistry().getAllEventTypes(),
        serializer: serializer.constructor.name,
      })
    }

    return eventStore
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new EventStoreConfigurationException(
      `Failed to create EventStore: ${errorMessage}`,
      'factory',
      undefined
    )
  }
}

/**
 * 本番用のEventStoreインスタンスを作成します
 * パフォーマンスを最適化した設定を使用します。
 *
 * @param prisma - Prismaクライアント
 * @param connectionString - データベース接続文字列
 * @returns EventStoreインスタンス
 */
export function createProductionEventStore(
  prisma: PrismaClient,
  connectionString: string
): EventStore {
  return createEventStore({
    debug: false,
    eventStoreConfig: {
      connectionString,
      debug: false,
      maxConnections: 20,
      queryTimeout: 30_000, // 30秒
    },
    prisma,
    serializerConfig: {
      debug: false,
      includeStackTrace: false,
      prettyPrint: false,
      stringifyDates: true,
    },
  })
}

/**
 * テスト用のEventStoreインスタンスを作成します
 * メモリ内で動作する軽量な設定を使用します。
 *
 * @param prisma - Prismaクライアント（テスト用）
 * @returns EventStoreインスタンス
 */
export function createTestEventStore(prisma: PrismaClient): EventStore {
  return createEventStore({
    debug: true,
    eventStoreConfig: {
      connectionString: 'test://localhost',
      debug: false,
      queryTimeout: 5000, // 5秒
    },
    prisma,
    serializerConfig: {
      debug: false, // テスト時はログを抑制
      prettyPrint: true,
      stringifyDates: true,
    },
  })
}

/**
 * EventStoreの健全性をチェックします
 *
 * @param eventStore - EventStoreインスタンス
 * @returns 健全性チェック結果
 */
export async function validateEventStore(eventStore: EventStore): Promise<{
  errors: string[]
  statistics?: {
    eventsByType: Record<string, number>
    totalAggregates: number
    totalEvents: number
  }
  valid: boolean
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 健全性チェック
    const healthResult = await eventStore.healthCheck()
    if (!healthResult.success) {
      errors.push(`Health check failed: ${healthResult.error}`)
    } else if (healthResult.data && healthResult.data.latency > 1000) {
      warnings.push(`High latency detected: ${healthResult.data.latency}ms`)
    }

    // 統計情報の取得
    const statsResult = await eventStore.getStatistics()
    if (!statsResult.success) {
      errors.push(`Statistics check failed: ${statsResult.error}`)
    }

    const statistics = statsResult.data

    return {
      errors,
      statistics,
      valid: errors.length === 0,
      warnings,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Validation failed: ${errorMessage}`)

    return {
      errors,
      valid: false,
      warnings,
    }
  }
}
