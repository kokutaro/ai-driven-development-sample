import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConcurrencyException } from '../interfaces/event-store.interface'

import { JsonEventSerializer } from './json-event-serializer'
import { PostgreSQLEventStore } from './postgresql-event-store'

import type { EventStore } from '../interfaces/event-store.interface'
import type { PrismaClient } from '@prisma/client'

import {
  type DomainEvent,
  TodoCompletedEvent,
  TodoCreatedEvent,
} from '@/domain/events/domain-events'

// モックしたPrismaクライアント
const mockPrisma = {
  $transaction: vi.fn(),
  eventStore: {
    aggregate: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

describe('PostgreSQLEventStore', () => {
  let eventStore: EventStore
  let serializer: JsonEventSerializer

  beforeEach(() => {
    vi.clearAllMocks()
    serializer = new JsonEventSerializer()
    eventStore = new PostgreSQLEventStore(mockPrisma, serializer)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('appendEvents', () => {
    const aggregateId = 'todo-123'
    const events: DomainEvent[] = [
      new TodoCreatedEvent(aggregateId, {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'Test Todo',
      }),
      new TodoCompletedEvent(aggregateId, {
        completedAt: new Date().toISOString(),
      }),
    ]

    it('should append events successfully', async () => {
      // Arrange
      const expectedVersion = 0
      const mockResult = {
        count: 2,
      }

      // Prismaモック設定
      mockPrisma.eventStore.findFirst = vi.fn().mockResolvedValue(null) // バージョンチェック
      mockPrisma.$transaction = vi.fn().mockResolvedValue(mockResult)

      // Act
      const result = await eventStore.appendEvents(
        aggregateId,
        events,
        expectedVersion
      )

      // Assert
      expect(result.success).toBe(true)
      expect(result.insertedCount).toBe(2)
      expect(result.lastVersion).toBe(2)
      expect(result.error).toBeUndefined()

      // Prismaが適切に呼ばれたかチェック
      expect(mockPrisma.eventStore.findFirst).toHaveBeenCalledWith({
        orderBy: { version: 'desc' },
        select: { version: true },
        where: { aggregateId },
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw ConcurrencyException when version mismatch occurs', async () => {
      // Arrange
      const expectedVersion = 0
      const actualVersion = 2

      // 既存のバージョンを返すモック
      mockPrisma.eventStore.findFirst = vi
        .fn()
        .mockResolvedValue({ version: actualVersion })

      // Act & Assert
      await expect(
        eventStore.appendEvents(aggregateId, events, expectedVersion)
      ).rejects.toThrow(ConcurrencyException)

      expect(mockPrisma.eventStore.findFirst).toHaveBeenCalledWith({
        orderBy: { version: 'desc' },
        select: { version: true },
        where: { aggregateId },
      })

      // トランザクションは実行されないはず
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should handle empty events array', async () => {
      // Arrange
      const expectedVersion = 0
      const emptyEvents: DomainEvent[] = []

      mockPrisma.eventStore.findFirst = vi.fn().mockResolvedValue(null)

      // Act
      const result = await eventStore.appendEvents(
        aggregateId,
        emptyEvents,
        expectedVersion
      )

      // Assert
      expect(result.success).toBe(true)
      expect(result.insertedCount).toBe(0)
      expect(result.lastVersion).toBe(0)

      // 空の場合はトランザクションを実行しない
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const expectedVersion = 0
      const dbError = new Error('Database connection failed')

      mockPrisma.eventStore.findFirst = vi.fn().mockRejectedValue(dbError)

      // Act
      const result = await eventStore.appendEvents(
        aggregateId,
        events,
        expectedVersion
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
      expect(result.insertedCount).toBe(0)
      expect(result.lastVersion).toBe(0)
    })
  })

  describe('getEventStream', () => {
    const aggregateId = 'todo-123'

    it('should return event stream for aggregate', async () => {
      // Arrange
      const mockStoredEvents = [
        {
          aggregateId,
          eventData: JSON.stringify({
            priority: 'HIGH',
            status: 'PENDING',
            title: 'Test Todo',
          }),
          eventType: 'TodoCreated',
          id: 'evt-1',
          insertedAt: new Date(),
          metadata: JSON.stringify({}),
          occurredAt: new Date(),
          version: 1,
        },
        {
          aggregateId,
          eventData: JSON.stringify({
            completedAt: new Date().toISOString(),
          }),
          eventType: 'TodoCompleted',
          id: 'evt-2',
          insertedAt: new Date(),
          metadata: JSON.stringify({}),
          occurredAt: new Date(),
          version: 2,
        },
      ]

      mockPrisma.eventStore.findMany = vi
        .fn()
        .mockResolvedValue(mockStoredEvents)
      mockPrisma.eventStore.count = vi.fn().mockResolvedValue(2)

      // Act
      const result = await eventStore.getEventStream(aggregateId)

      // Assert
      expect(result.events).toHaveLength(2)
      expect(result.totalCount).toBe(2)
      expect(result.lastVersion).toBe(2)
      expect(result.hasMore).toBe(false)

      expect(mockPrisma.eventStore.findMany).toHaveBeenCalledWith({
        orderBy: { version: 'asc' },
        where: {
          aggregateId,
          version: {
            gte: 1,
          },
        },
      })
    })

    it('should filter by version range', async () => {
      // Arrange
      const fromVersion = 2
      const toVersion = 5
      const mockStoredEvents = [
        {
          aggregateId,
          eventData: JSON.stringify({}),
          eventType: 'TodoStarted',
          id: 'evt-2',
          insertedAt: new Date(),
          metadata: JSON.stringify({}),
          occurredAt: new Date(),
          version: 2,
        },
      ]

      mockPrisma.eventStore.findMany = vi
        .fn()
        .mockResolvedValue(mockStoredEvents)
      mockPrisma.eventStore.count = vi.fn().mockResolvedValue(1)

      // Act
      const result = await eventStore.getEventStream(
        aggregateId,
        fromVersion,
        toVersion
      )

      // Assert
      expect(result.events).toHaveLength(1)
      expect(mockPrisma.eventStore.findMany).toHaveBeenCalledWith({
        orderBy: { version: 'asc' },
        where: {
          aggregateId,
          version: {
            gte: fromVersion,
            lte: toVersion,
          },
        },
      })
    })

    it('should return empty stream for non-existent aggregate', async () => {
      // Arrange
      mockPrisma.eventStore.findMany = vi.fn().mockResolvedValue([])
      mockPrisma.eventStore.count = vi.fn().mockResolvedValue(0)

      // Act
      const result = await eventStore.getEventStream('non-existent')

      // Assert
      expect(result.events).toHaveLength(0)
      expect(result.totalCount).toBe(0)
      expect(result.lastVersion).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('getCurrentVersion', () => {
    it('should return current version for existing aggregate', async () => {
      // Arrange
      const aggregateId = 'todo-123'
      const expectedVersion = 5

      mockPrisma.eventStore.findFirst = vi
        .fn()
        .mockResolvedValue({ version: expectedVersion })

      // Act
      const version = await eventStore.getCurrentVersion(aggregateId)

      // Assert
      expect(version).toBe(expectedVersion)
      expect(mockPrisma.eventStore.findFirst).toHaveBeenCalledWith({
        orderBy: { version: 'desc' },
        select: { version: true },
        where: { aggregateId },
      })
    })

    it('should return 0 for non-existent aggregate', async () => {
      // Arrange
      const aggregateId = 'non-existent'

      mockPrisma.eventStore.findFirst = vi.fn().mockResolvedValue(null)

      // Act
      const version = await eventStore.getCurrentVersion(aggregateId)

      // Assert
      expect(version).toBe(0)
    })
  })

  describe('getAllEvents', () => {
    it('should return all events with pagination', async () => {
      // Arrange
      const mockStoredEvents = [
        {
          aggregateId: 'todo-123',
          eventData: JSON.stringify({}),
          eventType: 'TodoCreated',
          id: 'evt-1',
          insertedAt: new Date(),
          metadata: JSON.stringify({}),
          occurredAt: new Date(),
          version: 1,
        },
      ]

      mockPrisma.eventStore.findMany = vi
        .fn()
        .mockResolvedValue(mockStoredEvents)

      // Act
      const events = await eventStore.getAllEvents(0, 10)

      // Assert
      expect(events).toHaveLength(1)
      expect(mockPrisma.eventStore.findMany).toHaveBeenCalledWith({
        orderBy: { insertedAt: 'asc' },
        skip: 0,
        take: 10,
      })
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      // Arrange
      mockPrisma.eventStore.count = vi.fn().mockImplementation(async () => {
        // 小さな遅延を追加してlatencyをシミュレート
        await new Promise((resolve) => setTimeout(resolve, 1))
        return 100
      })

      // Act
      const result = await eventStore.healthCheck()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.connected).toBe(true)
      expect(result.data?.latency).toBeGreaterThanOrEqual(0)
    })

    it('should return unhealthy status when database is not accessible', async () => {
      // Arrange
      mockPrisma.eventStore.count = vi
        .fn()
        .mockRejectedValue(new Error('Connection failed'))

      // Act
      const result = await eventStore.healthCheck()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Connection failed')
    })
  })

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      // Arrange
      const mockStats = {
        _count: { _all: 150 },
        _max: { occurredAt: new Date() },
      }

      const mockEventTypes = [
        { _count: { _all: 50 }, eventType: 'TodoCreated' },
        { _count: { _all: 30 }, eventType: 'TodoCompleted' },
      ]

      mockPrisma.eventStore.aggregate = vi.fn().mockResolvedValue(mockStats)

      mockPrisma.eventStore.findMany = vi
        .fn()
        .mockResolvedValue([
          { aggregateId: 'agg1' },
          { aggregateId: 'agg2' },
          { aggregateId: 'agg3' },
        ])

      mockPrisma.eventStore.groupBy = vi.fn().mockResolvedValue(mockEventTypes)

      // Act
      const result = await eventStore.getStatistics()

      // Assert
      expect(result.success).toBe(true)
      expect(result.data?.totalEvents).toBe(150)
      expect(result.data?.totalAggregates).toBe(3)
      expect(result.data?.eventsByType).toEqual({
        TodoCompleted: 30,
        TodoCreated: 50,
      })
      expect(result.data?.lastEventDate).toBeInstanceOf(Date)
    })
  })
})
