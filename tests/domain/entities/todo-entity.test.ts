import { describe, expect, it } from 'vitest'

import {
  createTestDate,
  expectValidationError,
  generateTestUUID,
} from '../value-objects/test-helpers'

import { TodoEntity } from '@/domain/entities/todo-entity'
import { DueDate } from '@/domain/value-objects/due-date'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

describe('TodoEntity', () => {
  const createValidTodoData = () => ({
    description: 'テスト用の説明',
    dueDate: new DueDate(createTestDate(7)),
    id: new TodoId(generateTestUUID()),
    priority: Priority.NORMAL(),
    status: TodoStatus.PENDING(),
    title: 'テストタスク',
    userId: generateTestUUID(),
  })

  describe('作成', () => {
    it('should create TodoEntity with valid data', () => {
      // Arrange
      const data = createValidTodoData()

      // Act
      const todo = TodoEntity.create(data)

      // Assert
      expect(todo.id.equals(data.id)).toBe(true)
      expect(todo.title).toBe(data.title)
      expect(todo.description).toBe(data.description)
      expect(todo.priority.equals(data.priority)).toBe(true)
      expect(todo.status.equals(data.status)).toBe(true)
      expect(todo.dueDate?.equals(data.dueDate)).toBe(true)
      expect(todo.userId).toBe(data.userId)
      expect(todo.createdAt).toBeInstanceOf(Date)
      expect(todo.updatedAt).toBeInstanceOf(Date)
    })

    it('should create TodoEntity without optional fields', () => {
      // Arrange
      const data = {
        id: new TodoId(generateTestUUID()),
        priority: Priority.LOW(),
        status: TodoStatus.PENDING(),
        title: 'シンプルなタスク',
        userId: generateTestUUID(),
      }

      // Act
      const todo = TodoEntity.create(data)

      // Assert
      expect(todo.title).toBe(data.title)
      expect(todo.description).toBeUndefined()
      expect(todo.dueDate).toBeUndefined()
      expect(todo.subTasks).toHaveLength(0)
    })

    it('should create TodoEntity from existing data', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T00:00:00.000Z')
      const updatedAt = new Date('2024-01-02T00:00:00.000Z')
      const data = {
        ...createValidTodoData(),
        createdAt,
        updatedAt,
      }

      // Act
      const todo = TodoEntity.fromData(data)

      // Assert
      expect(todo.createdAt).toEqual(createdAt)
      expect(todo.updatedAt).toEqual(updatedAt)
    })
  })

  describe('バリデーション', () => {
    it('should throw error for empty title', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: '',
      }

      // Act & Assert
      expectValidationError(() => TodoEntity.create(data), 'タイトルは必須です')
    })

    it('should throw error for whitespace only title', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: '   ',
      }

      // Act & Assert
      expectValidationError(() => TodoEntity.create(data), 'タイトルは必須です')
    })

    it('should throw error for title over 200 characters', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: 'a'.repeat(201),
      }

      // Act & Assert
      expectValidationError(
        () => TodoEntity.create(data),
        'タイトルは200文字以内である必要があります'
      )
    })

    it('should throw error for description over 2000 characters', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        description: 'a'.repeat(2001),
      }

      // Act & Assert
      expectValidationError(
        () => TodoEntity.create(data),
        '説明は2000文字以内である必要があります'
      )
    })

    it('should throw error for invalid userId format', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        userId: 'invalid-uuid',
      }

      // Act & Assert
      expectValidationError(
        () => TodoEntity.create(data),
        'ユーザーIDは有効なUUID形式である必要があります'
      )
    })
  })

  describe('操作', () => {
    it('should update title', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const newTitle = '更新されたタイトル'
      const originalUpdatedAt = todo.updatedAt

      // Act
      todo.updateTitle(newTitle)

      // Assert
      expect(todo.title).toBe(newTitle)
      expect(todo.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      )
    })

    it('should update description', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const newDescription = '更新された説明'

      // Act
      todo.updateDescription(newDescription)

      // Assert
      expect(todo.description).toBe(newDescription)
    })

    it('should clear description', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.updateDescription(undefined)

      // Assert
      expect(todo.description).toBeUndefined()
    })

    it('should update priority', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const newPriority = Priority.HIGH()

      // Act
      todo.updatePriority(newPriority)

      // Assert
      expect(todo.priority.equals(newPriority)).toBe(true)
    })

    it('should update due date', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const newDueDate = new DueDate(createTestDate(14))

      // Act
      todo.updateDueDate(newDueDate)

      // Assert
      expect(todo.dueDate?.equals(newDueDate)).toBe(true)
    })

    it('should clear due date', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.updateDueDate(undefined)

      // Assert
      expect(todo.dueDate).toBeUndefined()
    })
  })

  describe('ステータス操作', () => {
    it('should mark as completed', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.markAsCompleted()

      // Assert
      expect(todo.status.isCompleted()).toBe(true)
      expect(todo.completedAt).toBeInstanceOf(Date)
    })

    it('should mark as in progress', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.markAsInProgress()

      // Assert
      expect(todo.status.isInProgress()).toBe(true)
      expect(todo.completedAt).toBeUndefined()
    })

    it('should mark as cancelled', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.markAsCancelled()

      // Assert
      expect(todo.status.isCancelled()).toBe(true)
      expect(todo.completedAt).toBeUndefined()
    })

    it('should reopen completed todo', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      todo.markAsCompleted()

      // Act
      todo.reopen()

      // Assert
      expect(todo.status.isPending()).toBe(true)
      expect(todo.completedAt).toBeUndefined()
    })

    it('should throw error for invalid status transition', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      todo.markAsCompleted()

      // Act & Assert
      expectValidationError(
        () => todo.markAsCancelled(),
        '完了済みタスクをキャンセルに変更することはできません'
      )
    })
  })

  describe('サブタスク管理', () => {
    it('should add subtask', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const subtaskTitle = 'サブタスク1'

      // Act
      const subtask = todo.addSubTask(subtaskTitle)

      // Assert
      expect(todo.subTasks).toHaveLength(1)
      expect(subtask.title).toBe(subtaskTitle)
      expect(subtask.order).toBe(0)
    })

    it('should add multiple subtasks with correct order', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      const subtask1 = todo.addSubTask('サブタスク1')
      const subtask2 = todo.addSubTask('サブタスク2')

      // Assert
      expect(todo.subTasks).toHaveLength(2)
      expect(subtask1.order).toBe(0)
      expect(subtask2.order).toBe(1)
    })

    it('should remove subtask', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const subtask = todo.addSubTask('削除対象')

      // Act
      todo.removeSubTask(subtask.id)

      // Assert
      expect(todo.subTasks).toHaveLength(0)
    })

    it('should calculate completion rate based on subtasks', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      const subtask1 = todo.addSubTask('サブタスク1')
      const subtask2 = todo.addSubTask('サブタスク2')
      const _subtask3 = todo.addSubTask('サブタスク3')

      // Act
      subtask1.markAsCompleted()
      subtask2.markAsCompleted()

      // Assert
      const completionRate = todo.getCompletionRate()
      expect(completionRate.value).toBeCloseTo(66.67, 1)
    })

    it('should return 100% completion rate when no subtasks', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      todo.markAsCompleted()

      // Act
      const completionRate = todo.getCompletionRate()

      // Assert
      expect(completionRate.value).toBe(100)
    })
  })

  describe('期限判定', () => {
    it('should identify overdue todo', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        dueDate: new DueDate(createTestDate(-1), true), // 昨日（過去日付を許可）
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.isOverdue()).toBe(true)
    })

    it('should not identify completed todo as overdue', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        dueDate: new DueDate(createTestDate(-1), true), // 昨日
      }
      const todo = TodoEntity.create(data)
      todo.markAsCompleted()

      // Act & Assert
      expect(todo.isOverdue()).toBe(false)
    })

    it('should identify due today', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        dueDate: new DueDate(new Date()),
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.isDueToday()).toBe(true)
    })

    it('should identify due within days', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        dueDate: new DueDate(createTestDate(3)),
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.isDueWithinDays(5)).toBe(true)
      expect(todo.isDueWithinDays(2)).toBe(false)
    })
  })

  describe('検索・フィルタ', () => {
    it('should match search term in title', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: 'プロジェクトの企画書作成',
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.matchesSearchTerm('企画')).toBe(true)
      expect(todo.matchesSearchTerm('開発')).toBe(false)
    })

    it('should match search term in description', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        description: 'Q1のプロジェクト企画書を詳細に作成する',
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.matchesSearchTerm('詳細')).toBe(true)
      expect(todo.matchesSearchTerm('設計')).toBe(false)
    })

    it('should perform case-insensitive search', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: 'Important Task',
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.matchesSearchTerm('important')).toBe(true)
      expect(todo.matchesSearchTerm('TASK')).toBe(true)
    })
  })

  describe('等価性', () => {
    it('should be equal when IDs are same', () => {
      // Arrange
      const id = new TodoId(generateTestUUID())
      const data1 = { ...createValidTodoData(), id }
      const data2 = { ...createValidTodoData(), id, title: '異なるタイトル' }
      const todo1 = TodoEntity.create(data1)
      const todo2 = TodoEntity.create(data2)

      // Act & Assert
      expect(todo1.equals(todo2)).toBe(true)
    })

    it('should not be equal when IDs are different', () => {
      // Arrange
      const todo1 = TodoEntity.create(createValidTodoData())
      const todo2 = TodoEntity.create(createValidTodoData())

      // Act & Assert
      expect(todo1.equals(todo2)).toBe(false)
    })
  })

  describe('ドメインイベント', () => {
    it('should record domain events', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())

      // Act
      todo.markAsCompleted()
      todo.updatePriority(Priority.HIGH())

      // Assert
      const events = todo.getUncommittedEvents()
      expect(events).toHaveLength(3) // Created, Completed, PriorityChanged
      expect(events[0].eventType).toBe('TodoCreated')
      expect(events[1].eventType).toBe('TodoCompleted')
      expect(events[2].eventType).toBe('TodoPriorityChanged')
    })

    it('should clear uncommitted events', () => {
      // Arrange
      const todo = TodoEntity.create(createValidTodoData())
      todo.markAsCompleted()

      // Act
      todo.clearUncommittedEvents()

      // Assert
      expect(todo.getUncommittedEvents()).toHaveLength(0)
    })
  })

  describe('文字列変換', () => {
    it('should return title as toString', () => {
      // Arrange
      const data = {
        ...createValidTodoData(),
        title: 'テストタスク',
      }
      const todo = TodoEntity.create(data)

      // Act & Assert
      expect(todo.toString()).toBe('テストタスク')
    })
  })
})
