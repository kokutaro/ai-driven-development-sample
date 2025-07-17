import {
  ConcurrencyException,
  EventStoreException,
} from '../interfaces/event-store.interface'

import type { EventSerializer } from '../interfaces/event-serializer.interface'
import type {
  AppendEventsResult,
  EventStore,
  EventStoreConfig,
  EventStoreResult,
  EventStreamResult,
} from '../interfaces/event-store.interface'
import type {
  CreateStoredEventData,
  EventFilter,
  StoredEvent,
} from '../interfaces/stored-event.interface'
import type { DomainEvent } from '@/domain/events/domain-events'
import type { PrismaClient } from '@prisma/client'

/**
 * PostgreSQL を使用したEventStore実装
 *
 * PrismaクライアントとEventSerializerを使用して
 * ドメインイベントの永続化・取得を行います。
 */
export class PostgreSQLEventStore implements EventStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly serializer: EventSerializer,
    private readonly config?: EventStoreConfig
  ) {}

  async appendEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<AppendEventsResult> {
    try {
      // 空の場合は早期リターン
      if (events.length === 0) {
        return {
          insertedCount: 0,
          lastVersion: expectedVersion,
          success: true,
        }
      }

      // 現在のバージョンをチェック（楽観的ロック）
      const currentVersion = await this.getCurrentVersion(aggregateId)

      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyException(
          aggregateId,
          expectedVersion,
          currentVersion
        )
      }

      // イベントをシリアライズして永続化データを準備
      const eventDataList: CreateStoredEventData[] = []

      for (const [i, event] of events.entries()) {
        const serializeResult = this.serializer.serialize(event)

        if (!serializeResult.success || !serializeResult.data) {
          throw new EventStoreException(
            `Failed to serialize event at index ${i}: ${serializeResult.error}`
          )
        }

        eventDataList.push({
          aggregateId,
          eventData: serializeResult.data.eventData,
          eventType: event.eventType,
          metadata: serializeResult.data.metadata,
          occurredAt: event.occurredAt,
          version: expectedVersion + i + 1,
        })
      }

      // トランザクション内でイベントを挿入
      await this.prisma.$transaction(async (tx) => {
        const insertResults = []

        for (const eventData of eventDataList) {
          const inserted = await tx.eventStore.create({
            data: eventData,
          })
          insertResults.push(inserted)
        }

        return insertResults
      })

      const lastVersion = expectedVersion + events.length

      if (this.config?.debug) {
        console.log('Events appended:', {
          aggregateId,
          eventCount: events.length,
          lastVersion,
        })
      }

      return {
        insertedCount: events.length, // eventsの長さを使用
        lastVersion,
        success: true,
      }
    } catch (error) {
      if (error instanceof ConcurrencyException) {
        throw error // 再スロー
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      if (this.config?.debug) {
        console.error('Error appending events:', error)
      }

      return {
        error: errorMessage,
        insertedCount: 0,
        lastVersion: expectedVersion,
        success: false,
      }
    }
  }

  async getAllEvents(
    fromPosition?: number,
    limit?: number
  ): Promise<StoredEvent[]> {
    try {
      const events = await this.prisma.eventStore.findMany({
        orderBy: { insertedAt: 'asc' },
        skip: fromPosition ?? 0,
        take: limit ?? 100,
      })

      return events.map((event) => this.mapToStoredEvent.call(this, event))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new EventStoreException(
        `Failed to get all events: ${errorMessage}`,
        error as Error
      )
    }
  }

  async getCurrentVersion(aggregateId: string): Promise<number> {
    try {
      const lastEvent = await this.prisma.eventStore.findFirst({
        orderBy: { version: 'desc' },
        select: { version: true },
        where: { aggregateId },
      })

      return lastEvent?.version ?? 0
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new EventStoreException(
        `Failed to get current version: ${errorMessage}`,
        error as Error
      )
    }
  }

  async getEvents(filter: EventFilter): Promise<EventStreamResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereClause: any = {}

      if (filter.aggregateId) {
        whereClause.aggregateId = filter.aggregateId
      }

      if (filter.eventTypes && filter.eventTypes.length > 0) {
        whereClause.eventType = {
          in: filter.eventTypes,
        }
      }

      if (filter.fromVersion !== undefined) {
        whereClause.version = {
          ...whereClause.version,
          gte: filter.fromVersion,
        }
      }

      if (filter.toVersion !== undefined) {
        whereClause.version = {
          ...whereClause.version,
          lte: filter.toVersion,
        }
      }

      if (filter.fromDate) {
        whereClause.occurredAt = {
          ...whereClause.occurredAt,
          gte: filter.fromDate,
        }
      }

      if (filter.toDate) {
        whereClause.occurredAt = {
          ...whereClause.occurredAt,
          lte: filter.toDate,
        }
      }

      const [events, totalCount] = await Promise.all([
        this.prisma.eventStore.findMany({
          orderBy: { occurredAt: 'asc' },
          skip: filter.offset ?? 0,
          take: filter.limit ?? 100,
          where: whereClause,
        }),
        this.prisma.eventStore.count({ where: whereClause }),
      ])

      const storedEvents: StoredEvent[] = events.map((event) =>
        this.mapToStoredEvent(event)
      )
      const lastVersion = events.length > 0 ? (events.at(-1)?.version ?? 0) : 0

      return {
        events: storedEvents,
        hasMore: (filter.offset ?? 0) + events.length < totalCount,
        lastVersion,
        totalCount,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new EventStoreException(
        `Failed to get events: ${errorMessage}`,
        error as Error
      )
    }
  }

  async getEventsByType(
    eventTypes: string[],
    fromDate?: Date,
    limit?: number
  ): Promise<StoredEvent[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereClause: any = {
        eventType: {
          in: eventTypes,
        },
      }

      if (fromDate) {
        whereClause.occurredAt = {
          gte: fromDate,
        }
      }

      const events = await this.prisma.eventStore.findMany({
        orderBy: { occurredAt: 'asc' },
        take: limit ?? 100,
        where: whereClause,
      })

      return events.map((event) => this.mapToStoredEvent.call(this, event))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new EventStoreException(
        `Failed to get events by type: ${errorMessage}`,
        error as Error
      )
    }
  }

  async getEventStream(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<EventStreamResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereClause: any = {
        aggregateId,
        version: {
          gte: fromVersion ?? 1,
        },
      }

      if (toVersion !== undefined) {
        whereClause.version.lte = toVersion
      }

      const [events, totalCount] = await Promise.all([
        this.prisma.eventStore.findMany({
          orderBy: { version: 'asc' },
          where: whereClause,
        }),
        this.prisma.eventStore.count({ where: { aggregateId } }),
      ])

      const storedEvents: StoredEvent[] = events.map((event) =>
        this.mapToStoredEvent(event)
      )
      const lastVersion = events.length > 0 ? (events.at(-1)?.version ?? 0) : 0

      return {
        events: storedEvents,
        hasMore: toVersion ? lastVersion < toVersion : false,
        lastVersion,
        totalCount,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new EventStoreException(
        `Failed to get event stream: ${errorMessage}`,
        error as Error
      )
    }
  }

  async getStatistics(): Promise<
    EventStoreResult<{
      eventsByType: Record<string, number>
      lastEventDate: Date | null
      totalAggregates: number
      totalEvents: number
    }>
  > {
    try {
      const [totalStats, aggregateStats, eventTypeStats] = await Promise.all([
        this.prisma.eventStore.aggregate({
          _count: { _all: true },
          _max: { occurredAt: true },
        }),
        this.prisma.eventStore
          .findMany({
            distinct: ['aggregateId'],
            select: { aggregateId: true },
          })
          .then((result) => ({ _count: { aggregateId: result.length } })),
        this.prisma.eventStore.groupBy({
          _count: {
            _all: true,
          },
          by: ['eventType'],
        }),
      ])

      const eventsByType: Record<string, number> = {}
      for (const stat of eventTypeStats) {
        eventsByType[stat.eventType] = stat._count._all
      }

      return {
        data: {
          eventsByType,
          lastEventDate: totalStats._max.occurredAt,
          totalAggregates: aggregateStats._count.aggregateId,
          totalEvents: totalStats._count._all,
        },
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      return {
        error: `Failed to get statistics: ${errorMessage}`,
        success: false,
      }
    }
  }

  async healthCheck(): Promise<
    EventStoreResult<{ connected: boolean; latency: number }>
  > {
    try {
      const startTime = Date.now()

      // 簡単なクエリでデータベース接続をテスト
      await this.prisma.eventStore.count()

      const latency = Date.now() - startTime

      return {
        data: {
          connected: true,
          latency,
        },
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      return {
        error: `Health check failed: ${errorMessage}`,
        success: false,
      }
    }
  }

  /**
   * Prismaの結果をStoredEventにマップします
   */
  private mapToStoredEvent(event: {
    aggregateId: string
    createdAt: Date
    eventData: string
    eventType: string
    id: string
    insertedAt: Date
    metadata: string
    occurredAt: Date
    updatedAt: Date
    version: number
  }): StoredEvent {
    return {
      aggregateId: event.aggregateId,
      eventData: event.eventData,
      eventType: event.eventType,
      id: event.id,
      insertedAt: event.insertedAt ?? event.createdAt,
      metadata: event.metadata,
      occurredAt: event.occurredAt,
      version: event.version,
    }
  }
}
