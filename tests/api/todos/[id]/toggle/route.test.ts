import { describe, expect, it, vi } from 'vitest'

import type { Todo } from '@/types/todo'

import { POST } from '@/app/api/todos/[id]/toggle/route'
import * as todoService from '@/lib/todo-service'

// Mock the todo service
vi.mock('@/lib/todo-service')

describe('/api/todos/[id]/toggle route', () => {
  describe('POST', () => {
    it('should toggle todo completion with awaited params', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id/toggle',
        {
          method: 'POST',
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
      const response = await POST(mockRequest, { params: mockParams })
      const data = (await response.json()) as Todo

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(mockTodo)
      expect(todoService.toggleTodo).toHaveBeenCalledWith('test-id')
    })

    it('should return 404 when toggle fails', async () => {
      // Arrange
      const mockParams = Promise.resolve({ id: 'test-id' })
      const mockRequest = new Request(
        'http://localhost:3000/api/todos/test-id/toggle',
        {
          method: 'POST',
        }
      )
      vi.mocked(todoService.toggleTodo).mockRejectedValueOnce(
        new Error('Todo not found')
      )

      // Act
      const response = await POST(mockRequest, { params: mockParams })
      const data = (await response.json()) as { error: string }

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Failed to toggle todo' })
    })
  })
})
