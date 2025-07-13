import { describe, expect, it } from 'vitest'

import { createTestDate, generateTestUUID } from '../value-objects/test-helpers'

import { TodoEntity } from '@/domain/entities/todo-entity'
import {
  CompletedTodoSpec,
  HighPriorityTodoSpec,
  OverdueTodoSpec,
  PendingTodoSpec,
  TodoDueTodaySpec,
  TodoDueWithinDaysSpec,
  UserTodoSpec,
} from '@/domain/specifications/todo-specifications'
import { DueDate } from '@/domain/value-objects/due-date'
import { Priority } from '@/domain/value-objects/priority'
import { TodoId } from '@/domain/value-objects/todo-id'
import { TodoStatus } from '@/domain/value-objects/todo-status'

describe('Todo Specifications', () => {
  const userId = generateTestUUID()
  const otherUserId = generateTestUUID()

  const createTodo = (overrides = {}) => {
    return TodoEntity.create({
      id: new TodoId(generateTestUUID()),
      priority: Priority.NORMAL(),
      status: TodoStatus.PENDING(),
      title: 'テストタスク',
      userId,
      ...overrides,
    })
  }

  describe('UserTodoSpec', () => {
    it('should satisfy specification for todos belonging to user', () => {
      // Arrange
      const userTodo = createTodo({ userId })
      const otherUserTodo = createTodo({ userId: otherUserId })
      const spec = new UserTodoSpec(userId)

      // Act & Assert
      expect(spec.isSatisfiedBy(userTodo)).toBe(true)
      expect(spec.isSatisfiedBy(otherUserTodo)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new UserTodoSpec(userId)

      // Act & Assert
      expect(spec.description).toBe(`ユーザーID: ${userId} のTODO`)
    })

    it('should filter todos correctly', () => {
      // Arrange
      const userTodo1 = createTodo({ userId })
      const userTodo2 = createTodo({ userId })
      const otherUserTodo = createTodo({ userId: otherUserId })
      const todos = [userTodo1, otherUserTodo, userTodo2]
      const spec = new UserTodoSpec(userId)

      // Act
      const filteredTodos = spec.filterTodos(todos)

      // Assert
      expect(filteredTodos).toHaveLength(2)
      expect(filteredTodos).toContain(userTodo1)
      expect(filteredTodos).toContain(userTodo2)
      expect(filteredTodos).not.toContain(otherUserTodo)
    })
  })

  describe('CompletedTodoSpec', () => {
    it('should satisfy specification for completed todos', () => {
      // Arrange
      const completedTodo = createTodo({ status: TodoStatus.COMPLETED() })
      const pendingTodo = createTodo({ status: TodoStatus.PENDING() })
      const spec = new CompletedTodoSpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(completedTodo)).toBe(true)
      expect(spec.isSatisfiedBy(pendingTodo)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new CompletedTodoSpec()

      // Act & Assert
      expect(spec.description).toBe('完了済みのTODO')
    })
  })

  describe('PendingTodoSpec', () => {
    it('should satisfy specification for pending todos', () => {
      // Arrange
      const pendingTodo = createTodo({ status: TodoStatus.PENDING() })
      const completedTodo = createTodo({ status: TodoStatus.COMPLETED() })
      const inProgressTodo = createTodo({ status: TodoStatus.IN_PROGRESS() })
      const spec = new PendingTodoSpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(pendingTodo)).toBe(true)
      expect(spec.isSatisfiedBy(inProgressTodo)).toBe(true)
      expect(spec.isSatisfiedBy(completedTodo)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new PendingTodoSpec()

      // Act & Assert
      expect(spec.description).toBe('未完了のTODO')
    })
  })

  describe('HighPriorityTodoSpec', () => {
    it('should satisfy specification for high priority todos', () => {
      // Arrange
      const highTodo = createTodo({ priority: Priority.HIGH() })
      const urgentTodo = createTodo({ priority: Priority.URGENT() })
      const normalTodo = createTodo({ priority: Priority.NORMAL() })
      const lowTodo = createTodo({ priority: Priority.LOW() })
      const spec = new HighPriorityTodoSpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(highTodo)).toBe(true)
      expect(spec.isSatisfiedBy(urgentTodo)).toBe(true)
      expect(spec.isSatisfiedBy(normalTodo)).toBe(false)
      expect(spec.isSatisfiedBy(lowTodo)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new HighPriorityTodoSpec()

      // Act & Assert
      expect(spec.description).toBe('高優先度（HIGH以上）のTODO')
    })
  })

  describe('OverdueTodoSpec', () => {
    it('should satisfy specification for overdue todos', () => {
      // Arrange
      const overdueTodo = createTodo({
        dueDate: new DueDate(createTestDate(-1), true), // 昨日（過去日付を許可）
      })
      const futureTodo = createTodo({
        dueDate: new DueDate(createTestDate(1)),
      })
      const todoWithoutDueDate = createTodo()
      const spec = new OverdueTodoSpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(overdueTodo)).toBe(true)
      expect(spec.isSatisfiedBy(futureTodo)).toBe(false)
      expect(spec.isSatisfiedBy(todoWithoutDueDate)).toBe(false)
    })

    it('should not satisfy specification for completed overdue todos', () => {
      // Arrange
      const completedOverdueTodo = createTodo({
        dueDate: new DueDate(createTestDate(-1), true),
        status: TodoStatus.COMPLETED(),
      })
      const spec = new OverdueTodoSpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(completedOverdueTodo)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new OverdueTodoSpec()

      // Act & Assert
      expect(spec.description).toBe('期限切れのTODO')
    })
  })

  describe('TodoDueTodaySpec', () => {
    it('should satisfy specification for todos due today', () => {
      // Arrange
      const dueTodayTodo = createTodo({
        dueDate: new DueDate(new Date()),
      })
      const futureTodo = createTodo({
        dueDate: new DueDate(createTestDate(1)),
      })
      const todoWithoutDueDate = createTodo()
      const spec = new TodoDueTodaySpec()

      // Act & Assert
      expect(spec.isSatisfiedBy(dueTodayTodo)).toBe(true)
      expect(spec.isSatisfiedBy(futureTodo)).toBe(false)
      expect(spec.isSatisfiedBy(todoWithoutDueDate)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new TodoDueTodaySpec()

      // Act & Assert
      expect(spec.description).toBe('今日が期限のTODO')
    })
  })

  describe('TodoDueWithinDaysSpec', () => {
    it('should satisfy specification for todos due within specified days', () => {
      // Arrange
      const dueTomorrowTodo = createTodo({
        dueDate: new DueDate(createTestDate(1)),
      })
      const dueIn3DaysTodo = createTodo({
        dueDate: new DueDate(createTestDate(3)),
      })
      const dueIn7DaysTodo = createTodo({
        dueDate: new DueDate(createTestDate(7)),
      })
      const pastTodo = createTodo({
        dueDate: new DueDate(createTestDate(-1), true),
      })
      const spec = new TodoDueWithinDaysSpec(5)

      // Act & Assert
      expect(spec.isSatisfiedBy(dueTomorrowTodo)).toBe(true)
      expect(spec.isSatisfiedBy(dueIn3DaysTodo)).toBe(true)
      expect(spec.isSatisfiedBy(dueIn7DaysTodo)).toBe(false)
      expect(spec.isSatisfiedBy(pastTodo)).toBe(false)
    })

    it('should handle todos without due date', () => {
      // Arrange
      const todoWithoutDueDate = createTodo()
      const spec = new TodoDueWithinDaysSpec(5)

      // Act & Assert
      expect(spec.isSatisfiedBy(todoWithoutDueDate)).toBe(false)
    })

    it('should provide correct description', () => {
      // Arrange
      const spec = new TodoDueWithinDaysSpec(7)

      // Act & Assert
      expect(spec.description).toBe('7日以内に期限のTODO')
    })
  })

  describe('Specification Composition', () => {
    it('should compose specifications with AND operation', () => {
      // Arrange
      const userSpec = new UserTodoSpec(userId)
      const pendingSpec = new PendingTodoSpec()
      const composedSpec = userSpec.and(pendingSpec)

      const userPendingTodo = createTodo({
        status: TodoStatus.PENDING(),
        userId,
      })
      const userCompletedTodo = createTodo({
        status: TodoStatus.COMPLETED(),
        userId,
      })
      const otherUserPendingTodo = createTodo({
        status: TodoStatus.PENDING(),
        userId: otherUserId,
      })

      // Act & Assert
      expect(composedSpec.isSatisfiedBy(userPendingTodo)).toBe(true)
      expect(composedSpec.isSatisfiedBy(userCompletedTodo)).toBe(false)
      expect(composedSpec.isSatisfiedBy(otherUserPendingTodo)).toBe(false)
    })

    it('should compose specifications with OR operation', () => {
      // Arrange
      const highPrioritySpec = new HighPriorityTodoSpec()
      const overdueSpec = new OverdueTodoSpec()
      const composedSpec = highPrioritySpec.or(overdueSpec)

      const highPriorityTodo = createTodo({ priority: Priority.HIGH() })
      const overdueTodo = createTodo({
        dueDate: new DueDate(createTestDate(-1), true),
        priority: Priority.LOW(),
      })
      const normalTodo = createTodo({ priority: Priority.NORMAL() })

      // Act & Assert
      expect(composedSpec.isSatisfiedBy(highPriorityTodo)).toBe(true)
      expect(composedSpec.isSatisfiedBy(overdueTodo)).toBe(true)
      expect(composedSpec.isSatisfiedBy(normalTodo)).toBe(false)
    })

    it('should compose specifications with NOT operation', () => {
      // Arrange
      const completedSpec = new CompletedTodoSpec()
      const notCompletedSpec = completedSpec.not()

      const completedTodo = createTodo({ status: TodoStatus.COMPLETED() })
      const pendingTodo = createTodo({ status: TodoStatus.PENDING() })

      // Act & Assert
      expect(notCompletedSpec.isSatisfiedBy(completedTodo)).toBe(false)
      expect(notCompletedSpec.isSatisfiedBy(pendingTodo)).toBe(true)
    })

    it('should provide composed description for AND operation', () => {
      // Arrange
      const userSpec = new UserTodoSpec(userId)
      const pendingSpec = new PendingTodoSpec()
      const composedSpec = userSpec.and(pendingSpec)

      // Act & Assert
      expect(composedSpec.description).toBe(
        `ユーザーID: ${userId} のTODO かつ 未完了のTODO`
      )
    })

    it('should provide composed description for OR operation', () => {
      // Arrange
      const highPrioritySpec = new HighPriorityTodoSpec()
      const overdueSpec = new OverdueTodoSpec()
      const composedSpec = highPrioritySpec.or(overdueSpec)

      // Act & Assert
      expect(composedSpec.description).toBe(
        '高優先度（HIGH以上）のTODO または 期限切れのTODO'
      )
    })

    it('should provide composed description for NOT operation', () => {
      // Arrange
      const completedSpec = new CompletedTodoSpec()
      const notCompletedSpec = completedSpec.not()

      // Act & Assert
      expect(notCompletedSpec.description).toBe('完了済みのTODO ではない')
    })
  })

  describe('Complex Specification Combinations', () => {
    it('should handle complex specification combinations', () => {
      // Arrange
      const userSpec = new UserTodoSpec(userId)
      const pendingSpec = new PendingTodoSpec()
      const highPrioritySpec = new HighPriorityTodoSpec()
      const overdueSpec = new OverdueTodoSpec()

      // ユーザーの未完了タスクで、かつ（高優先度または期限切れ）
      const complexSpec = userSpec
        .and(pendingSpec)
        .and(highPrioritySpec.or(overdueSpec))

      const matchingTodo1 = createTodo({
        priority: Priority.HIGH(),
        status: TodoStatus.PENDING(),
        userId,
      })
      const matchingTodo2 = createTodo({
        dueDate: new DueDate(createTestDate(-1), true),
        priority: Priority.LOW(),
        status: TodoStatus.PENDING(),
        userId,
      })
      const nonMatchingTodo = createTodo({
        priority: Priority.LOW(),
        status: TodoStatus.PENDING(),
        userId,
      })

      // Act & Assert
      expect(complexSpec.isSatisfiedBy(matchingTodo1)).toBe(true)
      expect(complexSpec.isSatisfiedBy(matchingTodo2)).toBe(true)
      expect(complexSpec.isSatisfiedBy(nonMatchingTodo)).toBe(false)
    })
  })
})
