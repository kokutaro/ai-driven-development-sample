import { beforeEach, describe, expect, it } from 'vitest'

import { JsonEventSerializer } from './json-event-serializer'

import type {
  DeserializeResult,
  EventSerializer,
  EventTypeRegistry,
  SerializeResult,
} from '../interfaces/event-serializer.interface'

import {
  type DomainEvent,
  TodoCompletedEvent,
  TodoCreatedEvent,
  TodoTitleUpdatedEvent,
} from '@/domain/events/domain-events'

describe('JsonEventSerializer', () => {
  let serializer: EventSerializer
  let registry: EventTypeRegistry

  beforeEach(() => {
    serializer = new JsonEventSerializer()
    registry = serializer.getRegistry()

    // 標準的なイベントタイプを登録
    registry.register(
      'TodoCreated',
      TodoCreatedEvent as new (...args: unknown[]) => TodoCreatedEvent
    )
    registry.register(
      'TodoCompleted',
      TodoCompletedEvent as new (...args: unknown[]) => TodoCompletedEvent
    )
    registry.register(
      'TodoTitleUpdated',
      TodoTitleUpdatedEvent as new (...args: unknown[]) => TodoTitleUpdatedEvent
    )
  })

  describe('serialize', () => {
    it('should serialize TodoCreatedEvent correctly', () => {
      // Arrange
      const event = new TodoCreatedEvent('todo-123', {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'Test Todo',
      })

      // Act
      const result: SerializeResult = serializer.serialize(event)

      // Assert
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()

      const eventData = JSON.parse(result.data!.eventData)
      expect(eventData.aggregateId).toBe('todo-123')
      expect(eventData.eventType).toBe('TodoCreated')
      expect(eventData.payload.title).toBe('Test Todo')
      expect(eventData.payload.priority).toBe('HIGH')
      expect(eventData.payload.status).toBe('PENDING')

      const metadata = JSON.parse(result.data!.metadata)
      expect(metadata.eventType).toBe('TodoCreated')
      expect(metadata.aggregateId).toBe('todo-123')
      expect(metadata.occurredAt).toBeDefined()
    })

    it('should serialize TodoCompletedEvent correctly', () => {
      // Arrange
      const completedAt = new Date().toISOString()
      const event = new TodoCompletedEvent('todo-456', {
        completedAt,
      })

      // Act
      const result = serializer.serialize(event)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const eventData = JSON.parse(result.data!.eventData)
      expect(eventData.aggregateId).toBe('todo-456')
      expect(eventData.eventType).toBe('TodoCompleted')
      expect(eventData.payload.completedAt).toBe(completedAt)
    })

    it('should handle serialization errors gracefully', () => {
      // Arrange - 循環参照を持つ不正なオブジェクト
      const invalidEvent = {
        aggregateId: 'test',
        eventType: 'Invalid',
        occurredAt: new Date(),
        payload: {} as Record<string, unknown>,
      } as DomainEvent

      // 循環参照を作成
      invalidEvent.payload.self = invalidEvent

      // Act
      const result = serializer.serialize(invalidEvent)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.data).toBeUndefined()
    })
  })

  describe('deserialize', () => {
    it('should deserialize TodoCreatedEvent correctly', () => {
      // Arrange
      const eventType = 'TodoCreated'
      const eventData = JSON.stringify({
        aggregateId: 'todo-123',
        eventType: 'TodoCreated',
        occurredAt: new Date().toISOString(),
        payload: {
          priority: 'HIGH',
          status: 'PENDING',
          title: 'Test Todo',
        },
      })
      const metadata = JSON.stringify({
        aggregateId: 'todo-123',
        eventType: 'TodoCreated',
        occurredAt: new Date().toISOString(),
      })

      // Act
      const result: DeserializeResult<TodoCreatedEvent> =
        serializer.deserialize(eventType, eventData, metadata)

      // Assert
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.event).toBeInstanceOf(TodoCreatedEvent)

      const event = result.event!
      expect(event.aggregateId).toBe('todo-123')
      expect(event.eventType).toBe('TodoCreated')
      expect(event.title).toBe('Test Todo')
      expect(event.priority).toBe('HIGH')
      expect(event.status).toBe('PENDING')
    })

    it('should deserialize TodoCompletedEvent correctly', () => {
      // Arrange
      const completedAt = new Date().toISOString()
      const eventType = 'TodoCompleted'
      const eventData = JSON.stringify({
        aggregateId: 'todo-456',
        eventType: 'TodoCompleted',
        occurredAt: new Date().toISOString(),
        payload: {
          completedAt,
        },
      })
      const metadata = JSON.stringify({
        aggregateId: 'todo-456',
        eventType: 'TodoCompleted',
        occurredAt: new Date().toISOString(),
      })

      // Act
      const result: DeserializeResult<TodoCompletedEvent> =
        serializer.deserialize(eventType, eventData, metadata)

      // Assert
      expect(result.success).toBe(true)
      expect(result.event).toBeInstanceOf(TodoCompletedEvent)

      const event = result.event!
      expect(event.aggregateId).toBe('todo-456')
      expect(event.completedAt).toBe(completedAt)
    })

    it('should handle unknown event types', () => {
      // Arrange
      const eventType = 'UnknownEvent'
      const eventData = JSON.stringify({
        aggregateId: 'test-123',
        eventType: 'UnknownEvent',
        occurredAt: new Date().toISOString(),
        payload: {},
      })
      const metadata = JSON.stringify({})

      // Act
      const result = serializer.deserialize(eventType, eventData, metadata)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown event type')
      expect(result.event).toBeUndefined()
    })

    it('should handle invalid JSON data', () => {
      // Arrange
      const eventType = 'TodoCreated'
      const invalidEventData = '{ invalid json'
      const metadata = JSON.stringify({})

      // Act
      const result = serializer.deserialize(
        eventType,
        invalidEventData,
        metadata
      )

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.event).toBeUndefined()
    })
  })

  describe('extractMetadata', () => {
    it('should extract basic metadata from domain event', () => {
      // Arrange
      const event = new TodoCreatedEvent('todo-123', {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'Test Todo',
      })

      // Act
      const metadata = serializer.extractMetadata(event)

      // Assert
      expect(metadata.eventType).toBe('TodoCreated')
      expect(metadata.aggregateId).toBe('todo-123')
      expect(metadata.occurredAt).toBeInstanceOf(Date)
      expect(metadata.className).toBe('TodoCreatedEvent')
    })

    it('should include payload size in metadata', () => {
      // Arrange
      const event = new TodoTitleUpdatedEvent('todo-123', {
        newTitle: 'New Title',
        oldTitle: 'Old Title',
      })

      // Act
      const metadata = serializer.extractMetadata(event)

      // Assert
      expect(metadata.payloadSize).toBeGreaterThan(0)
      expect(typeof metadata.payloadSize).toBe('number')
    })
  })

  describe('EventTypeRegistry', () => {
    it('should register and retrieve event types', () => {
      // Arrange
      const newRegistry = serializer.getRegistry()

      // Act
      newRegistry.register(
        'TestEvent',
        TodoCreatedEvent as new (...args: unknown[]) => TodoCreatedEvent
      )

      // Assert
      expect(newRegistry.isRegistered('TestEvent')).toBe(true)
      expect(newRegistry.getConstructor('TestEvent')).toBe(TodoCreatedEvent)
      expect(newRegistry.getAllEventTypes()).toContain('TestEvent')
    })

    it('should handle non-registered event types', () => {
      // Arrange
      const newRegistry = serializer.getRegistry()

      // Act & Assert
      expect(newRegistry.isRegistered('NonExistentEvent')).toBe(false)
      expect(newRegistry.getConstructor('NonExistentEvent')).toBeUndefined()
    })

    it('should return all registered event types', () => {
      // Arrange & Act
      const eventTypes = registry.getAllEventTypes()

      // Assert
      expect(eventTypes).toContain('TodoCreated')
      expect(eventTypes).toContain('TodoCompleted')
      expect(eventTypes).toContain('TodoTitleUpdated')
      expect(eventTypes.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('validate', () => {
    it('should return valid when all event types are properly registered', () => {
      // Act
      const result = serializer.validate()

      // Assert
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect validation issues', () => {
      // Arrange - 新しいシリアライザで登録なし
      const emptySerializer = new JsonEventSerializer()

      // Act
      const result = emptySerializer.validate()

      // Assert
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('No event types registered')
    })
  })

  describe('roundtrip serialization', () => {
    it('should maintain data integrity in serialize -> deserialize cycle', () => {
      // Arrange
      const originalEvent = new TodoCreatedEvent('todo-123', {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'Test Todo',
      })

      // Act
      const serializeResult = serializer.serialize(originalEvent)
      expect(serializeResult.success).toBe(true)

      const deserializeResult = serializer.deserialize(
        originalEvent.eventType,
        serializeResult.data!.eventData,
        serializeResult.data!.metadata
      )

      // Assert
      expect(deserializeResult.success).toBe(true)

      const reconstructedEvent = deserializeResult.event as TodoCreatedEvent
      expect(reconstructedEvent.aggregateId).toBe(originalEvent.aggregateId)
      expect(reconstructedEvent.eventType).toBe(originalEvent.eventType)
      expect(reconstructedEvent.title).toBe(originalEvent.title)
      expect(reconstructedEvent.priority).toBe(originalEvent.priority)
      expect(reconstructedEvent.status).toBe(originalEvent.status)
    })

    it('should handle multiple event types in roundtrip', () => {
      // Arrange
      const events = [
        new TodoCreatedEvent('todo-1', {
          priority: 'HIGH',
          status: 'PENDING',
          title: 'Task 1',
        }),
        new TodoCompletedEvent('todo-1', {
          completedAt: new Date().toISOString(),
        }),
        new TodoTitleUpdatedEvent('todo-1', {
          newTitle: 'Updated Task 1',
          oldTitle: 'Task 1',
        }),
      ]

      // Act & Assert
      events.forEach((originalEvent) => {
        const serializeResult = serializer.serialize(originalEvent)
        expect(serializeResult.success).toBe(true)

        const deserializeResult = serializer.deserialize(
          originalEvent.eventType,
          serializeResult.data!.eventData,
          serializeResult.data!.metadata
        )
        expect(deserializeResult.success).toBe(true)
        expect(deserializeResult.event?.eventType).toBe(originalEvent.eventType)
        expect(deserializeResult.event?.aggregateId).toBe(
          originalEvent.aggregateId
        )
      })
    })
  })
})
