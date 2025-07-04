import { describe, it, expect } from 'vitest'

import { cn, formatDate, isValidEmail, capitalize } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3')
    })

    it('filters out falsy values', () => {
      expect(cn('class1', null, 'class2', undefined, false, 'class3')).toBe(
        'class1 class2 class3'
      )
    })

    it('returns empty string for no valid classes', () => {
      expect(cn(null, undefined, false)).toBe('')
    })
  })

  describe('formatDate', () => {
    it('formats date in Japanese locale', () => {
      const date = new Date('2023-12-25')
      const formatted = formatDate(date)
      expect(formatted).toContain('2023')
      expect(formatted).toContain('12')
      expect(formatted).toContain('25')
    })
  })

  describe('isValidEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.jp')).toBe(true)
      expect(isValidEmail('user+tag@domain.org')).toBe(true)
    })

    it('returns false for invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('test@domain')).toBe(false)
      expect(isValidEmail('test @domain.com')).toBe(false)
    })
  })

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
      expect(capitalize('test string')).toBe('Test string')
    })

    it('handles empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A')
      expect(capitalize('A')).toBe('A')
    })
  })
})
