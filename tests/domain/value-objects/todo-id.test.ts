import { describe, expect, it } from 'vitest'

import { expectValidationError, generateTestUUID } from './test-helpers'

import { TodoId } from '@/domain/value-objects/todo-id'

describe('TodoId Value Object', () => {
  describe('作成', () => {
    it('should create TodoId with valid UUID', () => {
      // Arrange
      const validUuid = generateTestUUID()

      // Act
      const todoId = new TodoId(validUuid)

      // Assert
      expect(todoId.value).toBe(validUuid)
    })

    it('should create TodoId with generated ID when no value provided', () => {
      // Act
      const todoId = TodoId.generate()

      // Assert
      expect(todoId.value).toMatch(/^[\w-]{36}$/)
      expect(typeof todoId.value).toBe('string')
    })
  })

  describe('バリデーション', () => {
    it('should throw error for empty string', () => {
      // Act & Assert
      expectValidationError(
        () => new TodoId(''),
        'TodoId は空文字列にできません'
      )
    })

    it('should throw error for whitespace only string', () => {
      // Act & Assert
      expectValidationError(
        () => new TodoId('   '),
        'TodoId は空文字列にできません'
      )
    })

    it('should throw error for invalid UUID format', () => {
      // Act & Assert
      expectValidationError(
        () => new TodoId('invalid-uuid'),
        'TodoId は有効なUUID形式である必要があります'
      )
    })

    it('should throw error for null value', () => {
      // Act & Assert
      expectValidationError(
        () => new TodoId(null as never),
        'TodoId は空文字列にできません'
      )
    })

    it('should throw error for undefined value', () => {
      // Act & Assert
      expectValidationError(
        () => new TodoId(undefined as never),
        'TodoId は空文字列にできません'
      )
    })
  })

  describe('等価性', () => {
    it('should be equal when values are same', () => {
      // Arrange
      const uuid = generateTestUUID()
      const todoId1 = new TodoId(uuid)
      const todoId2 = new TodoId(uuid)

      // Act & Assert
      expect(todoId1.equals(todoId2)).toBe(true)
      expect(todoId2.equals(todoId1)).toBe(true)
    })

    it('should not be equal when values are different', () => {
      // Arrange
      const todoId1 = new TodoId(generateTestUUID())
      const todoId2 = new TodoId(generateTestUUID())

      // Act & Assert
      expect(todoId1.equals(todoId2)).toBe(false)
      expect(todoId2.equals(todoId1)).toBe(false)
    })

    it('should not be equal to null', () => {
      // Arrange
      const todoId = new TodoId(generateTestUUID())

      // Act & Assert
      expect(todoId.equals(null as never)).toBe(false)
    })

    it('should not be equal to undefined', () => {
      // Arrange
      const todoId = new TodoId(generateTestUUID())

      // Act & Assert
      expect(todoId.equals(undefined as never)).toBe(false)
    })
  })

  describe('文字列変換', () => {
    it('should return value as string', () => {
      // Arrange
      const uuid = generateTestUUID()
      const todoId = new TodoId(uuid)

      // Act & Assert
      expect(todoId.toString()).toBe(uuid)
    })
  })

  describe('ファクトリメソッド', () => {
    it('should generate unique IDs', () => {
      // Act
      const ids = Array.from({ length: 100 }, () => TodoId.generate())
      const uniqueIds = new Set(ids.map((id) => id.value))

      // Assert
      expect(uniqueIds.size).toBe(100)
    })

    it('should create from string value', () => {
      // Arrange
      const uuid = generateTestUUID()

      // Act
      const todoId = TodoId.fromString(uuid)

      // Assert
      expect(todoId.value).toBe(uuid)
    })
  })
})
