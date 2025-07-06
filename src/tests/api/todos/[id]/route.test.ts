import { describe, expect, it, vi } from 'vitest'

import type { Todo } from '@/types/todo'

import { DELETE, PATCH, PUT } from '@/app/api/todos/[id]/route'
import * as todoService from '@/lib/todo-service'

// Mock the todo service
vi.mock('@/lib/todo-service')

describe('/api/todos/[id] route', () => {
  describe('DELETE', () => {
    it('should delete a todo with awaited params', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          method: 'DELETE',
        }
      )
      vi.mocked(todoService.deleteTodo).mockResolvedValueOnce()

      // Act
      const response = await DELETE(mockRequest, { params: mockParams })

      // Assert
      expect(response.status).toBe(204)
      expect(todoService.deleteTodo).toHaveBeenCalledWith('test-id')
    })

    it('should return 400 when delete fails', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          method: 'DELETE',
        }
      )
      vi.mocked(todoService.deleteTodo).mockRejectedValueOnce(
        new Error('Delete failed')
      )

      // Act
      const response = await DELETE(mockRequest, { params: mockParams })
      const data = (await response.json()) as { error: string }

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to delete todo' })
    })
  })

  describe('PATCH', () => {
    it('should toggle todo completion with awaited params', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          method: 'PATCH',
        }
      )
      const mockTodo = {
        createdAt: new Date().toISOString(),
        id: 'test-id',
        status: 'completed' as const,
        title: 'Test Todo',
        updatedAt: new Date().toISOString(),
      }
      vi.mocked(todoService.toggleTodo).mockResolvedValueOnce({
        ...mockTodo,
        createdAt: new Date(mockTodo.createdAt),
        updatedAt: new Date(mockTodo.updatedAt),
      })

      // Act
      const response = await PATCH(mockRequest, { params: mockParams })
      const data = (await response.json()) as Todo

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(mockTodo)
      expect(todoService.toggleTodo).toHaveBeenCalledWith('test-id')
    })

    it('should return 400 when toggle fails', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          method: 'PATCH',
        }
      )
      vi.mocked(todoService.toggleTodo).mockRejectedValueOnce(
        new Error('Toggle failed')
      )

      // Act
      const response = await PATCH(mockRequest, { params: mockParams })
      const data = (await response.json()) as { error: string }

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to toggle todo' })
    })
  })

  describe('PUT', () => {
    it('should update todo with awaited params', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const updateData = { title: 'Updated Todo' }
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          body: JSON.stringify(updateData),
          method: 'PUT',
        }
      )
      const mockTodo = {
        createdAt: new Date().toISOString(),
        id: 'test-id',
        status: 'pending' as const,
        title: 'Updated Todo',
        updatedAt: new Date().toISOString(),
      }
      vi.mocked(todoService.updateTodo).mockResolvedValueOnce({
        ...mockTodo,
        createdAt: new Date(mockTodo.createdAt),
        updatedAt: new Date(mockTodo.updatedAt),
      })

      // Act
      const response = await PUT(mockRequest, { params: mockParams })
      const data = (await response.json()) as Todo

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(mockTodo)
      expect(todoService.updateTodo).toHaveBeenCalledWith('test-id', updateData)
    })

    it('should return 400 when update fails', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const updateData = { title: 'Updated Todo' }
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id',
        {
          body: JSON.stringify(updateData),
          method: 'PUT',
        }
      )
      vi.mocked(todoService.updateTodo).mockRejectedValueOnce(
        new Error('Update failed')
      )

      // Act
      const response = await PUT(mockRequest, { params: mockParams })
      const data = (await response.json()) as { error: string }

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Failed to update todo' })
    })
  })
})
