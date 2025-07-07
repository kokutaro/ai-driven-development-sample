/**
 * ユーティリティ関数のテスト
 * @fileoverview 基本的なユーティリティ関数のユニットテスト
 */
import { describe, expect, it } from 'vitest'

import { capitalize, cn, formatDate, isValidEmail } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      // Arrange & Act
      const result = cn('class1', 'class2', 'class3')

      // Assert
      expect(result).toBe('class1 class2 class3')
    })

    it('filters out falsy values', () => {
      // Arrange & Act
      const result = cn(
        'class1',
        undefined,
        'class2',
        undefined,
        false,
        'class3'
      )

      // Assert
      expect(result).toBe('class1 class2 class3')
    })

    it('returns empty string for no valid classes', () => {
      // Arrange & Act
      const result = cn(undefined, undefined, false)

      // Assert
      expect(result).toBe('')
    })

    it('handles empty string input', () => {
      // Arrange & Act
      const result = cn('', 'class1', '')

      // Assert
      expect(result).toBe('class1')
    })
  })

  describe('formatDate', () => {
    it('formats date in Japanese locale', () => {
      // Arrange
      const date = new Date('2023-12-25')

      // Act
      const formatted = formatDate(date)

      // Assert
      expect(formatted).toContain('2023')
      expect(formatted).toContain('12')
      expect(formatted).toContain('25')
    })

    it('handles invalid date', () => {
      // Arrange
      const date = new Date('invalid')

      // Act
      const formatted = formatDate(date)

      // Assert
      expect(formatted).toBe('Invalid Date')
    })
  })

  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      // Arrange & Act & Assert
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.jp')).toBe(true)
      expect(isValidEmail('user+tag@domain.org')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      // Arrange & Act & Assert
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test@domain')).toBe(false)
      expect(isValidEmail('test @domain.com')).toBe(false)
    })

    it('returns false for empty string', () => {
      // Arrange & Act & Assert
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      // Arrange & Act & Assert
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('test string')).toBe('Test string')
    })

    it('handles empty string', () => {
      // Arrange & Act & Assert
      expect(capitalize('')).toBe('')
    })

    it('handles single character', () => {
      // Arrange & Act & Assert
      expect(capitalize('a')).toBe('A')
      expect(capitalize('A')).toBe('A')
    })

    it('handles string with numbers', () => {
      // Arrange & Act & Assert
      expect(capitalize('123abc')).toBe('123abc')
    })
  })
})
