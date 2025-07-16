import { PrismaClient } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createTestEventStore } from '../utils/event-store-factory'

import type { EventStore } from '../interfaces/event-store.interface'

import {
  SubTaskAddedEvent,
  TodoCompletedEvent,
  TodoCreatedEvent,
  TodoTitleUpdatedEvent,
} from '@/domain/events/domain-events'

describe('EventStore Integration Tests', () => {
  let eventStore: EventStore
  let prisma: PrismaClient

  beforeEach(async () => {
    // 新しいPrismaクライアントインスタンスを作成
    prisma = new PrismaClient()
    eventStore = createTestEventStore(prisma)

    // テストデータをクリーンアップ
    await prisma.eventStore.deleteMany()
  })

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.eventStore.deleteMany()

    // Prismaクライアントを切断
    await prisma.$disconnect()
  })

  describe('Full Lifecycle Integration', () => {
    it('should handle complete todo lifecycle with event sourcing', async () => {
      const aggregateId = 'todo-integration-test-123'

      // 1. TODOを作成
      const createEvent = new TodoCreatedEvent(aggregateId, {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'Integration Test Todo',
      })

      const appendResult1 = await eventStore.appendEvents(
        aggregateId,
        [createEvent],
        0
      )

      expect(appendResult1.success).toBe(true)
      expect(appendResult1.insertedCount).toBe(1)
      expect(appendResult1.lastVersion).toBe(1)

      // 2. サブタスクを追加
      const addSubTaskEvent = new SubTaskAddedEvent(aggregateId, {
        order: 1,
        subTaskId: 'subtask-123',
        title: 'Integration Test SubTask',
      })

      const appendResult2 = await eventStore.appendEvents(
        aggregateId,
        [addSubTaskEvent],
        1
      )

      expect(appendResult2.success).toBe(true)
      expect(appendResult2.lastVersion).toBe(2)

      // 3. タイトルを更新
      const updateTitleEvent = new TodoTitleUpdatedEvent(aggregateId, {
        newTitle: 'Updated Integration Test Todo',
        oldTitle: 'Integration Test Todo',
      })

      const appendResult3 = await eventStore.appendEvents(
        aggregateId,
        [updateTitleEvent],
        2
      )

      expect(appendResult3.success).toBe(true)
      expect(appendResult3.lastVersion).toBe(3)

      // 4. TODOを完了
      const completeEvent = new TodoCompletedEvent(aggregateId, {
        completedAt: new Date().toISOString(),
      })

      const appendResult4 = await eventStore.appendEvents(
        aggregateId,
        [completeEvent],
        3
      )

      expect(appendResult4.success).toBe(true)
      expect(appendResult4.lastVersion).toBe(4)

      // 5. イベントストリームを取得して検証
      const eventStream = await eventStore.getEventStream(aggregateId)

      expect(eventStream.events).toHaveLength(4)
      expect(eventStream.totalCount).toBe(4)
      expect(eventStream.lastVersion).toBe(4)

      // 各イベントの順序と内容を検証
      const events = eventStream.events
      expect(JSON.parse(events[0].eventData).eventType).toBe('TodoCreated')
      expect(JSON.parse(events[1].eventData).eventType).toBe('SubTaskAdded')
      expect(JSON.parse(events[2].eventData).eventType).toBe('TodoTitleUpdated')
      expect(JSON.parse(events[3].eventData).eventType).toBe('TodoCompleted')

      // バージョンの順序を検証
      expect(events[0].version).toBe(1)
      expect(events[1].version).toBe(2)
      expect(events[2].version).toBe(3)
      expect(events[3].version).toBe(4)
    })

    it('should reconstruct aggregate state from events', async () => {
      const aggregateId = 'todo-reconstruct-test-456'

      // イベントを順次追加
      const events = [
        new TodoCreatedEvent(aggregateId, {
          priority: 'MEDIUM',
          status: 'PENDING',
          title: 'Original Title',
        }),
        new TodoTitleUpdatedEvent(aggregateId, {
          newTitle: 'Updated Title',
          oldTitle: 'Original Title',
        }),
        new SubTaskAddedEvent(aggregateId, {
          order: 1,
          subTaskId: 'subtask-1',
          title: 'First SubTask',
        }),
        new SubTaskAddedEvent(aggregateId, {
          order: 2,
          subTaskId: 'subtask-2',
          title: 'Second SubTask',
        }),
        new TodoCompletedEvent(aggregateId, {
          completedAt: new Date().toISOString(),
        }),
      ]

      // 複数のイベントをバッチで追加
      const appendResult = await eventStore.appendEvents(aggregateId, events, 0)

      expect(appendResult.success).toBe(true)
      expect(appendResult.insertedCount).toBe(5)
      expect(appendResult.lastVersion).toBe(5)

      // イベントストリームから状態を再構築
      const eventStream = await eventStore.getEventStream(aggregateId)
      const storedEvents = eventStream.events

      // 最終状態を計算
      let currentTitle = ''
      let isCompleted = false
      const subTasks: { id: string; order: number; title: string }[] = []

      for (const storedEvent of storedEvents) {
        const eventData = JSON.parse(storedEvent.eventData)

        switch (eventData.eventType) {
          case 'SubTaskAdded':
            subTasks.push({
              id: eventData.payload.subTaskId,
              order: eventData.payload.order,
              title: eventData.payload.title,
            })
            break
          case 'TodoCompleted':
            isCompleted = true
            break
          case 'TodoCreated':
            currentTitle = eventData.payload.title
            break
          case 'TodoTitleUpdated':
            currentTitle = eventData.payload.newTitle
            break
        }
      }

      // 最終状態を検証
      expect(currentTitle).toBe('Updated Title')
      expect(isCompleted).toBe(true)
      expect(subTasks).toHaveLength(2)
      expect(subTasks[0].title).toBe('First SubTask')
      expect(subTasks[1].title).toBe('Second SubTask')
    })

    it('should handle concurrent modifications with optimistic locking', async () => {
      const aggregateId = 'todo-concurrency-test-789'

      // 初期イベントを追加
      const initialEvent = new TodoCreatedEvent(aggregateId, {
        priority: 'LOW',
        status: 'PENDING',
        title: 'Concurrency Test Todo',
      })

      await eventStore.appendEvents(aggregateId, [initialEvent], 0)

      // 同時に2つの更新を試行（楽観的ロック）
      const updateEvent1 = new TodoTitleUpdatedEvent(aggregateId, {
        newTitle: 'Updated by Process 1',
        oldTitle: 'Concurrency Test Todo',
      })

      const updateEvent2 = new TodoTitleUpdatedEvent(aggregateId, {
        newTitle: 'Updated by Process 2',
        oldTitle: 'Concurrency Test Todo',
      })

      // 最初の更新は成功するはず
      const result1 = await eventStore.appendEvents(
        aggregateId,
        [updateEvent1],
        1
      )
      expect(result1.success).toBe(true)

      // 2番目の更新は同じバージョンを期待しているため失敗するはず
      await expect(
        eventStore.appendEvents(aggregateId, [updateEvent2], 1)
      ).rejects.toThrow('Concurrency conflict')

      // 正しいバージョンで2番目の更新を実行
      const result3 = await eventStore.appendEvents(
        aggregateId,
        [updateEvent2],
        2
      )
      expect(result3.success).toBe(true)
      expect(result3.lastVersion).toBe(3)

      // 最終的に3つのイベントがあることを確認
      const finalStream = await eventStore.getEventStream(aggregateId)
      expect(finalStream.events).toHaveLength(3)
    })
  })

  describe('Event Filtering and Querying', () => {
    beforeEach(async () => {
      // テストデータをセットアップ
      const testAggregates = [
        { id: 'todo-1', type: 'TodoCreated' },
        { id: 'todo-1', type: 'TodoCompleted' },
        { id: 'todo-2', type: 'TodoCreated' },
        { id: 'todo-2', type: 'SubTaskAdded' },
        { id: 'todo-3', type: 'TodoCreated' },
      ]

      for (const { id, type } of testAggregates) {
        let event

        switch (type) {
          case 'SubTaskAdded':
            event = new SubTaskAddedEvent(id, {
              order: 1,
              subTaskId: `${id}-subtask`,
              title: `SubTask for ${id}`,
            })
            break
          case 'TodoCompleted':
            event = new TodoCompletedEvent(id, {
              completedAt: new Date().toISOString(),
            })
            break
          case 'TodoCreated':
            event = new TodoCreatedEvent(id, {
              priority: 'MEDIUM',
              status: 'PENDING',
              title: `Test Todo ${id}`,
            })
            break
          default:
            continue
        }

        const currentVersion = await eventStore.getCurrentVersion(id)
        await eventStore.appendEvents(id, [event], currentVersion)
      }
    })

    it('should filter events by type', async () => {
      const todoCreatedEvents = await eventStore.getEventsByType([
        'TodoCreated',
      ])

      expect(todoCreatedEvents.length).toBe(3)
      todoCreatedEvents.forEach((event) => {
        expect(event.eventType).toBe('TodoCreated')
      })
    })

    it('should filter events by multiple types', async () => {
      const events = await eventStore.getEventsByType([
        'TodoCompleted',
        'SubTaskAdded',
      ])

      expect(events.length).toBe(2)
    })

    it('should get events for specific aggregate', async () => {
      const todo1Events = await eventStore.getEventStream('todo-1')

      expect(todo1Events.events.length).toBe(2)
      expect(todo1Events.events[0].eventType).toBe('TodoCreated')
      expect(todo1Events.events[1].eventType).toBe('TodoCompleted')
    })

    it('should get all events with pagination', async () => {
      const allEvents = await eventStore.getAllEvents(0, 3)

      expect(allEvents.length).toBe(3)
    })
  })

  describe('Statistics and Health', () => {
    it('should provide accurate statistics', async () => {
      // サンプルイベントを追加
      const events = [
        new TodoCreatedEvent('stats-todo-1', {
          priority: 'HIGH',
          status: 'PENDING',
          title: 'Test',
        }),
        new TodoCreatedEvent('stats-todo-2', {
          priority: 'LOW',
          status: 'PENDING',
          title: 'Test',
        }),
        new TodoCompletedEvent('stats-todo-1', {
          completedAt: new Date().toISOString(),
        }),
      ]

      for (const event of events) {
        const currentVersion = await eventStore.getCurrentVersion(
          event.aggregateId
        )
        await eventStore.appendEvents(
          event.aggregateId,
          [event],
          currentVersion
        )
      }

      const statsResult = await eventStore.getStatistics()

      expect(statsResult.success).toBe(true)
      expect(statsResult.data?.totalEvents).toBe(3)
      expect(statsResult.data?.totalAggregates).toBe(2)
      expect(statsResult.data?.eventsByType.TodoCreated).toBe(2)
      expect(statsResult.data?.eventsByType.TodoCompleted).toBe(1)
    })

    it('should perform health check', async () => {
      const healthResult = await eventStore.healthCheck()

      expect(healthResult.success).toBe(true)
      expect(healthResult.data?.connected).toBe(true)
      expect(healthResult.data?.latency).toBeGreaterThanOrEqual(0)
    })
  })
})
