import { describe, expect, it, vi } from 'vitest'

import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

import * as todoClient from '@/lib/api/todo-client'

// グローバルfetchのモック
globalThis.fetch = vi.fn()

describe('todo-client', () => {
  const mockTodo: Todo = {
    createdAt: new Date('2024-01-01'),
    description: 'Test description',
    id: '1',
    status: 'pending',
    title: 'Test Todo',
    updatedAt: new Date('2024-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTodos', () => {
    it('should fetch todos successfully', async () => {
      // Arrange
      const mockTodos = [mockTodo]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        json: async () => mockTodos,
        ok: true,
      } as Response)

      // Act
      const result = await todoClient.getTodos()

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos')
      expect(result).toEqual(mockTodos)
    })

    it('should throw error when fetch fails', async () => {
      // Arrange
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      // Act & Assert
      await expect(todoClient.getTodos()).rejects.toThrow(
        'Failed to fetch todos'
      )
    })
  })

  describe('createTodo', () => {
    it('should create todo successfully', async () => {
      // Arrange
      const input: CreateTodoInput = {
        description: 'New description',
        title: 'New Todo',
      }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        json: async () => mockTodo,
        ok: true,
      } as Response)

      // Act
      const result = await todoClient.createTodo(input)

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos', {
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      expect(result).toEqual(mockTodo)
    })

    it('should throw error when create fails', async () => {
      // Arrange
      const input: CreateTodoInput = {
        title: 'New Todo',
      }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      // Act & Assert
      await expect(todoClient.createTodo(input)).rejects.toThrow(
        'Failed to create todo'
      )
    })
  })

  describe('updateTodo', () => {
    it('should update todo successfully', async () => {
      // Arrange
      const id = '1'
      const input: UpdateTodoInput = {
        status: 'completed',
        title: 'Updated Todo',
      }
      const updatedTodo = { ...mockTodo, ...input }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        json: async () => updatedTodo,
        ok: true,
      } as Response)

      // Act
      const result = await todoClient.updateTodo(id, input)

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${id}`, {
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
      expect(result).toEqual(updatedTodo)
    })

    it('should throw error when update fails', async () => {
      // Arrange
      const id = '1'
      const input: UpdateTodoInput = {
        title: 'Updated Todo',
      }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      // Act & Assert
      await expect(todoClient.updateTodo(id, input)).rejects.toThrow(
        'Failed to update todo'
      )
    })
  })

  describe('toggleTodo', () => {
    it('should toggle todo successfully', async () => {
      // Arrange
      const id = '1'
      const toggledTodo = { ...mockTodo, status: 'completed' as const }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        json: async () => toggledTodo,
        ok: true,
      } as Response)

      // Act
      const result = await todoClient.toggleTodo(id)

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${id}/toggle`, {
        method: 'POST',
      })
      expect(result).toEqual(toggledTodo)
    })

    it('should throw error when toggle fails', async () => {
      // Arrange
      const id = '1'
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      // Act & Assert
      await expect(todoClient.toggleTodo(id)).rejects.toThrow(
        'Failed to toggle todo'
      )
    })
  })

  describe('deleteTodo', () => {
    it('should delete todo successfully', async () => {
      // Arrange
      const id = '1'
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      // Act
      await todoClient.deleteTodo(id)

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(`/api/todos/${id}`, {
        method: 'DELETE',
      })
    })

    it('should throw error when delete fails', async () => {
      // Arrange
      const id = '1'
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      // Act & Assert
      await expect(todoClient.deleteTodo(id)).rejects.toThrow(
        'Failed to delete todo'
      )
    })
  })
})
