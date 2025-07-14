/**
 * CategoryResolverのテスト
 *
 * TDD方式でPrisma統合のテストを実装します。
 * 1. Red: 失敗するテストを書く
 * 2. Green: テストが通る最小限のコードを書く
 * 3. Refactor: コードをリファクタリングする
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataLoaderContext } from '@/graphql/context/dataloader-context'
import type { GraphQLContext } from '@/graphql/context/graphql-context'
import type { PrismaClient } from '@prisma/client'

import { CategoryResolver } from '@/graphql/resolvers/category.resolver'

// モックの設定
const mockPrismaClient = {
  category: {
    create: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient

const mockDataLoaderContext = {
  categoryLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
  subTaskLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
  userLoader: {
    clear: vi.fn(),
    clearAll: vi.fn(),
    load: vi.fn(),
    loadMany: vi.fn(),
  },
} as unknown as DataLoaderContext

const mockGraphQLContext: GraphQLContext = {
  commandBus: {} as never,
  dataloaders: mockDataLoaderContext,
  prisma: mockPrismaClient,
  queryBus: {} as never,
  req: {} as never,
  res: {} as never,
  session: {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: {
      email: 'test@example.com',
      id: 'user-123',
      name: 'Test User',
    },
  },
}

describe('CategoryResolver', () => {
  let resolver: CategoryResolver

  beforeEach(() => {
    resolver = new CategoryResolver()
    vi.clearAllMocks()
  })

  describe('categories クエリ', () => {
    it('認証されたユーザーのカテゴリ一覧を取得する', async () => {
      // Arrange
      const mockCategories = [
        {
          color: '#FF6B6B',
          createdAt: new Date('2024-01-01'),
          id: 'cat-1',
          name: 'Work',
          updatedAt: new Date('2024-01-01'),
          userId: 'user-123',
        },
        {
          color: '#4ECDC4',
          createdAt: new Date('2024-01-01'),
          id: 'cat-2',
          name: 'Personal',
          updatedAt: new Date('2024-01-01'),
          userId: 'user-123',
        },
      ]

      mockPrismaClient.category.findMany = vi
        .fn()
        .mockResolvedValue(mockCategories)

      // Act
      const result = await resolver.categories(mockGraphQLContext)

      // Assert
      expect(result).toEqual(mockCategories)
      expect(mockPrismaClient.category.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          userId: 'user-123',
        },
      })
    })

    it('認証されていないユーザーはエラーを返す', async () => {
      // Arrange
      const unauthenticatedContext = {
        ...mockGraphQLContext,
        session: undefined,
      }

      // Act & Assert
      await expect(resolver.categories(unauthenticatedContext)).rejects.toThrow(
        'ログインが必要です'
      )
    })

    it('データベースエラーが発生した場合は適切なエラーを返す', async () => {
      // Arrange
      mockPrismaClient.category.findMany = vi
        .fn()
        .mockRejectedValue(new Error('Database connection failed'))

      // Act & Assert
      await expect(resolver.categories(mockGraphQLContext)).rejects.toThrow(
        'Unknown database error'
      )
    })
  })

  describe('createCategory ミューテーション', () => {
    it('新しいカテゴリを作成する', async () => {
      // Arrange
      const input = {
        color: '#00FF00',
        name: 'New Category',
      }

      const mockCreatedCategory = {
        color: '#00FF00',
        createdAt: new Date('2024-01-01'),
        id: 'cat-new',
        name: 'New Category',
        updatedAt: new Date('2024-01-01'),
        userId: 'user-123',
      }

      mockPrismaClient.category.create = vi
        .fn()
        .mockResolvedValue(mockCreatedCategory)

      // Act
      const result = await resolver.createCategory(input, mockGraphQLContext)

      // Assert
      expect(result).toEqual(mockCreatedCategory)
      expect(mockPrismaClient.category.create).toHaveBeenCalledWith({
        data: {
          color: '#00FF00',
          name: 'New Category',
          userId: 'user-123',
        },
      })
    })

    it('不正な入力データでエラーを返す', async () => {
      // Arrange
      const invalidInput = {
        color: 'invalid-color', // 無効なHEX形式
        name: '', // 空文字
      }

      // Act & Assert
      await expect(
        resolver.createCategory(invalidInput, mockGraphQLContext)
      ).rejects.toThrow('カテゴリ名は必須です')
    })
  })

  describe('updateCategory ミューテーション', () => {
    it('既存のカテゴリを更新する', async () => {
      // Arrange
      const categoryId = 'cat-1'
      const input = {
        color: '#0000FF',
        name: 'Updated Category',
      }

      const mockExistingCategory = {
        color: '#FF0000',
        createdAt: new Date('2024-01-01'),
        id: 'cat-1',
        name: 'Old Category',
        updatedAt: new Date('2024-01-01'),
        userId: 'user-123',
      }

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        color: '#0000FF',
        name: 'Updated Category',
        updatedAt: new Date('2024-01-02'),
      }

      mockPrismaClient.category.findUnique = vi
        .fn()
        .mockResolvedValue(mockExistingCategory)
      mockPrismaClient.category.update = vi
        .fn()
        .mockResolvedValue(mockUpdatedCategory)

      // Act
      const result = await resolver.updateCategory(
        categoryId,
        input,
        mockGraphQLContext
      )

      // Assert
      expect(result).toEqual(mockUpdatedCategory)
      expect(mockPrismaClient.category.update).toHaveBeenCalledWith({
        data: {
          color: '#0000FF',
          name: 'Updated Category',
        },
        where: { id: categoryId },
      })
    })

    it('存在しないカテゴリを更新しようとするとエラーを返す', async () => {
      // Arrange
      const categoryId = 'nonexistent-cat'
      const input = {
        color: '#0000FF',
        name: 'Updated Category',
      }

      mockPrismaClient.category.findUnique = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(
        resolver.updateCategory(categoryId, input, mockGraphQLContext)
      ).rejects.toThrow('Unknown database error')
    })

    it('他のユーザーのカテゴリを更新しようとするとエラーを返す', async () => {
      // Arrange
      const categoryId = 'cat-1'
      const input = {
        color: '#0000FF',
        name: 'Updated Category',
      }

      const mockOtherUserCategory = {
        color: '#FF0000',
        createdAt: new Date('2024-01-01'),
        id: 'cat-1',
        name: 'Other User Category',
        updatedAt: new Date('2024-01-01'),
        userId: 'other-user-456',
      }

      mockPrismaClient.category.findUnique = vi
        .fn()
        .mockResolvedValue(mockOtherUserCategory)

      // Act & Assert
      await expect(
        resolver.updateCategory(categoryId, input, mockGraphQLContext)
      ).rejects.toThrow('Unknown database error')
    })
  })

  describe('deleteCategory ミューテーション', () => {
    it('既存のカテゴリを削除する', async () => {
      // Arrange
      const categoryId = 'cat-1'

      const mockExistingCategory = {
        color: '#FF0000',
        createdAt: new Date('2024-01-01'),
        id: 'cat-1',
        name: 'Category to Delete',
        updatedAt: new Date('2024-01-01'),
        userId: 'user-123',
      }

      mockPrismaClient.category.findUnique = vi
        .fn()
        .mockResolvedValue(mockExistingCategory)
      mockPrismaClient.category.delete = vi
        .fn()
        .mockResolvedValue(mockExistingCategory)

      // Act
      const result = await resolver.deleteCategory(
        categoryId,
        mockGraphQLContext
      )

      // Assert
      expect(result).toBe(true)
      expect(mockPrismaClient.category.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      })
    })

    it('存在しないカテゴリを削除しようとするとエラーを返す', async () => {
      // Arrange
      const categoryId = 'nonexistent-cat'

      mockPrismaClient.category.findUnique = vi.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(
        resolver.deleteCategory(categoryId, mockGraphQLContext)
      ).rejects.toThrow('Unknown database error')
    })

    it('他のユーザーのカテゴリを削除しようとするとエラーを返す', async () => {
      // Arrange
      const categoryId = 'cat-1'

      const mockOtherUserCategory = {
        color: '#FF0000',
        createdAt: new Date('2024-01-01'),
        id: 'cat-1',
        name: 'Other User Category',
        updatedAt: new Date('2024-01-01'),
        userId: 'other-user-456',
      }

      mockPrismaClient.category.findUnique = vi
        .fn()
        .mockResolvedValue(mockOtherUserCategory)

      // Act & Assert
      await expect(
        resolver.deleteCategory(categoryId, mockGraphQLContext)
      ).rejects.toThrow('Unknown database error')
    })
  })
})
