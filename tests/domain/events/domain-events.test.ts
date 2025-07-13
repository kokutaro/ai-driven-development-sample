import { describe, expect, it } from 'vitest'

import { generateTestUUID } from '../value-objects/test-helpers'

import type { DomainEvent } from '@/domain/events/domain-events'

import {
  SubTaskAddedEvent,
  SubTaskRemovedEvent,
  TodoCancelledEvent,
  TodoCompletedEvent,
  TodoCreatedEvent,
  TodoDescriptionUpdatedEvent,
  TodoDueDateUpdatedEvent,
  TodoPriorityChangedEvent,
  TodoReopenedEvent,
  TodoStartedEvent,
  TodoTitleUpdatedEvent,
} from '@/domain/events/domain-events'

describe('Domain Events', () => {
  const testTodoId = generateTestUUID()
  const testSubTaskId = generateTestUUID()
  const testOccurredAt = new Date('2024-01-01T12:00:00.000Z')

  describe('TodoCreatedEvent', () => {
    it('should create TodoCreatedEvent with valid data', () => {
      // Arrange
      const payload = {
        priority: 'NORMAL',
        status: 'PENDING',
        title: 'テストタスク',
      }

      // Act
      const event = new TodoCreatedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoCreated')
      expect(event.occurredAt).toEqual(testOccurredAt)
      expect(event.payload).toEqual(payload)
      expect(event.title).toBe('テストタスク')
      expect(event.priority).toBe('NORMAL')
      expect(event.status).toBe('PENDING')
    })

    it('should create TodoCreatedEvent with current timestamp by default', () => {
      // Arrange
      const payload = {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'テストタスク',
      }
      const beforeCreation = new Date()

      // Act
      const event = new TodoCreatedEvent(testTodoId, payload)

      // Assert
      const afterCreation = new Date()
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime()
      )
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime()
      )
    })
  })

  describe('TodoCompletedEvent', () => {
    it('should create TodoCompletedEvent with valid data', () => {
      // Arrange
      const payload = {
        completedAt: '2024-01-01T12:00:00.000Z',
      }

      // Act
      const event = new TodoCompletedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoCompleted')
      expect(event.occurredAt).toEqual(testOccurredAt)
      expect(event.payload).toEqual(payload)
      expect(event.completedAt).toBe('2024-01-01T12:00:00.000Z')
    })
  })

  describe('TodoCancelledEvent', () => {
    it('should create TodoCancelledEvent with valid data', () => {
      // Arrange
      const payload = {
        cancelledAt: '2024-01-01T12:00:00.000Z',
      }

      // Act
      const event = new TodoCancelledEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoCancelled')
      expect(event.payload).toEqual(payload)
      expect(event.cancelledAt).toBe('2024-01-01T12:00:00.000Z')
    })
  })

  describe('TodoStartedEvent', () => {
    it('should create TodoStartedEvent with valid data', () => {
      // Arrange
      const payload = {
        startedAt: '2024-01-01T12:00:00.000Z',
      }

      // Act
      const event = new TodoStartedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoStarted')
      expect(event.payload).toEqual(payload)
      expect(event.startedAt).toBe('2024-01-01T12:00:00.000Z')
    })
  })

  describe('TodoReopenedEvent', () => {
    it('should create TodoReopenedEvent with valid data', () => {
      // Arrange
      const payload = {
        reopenedAt: '2024-01-01T12:00:00.000Z',
      }

      // Act
      const event = new TodoReopenedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoReopened')
      expect(event.payload).toEqual(payload)
      expect(event.reopenedAt).toBe('2024-01-01T12:00:00.000Z')
    })
  })

  describe('TodoTitleUpdatedEvent', () => {
    it('should create TodoTitleUpdatedEvent with valid data', () => {
      // Arrange
      const payload = {
        newTitle: '新しいタイトル',
        oldTitle: '古いタイトル',
      }

      // Act
      const event = new TodoTitleUpdatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoTitleUpdated')
      expect(event.payload).toEqual(payload)
      expect(event.oldTitle).toBe('古いタイトル')
      expect(event.newTitle).toBe('新しいタイトル')
    })
  })

  describe('TodoDescriptionUpdatedEvent', () => {
    it('should create TodoDescriptionUpdatedEvent with valid data', () => {
      // Arrange
      const payload = {
        newDescription: '新しい説明',
        oldDescription: '古い説明',
      }

      // Act
      const event = new TodoDescriptionUpdatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoDescriptionUpdated')
      expect(event.payload).toEqual(payload)
      expect(event.oldDescription).toBe('古い説明')
      expect(event.newDescription).toBe('新しい説明')
    })

    it('should handle undefined descriptions', () => {
      // Arrange
      const payload = {
        newDescription: '新しい説明',
        oldDescription: undefined,
      }

      // Act
      const event = new TodoDescriptionUpdatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.oldDescription).toBeUndefined()
      expect(event.newDescription).toBe('新しい説明')
    })
  })

  describe('TodoPriorityChangedEvent', () => {
    it('should create TodoPriorityChangedEvent with valid data', () => {
      // Arrange
      const payload = {
        newPriority: 'HIGH',
        oldPriority: 'NORMAL',
      }

      // Act
      const event = new TodoPriorityChangedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoPriorityChanged')
      expect(event.payload).toEqual(payload)
      expect(event.oldPriority).toBe('NORMAL')
      expect(event.newPriority).toBe('HIGH')
    })
  })

  describe('TodoDueDateUpdatedEvent', () => {
    it('should create TodoDueDateUpdatedEvent with valid data', () => {
      // Arrange
      const payload = {
        newDueDate: '2024-01-02T00:00:00.000Z',
        oldDueDate: '2024-01-01T00:00:00.000Z',
      }

      // Act
      const event = new TodoDueDateUpdatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('TodoDueDateUpdated')
      expect(event.payload).toEqual(payload)
      expect(event.oldDueDate).toBe('2024-01-01T00:00:00.000Z')
      expect(event.newDueDate).toBe('2024-01-02T00:00:00.000Z')
    })

    it('should handle undefined due dates', () => {
      // Arrange
      const payload = {
        newDueDate: '2024-01-02T00:00:00.000Z',
        oldDueDate: undefined,
      }

      // Act
      const event = new TodoDueDateUpdatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Assert
      expect(event.oldDueDate).toBeUndefined()
      expect(event.newDueDate).toBe('2024-01-02T00:00:00.000Z')
    })
  })

  describe('SubTaskAddedEvent', () => {
    it('should create SubTaskAddedEvent with valid data', () => {
      // Arrange
      const payload = {
        order: 0,
        subTaskId: testSubTaskId,
        title: 'サブタスク1',
      }

      // Act
      const event = new SubTaskAddedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('SubTaskAdded')
      expect(event.payload).toEqual(payload)
      expect(event.subTaskId).toBe(testSubTaskId)
      expect(event.title).toBe('サブタスク1')
      expect(event.order).toBe(0)
    })
  })

  describe('SubTaskRemovedEvent', () => {
    it('should create SubTaskRemovedEvent with valid data', () => {
      // Arrange
      const payload = {
        subTaskId: testSubTaskId,
        title: 'サブタスク1',
      }

      // Act
      const event = new SubTaskRemovedEvent(testTodoId, payload, testOccurredAt)

      // Assert
      expect(event.aggregateId).toBe(testTodoId)
      expect(event.eventType).toBe('SubTaskRemoved')
      expect(event.payload).toEqual(payload)
      expect(event.subTaskId).toBe(testSubTaskId)
      expect(event.title).toBe('サブタスク1')
    })
  })

  describe('Base DomainEvent interface', () => {
    it('should implement DomainEvent interface correctly', () => {
      // Arrange
      const payload = { priority: 'NORMAL', status: 'PENDING', title: 'テスト' }
      const event = new TodoCreatedEvent(testTodoId, payload, testOccurredAt)

      // Act & Assert
      expect(event).toHaveProperty('aggregateId')
      expect(event).toHaveProperty('eventType')
      expect(event).toHaveProperty('occurredAt')
      expect(event).toHaveProperty('payload')

      // Type checking
      const domainEvent: DomainEvent = event
      expect(domainEvent.aggregateId).toBe(testTodoId)
      expect(domainEvent.eventType).toBe('TodoCreated')
      expect(domainEvent.occurredAt).toEqual(testOccurredAt)
      expect(domainEvent.payload).toEqual(payload)
    })
  })

  describe('Event equality and serialization', () => {
    it('should serialize and deserialize events correctly', () => {
      // Arrange
      const payload = {
        priority: 'HIGH',
        status: 'PENDING',
        title: 'テストタスク',
      }
      const originalEvent = new TodoCreatedEvent(
        testTodoId,
        payload,
        testOccurredAt
      )

      // Act
      const serialized = JSON.stringify(originalEvent)
      const deserialized = JSON.parse(serialized)

      // Assert
      // プライベートプロパティが正しくシリアライズされていることを確認
      expect(deserialized._aggregateId).toBe(testTodoId)
      expect(deserialized._eventType).toBe('TodoCreated')
      expect(new Date(deserialized._occurredAt as string)).toEqual(
        testOccurredAt
      )
      expect(deserialized._payload).toEqual(payload)
    })

    it('should compare events correctly', () => {
      // Arrange
      const payload1 = {
        priority: 'NORMAL',
        status: 'PENDING',
        title: 'タスク1',
      }
      const payload2 = {
        priority: 'NORMAL',
        status: 'PENDING',
        title: 'タスク2',
      }
      const event1 = new TodoCreatedEvent(testTodoId, payload1, testOccurredAt)
      const event2 = new TodoCreatedEvent(testTodoId, payload1, testOccurredAt)
      const event3 = new TodoCreatedEvent(testTodoId, payload2, testOccurredAt)

      // Act & Assert
      expect(event1.aggregateId).toBe(event2.aggregateId)
      expect(event1.eventType).toBe(event2.eventType)
      expect(event1.occurredAt).toEqual(event2.occurredAt)
      expect(event1.payload).toEqual(event2.payload)

      expect(event1.payload).not.toEqual(event3.payload)
    })
  })
})
