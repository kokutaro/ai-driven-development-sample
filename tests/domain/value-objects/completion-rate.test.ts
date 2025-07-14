import { describe, expect, it } from 'vitest'

import { expectValidationError } from './test-helpers'

import { CompletionRate } from '@/domain/value-objects/completion-rate'

describe('CompletionRate Value Object', () => {
  describe('作成', () => {
    it('should create CompletionRate with valid percentage', () => {
      // Act
      const rate = new CompletionRate(75.5)

      // Assert
      expect(rate.value).toBe(75.5)
    })

    it('should create CompletionRate with 0%', () => {
      // Act
      const rate = new CompletionRate(0)

      // Assert
      expect(rate.value).toBe(0)
    })

    it('should create CompletionRate with 100%', () => {
      // Act
      const rate = new CompletionRate(100)

      // Assert
      expect(rate.value).toBe(100)
    })

    it('should create CompletionRate from completed and total counts', () => {
      // Act
      const rate = CompletionRate.fromCounts(3, 4)

      // Assert
      expect(rate.value).toBe(75)
    })

    it('should create CompletionRate from string percentage', () => {
      // Act
      const rate = CompletionRate.fromString('85.25')

      // Assert
      expect(rate.value).toBe(85.25)
    })

    it('should create zero completion rate when total is 0', () => {
      // Act
      const rate = CompletionRate.fromCounts(0, 0)

      // Assert
      expect(rate.value).toBe(0)
    })
  })

  describe('バリデーション', () => {
    it('should throw error for negative percentage', () => {
      // Act & Assert
      expectValidationError(
        () => new CompletionRate(-1),
        '完了率は0%以上100%以下である必要があります'
      )
    })

    it('should throw error for percentage over 100', () => {
      // Act & Assert
      expectValidationError(
        () => new CompletionRate(101),
        '完了率は0%以上100%以下である必要があります'
      )
    })

    it('should throw error for NaN', () => {
      // Act & Assert
      expectValidationError(
        () => new CompletionRate(NaN),
        '完了率は有効な数値である必要があります'
      )
    })

    it('should throw error for Infinity', () => {
      // Act & Assert
      expectValidationError(
        () => new CompletionRate(Infinity),
        '完了率は有効な数値である必要があります'
      )
    })

    it('should throw error for negative completed count', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromCounts(-1, 5),
        '完了数と総数は0以上の整数である必要があります'
      )
    })

    it('should throw error for negative total count', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromCounts(3, -1),
        '完了数と総数は0以上の整数である必要があります'
      )
    })

    it('should throw error when completed exceeds total', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromCounts(6, 5),
        '完了数は総数を超えることはできません'
      )
    })

    it('should throw error for non-integer completed count', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromCounts(2.5, 5),
        '完了数と総数は0以上の整数である必要があります'
      )
    })

    it('should throw error for invalid string percentage', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromString('invalid'),
        '無効な完了率の文字列です'
      )
    })

    it('should throw error for empty string', () => {
      // Act & Assert
      expectValidationError(
        () => CompletionRate.fromString(''),
        '無効な完了率の文字列です'
      )
    })
  })

  describe('状態判定', () => {
    it('should identify zero completion correctly', () => {
      // Arrange
      const zeroRate = new CompletionRate(0)
      const partialRate = new CompletionRate(50)
      const fullRate = new CompletionRate(100)

      // Act & Assert
      expect(zeroRate.isZero()).toBe(true)
      expect(partialRate.isZero()).toBe(false)
      expect(fullRate.isZero()).toBe(false)
    })

    it('should identify complete status correctly', () => {
      // Arrange
      const zeroRate = new CompletionRate(0)
      const partialRate = new CompletionRate(50)
      const fullRate = new CompletionRate(100)

      // Act & Assert
      expect(zeroRate.isComplete()).toBe(false)
      expect(partialRate.isComplete()).toBe(false)
      expect(fullRate.isComplete()).toBe(true)
    })

    it('should identify partial completion correctly', () => {
      // Arrange
      const zeroRate = new CompletionRate(0)
      const partialRate = new CompletionRate(50)
      const fullRate = new CompletionRate(100)

      // Act & Assert
      expect(zeroRate.isPartial()).toBe(false)
      expect(partialRate.isPartial()).toBe(true)
      expect(fullRate.isPartial()).toBe(false)
    })

    it('should identify high completion correctly', () => {
      // Arrange
      const lowRate = new CompletionRate(25)
      const mediumRate = new CompletionRate(70)
      const highRate = new CompletionRate(85)
      const fullRate = new CompletionRate(100)

      // Act & Assert
      expect(lowRate.isHigh()).toBe(false)
      expect(mediumRate.isHigh()).toBe(false)
      expect(highRate.isHigh()).toBe(true)
      expect(fullRate.isHigh()).toBe(true)
    })

    it('should identify low completion correctly', () => {
      // Arrange
      const zeroRate = new CompletionRate(0)
      const lowRate = new CompletionRate(15)
      const mediumRate = new CompletionRate(50)
      const highRate = new CompletionRate(85)

      // Act & Assert
      expect(zeroRate.isLow()).toBe(true)
      expect(lowRate.isLow()).toBe(true)
      expect(mediumRate.isLow()).toBe(false)
      expect(highRate.isLow()).toBe(false)
    })
  })

  describe('算術演算', () => {
    it('should add completion rates correctly', () => {
      // Arrange
      const rate1 = new CompletionRate(30)
      const rate2 = new CompletionRate(20)

      // Act
      const result = rate1.add(rate2)

      // Assert
      expect(result.value).toBe(50)
    })

    it('should subtract completion rates correctly', () => {
      // Arrange
      const rate1 = new CompletionRate(70)
      const rate2 = new CompletionRate(20)

      // Act
      const result = rate1.subtract(rate2)

      // Assert
      expect(result.value).toBe(50)
    })

    it('should cap addition at 100%', () => {
      // Arrange
      const rate1 = new CompletionRate(70)
      const rate2 = new CompletionRate(50)

      // Act
      const result = rate1.add(rate2)

      // Assert
      expect(result.value).toBe(100)
    })

    it('should cap subtraction at 0%', () => {
      // Arrange
      const rate1 = new CompletionRate(20)
      const rate2 = new CompletionRate(50)

      // Act
      const result = rate1.subtract(rate2)

      // Assert
      expect(result.value).toBe(0)
    })

    it('should calculate average of completion rates', () => {
      // Arrange
      const rates = [
        new CompletionRate(80),
        new CompletionRate(60),
        new CompletionRate(100),
        new CompletionRate(40),
      ]

      // Act
      const average = CompletionRate.average(rates)

      // Assert
      expect(average.value).toBe(70)
    })

    it('should return zero for empty array average', () => {
      // Act
      const average = CompletionRate.average([])

      // Assert
      expect(average.value).toBe(0)
    })
  })

  describe('比較', () => {
    it('should compare completion rates correctly', () => {
      // Arrange
      const lower = new CompletionRate(30)
      const higher = new CompletionRate(70)

      // Act & Assert
      expect(lower.isLowerThan(higher)).toBe(true)
      expect(higher.isHigherThan(lower)).toBe(true)
      expect(lower.isHigherThan(higher)).toBe(false)
      expect(higher.isLowerThan(lower)).toBe(false)
    })

    it('should handle equal completion rates', () => {
      // Arrange
      const rate1 = new CompletionRate(50)
      const rate2 = new CompletionRate(50)

      // Act & Assert
      expect(rate1.isLowerThan(rate2)).toBe(false)
      expect(rate1.isHigherThan(rate2)).toBe(false)
    })
  })

  describe('等価性', () => {
    it('should be equal when values are same', () => {
      // Arrange
      const rate1 = new CompletionRate(75.5)
      const rate2 = new CompletionRate(75.5)

      // Act & Assert
      expect(rate1.equals(rate2)).toBe(true)
      expect(rate2.equals(rate1)).toBe(true)
    })

    it('should not be equal when values are different', () => {
      // Arrange
      const rate1 = new CompletionRate(75)
      const rate2 = new CompletionRate(80)

      // Act & Assert
      expect(rate1.equals(rate2)).toBe(false)
      expect(rate2.equals(rate1)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const rate = new CompletionRate(75)

      // Act & Assert
      expect(rate.equals(null as never)).toBe(false)
    })
  })

  describe('フォーマット', () => {
    it('should format as percentage string', () => {
      // Arrange
      const rate = new CompletionRate(75.5)

      // Act & Assert
      expect(rate.toPercentageString()).toBe('75.5%')
    })

    it('should format with specified decimal places', () => {
      // Arrange
      const rate = new CompletionRate(75.555)

      // Act & Assert
      expect(rate.toPercentageString(2)).toBe('75.56%')
      expect(rate.toPercentageString(0)).toBe('76%')
    })

    it('should format as fraction string', () => {
      // Arrange
      const rate = CompletionRate.fromCounts(3, 4)

      // Act & Assert
      expect(rate.toFractionString(3, 4)).toBe('3/4')
    })

    it('should format with progress description', () => {
      // Arrange
      const zeroRate = new CompletionRate(0)
      const lowRate = new CompletionRate(15)
      const mediumRate = new CompletionRate(50)
      const highRate = new CompletionRate(85)
      const fullRate = new CompletionRate(100)

      // Act & Assert
      expect(zeroRate.getProgressDescription()).toBe('未着手')
      expect(lowRate.getProgressDescription()).toBe('開始済み')
      expect(mediumRate.getProgressDescription()).toBe('進行中')
      expect(highRate.getProgressDescription()).toBe('もうすぐ完了')
      expect(fullRate.getProgressDescription()).toBe('完了')
    })
  })

  describe('文字列変換', () => {
    it('should return percentage string as toString', () => {
      // Arrange
      const rate = new CompletionRate(75.5)

      // Act & Assert
      expect(rate.toString()).toBe('75.5%')
    })
  })

  describe('ファクトリメソッド', () => {
    it('should create zero completion rate', () => {
      // Act
      const rate = CompletionRate.zero()

      // Assert
      expect(rate.value).toBe(0)
    })

    it('should create full completion rate', () => {
      // Act
      const rate = CompletionRate.full()

      // Assert
      expect(rate.value).toBe(100)
    })
  })
})
