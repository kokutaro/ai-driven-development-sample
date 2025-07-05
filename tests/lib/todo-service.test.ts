import { PrismaClient } from '@prisma/client'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
  updateTodo,
} from '@/lib/todo-service'

// Test用のPrismaクライアント
const prisma = new PrismaClient()

describe('Todo Service', () => {
  // 各テストの前にデータベースをクリーンアップ
  beforeEach(async () => {
    await prisma.todo.deleteMany()
  })

  // テスト後にクリーンアップ
  afterEach(async () => {
    await prisma.todo.deleteMany()
  })

  describe('createTodo', () => {
    it('should create a new todo', async () => {
      // Arrange
      const input = {
        description: 'Test Description',
        title: 'Test Todo',
      }

      // Act
      const todo = await createTodo(input)

      // Assert
      expect(todo).toBeDefined()
      expect(todo.title).toBe(input.title)
      expect(todo.description).toBe(input.description)
      expect(todo.status).toBe('pending')
      expect(todo.id).toBeDefined()
      expect(todo.createdAt).toBeInstanceOf(Date)
      expect(todo.updatedAt).toBeInstanceOf(Date)
    })

    it('should create a todo without description', async () => {
      // Arrange
      const input = {
        title: 'Test Todo Without Description',
      }

      // Act
      const todo = await createTodo(input)

      // Assert
      expect(todo).toBeDefined()
      expect(todo.title).toBe(input.title)
      expect(todo.description).toBeUndefined()
      expect(todo.status).toBe('pending')
    })

    it('should trim whitespace from title and description', async () => {
      // Arrange
      const input = {
        description: '  Test Description  ',
        title: '  Test Todo  ',
      }

      // Act
      const todo = await createTodo(input)

      // Assert
      expect(todo.title).toBe('Test Todo')
      expect(todo.description).toBe('Test Description')
    })

    it('should throw error if title is empty', async () => {
      // Arrange & Act & Assert
      await expect(createTodo({ title: '' })).rejects.toThrow(
        'Todo title cannot be empty'
      )
    })

    it('should throw error if title is only whitespace', async () => {
      // Arrange & Act & Assert
      await expect(createTodo({ title: '   ' })).rejects.toThrow(
        'Todo title cannot be empty'
      )
    })
  })

  describe('getTodos', () => {
    it('should return empty array when no todos', async () => {
      // Act
      const todos = await getTodos()

      // Assert
      expect(todos).toEqual([])
    })

    it('should return all todos', async () => {
      // Arrange
      await createTodo({ title: 'Todo 1' })
      await createTodo({ title: 'Todo 2' })
      await createTodo({ title: 'Todo 3' })

      // Act
      const todos = await getTodos()

      // Assert
      expect(todos).toHaveLength(3)
      expect(todos[0].title).toBe('Todo 3') // 最新順
      expect(todos[1].title).toBe('Todo 2')
      expect(todos[2].title).toBe('Todo 1')
    })

    it('should return todos with correct description conversion', async () => {
      // Arrange
      await createTodo({
        description: 'Test description',
        title: 'Todo with description',
      })
      await createTodo({ title: 'Todo without description' })

      // Act
      const todos = await getTodos()

      // Assert
      expect(todos).toHaveLength(2)
      expect(todos[0].title).toBe('Todo without description')
      expect(todos[0].description).toBeUndefined() // null -> undefined conversion
      expect(todos[1].title).toBe('Todo with description')
      expect(todos[1].description).toBe('Test description')
    })
  })

  describe('updateTodo', () => {
    it('should update todo title and description', async () => {
      // Arrange
      const todo = await createTodo({ title: 'Original Todo' })
      const updateData = {
        description: 'Updated Description',
        title: 'Updated Todo',
      }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.title).toBe(updateData.title)
      expect(updatedTodo.description).toBe(updateData.description)
      expect(updatedTodo.id).toBe(todo.id)
      expect(updatedTodo.status).toBe(todo.status)
    })

    it('should update only title', async () => {
      // Arrange
      const todo = await createTodo({
        description: 'Original Description',
        title: 'Original Todo',
      })
      const updateData = { title: 'Updated Title Only' }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.title).toBe('Updated Title Only')
      expect(updatedTodo.description).toBe('Original Description')
      expect(updatedTodo.status).toBe('pending')
    })

    it('should update only description', async () => {
      // Arrange
      const todo = await createTodo({
        description: 'Original Description',
        title: 'Original Todo',
      })
      const updateData = { description: 'Updated Description Only' }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.title).toBe('Original Todo')
      expect(updatedTodo.description).toBe('Updated Description Only')
      expect(updatedTodo.status).toBe('pending')
    })

    it('should update only status', async () => {
      // Arrange
      const todo = await createTodo({
        description: 'Original Description',
        title: 'Original Todo',
      })
      const updateData = { status: 'completed' as const }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.title).toBe('Original Todo')
      expect(updatedTodo.description).toBe('Original Description')
      expect(updatedTodo.status).toBe('completed')
    })

    it('should trim whitespace from updated fields', async () => {
      // Arrange
      const todo = await createTodo({ title: 'Original Todo' })
      const updateData = {
        description: '  Updated Description  ',
        title: '  Updated Title  ',
      }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.title).toBe('Updated Title')
      expect(updatedTodo.description).toBe('Updated Description')
    })

    it('should handle updating to empty description', async () => {
      // Arrange
      const todo = await createTodo({
        description: 'Original Description',
        title: 'Test Todo',
      })
      const updateData = { description: '' }

      // Act
      const updatedTodo = await updateTodo(todo.id, updateData)

      // Assert
      expect(updatedTodo.description).toBe('')
    })

    it('should throw error if todo not found', async () => {
      // Arrange & Act & Assert
      await expect(
        updateTodo('non-existent-id', { title: 'text' })
      ).rejects.toThrow('Todo not found')
    })
  })

  describe('toggleTodo', () => {
    it('should toggle todo completion status', async () => {
      // Arrange
      const todo = await createTodo({ title: 'Toggle Test' })
      expect(todo.status).toBe('pending')

      // Act
      const toggledTodo = await toggleTodo(todo.id)

      // Assert
      expect(toggledTodo.status).toBe('completed')
      expect(toggledTodo.id).toBe(todo.id)

      // Act again
      const toggledAgain = await toggleTodo(todo.id)

      // Assert
      expect(toggledAgain.status).toBe('pending')
    })

    it('should throw error if todo not found', async () => {
      // Arrange & Act & Assert
      await expect(toggleTodo('non-existent-id')).rejects.toThrow(
        'Todo not found'
      )
    })

    it('should toggle from completed to pending', async () => {
      // Arrange
      const todo = await createTodo({ title: 'Toggle Test' })
      // First toggle to completed
      await toggleTodo(todo.id)

      // Act - Toggle back to pending
      const toggledTodo = await toggleTodo(todo.id)

      // Assert
      expect(toggledTodo.status).toBe('pending')
      expect(toggledTodo.id).toBe(todo.id)
    })
  })

  describe('deleteTodo', () => {
    it('should delete a todo', async () => {
      // Arrange
      const todo = await createTodo({ title: 'Delete Test' })

      // Act
      await deleteTodo(todo.id)

      // Assert
      const todos = await getTodos()
      expect(todos).toHaveLength(0)
    })

    it('should throw error if todo not found', async () => {
      // Arrange & Act & Assert
      await expect(deleteTodo('non-existent-id')).rejects.toThrow(
        'Todo not found'
      )
    })
  })

  // テスト終了後に接続をクローズ
  afterAll(async () => {
    await prisma.$disconnect()
  })
})
