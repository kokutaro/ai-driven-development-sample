import { describe, expect, it } from 'vitest'

import { createTestDate, expectValidationError } from './test-helpers'

import { DueDate } from '@/domain/value-objects/due-date'

describe('DueDate Value Object', () => {
  describe('作成', () => {
    it('should create DueDate with future date', () => {
      // Arrange
      const futureDate = createTestDate(7) // 7日後

      // Act
      const dueDate = new DueDate(futureDate)

      // Assert
      expect(dueDate.value).toEqual(futureDate)
    })

    it('should create DueDate with today date', () => {
      // Arrange
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 今日の終わり

      // Act
      const dueDate = new DueDate(today)

      // Assert
      expect(dueDate.value).toEqual(today)
    })

    it('should create DueDate from string', () => {
      // Arrange
      const futureDate = createTestDate(30)
      const dateString = futureDate.toISOString()

      // Act
      const dueDate = DueDate.fromString(dateString)

      // Assert
      expect(dueDate.value.toISOString()).toBe(dateString)
    })

    it('should create DueDate from date components', () => {
      // Arrange
      const nextYear = new Date().getFullYear() + 1

      // Act
      const dueDate = DueDate.fromComponents(nextYear, 12, 31)

      // Assert
      expect(dueDate.value.getFullYear()).toBe(nextYear)
      expect(dueDate.value.getMonth()).toBe(11) // 0-indexed
      expect(dueDate.value.getDate()).toBe(31)
    })
  })

  describe('バリデーション', () => {
    it('should throw error for past date (more than 1 day ago)', () => {
      // Arrange
      const pastDate = createTestDate(-2) // 2日前

      // Act & Assert
      expectValidationError(
        () => new DueDate(pastDate),
        '期限日は過去の日付にできません'
      )
    })

    it('should throw error for invalid date', () => {
      // Arrange
      const invalidDate = new Date('invalid')

      // Act & Assert
      expectValidationError(() => new DueDate(invalidDate), '無効な日付です')
    })

    it('should throw error for null date', () => {
      // Act & Assert
      expectValidationError(() => new DueDate(null as never), '無効な日付です')
    })

    it('should throw error for undefined date', () => {
      // Act & Assert
      expectValidationError(
        () => new DueDate(undefined as never),
        '無効な日付です'
      )
    })

    it('should throw error for invalid date string', () => {
      // Act & Assert
      expectValidationError(
        () => DueDate.fromString('invalid-date'),
        '無効な日付文字列です'
      )
    })

    it('should throw error for invalid month in components', () => {
      // Act & Assert
      expectValidationError(
        () => DueDate.fromComponents(2024, 13, 1),
        '無効な日付コンポーネントです'
      )
    })

    it('should throw error for invalid day in components', () => {
      // Act & Assert
      expectValidationError(
        () => DueDate.fromComponents(2024, 2, 30),
        '無効な日付コンポーネントです'
      )
    })
  })

  describe('期限判定', () => {
    it('should identify overdue date correctly', () => {
      // Arrange
      const yesterday = createTestDate(-1)
      const dueDate = new DueDate(yesterday, true) // 過去日付を許可

      // Act & Assert
      expect(dueDate.isOverdue()).toBe(true)
    })

    it('should identify today as not overdue', () => {
      // Arrange
      const today = new Date()
      const dueDate = new DueDate(today)

      // Act & Assert
      expect(dueDate.isOverdue()).toBe(false)
    })

    it('should identify future date as not overdue', () => {
      // Arrange
      const tomorrow = createTestDate(1)
      const dueDate = new DueDate(tomorrow)

      // Act & Assert
      expect(dueDate.isOverdue()).toBe(false)
    })

    it('should identify today correctly', () => {
      // Arrange
      const today = new Date()
      const dueDate = new DueDate(today)

      // Act & Assert
      expect(dueDate.isToday()).toBe(true)
    })

    it('should identify tomorrow correctly', () => {
      // Arrange
      const tomorrow = createTestDate(1)
      const dueDate = new DueDate(tomorrow)

      // Act & Assert
      expect(dueDate.isTomorrow()).toBe(true)
    })

    it('should identify within days correctly', () => {
      // Arrange
      const threeDaysLater = createTestDate(3)
      const dueDate = new DueDate(threeDaysLater)

      // Act & Assert
      expect(dueDate.isWithinDays(5)).toBe(true)
      expect(dueDate.isWithinDays(2)).toBe(false)
    })

    it('should identify this week correctly', () => {
      // Arrange
      const tomorrow = createTestDate(1)
      const dueDate = new DueDate(tomorrow)

      // Act & Assert
      expect(dueDate.isThisWeek()).toBe(true)
    })

    it('should identify next week correctly', () => {
      // Arrange
      const nextWeek = createTestDate(8)
      const dueDate = new DueDate(nextWeek)

      // Act & Assert
      expect(dueDate.isNextWeek()).toBe(true)
    })
  })

  describe('日数計算', () => {
    it('should calculate days until due date correctly', () => {
      // Arrange
      const threeDaysLater = createTestDate(3)
      const dueDate = new DueDate(threeDaysLater)

      // Act
      const daysUntil = dueDate.daysUntilDue()

      // Assert
      expect(daysUntil).toBe(3)
    })

    it('should return negative days for overdue', () => {
      // Arrange
      const yesterday = createTestDate(-1)
      const dueDate = new DueDate(yesterday, true) // 過去日付を許可

      // Act
      const daysUntil = dueDate.daysUntilDue()

      // Assert
      expect(daysUntil).toBe(-1)
    })

    it('should return 0 for today', () => {
      // Arrange
      const today = new Date()
      const dueDate = new DueDate(today)

      // Act
      const daysUntil = dueDate.daysUntilDue()

      // Assert
      expect(daysUntil).toBe(0)
    })
  })

  describe('フォーマット', () => {
    it('should format date in Japanese', () => {
      // Arrange
      const futureDate = createTestDate(30)
      const dueDate = new DueDate(futureDate)

      // Act
      const formatted = dueDate.formatJapanese()

      // Assert
      expect(formatted).toContain(futureDate.getFullYear().toString())
    })

    it('should format date in ISO string', () => {
      // Arrange
      const futureDate = createTestDate(30)
      const dueDate = new DueDate(futureDate)

      // Act
      const formatted = dueDate.toISOString()

      // Assert
      expect(formatted).toBe(futureDate.toISOString())
    })

    it('should format relative time for today', () => {
      // Arrange
      const today = new Date()
      const dueDate = new DueDate(today)

      // Act
      const relative = dueDate.formatRelative()

      // Assert
      expect(relative).toBe('今日')
    })

    it('should format relative time for tomorrow', () => {
      // Arrange
      const tomorrow = createTestDate(1)
      const dueDate = new DueDate(tomorrow)

      // Act
      const relative = dueDate.formatRelative()

      // Assert
      expect(relative).toBe('明日')
    })

    it('should format relative time for days later', () => {
      // Arrange
      const threeDaysLater = createTestDate(3)
      const dueDate = new DueDate(threeDaysLater)

      // Act
      const relative = dueDate.formatRelative()

      // Assert
      expect(relative).toBe('3日後')
    })

    it('should format relative time for overdue', () => {
      // Arrange
      const yesterday = createTestDate(-1)
      const dueDate = new DueDate(yesterday, true) // 過去日付を許可

      // Act
      const relative = dueDate.formatRelative()

      // Assert
      expect(relative).toBe('1日遅れ')
    })
  })

  describe('等価性', () => {
    it('should be equal when dates are same', () => {
      // Arrange
      const date = createTestDate(5)
      const dueDate1 = new DueDate(new Date(date.getTime()))
      const dueDate2 = new DueDate(new Date(date.getTime()))

      // Act & Assert
      expect(dueDate1.equals(dueDate2)).toBe(true)
    })

    it('should not be equal when dates are different', () => {
      // Arrange
      const dueDate1 = new DueDate(createTestDate(1))
      const dueDate2 = new DueDate(createTestDate(2))

      // Act & Assert
      expect(dueDate1.equals(dueDate2)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const dueDate = new DueDate(createTestDate(1))

      // Act & Assert
      expect(dueDate.equals(null as never)).toBe(false)
    })
  })

  describe('比較', () => {
    it('should compare due dates correctly', () => {
      // Arrange
      const earlier = new DueDate(createTestDate(1))
      const later = new DueDate(createTestDate(3))

      // Act & Assert
      expect(earlier.isBefore(later)).toBe(true)
      expect(later.isAfter(earlier)).toBe(true)
      expect(earlier.isAfter(later)).toBe(false)
      expect(later.isBefore(earlier)).toBe(false)
    })

    it('should identify same dates correctly', () => {
      // Arrange
      const date = createTestDate(2)
      const dueDate1 = new DueDate(new Date(date.getTime()))
      const dueDate2 = new DueDate(new Date(date.getTime()))

      // Act & Assert
      expect(dueDate1.isSameDay(dueDate2)).toBe(true)
      expect(dueDate1.isBefore(dueDate2)).toBe(false)
      expect(dueDate1.isAfter(dueDate2)).toBe(false)
    })
  })

  describe('文字列変換', () => {
    it('should return ISO string as toString', () => {
      // Arrange
      const futureDate = createTestDate(30)
      const dueDate = new DueDate(futureDate)

      // Act & Assert
      expect(dueDate.toString()).toBe(futureDate.toISOString())
    })
  })
})
