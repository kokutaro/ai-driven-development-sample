import { beforeEach, describe, expect, it, vi } from 'vitest'

import { subTaskClient } from './subtask-client'

import type { ApiResponse, SubTask } from '@/types/todo'

/**
 * subtask-client.tsのテスト
 *
 * 各APIメソッドの正常系・異常系・エッジケースを100%カバレッジでテスト
 */

// fetchのモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('subTaskClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSubTask', () => {
    it('should create subtask with valid data', async () => {
      // Arrange
      const todoId = 'todo_123'
      const data = { title: 'テストサブタスク' }
      const expectedResponse: ApiResponse<SubTask> = {
        data: {
          createdAt: new Date('2024-01-01'),
          id: 'subtask_123',
          isCompleted: false,
          order: 0,
          title: 'テストサブタスク',
          todoId: todoId,
          updatedAt: new Date('2024-01-01'),
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.createSubTask(todoId, data)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/todos/${todoId}/subtasks`, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const todoId = 'todo_123'
      const data = { title: 'テストサブタスク' }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      // Act & Assert
      await expect(subTaskClient.createSubTask(todoId, data)).rejects.toThrow(
        'サブタスクの作成に失敗しました: 400'
      )
    })

    it('should handle network error', async () => {
      // Arrange
      const todoId = 'todo_123'
      const data = { title: 'テストサブタスク' }
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(subTaskClient.createSubTask(todoId, data)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('deleteSubTask', () => {
    it('should delete subtask with valid id', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const expectedResponse: ApiResponse<{ deleted: boolean; id: string }> = {
        data: {
          deleted: true,
          id: subTaskId,
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.deleteSubTask(todoId, subTaskId)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/subtasks/${subTaskId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        }
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      // Act & Assert
      await expect(
        subTaskClient.deleteSubTask(todoId, subTaskId)
      ).rejects.toThrow('サブタスクの削除に失敗しました: 404')
    })

    it('should handle network error', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(
        subTaskClient.deleteSubTask(todoId, subTaskId)
      ).rejects.toThrow('Network error')
    })
  })

  describe('getSubTasks', () => {
    it('should get subtasks list for a todo', async () => {
      // Arrange
      const todoId = 'todo_123'
      const expectedResponse: ApiResponse<SubTask[]> = {
        data: [
          {
            createdAt: new Date('2024-01-01'),
            id: 'subtask_123',
            isCompleted: false,
            order: 0,
            title: 'テストサブタスク1',
            todoId: todoId,
            updatedAt: new Date('2024-01-01'),
          },
          {
            createdAt: new Date('2024-01-02'),
            id: 'subtask_456',
            isCompleted: true,
            order: 1,
            title: 'テストサブタスク2',
            todoId: todoId,
            updatedAt: new Date('2024-01-02'),
          },
        ],
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.getSubTasks(todoId)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/todos/${todoId}/subtasks`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const todoId = 'todo_123'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      // Act & Assert
      await expect(subTaskClient.getSubTasks(todoId)).rejects.toThrow(
        'サブタスクの取得に失敗しました: 500'
      )
    })

    it('should handle network error', async () => {
      // Arrange
      const todoId = 'todo_123'
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(subTaskClient.getSubTasks(todoId)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('toggleSubTask', () => {
    it('should toggle subtask completion status', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const expectedResponse: ApiResponse<SubTask> = {
        data: {
          createdAt: new Date('2024-01-01'),
          id: subTaskId,
          isCompleted: true,
          order: 0,
          title: 'テストサブタスク',
          todoId: todoId,
          updatedAt: new Date('2024-01-02'),
        },
        success: true,
        timestamp: '2024-01-02T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.toggleSubTask(todoId, subTaskId)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/subtasks/${subTaskId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        }
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      // Act & Assert
      await expect(
        subTaskClient.toggleSubTask(todoId, subTaskId)
      ).rejects.toThrow('サブタスクの切り替えに失敗しました: 404')
    })

    it('should handle network error', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(
        subTaskClient.toggleSubTask(todoId, subTaskId)
      ).rejects.toThrow('Network error')
    })
  })

  describe('updateSubTask', () => {
    it('should update subtask with valid data', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const data = {
        isCompleted: true,
        title: '更新されたサブタスク',
      }
      const expectedResponse: ApiResponse<SubTask> = {
        data: {
          createdAt: new Date('2024-01-01'),
          id: subTaskId,
          isCompleted: true,
          order: 0,
          title: '更新されたサブタスク',
          todoId: todoId,
          updatedAt: new Date('2024-01-02'),
        },
        success: true,
        timestamp: '2024-01-02T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.updateSubTask(todoId, subTaskId, data)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/subtasks/${subTaskId}`,
        {
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should update subtask with partial data', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const data = {
        title: '部分更新サブタスク',
      }
      const expectedResponse: ApiResponse<SubTask> = {
        data: {
          createdAt: new Date('2024-01-01'),
          id: subTaskId,
          isCompleted: false,
          order: 0,
          title: '部分更新サブタスク',
          todoId: todoId,
          updatedAt: new Date('2024-01-02'),
        },
        success: true,
        timestamp: '2024-01-02T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await subTaskClient.updateSubTask(todoId, subTaskId, data)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/subtasks/${subTaskId}`,
        {
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const data = {
        isCompleted: true,
        title: '更新されたサブタスク',
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      // Act & Assert
      await expect(
        subTaskClient.updateSubTask(todoId, subTaskId, data)
      ).rejects.toThrow('サブタスクの更新に失敗しました: 400')
    })

    it('should handle network error', async () => {
      // Arrange
      const todoId = 'todo_123'
      const subTaskId = 'subtask_123'
      const data = {
        isCompleted: true,
        title: '更新されたサブタスク',
      }
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(
        subTaskClient.updateSubTask(todoId, subTaskId, data)
      ).rejects.toThrow('Network error')
    })
  })
})
