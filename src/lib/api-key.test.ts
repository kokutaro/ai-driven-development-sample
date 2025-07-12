import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createApiKey,
  deleteApiKey,
  generateApiKey,
  getUserApiKeys,
  getUserIdFromApiKey,
  hashApiKey,
  isValidApiKey,
  verifyApiKey,
} from '@/lib/api-key'
import { prisma } from '@/lib/db'

// Prismaをモック
vi.mock('@/lib/db', () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('API Key Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateApiKey', () => {
    it('should generate API key with todo_ prefix', () => {
      const apiKey = generateApiKey()

      expect(apiKey).toMatch(/^todo_[a-f0-9]{64}$/)
    })

    it('should generate unique API keys', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()

      expect(key1).not.toBe(key2)
    })
  })

  describe('hashApiKey and verifyApiKey', () => {
    it('should hash and verify API key correctly', async () => {
      const plainKey = 'todo_test123456789'

      const hashedKey = await hashApiKey(plainKey)
      expect(hashedKey).not.toBe(plainKey)
      expect(hashedKey.length).toBeGreaterThan(0)

      const isValid = await verifyApiKey(plainKey, hashedKey)
      expect(isValid).toBe(true)

      const isInvalid = await verifyApiKey('wrong_key', hashedKey)
      expect(isInvalid).toBe(false)
    })
  })

  describe('createApiKey', () => {
    it('should create API key successfully', async () => {
      const mockApiKey = {
        createdAt: new Date(),
        expiresAt: null,
        id: 'test-id',
        lastUsedAt: null,
        name: 'Test Key',
        updatedAt: new Date(),
      }

      vi.mocked(prisma.apiKey.create).mockResolvedValue(mockApiKey as any)

      const result = await createApiKey('user-123', 'Test Key')

      expect(result.apiKey).toEqual(mockApiKey)
      expect(result.plainKey).toMatch(/^todo_[a-f0-9]{64}$/)
      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: {
          expiresAt: undefined,
          keyHash: expect.any(String),
          name: 'Test Key',
          userId: 'user-123',
        },
        select: {
          createdAt: true,
          expiresAt: true,
          id: true,
          lastUsedAt: true,
          name: true,
          updatedAt: true,
        },
      })
    })
  })

  describe('getUserApiKeys', () => {
    it('should get user API keys', async () => {
      const mockApiKeys = [
        {
          createdAt: new Date(),
          expiresAt: null,
          id: 'key-1',
          lastUsedAt: new Date(),
          name: 'Test Key 1',
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockApiKeys as any)

      const result = await getUserApiKeys('user-123')

      expect(result).toEqual(mockApiKeys)
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          expiresAt: true,
          id: true,
          lastUsedAt: true,
          name: true,
          updatedAt: true,
        },
        where: { userId: 'user-123' },
      })
    })
  })

  describe('deleteApiKey', () => {
    it('should delete API key', async () => {
      const mockApiKey = { id: 'key-1', userId: 'user-123' }

      vi.mocked(prisma.apiKey.delete).mockResolvedValue(mockApiKey as any)

      const result = await deleteApiKey('user-123', 'key-1')

      expect(result).toEqual(mockApiKey)
      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: {
          id: 'key-1',
          userId: 'user-123',
        },
      })
    })
  })

  describe('getUserIdFromApiKey', () => {
    it('should return null for invalid API key format', async () => {
      const userId = await getUserIdFromApiKey('invalid-key')
      expect(userId).toBeNull()
    })

    it('should return null for non-todo prefixed key', async () => {
      const userId = await getUserIdFromApiKey('other_1234567890')
      expect(userId).toBeNull()
    })

    it('should return user ID for valid API key', async () => {
      const plainKey = generateApiKey()
      const hashedKey = await hashApiKey(plainKey)

      const mockApiKeys = [
        {
          expiresAt: null,
          id: 'key-1',
          keyHash: hashedKey,
          userId: 'user-123',
        },
      ]

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockApiKeys as any)
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any)

      const userId = await getUserIdFromApiKey(plainKey)

      expect(userId).toBe('user-123')
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        data: { lastUsedAt: expect.any(Date) },
        where: { id: 'key-1' },
      })
    })

    it('should return null for expired API key', async () => {
      const plainKey = generateApiKey()
      const hashedKey = await hashApiKey(plainKey)
      const expiredDate = new Date(Date.now() - 1000) // 1秒前

      const mockApiKeys = [
        {
          expiresAt: expiredDate,
          id: 'key-1',
          keyHash: hashedKey,
          userId: 'user-123',
        },
      ]

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockApiKeys as any)

      const userId = await getUserIdFromApiKey(plainKey)

      expect(userId).toBeNull()
    })
  })

  describe('isValidApiKey', () => {
    it('should return true for valid API key', async () => {
      const plainKey = generateApiKey()
      const hashedKey = await hashApiKey(plainKey)

      const mockApiKeys = [
        {
          expiresAt: null,
          id: 'key-1',
          keyHash: hashedKey,
          userId: 'user-123',
        },
      ]

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockApiKeys as any)
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any)

      const isValid = await isValidApiKey(plainKey)

      expect(isValid).toBe(true)
    })

    it('should return false for invalid API key', async () => {
      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([])

      const isValid = await isValidApiKey('invalid-key')

      expect(isValid).toBe(false)
    })
  })
})
