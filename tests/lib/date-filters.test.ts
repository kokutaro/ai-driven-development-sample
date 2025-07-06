import { describe, expect, it } from 'vitest'

import type { Todo } from '@/types/todo'

import {
  getFilteredTodos,
  isThisMonth,
  isThisWeek,
  isToday,
} from '@/lib/date-filters'

describe('date-filters', () => {
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

    it('should return todos from this month when filter is "thisMonth"', () => {
      // Arrange & Act
      const result = getFilteredTodos(mockTodos, 'thisMonth')

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
  })
})
