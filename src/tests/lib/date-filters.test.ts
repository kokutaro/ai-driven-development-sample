import { vi } from 'vitest'

import type { Todo } from '@/types/todo'

import {
  getFilteredTodos,
  isThisMonth,
  isThisWeek,
  isToday,
} from '@/lib/date-filters'

/**
 * テスト用のTODO項目を作成するヘルパー関数
 */
function createTestTodo(
  id: string,
  title: string,
  createdAt: Date,
  status: 'completed' | 'pending' = 'pending'
): Todo {
  return {
    createdAt,
    id,
    status,
    title,
    updatedAt: createdAt,
  }
}

describe('日付フィルタリング関数', () => {
  const now = new Date('2024-01-15T12:00:00Z') // 月曜日

  beforeEach(() => {
    // 現在時刻をモック
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isToday', () => {
    it('今日の日付に対してtrueを返す', () => {
      const today = new Date('2024-01-15T09:00:00Z')
      expect(isToday(today)).toBe(true)
    })

    it('昨日の日付に対してfalseを返す', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z')
      expect(isToday(yesterday)).toBe(false)
    })

    it('明日の日付に対してfalseを返す', () => {
      const tomorrow = new Date('2024-01-16T12:00:00Z')
      expect(isToday(tomorrow)).toBe(false)
    })
  })

  describe('isThisWeek', () => {
    it('今週の月曜日（今日）に対してtrueを返す', () => {
      const monday = new Date('2024-01-15T12:00:00Z')
      expect(isThisWeek(monday)).toBe(true)
    })

    it('今週の日曜日に対してtrueを返す', () => {
      const sunday = new Date('2024-01-21T12:00:00Z')
      expect(isThisWeek(sunday)).toBe(true)
    })

    it('先週の日曜日に対してfalseを返す', () => {
      const lastSunday = new Date('2024-01-14T12:00:00Z')
      expect(isThisWeek(lastSunday)).toBe(false)
    })

    it('来週の月曜日に対してfalseを返す', () => {
      const nextMonday = new Date('2024-01-22T12:00:00Z')
      expect(isThisWeek(nextMonday)).toBe(false)
    })
  })

  describe('isThisMonth', () => {
    it('今月の1日に対してtrueを返す', () => {
      const firstDay = new Date('2024-01-01T12:00:00Z')
      expect(isThisMonth(firstDay)).toBe(true)
    })

    it('今月の31日に対してtrueを返す', () => {
      const lastDay = new Date('2024-01-31T12:00:00Z')
      expect(isThisMonth(lastDay)).toBe(true)
    })

    it('先月の31日に対してfalseを返す', () => {
      const lastMonth = new Date('2023-12-31T12:00:00Z')
      expect(isThisMonth(lastMonth)).toBe(false)
    })

    it('来月の1日に対してfalseを返す', () => {
      const nextMonth = new Date('2024-02-01T12:00:00Z')
      expect(isThisMonth(nextMonth)).toBe(false)
    })
  })

  describe('getFilteredTodos', () => {
    const todos: Todo[] = [
      createTestTodo('1', 'Today todo', new Date('2024-01-15T10:00:00Z')),
      createTestTodo('2', 'This week todo', new Date('2024-01-17T10:00:00Z')),
      createTestTodo('3', 'This month todo', new Date('2024-01-05T10:00:00Z')),
      createTestTodo('4', 'Last month todo', new Date('2023-12-15T10:00:00Z')),
      createTestTodo(
        '5',
        'Completed todo',
        new Date('2024-01-15T10:00:00Z'),
        'completed'
      ),
    ]

    it('all フィルタで全てのTODOを返す', () => {
      const filtered = getFilteredTodos(todos, 'all')
      expect(filtered).toHaveLength(5)
    })

    it('today フィルタで今日作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'today')
      expect(filtered).toHaveLength(2) // pending と completed の今日のTODO
      expect(filtered.map((t) => t.id)).toContain('1')
      expect(filtered.map((t) => t.id)).toContain('5')
    })

    it('thisWeek フィルタで今週作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'thisWeek')
      expect(filtered).toHaveLength(3) // 今日と今週のTODO
      expect(filtered.map((t) => t.id)).toContain('1')
      expect(filtered.map((t) => t.id)).toContain('2')
      expect(filtered.map((t) => t.id)).toContain('5')
    })

    it('thisMonth フィルタで今月作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'thisMonth')
      expect(filtered).toHaveLength(4) // 今月のTODO
      expect(filtered.map((t) => t.id)).not.toContain('4')
    })

    it('completed フィルタで完了済みTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'completed')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('5')
      expect(filtered[0].status).toBe('completed')
    })
  })
  describe('isThisMonth', () => {
    it('should return true when date is in current month', () => {
      // Arrange
      const currentDate = new Date()
      const dateInThisMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        15
      )

      // Act
      const result = isThisMonth(dateInThisMonth)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when date is in different month', () => {
      // Arrange
      const currentDate = new Date()
      const dateInDifferentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        15
      )

      // Act
      const result = isThisMonth(dateInDifferentMonth)

      // Assert
      expect(result).toBe(false)
    })

    it('should handle string date input', () => {
      // Arrange
      const currentDate = new Date()
      const dateString = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        15
      ).toISOString()

      // Act
      const result = isThisMonth(dateString)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle null/undefined input gracefully', () => {
      // Arrange & Act & Assert
      expect(() => isThisMonth(undefined)).not.toThrow()
      expect(() => isThisMonth(undefined)).not.toThrow()
      expect(isThisMonth(undefined)).toBe(false)
      expect(isThisMonth(undefined)).toBe(false)
    })
  })

  describe('isThisWeek', () => {
    it('should return true when date is in current week', () => {
      // Arrange
      const currentDate = new Date()

      // Act
      const result = isThisWeek(currentDate)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when date is in different week', () => {
      // Arrange
      const currentDate = new Date()
      const dateInDifferentWeek = new Date(
        currentDate.getTime() - 8 * 24 * 60 * 60 * 1000
      ) // 8 days ago

      // Act
      const result = isThisWeek(dateInDifferentWeek)

      // Assert
      expect(result).toBe(false)
    })

    it('should handle string date input', () => {
      // Arrange
      const currentDate = new Date()
      const dateString = currentDate.toISOString()

      // Act
      const result = isThisWeek(dateString)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle null/undefined input gracefully', () => {
      // Arrange & Act & Assert
      expect(() => isThisWeek(undefined)).not.toThrow()
      expect(() => isThisWeek(undefined)).not.toThrow()
      expect(isThisWeek(undefined)).toBe(false)
      expect(isThisWeek(undefined)).toBe(false)
    })
  })

  describe('isToday', () => {
    it('should return true when date is today', () => {
      // Arrange
      const today = new Date()

      // Act
      const result = isToday(today)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when date is yesterday', () => {
      // Arrange
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Act
      const result = isToday(yesterday)

      // Assert
      expect(result).toBe(false)
    })

    it('should handle string date input', () => {
      // Arrange
      const todayString = new Date().toISOString()

      // Act
      const result = isToday(todayString)

      // Assert
      expect(result).toBe(true)
    })

    it('should handle null/undefined input gracefully', () => {
      // Arrange & Act & Assert
      expect(() => isToday(undefined)).not.toThrow()
      expect(() => isToday(undefined)).not.toThrow()
      expect(isToday(undefined)).toBe(false)
      expect(isToday(undefined)).toBe(false)
    })
  })

  describe('getFilteredTodos', () => {
    const mockTodos: Todo[] = [
      {
        createdAt: new Date(),
        id: '1',
        status: 'pending',
        title: 'Todo 1',
        updatedAt: new Date(),
      },
      {
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        id: '2',
        status: 'completed',
        title: 'Todo 2',
        updatedAt: new Date(),
      },
    ]

    it('should return all todos when filter is "all"', () => {
      // Arrange & Act
      const result = getFilteredTodos(mockTodos, 'all')

      // Assert
      expect(result).toHaveLength(2)
      expect(result).toEqual(mockTodos)
    })

    it('should return completed todos when filter is "completed"', () => {
      // Arrange & Act
      const result = getFilteredTodos(mockTodos, 'completed')

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('completed')
    })
  })
})
