import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET, POST } from '@/app/api/api-keys/route'

// 依存関係をモック
vi.mock('@/lib/auth', () => ({
  getUserIdFromRequest: vi.fn(),
}))

vi.mock('@/lib/api-key', () => ({
  createApiKey: vi.fn(),
  getUserApiKeys: vi.fn(),
}))

const mockGetUserIdFromRequest = vi.mocked(
  await import('@/lib/auth')
).getUserIdFromRequest
const mockGetUserApiKeys = vi.mocked(
  await import('@/lib/api-key')
).getUserApiKeys
const mockCreateApiKey = vi.mocked(await import('@/lib/api-key')).createApiKey

describe('/api/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return API keys for authenticated user', async () => {
      const mockApiKeys = [
        {
          createdAt: new Date(),
          expiresAt: null,
          id: 'key-1',
          lastUsedAt: new Date(),
          name: 'Test Key',
          updatedAt: new Date(),
        },
      ]

      mockGetUserIdFromRequest.mockResolvedValue('user-123')
      mockGetUserApiKeys.mockResolvedValue(mockApiKeys)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // 日付フィールドを除いた比較
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('key-1')
      expect(data.data[0].name).toBe('Test Key')
      expect(data.data[0].expiresAt).toBeNull()

      // 日付フィールドは文字列として存在することを確認
      expect(typeof data.data[0].createdAt).toBe('string')
      expect(typeof data.data[0].lastUsedAt).toBe('string')
      expect(typeof data.data[0].updatedAt).toBe('string')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUserIdFromRequest.mockRejectedValue(new Error('認証が必要です'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST', () => {
    it('should create API key successfully', async () => {
      const mockResult = {
        apiKey: {
          createdAt: new Date(),
          expiresAt: null,
          id: 'key-1',
          lastUsedAt: null,
          name: 'Test Key',
          updatedAt: new Date(),
        },
        plainKey: 'todo_test123456789',
      }

      mockGetUserIdFromRequest.mockResolvedValue('user-123')
      mockCreateApiKey.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/api-keys', {
        body: JSON.stringify({
          name: 'Test Key',
        }),
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)

      // 日付フィールドを除いた比較
      expect(data.data.plainKey).toBe('todo_test123456789')
      expect(data.data.apiKey.id).toBe('key-1')
      expect(data.data.apiKey.name).toBe('Test Key')
      expect(data.data.apiKey.expiresAt).toBeNull()
      expect(data.data.apiKey.lastUsedAt).toBeNull()

      // 日付フィールドは文字列として存在することを確認
      expect(typeof data.data.apiKey.createdAt).toBe('string')
      expect(typeof data.data.apiKey.updatedAt).toBe('string')
    })

    it('should return validation error for invalid data', async () => {
      mockGetUserIdFromRequest.mockResolvedValue('user-123')

      const request = new NextRequest('http://localhost:3000/api/api-keys', {
        body: JSON.stringify({
          name: '', // 空の名前
        }),
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetUserIdFromRequest.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost:3000/api/api-keys', {
        body: JSON.stringify({
          name: 'Test Key',
        }),
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
