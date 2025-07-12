import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE } from './route'

import type { NextRequest, NextResponse } from 'next/server'

/**
 * APIキー削除エンドポイント テスト
 *
 * DELETE /api/api-keys/[id] の全機能をテストし、100%カバレッジを達成します。
 * - 正常な削除処理
 * - 認証エラー処理
 * - 存在しないAPIキー処理
 * - Prismaエラー処理
 * - 一般的なエラー処理
 */

// 外部依存関係をモック
vi.mock('@/lib/api-key', () => ({
  deleteApiKey: vi.fn(),
}))

vi.mock('@/lib/api-utils', () => ({
  createErrorResponse: vi.fn(),
  createSuccessResponse: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getUserIdFromRequestWithApiKey: vi.fn(),
}))

const { deleteApiKey } = await import('@/lib/api-key')
const { createErrorResponse, createSuccessResponse } = await import(
  '@/lib/api-utils'
)
const { getUserIdFromRequestWithApiKey } = await import('@/lib/auth')

const mockDeleteApiKey = vi.mocked(deleteApiKey)
const mockCreateErrorResponse = vi.mocked(createErrorResponse)
const mockCreateSuccessResponse = vi.mocked(createSuccessResponse)
const mockGetUserIdFromRequestWithApiKey = vi.mocked(
  getUserIdFromRequestWithApiKey
)

// モックレスポンス
const mockSuccessResponse = new Response('success', {
  status: 200,
}) as unknown as NextResponse
const mockErrorResponse401 = new Response('error', {
  status: 401,
}) as unknown as NextResponse
const mockErrorResponse404 = new Response('error', {
  status: 404,
}) as unknown as NextResponse
const mockErrorResponse500 = new Response('error', {
  status: 500,
}) as unknown as NextResponse

const mockApiKeyData = {
  createdAt: new Date(),
  expiresAt: null,
  id: 'test-api-key-id',
  keyHash: 'hash123',
  lastUsedAt: null,
  name: 'Test Key',
  updatedAt: new Date(),
  userId: 'user123',
}

describe('DELETE /api/api-keys/[id]', () => {
  const mockRequest = {
    method: 'DELETE',
  } as NextRequest

  const mockParams = {
    params: { id: 'test-api-key-id' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn() // コンソールエラーをモック
  })

  describe('successful deletion', () => {
    it('should delete API key successfully', async () => {
      // Arrange
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockResolvedValue(mockApiKeyData)
      mockCreateSuccessResponse.mockReturnValue(mockSuccessResponse)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockGetUserIdFromRequestWithApiKey).toHaveBeenCalledWith(
        mockRequest
      )
      expect(mockDeleteApiKey).toHaveBeenCalledWith(
        'user123',
        'test-api-key-id'
      )
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        deleted: true,
        id: 'test-api-key-id',
      })
      expect(response).toBe(mockSuccessResponse)
    })
  })

  describe('authentication errors', () => {
    it('should return 401 when authentication is required', async () => {
      // Arrange
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequestWithApiKey.mockRejectedValue(authError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse401)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'UNAUTHORIZED',
        '認証が必要です',
        401
      )
      expect(response).toBe(mockErrorResponse401)
      expect(mockDeleteApiKey).not.toHaveBeenCalled()
    })

    it('should return 401 when getUserIdFromRequestWithApiKey throws authentication error', async () => {
      // Arrange
      const authError = new Error('認証が必要です')
      mockGetUserIdFromRequestWithApiKey.mockRejectedValue(authError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse401)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'UNAUTHORIZED',
        '認証が必要です',
        401
      )
      expect(response).toBe(mockErrorResponse401)
    })
  })

  describe('resource not found errors', () => {
    it('should return 404 when API key is not found (P2025 error)', async () => {
      // Arrange
      const prismaError = new Error(
        'An operation failed because it depends on one or more records that were required but not found. Record to delete does not exist. (P2025)'
      )
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(prismaError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse404)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'NOT_FOUND',
        'APIキーが見つかりません',
        404
      )
      expect(response).toBe(mockErrorResponse404)
    })

    it('should return 404 when deleteApiKey throws P2025 error with different message', async () => {
      // Arrange
      const prismaError = new Error('Record not found P2025')
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(prismaError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse404)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'NOT_FOUND',
        'APIキーが見つかりません',
        404
      )
      expect(response).toBe(mockErrorResponse404)
    })
  })

  describe('server errors', () => {
    it('should return 500 for unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection failed')
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(unexpectedError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse500)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'APIキー削除エラー:',
        unexpectedError
      )
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'サーバーエラーが発生しました',
        500
      )
      expect(response).toBe(mockErrorResponse500)
    })

    it('should return 500 for non-Error exceptions', async () => {
      // Arrange
      const nonErrorException = 'String error'
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(nonErrorException)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse500)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'APIキー削除エラー:',
        nonErrorException
      )
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'サーバーエラーが発生しました',
        500
      )
      expect(response).toBe(mockErrorResponse500)
    })

    it('should return 500 when deleteApiKey throws unexpected error', async () => {
      // Arrange
      const networkError = new Error('Network timeout')
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(networkError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse500)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'APIキー削除エラー:',
        networkError
      )
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'サーバーエラーが発生しました',
        500
      )
      expect(response).toBe(mockErrorResponse500)
    })
  })

  describe('parameter handling', () => {
    it('should pass correct parameters to deleteApiKey', async () => {
      // Arrange
      const customParams = {
        params: { id: 'custom-api-key-id' },
      }
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('custom-user')
      mockDeleteApiKey.mockResolvedValue(mockApiKeyData)
      mockCreateSuccessResponse.mockReturnValue(mockSuccessResponse)

      // Act
      await DELETE(mockRequest, customParams)

      // Assert
      expect(mockDeleteApiKey).toHaveBeenCalledWith(
        'custom-user',
        'custom-api-key-id'
      )
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        deleted: true,
        id: 'custom-api-key-id',
      })
    })

    it('should handle empty API key ID', async () => {
      // Arrange
      const emptyParams = {
        params: { id: '' },
      }
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockResolvedValue(mockApiKeyData)
      mockCreateSuccessResponse.mockReturnValue(mockSuccessResponse)

      // Act
      await DELETE(mockRequest, emptyParams)

      // Assert
      expect(mockDeleteApiKey).toHaveBeenCalledWith('user123', '')
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith({
        deleted: true,
        id: '',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle authentication error with specific message', async () => {
      // Arrange
      const specificAuthError = new Error('認証が必要です')
      mockGetUserIdFromRequestWithApiKey.mockRejectedValue(specificAuthError)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse401)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'UNAUTHORIZED',
        '認証が必要です',
        401
      )
      expect(response).toBe(mockErrorResponse401)
    })

    it('should handle P2025 error with partial message match', async () => {
      // Arrange
      const partialP2025Error = new Error('Some error P2025 more text')
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(partialP2025Error)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse404)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'NOT_FOUND',
        'APIキーが見つかりません',
        404
      )
      expect(response).toBe(mockErrorResponse404)
    })

    it('should not treat non-P2025 errors as not found', async () => {
      // Arrange
      const nonP2025Error = new Error('Some other database error')
      mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user123')
      mockDeleteApiKey.mockRejectedValue(nonP2025Error)
      mockCreateErrorResponse.mockReturnValue(mockErrorResponse500)

      // Act
      const response = await DELETE(mockRequest, mockParams)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'サーバーエラーが発生しました',
        500
      )
      expect(response).toBe(mockErrorResponse500)
    })
  })
})
