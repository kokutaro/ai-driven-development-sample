import { describe, expect, it } from 'vitest'

import { generateUUID } from '@/lib/utils'

describe('utils', () => {
  describe('generateUUID', () => {
    it('should generate a string', () => {
      // Arrange & Act
      const result = generateUUID()

      // Assert
      expect(typeof result).toBe('string')
    })

    it('should generate a UUID with correct format', () => {
      // Arrange
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      // Act
      const result = generateUUID()

      // Assert
      expect(result).toMatch(uuidRegex)
    })

    it('should generate unique UUIDs', () => {
      // Arrange & Act
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      const uuid3 = generateUUID()

      // Assert
      expect(uuid1).not.toBe(uuid2)
      expect(uuid1).not.toBe(uuid3)
      expect(uuid2).not.toBe(uuid3)
    })

    it('should generate UUID with correct length', () => {
      // Arrange & Act
      const result = generateUUID()

      // Assert
      expect(result.length).toBe(36)
    })

    it('should generate UUID with correct version (4)', () => {
      // Arrange & Act
      const result = generateUUID()

      // Assert
      expect(result.charAt(14)).toBe('4')
    })

    it('should generate UUID with correct variant', () => {
      // Arrange & Act
      const result = generateUUID()

      // Assert
      const variantChar = result.charAt(19)
      expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(variantChar)
    })
  })
})
