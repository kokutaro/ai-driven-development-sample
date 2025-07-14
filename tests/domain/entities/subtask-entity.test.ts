import { describe, expect, it } from 'vitest'

import {
  expectValidationError,
  generateTestUUID,
} from '../value-objects/test-helpers'

import { SubTaskEntity } from '@/domain/entities/subtask-entity'
import { TodoId } from '@/domain/value-objects/todo-id'

describe('SubTaskEntity', () => {
  const createValidSubTaskData = () => ({
    id: new TodoId(generateTestUUID()),
    order: 0,
    title: 'サブタスクテスト',
    todoId: new TodoId(generateTestUUID()),
  })

  describe('作成', () => {
    it('should create SubTaskEntity with valid data', () => {
      // Arrange
      const data = createValidSubTaskData()

      // Act
      const subTask = SubTaskEntity.create(data)

      // Assert
      expect(subTask.id.equals(data.id)).toBe(true)
      expect(subTask.title).toBe(data.title)
      expect(subTask.order).toBe(data.order)
      expect(subTask.todoId.equals(data.todoId)).toBe(true)
      expect(subTask.isCompleted).toBe(false)
      expect(subTask.createdAt).toBeInstanceOf(Date)
      expect(subTask.updatedAt).toBeInstanceOf(Date)
    })

    it('should create SubTaskEntity from existing data', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T00:00:00.000Z')
      const updatedAt = new Date('2024-01-02T00:00:00.000Z')
      const data = {
        ...createValidSubTaskData(),
        createdAt,
        isCompleted: true,
        updatedAt,
      }

      // Act
      const subTask = SubTaskEntity.fromData(data)

      // Assert
      expect(subTask.isCompleted).toBe(true)
      expect(subTask.createdAt).toEqual(createdAt)
      expect(subTask.updatedAt).toEqual(updatedAt)
    })
  })

  describe('バリデーション', () => {
    it('should throw error for empty title', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: '',
      }

      // Act & Assert
      expectValidationError(
        () => SubTaskEntity.create(data),
        'サブタスクのタイトルは必須です'
      )
    })

    it('should throw error for whitespace only title', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: '   ',
      }

      // Act & Assert
      expectValidationError(
        () => SubTaskEntity.create(data),
        'サブタスクのタイトルは必須です'
      )
    })

    it('should throw error for title over 200 characters', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: 'a'.repeat(201),
      }

      // Act & Assert
      expectValidationError(
        () => SubTaskEntity.create(data),
        'サブタスクのタイトルは200文字以内である必要があります'
      )
    })

    it('should throw error for negative order', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        order: -1,
      }

      // Act & Assert
      expectValidationError(
        () => SubTaskEntity.create(data),
        'サブタスクの順序は0以上である必要があります'
      )
    })

    it('should throw error for non-integer order', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        order: 1.5,
      }

      // Act & Assert
      expectValidationError(
        () => SubTaskEntity.create(data),
        'サブタスクの順序は整数である必要があります'
      )
    })
  })

  describe('操作', () => {
    it('should update title', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())
      const newTitle = '更新されたサブタスク'
      const originalUpdatedAt = subTask.updatedAt

      // Act
      subTask.updateTitle(newTitle)

      // Assert
      expect(subTask.title).toBe(newTitle)
      expect(subTask.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      )
    })

    it('should update order', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())
      const newOrder = 5

      // Act
      subTask.updateOrder(newOrder)

      // Assert
      expect(subTask.order).toBe(newOrder)
    })

    it('should mark as completed', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act
      subTask.markAsCompleted()

      // Assert
      expect(subTask.isCompleted).toBe(true)
    })

    it('should mark as not completed', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())
      subTask.markAsCompleted()

      // Act
      subTask.markAsNotCompleted()

      // Assert
      expect(subTask.isCompleted).toBe(false)
    })

    it('should toggle completion status', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.isCompleted).toBe(false)

      subTask.toggleCompletion()
      expect(subTask.isCompleted).toBe(true)

      subTask.toggleCompletion()
      expect(subTask.isCompleted).toBe(false)
    })
  })

  describe('バリデーション - 更新時', () => {
    it('should throw error when updating to empty title', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expectValidationError(
        () => subTask.updateTitle(''),
        'サブタスクのタイトルは必須です'
      )
    })

    it('should throw error when updating to long title', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expectValidationError(
        () => subTask.updateTitle('a'.repeat(201)),
        'サブタスクのタイトルは200文字以内である必要があります'
      )
    })

    it('should throw error when updating to negative order', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expectValidationError(
        () => subTask.updateOrder(-1),
        'サブタスクの順序は0以上である必要があります'
      )
    })
  })

  describe('等価性', () => {
    it('should be equal when IDs are same', () => {
      // Arrange
      const id = new TodoId(generateTestUUID())
      const data1 = { ...createValidSubTaskData(), id }
      const data2 = { ...createValidSubTaskData(), id, title: '異なるタイトル' }
      const subTask1 = SubTaskEntity.create(data1)
      const subTask2 = SubTaskEntity.create(data2)

      // Act & Assert
      expect(subTask1.equals(subTask2)).toBe(true)
    })

    it('should not be equal when IDs are different', () => {
      // Arrange
      const subTask1 = SubTaskEntity.create(createValidSubTaskData())
      const subTask2 = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask1.equals(subTask2)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.equals(null as never)).toBe(false)
    })

    it('should not be equal to undefined', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.equals(undefined as never)).toBe(false)
    })
  })

  describe('検索・フィルタ', () => {
    it('should match search term in title', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: 'データベース設計の詳細',
      }
      const subTask = SubTaskEntity.create(data)

      // Act & Assert
      expect(subTask.matchesSearchTerm('設計')).toBe(true)
      expect(subTask.matchesSearchTerm('実装')).toBe(false)
    })

    it('should perform case-insensitive search', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: 'Database Design',
      }
      const subTask = SubTaskEntity.create(data)

      // Act & Assert
      expect(subTask.matchesSearchTerm('database')).toBe(true)
      expect(subTask.matchesSearchTerm('DESIGN')).toBe(true)
    })

    it('should return false for empty search term', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.matchesSearchTerm('')).toBe(false)
    })
  })

  describe('文字列変換', () => {
    it('should return title as toString', () => {
      // Arrange
      const data = {
        ...createValidSubTaskData(),
        title: 'サブタスクのテスト',
      }
      const subTask = SubTaskEntity.create(data)

      // Act & Assert
      expect(subTask.toString()).toBe('サブタスクのテスト')
    })
  })

  describe('ステータス表示', () => {
    it('should return appropriate status icon', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.getStatusIcon()).toBe('○') // 未完了

      subTask.markAsCompleted()
      expect(subTask.getStatusIcon()).toBe('●') // 完了
    })

    it('should return appropriate status text', () => {
      // Arrange
      const subTask = SubTaskEntity.create(createValidSubTaskData())

      // Act & Assert
      expect(subTask.getStatusText()).toBe('未完了')

      subTask.markAsCompleted()
      expect(subTask.getStatusText()).toBe('完了')
    })
  })
})
