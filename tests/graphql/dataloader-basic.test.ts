/**
 * DataLoader基本動作確認テスト
 *
 * DataLoaderが正しく実装され、基本的な機能が
 * 動作することを確認します。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@prisma/client'

import { DataLoaderContext } from '@/graphql/context/dataloader-context'
import { createGraphQLContext } from '@/graphql/context/graphql-context'
import { CategoryLoader } from '@/graphql/dataloaders/category.loader'
import { SubTaskLoader } from '@/graphql/dataloaders/subtask.loader'
import { UserLoader } from '@/graphql/dataloaders/user.loader'

// Prismaクライアントのモック
const mockPrisma = {
  category: {
    findMany: vi.fn(),
  },
  subTask: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

// NextRequestのモック
const mockRequest = {
  headers: new Headers(),
  method: 'POST',
  url: 'http://localhost:3000/api/graphql',
} as unknown as Request

describe('DataLoader Basic Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DataLoader Individual Components', () => {
    it('should create CategoryLoader correctly', () => {
      const categoryLoader = new CategoryLoader(mockPrisma)
      expect(categoryLoader).toBeDefined()
      expect(typeof categoryLoader.load).toBe('function')
      expect(typeof categoryLoader.loadMany).toBe('function')
      expect(typeof categoryLoader.clear).toBe('function')
      expect(typeof categoryLoader.clearAll).toBe('function')
    })

    it('should create SubTaskLoader correctly', () => {
      const subTaskLoader = new SubTaskLoader(mockPrisma)
      expect(subTaskLoader).toBeDefined()
      expect(typeof subTaskLoader.load).toBe('function')
      expect(typeof subTaskLoader.loadMany).toBe('function')
      expect(typeof subTaskLoader.clear).toBe('function')
      expect(typeof subTaskLoader.clearAll).toBe('function')
    })

    it('should create UserLoader correctly', () => {
      const userLoader = new UserLoader(mockPrisma)
      expect(userLoader).toBeDefined()
      expect(typeof userLoader.load).toBe('function')
      expect(typeof userLoader.loadMany).toBe('function')
      expect(typeof userLoader.clear).toBe('function')
      expect(typeof userLoader.clearAll).toBe('function')
    })
  })

  describe('DataLoaderContext', () => {
    it('should create DataLoaderContext with all loaders', () => {
      const context = new DataLoaderContext(mockPrisma)

      expect(context.categoryLoader).toBeInstanceOf(CategoryLoader)
      expect(context.subTaskLoader).toBeInstanceOf(SubTaskLoader)
      expect(context.userLoader).toBeInstanceOf(UserLoader)
    })

    it('should provide fresh DataLoader instances for each context', () => {
      const context1 = new DataLoaderContext(mockPrisma)
      const context2 = new DataLoaderContext(mockPrisma)

      expect(context1.categoryLoader).not.toBe(context2.categoryLoader)
      expect(context1.subTaskLoader).not.toBe(context2.subTaskLoader)
      expect(context1.userLoader).not.toBe(context2.userLoader)
    })

    it('should clear all caches', () => {
      const context = new DataLoaderContext(mockPrisma)

      // スパイを設定
      const clearCategorySpy = vi.spyOn(context.categoryLoader, 'clearAll')
      const clearSubTaskSpy = vi.spyOn(context.subTaskLoader, 'clearAll')
      const clearUserSpy = vi.spyOn(context.userLoader, 'clearAll')

      context.clearAllCaches()

      expect(clearCategorySpy).toHaveBeenCalledTimes(1)
      expect(clearSubTaskSpy).toHaveBeenCalledTimes(1)
      expect(clearUserSpy).toHaveBeenCalledTimes(1)
    })

    it('should provide stats functionality', () => {
      const context = new DataLoaderContext(mockPrisma)
      const stats = context.getStats()

      expect(stats).toBeDefined()
      expect(stats.timestamp).toBeInstanceOf(Date)
      expect(typeof stats.requestId).toBe('string')
      expect(stats.requestId.length).toBeGreaterThan(0)
    })
  })

  describe('GraphQL Context Integration', () => {
    it('should create GraphQL context with DataLoader integration', async () => {
      const context = await createGraphQLContext(mockRequest)

      expect(context).toBeDefined()
      expect(context.dataloaders).toBeInstanceOf(DataLoaderContext)
      expect(context.dataloaders.categoryLoader).toBeInstanceOf(CategoryLoader)
      expect(context.dataloaders.subTaskLoader).toBeInstanceOf(SubTaskLoader)
      expect(context.dataloaders.userLoader).toBeInstanceOf(UserLoader)
      expect(context.prisma).toBeDefined()
    })

    it('should create fresh DataLoader context for each GraphQL request', async () => {
      const context1 = await createGraphQLContext(mockRequest)
      const context2 = await createGraphQLContext(mockRequest)

      expect(context1.dataloaders).not.toBe(context2.dataloaders)
      expect(context1.dataloaders.categoryLoader).not.toBe(
        context2.dataloaders.categoryLoader
      )
    })
  })

  describe('DataLoader Caching Behavior', () => {
    it('should demonstrate caching within same DataLoader instance', async () => {
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)
      const categoryLoader = new CategoryLoader(mockPrisma)

      // 同じIDを複数回ロード
      const [result1, result2, result3] = await Promise.all([
        categoryLoader.load('cat1'),
        categoryLoader.load('cat1'),
        categoryLoader.load('cat1'),
      ])

      // 結果は同じ
      expect(result1).toEqual(mockCategories[0])
      expect(result2).toEqual(mockCategories[0])
      expect(result3).toEqual(mockCategories[0])

      // Prismaクエリは1回だけ（バッチング+キャッシング効果）
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1)
    })

    it('should isolate cache between different DataLoader instances', async () => {
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)

      const loader1 = new CategoryLoader(mockPrisma)
      const loader2 = new CategoryLoader(mockPrisma)

      await loader1.load('cat1')
      await loader2.load('cat1')

      // 異なるインスタンスなので、それぞれでクエリが実行される
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('DataLoader Error Resilience', () => {
    it('should handle individual loader errors without affecting others', async () => {
      const context = new DataLoaderContext(mockPrisma)

      // CategoryLoaderでエラーを発生
      mockPrisma.category.findMany = vi
        .fn()
        .mockRejectedValue(new Error('Category error'))

      // SubTaskLoaderは正常
      const mockSubTasks = [
        {
          id: 'sub1',
          isCompleted: false,
          order: 1,
          title: 'SubTask 1',
          todoId: 'todo1',
        },
      ]
      mockPrisma.subTask.findMany = vi.fn().mockResolvedValue(mockSubTasks)

      // CategoryLoaderはエラー
      await expect(context.categoryLoader.load('cat1')).rejects.toThrow(
        'Category error'
      )

      // SubTaskLoaderは正常動作
      const subTasks = await context.subTaskLoader.load('todo1')
      expect(subTasks).toEqual(mockSubTasks)
    })
  })

  describe('DataLoader Memory Management', () => {
    it('should clear individual cache entries', async () => {
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)
      const categoryLoader = new CategoryLoader(mockPrisma)

      // 最初のロード
      await categoryLoader.load('cat1')
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1)

      // キャッシュクリア
      categoryLoader.clear('cat1')

      // 再ロード（新しいクエリが実行される）
      await categoryLoader.load('cat1')
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(2)
    })

    it('should clear all cache entries', async () => {
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)
      const categoryLoader = new CategoryLoader(mockPrisma)

      // 複数のエントリをロード
      await Promise.all([
        categoryLoader.load('cat1'),
        categoryLoader.load('cat2'),
      ])

      // 全キャッシュクリア
      categoryLoader.clearAll()

      // 再ロード（新しいクエリが実行される）
      await categoryLoader.load('cat1')

      // クリア後のロードで新しいクエリが実行されることを確認
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(2)
    })
  })
})
