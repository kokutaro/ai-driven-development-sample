/**
 * DataLoader機能のTDDテスト
 *
 * N+1クエリ問題の解決とパフォーマンス最適化をテストします。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PrismaClient } from '@prisma/client'

import { DataLoaderContext } from '@/graphql/context/dataloader-context'
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

describe('DataLoader Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CategoryLoader', () => {
    it('should batch load categories by IDs', async () => {
      // Arrange
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)

      const categoryLoader = new CategoryLoader(mockPrisma)

      // Act
      const results = await Promise.all([
        categoryLoader.load('cat1'),
        categoryLoader.load('cat2'),
        categoryLoader.load('cat1'), // 重複リクエスト（キャッシュテスト）
      ])

      // Assert
      expect(results).toHaveLength(3)
      expect(results[0]).toEqual(mockCategories[0])
      expect(results[1]).toEqual(mockCategories[1])
      expect(results[2]).toEqual(mockCategories[0]) // キャッシュされた結果

      // Prismaクエリが1回だけ呼ばれることを確認（バッチング効果）
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['cat1', 'cat2'] } },
      })
    })

    it('should handle missing categories gracefully', async () => {
      // Arrange
      mockPrisma.category.findMany = vi
        .fn()
        .mockResolvedValue([
          { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        ])

      const categoryLoader = new CategoryLoader(mockPrisma)

      // Act
      const results = await Promise.all([
        categoryLoader.load('cat1'),
        categoryLoader.load('nonexistent'),
      ])

      // Assert
      expect(results[0]).toEqual({
        color: '#FF6B6B',
        id: 'cat1',
        name: 'Work',
        userId: 'user1',
      })
      expect(results[1]).toBeUndefined()
    })
  })

  describe('SubTaskLoader', () => {
    it('should batch load subtasks by todo IDs', async () => {
      // Arrange
      const mockSubTasks = [
        { id: 'sub1', isCompleted: false, title: 'Task 1', todoId: 'todo1' },
        { id: 'sub2', isCompleted: true, title: 'Task 2', todoId: 'todo1' },
        { id: 'sub3', isCompleted: false, title: 'Task 3', todoId: 'todo2' },
      ]

      mockPrisma.subTask.findMany = vi.fn().mockResolvedValue(mockSubTasks)

      const subTaskLoader = new SubTaskLoader(mockPrisma)

      // Act
      const results = await Promise.all([
        subTaskLoader.load('todo1'),
        subTaskLoader.load('todo2'),
        subTaskLoader.load('todo3'), // 該当なしのケース
      ])

      // Assert
      expect(results).toHaveLength(3)
      expect(results[0]).toHaveLength(2) // todo1のサブタスク
      expect(results[1]).toHaveLength(1) // todo2のサブタスク
      expect(results[2]).toHaveLength(0) // todo3のサブタスク（なし）

      expect(mockPrisma.subTask.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.subTask.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
        where: { todoId: { in: ['todo1', 'todo2', 'todo3'] } },
      })
    })
  })

  describe('UserLoader', () => {
    it('should batch load users by IDs', async () => {
      // Arrange
      const mockUsers = [
        { email: 'user1@example.com', id: 'user1', name: 'User 1' },
        { email: 'user2@example.com', id: 'user2', name: 'User 2' },
      ]

      mockPrisma.user.findMany = vi.fn().mockResolvedValue(mockUsers)

      const userLoader = new UserLoader(mockPrisma)

      // Act
      const results = await Promise.all([
        userLoader.load('user1'),
        userLoader.load('user2'),
      ])

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual(mockUsers[0])
      expect(results[1]).toEqual(mockUsers[1])

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          email: true,
          id: true,
          name: true,
          updatedAt: true,
        },
        where: { id: { in: ['user1', 'user2'] } },
      })
    })
  })

  describe('DataLoaderContext Integration', () => {
    it('should create dataloader context with all loaders', () => {
      // Act
      const context = new DataLoaderContext(mockPrisma)

      // Assert
      expect(context.categoryLoader).toBeInstanceOf(CategoryLoader)
      expect(context.subTaskLoader).toBeInstanceOf(SubTaskLoader)
      expect(context.userLoader).toBeInstanceOf(UserLoader)
    })

    it('should provide fresh loaders for each request', () => {
      // Act
      const context1 = new DataLoaderContext(mockPrisma)
      const context2 = new DataLoaderContext(mockPrisma)

      // Assert
      expect(context1.categoryLoader).not.toBe(context2.categoryLoader)
      expect(context1.subTaskLoader).not.toBe(context2.subTaskLoader)
      expect(context1.userLoader).not.toBe(context2.userLoader)
    })
  })

  describe('Performance Testing', () => {
    it('should reduce database queries with DataLoader', async () => {
      // Arrange
      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
      ]

      mockPrisma.category.findMany = vi.fn().mockResolvedValue(mockCategories)

      const categoryLoader = new CategoryLoader(mockPrisma)

      // Act - 10個の同時リクエスト（通常なら10回のクエリ）
      const promises = Array.from({ length: 10 }, (_, i) =>
        categoryLoader.load(i < 5 ? 'cat1' : 'cat2')
      )

      const results = await Promise.all(promises)

      // Assert
      expect(results).toHaveLength(10)
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1) // 1回のバッチクエリのみ
    })

    it('should measure query batching effectiveness', async () => {
      // Arrange
      const startTime = Date.now()
      const categoryLoader = new CategoryLoader(mockPrisma)

      mockPrisma.category.findMany = vi.fn().mockImplementation(async () => {
        // 実際のDBクエリをシミュレート（10ms遅延）
        await new Promise((resolve) => setTimeout(resolve, 10))
        return [
          { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
          { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
        ]
      })

      // Act - 複数の同時リクエスト
      await Promise.all([
        categoryLoader.load('cat1'),
        categoryLoader.load('cat2'),
        categoryLoader.load('cat1'),
        categoryLoader.load('cat2'),
      ])

      const endTime = Date.now()
      const duration = endTime - startTime

      // Assert
      expect(duration).toBeLessThan(50) // バッチングにより高速化
      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed')
      mockPrisma.category.findMany = vi.fn().mockRejectedValue(dbError)

      const categoryLoader = new CategoryLoader(mockPrisma)

      // Act & Assert
      await expect(categoryLoader.load('cat1')).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should isolate errors per batch', async () => {
      // Arrange
      mockPrisma.category.findMany = vi
        .fn()
        .mockResolvedValueOnce([
          { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        ])
        .mockRejectedValueOnce(new Error('DB Error'))

      const categoryLoader = new CategoryLoader(mockPrisma)

      // Act
      const result1 = await categoryLoader.load('cat1')

      // Clear loader cache to force new batch
      categoryLoader.clearAll()

      // Assert
      expect(result1).toEqual({
        color: '#FF6B6B',
        id: 'cat1',
        name: 'Work',
        userId: 'user1',
      })
      await expect(categoryLoader.load('cat2')).rejects.toThrow('DB Error')
    })
  })
})
