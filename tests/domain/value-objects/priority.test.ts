import { describe, expect, it } from 'vitest'

import { expectValidationError } from './test-helpers'

import { Priority } from '@/domain/value-objects/priority'

describe('Priority Value Object', () => {
  describe('作成', () => {
    it('should create Priority with LOW value', () => {
      // Act
      const priority = Priority.LOW()

      // Assert
      expect(priority.value).toBe('LOW')
      expect(priority.numericValue).toBe(1)
    })

    it('should create Priority with NORMAL value', () => {
      // Act
      const priority = Priority.NORMAL()

      // Assert
      expect(priority.value).toBe('NORMAL')
      expect(priority.numericValue).toBe(2)
    })

    it('should create Priority with HIGH value', () => {
      // Act
      const priority = Priority.HIGH()

      // Assert
      expect(priority.value).toBe('HIGH')
      expect(priority.numericValue).toBe(3)
    })

    it('should create Priority with URGENT value', () => {
      // Act
      const priority = Priority.URGENT()

      // Assert
      expect(priority.value).toBe('URGENT')
      expect(priority.numericValue).toBe(4)
    })

    it('should create Priority from valid string', () => {
      // Act
      const priority = Priority.fromString('HIGH')

      // Assert
      expect(priority.value).toBe('HIGH')
      expect(priority.numericValue).toBe(3)
    })

    it('should create Priority from numeric value', () => {
      // Act
      const priority = Priority.fromNumeric(3)

      // Assert
      expect(priority.value).toBe('HIGH')
      expect(priority.numericValue).toBe(3)
    })
  })

  describe('バリデーション', () => {
    it('should throw error for invalid string priority', () => {
      // Act & Assert
      expectValidationError(
        () => Priority.fromString('INVALID'),
        '無効な優先度です: INVALID'
      )
    })

    it('should throw error for invalid numeric priority', () => {
      // Act & Assert
      expectValidationError(
        () => Priority.fromNumeric(5),
        '無効な優先度の数値です: 5'
      )
    })

    it('should throw error for negative numeric priority', () => {
      // Act & Assert
      expectValidationError(
        () => Priority.fromNumeric(-1),
        '無効な優先度の数値です: -1'
      )
    })

    it('should throw error for zero numeric priority', () => {
      // Act & Assert
      expectValidationError(
        () => Priority.fromNumeric(0),
        '無効な優先度の数値です: 0'
      )
    })

    it('should throw error for empty string', () => {
      // Act & Assert
      expectValidationError(() => Priority.fromString(''), '無効な優先度です: ')
    })

    it('should throw error for null value', () => {
      // Act & Assert
      expectValidationError(
        () => Priority.fromString(null as never),
        '無効な優先度です: null'
      )
    })
  })

  describe('比較', () => {
    it('should compare priorities correctly using isHigherThan', () => {
      // Arrange
      const low = Priority.LOW()
      const normal = Priority.NORMAL()
      const high = Priority.HIGH()
      const urgent = Priority.URGENT()

      // Act & Assert
      expect(urgent.isHigherThan(high)).toBe(true)
      expect(high.isHigherThan(normal)).toBe(true)
      expect(normal.isHigherThan(low)).toBe(true)

      expect(low.isHigherThan(normal)).toBe(false)
      expect(normal.isHigherThan(high)).toBe(false)
      expect(high.isHigherThan(urgent)).toBe(false)
    })

    it('should compare priorities correctly using isLowerThan', () => {
      // Arrange
      const low = Priority.LOW()
      const normal = Priority.NORMAL()
      const high = Priority.HIGH()
      const urgent = Priority.URGENT()

      // Act & Assert
      expect(low.isLowerThan(normal)).toBe(true)
      expect(normal.isLowerThan(high)).toBe(true)
      expect(high.isLowerThan(urgent)).toBe(true)

      expect(urgent.isLowerThan(high)).toBe(false)
      expect(high.isLowerThan(normal)).toBe(false)
      expect(normal.isLowerThan(low)).toBe(false)
    })

    it('should return false when comparing same priorities', () => {
      // Arrange
      const priority1 = Priority.HIGH()
      const priority2 = Priority.HIGH()

      // Act & Assert
      expect(priority1.isHigherThan(priority2)).toBe(false)
      expect(priority1.isLowerThan(priority2)).toBe(false)
    })
  })

  describe('等価性', () => {
    it('should be equal when values are same', () => {
      // Arrange
      const priority1 = Priority.HIGH()
      const priority2 = Priority.HIGH()

      // Act & Assert
      expect(priority1.equals(priority2)).toBe(true)
      expect(priority2.equals(priority1)).toBe(true)
    })

    it('should not be equal when values are different', () => {
      // Arrange
      const priority1 = Priority.HIGH()
      const priority2 = Priority.LOW()

      // Act & Assert
      expect(priority1.equals(priority2)).toBe(false)
      expect(priority2.equals(priority1)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const priority = Priority.HIGH()

      // Act & Assert
      expect(priority.equals(null as never)).toBe(false)
    })
  })

  describe('ユーティリティメソッド', () => {
    it('should identify high priority correctly', () => {
      // Arrange
      const low = Priority.LOW()
      const normal = Priority.NORMAL()
      const high = Priority.HIGH()
      const urgent = Priority.URGENT()

      // Act & Assert
      expect(low.isHigh()).toBe(false)
      expect(normal.isHigh()).toBe(false)
      expect(high.isHigh()).toBe(true)
      expect(urgent.isHigh()).toBe(true)
    })

    it('should identify urgent priority correctly', () => {
      // Arrange
      const low = Priority.LOW()
      const normal = Priority.NORMAL()
      const high = Priority.HIGH()
      const urgent = Priority.URGENT()

      // Act & Assert
      expect(low.isUrgent()).toBe(false)
      expect(normal.isUrgent()).toBe(false)
      expect(high.isUrgent()).toBe(false)
      expect(urgent.isUrgent()).toBe(true)
    })

    it('should return display name correctly', () => {
      // Act & Assert
      expect(Priority.LOW().displayName).toBe('低')
      expect(Priority.NORMAL().displayName).toBe('通常')
      expect(Priority.HIGH().displayName).toBe('高')
      expect(Priority.URGENT().displayName).toBe('緊急')
    })

    it('should return color code correctly', () => {
      // Act & Assert
      expect(Priority.LOW().colorCode).toBe('#6B7280')
      expect(Priority.NORMAL().colorCode).toBe('#3B82F6')
      expect(Priority.HIGH().colorCode).toBe('#F59E0B')
      expect(Priority.URGENT().colorCode).toBe('#EF4444')
    })
  })

  describe('文字列変換', () => {
    it('should return value as string', () => {
      // Arrange
      const priority = Priority.HIGH()

      // Act & Assert
      expect(priority.toString()).toBe('HIGH')
    })
  })

  describe('ソート', () => {
    it('should sort priorities in descending order', () => {
      // Arrange
      const priorities = [
        Priority.LOW(),
        Priority.URGENT(),
        Priority.NORMAL(),
        Priority.HIGH(),
      ]

      // Act
      const sorted = Priority.sortByPriorityDescending(priorities)

      // Assert
      expect(sorted.map((p) => p.value)).toEqual([
        'URGENT',
        'HIGH',
        'NORMAL',
        'LOW',
      ])
    })

    it('should sort priorities in ascending order', () => {
      // Arrange
      const priorities = [
        Priority.URGENT(),
        Priority.LOW(),
        Priority.HIGH(),
        Priority.NORMAL(),
      ]

      // Act
      const sorted = Priority.sortByPriorityAscending(priorities)

      // Assert
      expect(sorted.map((p) => p.value)).toEqual([
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT',
      ])
    })
  })
})
