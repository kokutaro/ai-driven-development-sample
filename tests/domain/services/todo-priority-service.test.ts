import { describe, expect, it } from 'vitest'

import { createTestDate, generateTestUUID } from '../value-objects/test-helpers'

import { TodoEntity } from '@/domain/entities/todo-entity'
import { TodoPriorityService } from '@/domain/services/todo-priority-service'
import { DueDate } from '@/domain/value-objects/due-date'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

describe('TodoPriorityService', () => {
  const createTodoWithPriority = (
    priority: Priority,
    dueDate?: DueDate,
    status = TodoStatus.PENDING()
  ) => {
    return TodoEntity.create({
      dueDate,
      id: new TodoId(generateTestUUID()),
      priority,
      status,
      title: 'テストタスク',
      userId: generateTestUUID(),
    })
  }

  describe('sortByPriority', () => {
    it('should sort todos by priority in descending order', () => {
      // Arrange
      const highTodo = createTodoWithPriority(Priority.HIGH())
      const lowTodo = createTodoWithPriority(Priority.LOW())
      const urgentTodo = createTodoWithPriority(Priority.URGENT())
      const normalTodo = createTodoWithPriority(Priority.NORMAL())
      const todos = [highTodo, lowTodo, urgentTodo, normalTodo]

      // Act
      const sortedTodos = TodoPriorityService.sortByPriority(todos)

      // Assert
      expect(sortedTodos[0]).toBe(urgentTodo)
      expect(sortedTodos[1]).toBe(highTodo)
      expect(sortedTodos[2]).toBe(normalTodo)
      expect(sortedTodos[3]).toBe(lowTodo)
    })

    it('should maintain order for same priority todos', () => {
      // Arrange
      const todo1 = createTodoWithPriority(Priority.HIGH())
      const todo2 = createTodoWithPriority(Priority.HIGH())
      const todo3 = createTodoWithPriority(Priority.HIGH())
      const todos = [todo1, todo2, todo3]

      // Act
      const sortedTodos = TodoPriorityService.sortByPriority(todos)

      // Assert
      expect(sortedTodos[0]).toBe(todo1)
      expect(sortedTodos[1]).toBe(todo2)
      expect(sortedTodos[2]).toBe(todo3)
    })

    it('should handle empty array', () => {
      // Act
      const sortedTodos = TodoPriorityService.sortByPriority([])

      // Assert
      expect(sortedTodos).toEqual([])
    })
  })

  describe('getHighPriorityTodos', () => {
    it('should return only HIGH and URGENT priority todos', () => {
      // Arrange
      const highTodo = createTodoWithPriority(Priority.HIGH())
      const lowTodo = createTodoWithPriority(Priority.LOW())
      const urgentTodo = createTodoWithPriority(Priority.URGENT())
      const normalTodo = createTodoWithPriority(Priority.NORMAL())
      const todos = [highTodo, lowTodo, urgentTodo, normalTodo]

      // Act
      const highPriorityTodos = TodoPriorityService.getHighPriorityTodos(todos)

      // Assert
      expect(highPriorityTodos).toHaveLength(2)
      expect(highPriorityTodos).toContain(highTodo)
      expect(highPriorityTodos).toContain(urgentTodo)
      expect(highPriorityTodos).not.toContain(lowTodo)
      expect(highPriorityTodos).not.toContain(normalTodo)
    })

    it('should return empty array when no high priority todos', () => {
      // Arrange
      const lowTodo = createTodoWithPriority(Priority.LOW())
      const normalTodo = createTodoWithPriority(Priority.NORMAL())
      const todos = [lowTodo, normalTodo]

      // Act
      const highPriorityTodos = TodoPriorityService.getHighPriorityTodos(todos)

      // Assert
      expect(highPriorityTodos).toEqual([])
    })
  })

  describe('calculatePriorityDistribution', () => {
    it('should calculate correct priority distribution', () => {
      // Arrange
      const highTodo1 = createTodoWithPriority(Priority.HIGH())
      const highTodo2 = createTodoWithPriority(Priority.HIGH())
      const lowTodo = createTodoWithPriority(Priority.LOW())
      const urgentTodo = createTodoWithPriority(Priority.URGENT())
      const normalTodo = createTodoWithPriority(Priority.NORMAL())
      const todos = [highTodo1, highTodo2, lowTodo, urgentTodo, normalTodo]

      // Act
      const distribution =
        TodoPriorityService.calculatePriorityDistribution(todos)

      // Assert
      expect(distribution.URGENT).toBe(1)
      expect(distribution.HIGH).toBe(2)
      expect(distribution.NORMAL).toBe(1)
      expect(distribution.LOW).toBe(1)
    })

    it('should handle empty array', () => {
      // Act
      const distribution = TodoPriorityService.calculatePriorityDistribution([])

      // Assert
      expect(distribution.URGENT).toBe(0)
      expect(distribution.HIGH).toBe(0)
      expect(distribution.NORMAL).toBe(0)
      expect(distribution.LOW).toBe(0)
    })
  })

  describe('suggestPriorityAdjustment', () => {
    it('should suggest higher priority for overdue todos', () => {
      // Arrange
      const overdueTodo = createTodoWithPriority(
        Priority.NORMAL(),
        new DueDate(createTestDate(-1), true) // 昨日（過去日付を許可）
      )

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(overdueTodo)

      // Assert
      expect(suggestion.shouldAdjust).toBe(true)
      expect(suggestion.suggestedPriority.isHigherThan(Priority.NORMAL())).toBe(
        true
      )
      expect(suggestion.reason).toContain('期限切れ')
    })

    it('should suggest higher priority for due today todos', () => {
      // Arrange
      const dueTodayTodo = createTodoWithPriority(
        Priority.LOW(),
        new DueDate(new Date())
      )

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(dueTodayTodo)

      // Assert
      expect(suggestion.shouldAdjust).toBe(true)
      expect(suggestion.suggestedPriority.isHigherThan(Priority.LOW())).toBe(
        true
      )
      expect(suggestion.reason).toContain('今日が期限')
    })

    it('should suggest higher priority for due within 3 days todos', () => {
      // Arrange
      const dueWithin3DaysTodo = createTodoWithPriority(
        Priority.LOW(),
        new DueDate(createTestDate(2))
      )

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(dueWithin3DaysTodo)

      // Assert
      expect(suggestion.shouldAdjust).toBe(true)
      expect(suggestion.suggestedPriority.isHigherThan(Priority.LOW())).toBe(
        true
      )
      expect(suggestion.reason).toContain('3日以内')
    })

    it('should not suggest adjustment for urgent todos', () => {
      // Arrange
      const urgentTodo = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(createTestDate(-1), true) // 期限切れでも
      )

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(urgentTodo)

      // Assert
      expect(suggestion.shouldAdjust).toBe(false)
      expect(suggestion.reason).toContain('既に最高優先度')
    })

    it('should not suggest adjustment for completed todos', () => {
      // Arrange
      const completedTodo = createTodoWithPriority(
        Priority.LOW(),
        new DueDate(createTestDate(-1), true),
        TodoStatus.COMPLETED()
      )

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(completedTodo)

      // Assert
      expect(suggestion.shouldAdjust).toBe(false)
      expect(suggestion.reason).toContain('完了済み')
    })

    it('should not suggest adjustment for todos without due date', () => {
      // Arrange
      const todoWithoutDueDate = createTodoWithPriority(Priority.LOW())

      // Act
      const suggestion =
        TodoPriorityService.suggestPriorityAdjustment(todoWithoutDueDate)

      // Assert
      expect(suggestion.shouldAdjust).toBe(false)
      expect(suggestion.reason).toContain('期限日なし')
    })
  })

  describe('getUrgentActionRequired', () => {
    it('should return urgent action required todos', () => {
      // Arrange
      const urgentOverdueTodo = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(createTestDate(-1), true)
      )
      const highOverdueTodo = createTodoWithPriority(
        Priority.HIGH(),
        new DueDate(createTestDate(-2), true)
      )
      const normalFutureTodo = createTodoWithPriority(
        Priority.NORMAL(),
        new DueDate(createTestDate(7))
      )
      const urgentDueTodayTodo = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(new Date())
      )
      const todos = [
        urgentOverdueTodo,
        highOverdueTodo,
        normalFutureTodo,
        urgentDueTodayTodo,
      ]

      // Act
      const urgentTodos = TodoPriorityService.getUrgentActionRequired(todos)

      // Assert
      expect(urgentTodos).toHaveLength(3)
      expect(urgentTodos).toContain(urgentOverdueTodo)
      expect(urgentTodos).toContain(highOverdueTodo)
      expect(urgentTodos).toContain(urgentDueTodayTodo)
      expect(urgentTodos).not.toContain(normalFutureTodo)
    })

    it('should exclude completed todos from urgent action required', () => {
      // Arrange
      const urgentOverdueCompleted = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(createTestDate(-1), true),
        TodoStatus.COMPLETED()
      )
      const urgentOverduePending = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(createTestDate(-1), true)
      )
      const todos = [urgentOverdueCompleted, urgentOverduePending]

      // Act
      const urgentTodos = TodoPriorityService.getUrgentActionRequired(todos)

      // Assert
      expect(urgentTodos).toHaveLength(1)
      expect(urgentTodos).toContain(urgentOverduePending)
      expect(urgentTodos).not.toContain(urgentOverdueCompleted)
    })
  })

  describe('prioritizeByUrgency', () => {
    it('should prioritize todos by urgency factors', () => {
      // Arrange
      const urgentOverdue = createTodoWithPriority(
        Priority.URGENT(),
        new DueDate(createTestDate(-2), true)
      )
      const highDueToday = createTodoWithPriority(
        Priority.HIGH(),
        new DueDate(new Date())
      )
      const normalDueWithin3Days = createTodoWithPriority(
        Priority.NORMAL(),
        new DueDate(createTestDate(2))
      )
      const lowFuture = createTodoWithPriority(
        Priority.LOW(),
        new DueDate(createTestDate(7))
      )
      const todos = [
        lowFuture,
        normalDueWithin3Days,
        urgentOverdue,
        highDueToday,
      ]

      // Act
      const prioritized = TodoPriorityService.prioritizeByUrgency(todos)

      // Assert
      expect(prioritized[0]).toBe(urgentOverdue) // 緊急 + 期限切れ
      expect(prioritized[1]).toBe(highDueToday) // 高優先度 + 今日期限
      expect(prioritized[2]).toBe(normalDueWithin3Days) // 通常 + 3日以内
      expect(prioritized[3]).toBe(lowFuture) // 低優先度 + 将来
    })

    it('should handle todos without due dates', () => {
      // Arrange
      const urgentWithoutDueDate = createTodoWithPriority(Priority.URGENT())
      const normalWithoutDueDate = createTodoWithPriority(Priority.NORMAL())
      const todos = [normalWithoutDueDate, urgentWithoutDueDate]

      // Act
      const prioritized = TodoPriorityService.prioritizeByUrgency(todos)

      // Assert
      expect(prioritized[0]).toBe(urgentWithoutDueDate)
      expect(prioritized[1]).toBe(normalWithoutDueDate)
    })
  })
})
