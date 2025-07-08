import { beforeEach, describe, expect, it, vi } from 'vitest'

import { categoryClient } from './category-client'

import type { ApiResponse, Category } from '@/types/todo'

/**
 * category-client.tsのテスト
 *
 * 各APIメソッドの正常系・異常系・エッジケースを100%カバレッジでテスト
 */

// fetchのモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('categoryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(vi.fn())
    // timestampを固定するためにDateをモック
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  describe('createCategory', () => {
    it('should create category with valid data', async () => {
      // Arrange
      const categoryData = {
        color: '#FF6B6B',
        name: 'テストカテゴリ',
      }
      const expectedResponse: ApiResponse<Category> = {
        data: {
          color: '#FF6B6B',
          createdAt: new Date('2024-01-01'),
          id: 'category_123',
          name: 'テストカテゴリ',
          updatedAt: new Date('2024-01-01'),
          userId: 'user_123',
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await categoryClient.createCategory(categoryData)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/categories', {
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const categoryData = {
        color: '#FF6B6B',
        name: 'テストカテゴリ',
      }
      const mockErrorResponse = {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'HTTP Error: 400' },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
        status: 400,
      })

      // Act & Assert
      await expect(categoryClient.createCategory(categoryData)).rejects.toThrow(
        'HTTP Error: 400'
      )
      expect(console.error).toHaveBeenCalledWith('API Error (400):', {
        details: undefined,
        message: 'HTTP Error: 400',
        path: undefined,
      })
    })

    it('should handle network error', async () => {
      // Arrange
      const categoryData = {
        color: '#FF6B6B',
        name: 'テストカテゴリ',
      }
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(categoryClient.createCategory(categoryData)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('deleteCategory', () => {
    it('should delete category with valid id', async () => {
      // Arrange
      const categoryId = 'category_123'
      const expectedResponse: ApiResponse<{ deleted: boolean; id: string }> = {
        data: {
          deleted: true,
          id: categoryId,
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await categoryClient.deleteCategory(categoryId)

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const categoryId = 'category_123'
      const mockErrorResponse = {
        data: null,
        error: { code: 'NOT_FOUND', message: 'HTTP Error: 404' },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
        status: 404,
      })

      // Act & Assert
      await expect(categoryClient.deleteCategory(categoryId)).rejects.toThrow(
        'HTTP Error: 404'
      )
      expect(console.error).toHaveBeenCalledWith('API Error (404):', {
        details: undefined,
        message: 'HTTP Error: 404',
        path: undefined,
      })
    })

    it('should handle network error', async () => {
      // Arrange
      const categoryId = 'category_123'
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(categoryClient.deleteCategory(categoryId)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('getCategories', () => {
    it('should get categories list', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Category[]> = {
        data: [
          {
            color: '#FF6B6B',
            createdAt: new Date('2024-01-01'),
            id: 'category_123',
            name: 'テストカテゴリ1',
            updatedAt: new Date('2024-01-01'),
            userId: 'user_123',
          },
          {
            color: '#4ECDC4',
            createdAt: new Date('2024-01-02'),
            id: 'category_456',
            name: 'テストカテゴリ2',
            updatedAt: new Date('2024-01-02'),
            userId: 'user_123',
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
      const result = await categoryClient.getCategories()

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/categories', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const mockErrorResponse = {
        data: null,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'HTTP Error: 500' },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
        status: 500,
      })

      // Act & Assert
      await expect(categoryClient.getCategories()).rejects.toThrow(
        'HTTP Error: 500'
      )
      expect(console.error).toHaveBeenCalledWith('API Error (500):', {
        details: undefined,
        message: 'HTTP Error: 500',
        path: undefined,
      })
    })

    it('should handle network error', async () => {
      // Arrange
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(categoryClient.getCategories()).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('updateCategory', () => {
    it('should update category with valid data', async () => {
      // Arrange
      const categoryId = 'category_123'
      const categoryData = {
        color: '#45B7D1',
        name: '更新されたカテゴリ',
      }
      const expectedResponse: ApiResponse<Category> = {
        data: {
          color: '#45B7D1',
          createdAt: new Date('2024-01-01'),
          id: categoryId,
          name: '更新されたカテゴリ',
          updatedAt: new Date('2024-01-02'),
          userId: 'user_123',
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await categoryClient.updateCategory(
        categoryId,
        categoryData
      )

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should update category with partial data', async () => {
      // Arrange
      const categoryId = 'category_123'
      const categoryData = {
        name: '部分更新カテゴリ',
      }
      const expectedResponse: ApiResponse<Category> = {
        data: {
          color: '#FF6B6B',
          createdAt: new Date('2024-01-01'),
          id: categoryId,
          name: '部分更新カテゴリ',
          updatedAt: new Date('2024-01-02'),
          userId: 'user_123',
        },
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce(expectedResponse),
        ok: true,
      })

      // Act
      const result = await categoryClient.updateCategory(
        categoryId,
        categoryData
      )

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      })
      expect(result).toEqual(expectedResponse)
    })

    it('should handle HTTP error response', async () => {
      // Arrange
      const categoryId = 'category_123'
      const categoryData = {
        color: '#45B7D1',
        name: '更新されたカテゴリ',
      }
      const mockErrorResponse = {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'HTTP Error: 400' },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
        status: 400,
      })

      // Act & Assert
      await expect(
        categoryClient.updateCategory(categoryId, categoryData)
      ).rejects.toThrow('HTTP Error: 400')
      expect(console.error).toHaveBeenCalledWith('API Error (400):', {
        details: undefined,
        message: 'HTTP Error: 400',
        path: undefined,
      })
    })

    it('should handle network error', async () => {
      // Arrange
      const categoryId = 'category_123'
      const categoryData = {
        color: '#45B7D1',
        name: '更新されたカテゴリ',
      }
      const networkError = new Error('Network error')

      mockFetch.mockRejectedValueOnce(networkError)

      // Act & Assert
      await expect(
        categoryClient.updateCategory(categoryId, categoryData)
      ).rejects.toThrow('Network error')
    })
  })
})
