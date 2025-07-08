import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient, APIClientError } from './api-client'

import type { ApiResponse } from '@/types/api'

// グローバルfetchのモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// console.error, console.warnのモック
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {
  // エラーログを無視
})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {
  // 警告ログを無視
})

// window.location.hrefのモック
const mockLocation = {
  href: '',
}
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: mockLocation,
  },
  writable: true,
})

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  describe('APIClientError', () => {
    it('should create error with correct properties', () => {
      // Arrange
      const message = 'Test error'
      const status = 400
      const response: ApiResponse<unknown> = {
        data: null,
        error: { code: 'TEST_ERROR', message: 'Test error' },
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      // Act
      const error = new APIClientError(message, status, response)

      // Assert
      expect(error.message).toBe(message)
      expect(error.status).toBe(status)
      expect(error.response).toBe(response)
      expect(error.name).toBe('APIClientError')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('401エラーハンドリング', () => {
    it('should redirect to signin page on 401 error', async () => {
      // Arrange
      const mockResponse: ApiResponse<unknown> = {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: false,
        status: 401,
        url: '/api/test',
      })

      // Act & Assert
      try {
        await apiClient.get('/api/test')
        // Should not reach here
        expect.fail('Expected an error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(APIClientError)
        const apiError = error as APIClientError
        expect(apiError.message).toBe(
          '認証が必要です。サインインページにリダイレクトしています。'
        )
        expect(apiError.status).toBe(401)
        expect(apiError.response).toEqual(mockResponse)
      }

      // リダイレクトが実行されることを確認
      expect(mockLocation.href).toBe('/auth/signin')

      // 適切なログが出力されることを確認
      expect(mockConsoleError).toHaveBeenCalledWith(
        '認証エラー (401):',
        'Authentication required'
      )
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '認証が必要です。サインインページにリダイレクトします。'
      )
    })

    it('should throw APIClientError with 401 status and response details', async () => {
      // Arrange
      const mockResponse: ApiResponse<unknown> = {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Token expired' },
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: false,
        status: 401,
        url: '/api/protected',
      })

      // Act
      try {
        await apiClient.post('/api/protected', { data: 'test' })
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(APIClientError)
        const apiError = error as APIClientError
        expect(apiError.status).toBe(401)
        expect(apiError.response).toEqual(mockResponse)
        expect(apiError.message).toBe(
          '認証が必要です。サインインページにリダイレクトしています。'
        )
      }
    })
  })

  describe('正常なレスポンス処理', () => {
    it('should return data on successful GET request', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test Item' }
      const mockResponse: ApiResponse<typeof mockData> = {
        data: mockData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items',
      })

      // Act
      const result = await apiClient.get<typeof mockData>('/api/items')

      // Assert
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    })

    it('should return data on successful POST request with body', async () => {
      // Arrange
      const postData = { name: 'New Item' }
      const responseData = { id: '2', ...postData }
      const mockResponse: ApiResponse<typeof responseData> = {
        data: responseData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 201,
        url: '/api/items',
      })

      // Act
      const result = await apiClient.post<typeof responseData>(
        '/api/items',
        postData
      )

      // Assert
      expect(result).toEqual(responseData)
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    })

    it('should handle GET request with query parameters', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Item 1' }]
      const mockResponse: ApiResponse<typeof mockData> = {
        data: mockData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items?filter=active&page=1',
      })

      // Act
      const result = await apiClient.get<typeof mockData>('/api/items', {
        filter: 'active',
        page: 1,
      })

      // Assert
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/items?filter=active&page=1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }
      )
    })
  })

  describe('その他のHTTPエラー処理', () => {
    it('should throw APIClientError on 400 error', async () => {
      // Arrange
      const mockResponse: ApiResponse<unknown> = {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      const mockJsonFn = vi.fn().mockResolvedValue(mockResponse)
      mockFetch.mockResolvedValueOnce({
        json: mockJsonFn,
        ok: false,
        status: 400,
        url: '/api/test',
      })

      // Act & Assert
      try {
        await apiClient.post('/api/test', {})
        // Should not reach here
        expect.fail('Expected an error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(APIClientError)
        const apiError = error as APIClientError
        expect(apiError.message).toBe('Invalid input data')
        expect(apiError.status).toBe(400)
        expect(apiError.response).toEqual(mockResponse)
      }

      // 401以外のエラーではリダイレクトしないことを確認
      expect(mockLocation.href).toBe('')
    })

    it('should throw APIClientError on 500 error', async () => {
      // Arrange
      const mockResponse: ApiResponse<unknown> = {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: false,
        status: 500,
        url: '/api/test',
      })

      // Act
      try {
        await apiClient.get('/api/test')
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(APIClientError)
        const apiError = error as APIClientError
        expect(apiError.status).toBe(500)
        expect(apiError.response).toEqual(mockResponse)
        expect(apiError.message).toBe('Internal server error')
      }
    })

    it('should use default error message when none provided', async () => {
      // Arrange
      const mockResponse: ApiResponse<unknown> = {
        data: null,
        success: false,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: false,
        status: 404,
        url: '/api/notfound',
      })

      // Act & Assert
      await expect(apiClient.get('/api/notfound')).rejects.toThrow(
        'HTTP Error: 404'
      )
    })
  })

  describe('JSONパースエラー処理', () => {
    it('should throw APIClientError on JSON parse error', async () => {
      // Arrange
      const mockJsonFn = vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      mockFetch.mockResolvedValueOnce({
        json: mockJsonFn,
        ok: true,
        status: 200,
        url: '/api/test',
      })

      // Act & Assert
      try {
        await apiClient.get('/api/test')
        // Should not reach here
        expect.fail('Expected an error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(APIClientError)
        const apiError = error as APIClientError
        expect(apiError.message).toBe('サーバーレスポンスの解析に失敗しました')
        expect(apiError.status).toBe(200)
      }

      expect(mockConsoleError).toHaveBeenCalledWith(
        'APIレスポンスのJSONパースに失敗しました:',
        expect.any(Error)
      )
    })
  })

  describe('HTTPメソッド', () => {
    it('should make PUT request correctly', async () => {
      // Arrange
      const putData = { id: '1', name: 'Updated Item' }
      const mockResponse: ApiResponse<typeof putData> = {
        data: putData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items/1',
      })

      // Act
      const result = await apiClient.put<typeof putData>(
        '/api/items/1',
        putData
      )

      // Assert
      expect(result).toEqual(putData)
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        body: JSON.stringify(putData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      })
    })

    it('should make PATCH request correctly', async () => {
      // Arrange
      const patchData = { name: 'Patched Item' }
      const responseData = { id: '1', name: 'Patched Item' }
      const mockResponse: ApiResponse<typeof responseData> = {
        data: responseData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items/1',
      })

      // Act
      const result = await apiClient.patch<typeof responseData>(
        '/api/items/1',
        patchData
      )

      // Assert
      expect(result).toEqual(responseData)
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        body: JSON.stringify(patchData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
    })

    it('should make DELETE request correctly', async () => {
      // Arrange
      const deleteResponse = { deleted: true, id: '1' }
      const mockResponse: ApiResponse<typeof deleteResponse> = {
        data: deleteResponse,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items/1',
      })

      // Act
      const result =
        await apiClient.delete<typeof deleteResponse>('/api/items/1')

      // Assert
      expect(result).toEqual(deleteResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/items/1', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })
    })
  })

  describe('クエリパラメータ処理', () => {
    it('should filter out undefined query parameters', async () => {
      // Arrange
      const mockData: unknown[] = []
      const mockResponse: ApiResponse<typeof mockData> = {
        data: mockData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items?active=true&page=1',
      })

      // Act
      await apiClient.get('/api/items', {
        active: true,
        category: undefined,
        page: 1,
        search: undefined,
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/items?active=true&page=1', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    })

    it('should handle boolean and number query parameters', async () => {
      // Arrange
      const mockData: unknown[] = []
      const mockResponse: ApiResponse<typeof mockData> = {
        data: mockData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/items?active=true&limit=10&page=1',
      })

      // Act
      await apiClient.get('/api/items', {
        active: true,
        limit: 10,
        page: 1,
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/items?active=true&limit=10&page=1',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }
      )
    })
  })

  describe('リクエストオプション', () => {
    it('should merge additional headers with default headers', async () => {
      // Arrange
      const mockData = { test: 'data' }
      const mockResponse: ApiResponse<typeof mockData> = {
        data: mockData,
        success: true,
        timestamp: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
        url: '/api/test',
      })

      // Act
      await apiClient.get('/api/test', undefined, {
        headers: {
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
        method: 'GET',
      })
    })
  })
})
