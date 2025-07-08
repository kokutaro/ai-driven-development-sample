import { describe, expect, it } from 'vitest'

import { todoSchema } from './todo'

describe('todoSchema', () => {
  describe('dueDate validation', () => {
    it('accepts valid date string in YYYY-MM-DD format', () => {
      // Arrange
      const validTodo = {
        description: 'Test description',
        dueDate: '2025-07-09',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.dueDate).toBeInstanceOf(Date)
      expect(result.dueDate).toEqual(new Date('2025-07-09'))
    })

    it('accepts valid ISO datetime string', () => {
      // Arrange
      const validTodo = {
        description: 'Test description',
        dueDate: '2025-07-09T10:30:00.000Z',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.dueDate).toBeInstanceOf(Date)
      expect(result.dueDate).toEqual(new Date('2025-07-09T10:30:00.000Z'))
    })

    it('accepts null as dueDate', () => {
      // Arrange
      const validTodo = {
        description: 'Test description',
        dueDate: null,
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.dueDate).toBeUndefined()
    })

    it('accepts undefined as dueDate', () => {
      // Arrange
      const validTodo = {
        description: 'Test description',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.dueDate).toBeUndefined()
    })

    it('rejects invalid date string', () => {
      // Arrange
      const invalidTodo = {
        description: 'Test description',
        dueDate: 'invalid-date',
        isImportant: false,
        title: 'Test Task',
      }

      // Act & Assert
      expect(() => todoSchema.parse(invalidTodo)).toThrow()
    })
  })

  describe('title validation', () => {
    it('accepts valid title', () => {
      // Arrange
      const validTodo = {
        isImportant: false,
        title: 'Valid Title',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.title).toBe('Valid Title')
    })

    it('rejects empty title', () => {
      // Arrange
      const invalidTodo = {
        isImportant: false,
        title: '',
      }

      // Act & Assert
      expect(() => todoSchema.parse(invalidTodo)).toThrow()
    })

    it('rejects title longer than 200 characters', () => {
      // Arrange
      const longTitle = 'a'.repeat(201)
      const invalidTodo = {
        isImportant: false,
        title: longTitle,
      }

      // Act & Assert
      expect(() => todoSchema.parse(invalidTodo)).toThrow()
    })
  })

  describe('description validation', () => {
    it('accepts valid description', () => {
      // Arrange
      const validTodo = {
        description: 'Valid description',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.description).toBe('Valid description')
    })

    it('accepts empty description', () => {
      // Arrange
      const validTodo = {
        description: '',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.description).toBe('')
    })

    it('rejects description longer than 1000 characters', () => {
      // Arrange
      const longDescription = 'a'.repeat(1001)
      const invalidTodo = {
        description: longDescription,
        isImportant: false,
        title: 'Test Task',
      }

      // Act & Assert
      expect(() => todoSchema.parse(invalidTodo)).toThrow()
    })
  })

  describe('isImportant validation', () => {
    it('accepts true value', () => {
      // Arrange
      const validTodo = {
        isImportant: true,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.isImportant).toBe(true)
    })

    it('accepts false value', () => {
      // Arrange
      const validTodo = {
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.isImportant).toBe(false)
    })

    it('defaults to false when not provided', () => {
      // Arrange
      const validTodo = {
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.isImportant).toBe(false)
    })
  })

  describe('categoryId validation', () => {
    it('accepts valid CUID', () => {
      // Arrange
      const validTodo = {
        categoryId: 'clh7k8j9c0000xyz123456789',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.categoryId).toBe('clh7k8j9c0000xyz123456789')
    })

    it('converts empty string to undefined', () => {
      // Arrange
      const validTodo = {
        categoryId: '',
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.categoryId).toBeUndefined()
    })

    it('converts null to undefined', () => {
      // Arrange
      const validTodo = {
        categoryId: null,
        isImportant: false,
        title: 'Test Task',
      }

      // Act
      const result = todoSchema.parse(validTodo)

      // Assert
      expect(result.categoryId).toBeUndefined()
    })
  })
})
