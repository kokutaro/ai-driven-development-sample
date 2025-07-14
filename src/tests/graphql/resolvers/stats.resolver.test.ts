/**
 * StatsResolverのテスト
 *
 * TDD方式でPrisma統合のテストを実装します。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataLoaderContext } from '@/graphql/context/dataloader-context'
import type { GraphQLContext } from '@/graphql/context/graphql-context'
import type { PrismaClient } from '@prisma/client'

import { StatsResolver } from '@/graphql/resolvers/stats.resolver'
import { StatsPeriod } from '@/graphql/types/stats.types'

// モックの設定
const mockPrismaClient = {
  category: {
    findMany: vi.fn(),
  },
  todo: {
    aggregate: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
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

describe('StatsResolver', () => {
  let resolver: StatsResolver

  beforeEach(() => {
    resolver = new StatsResolver()
    vi.clearAllMocks()
  })

  describe('todoStats クエリ', () => {
    it('月次統計を計算する', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: 'cat-1',
          createdAt: new Date('2024-01-01'),
          dueDate: null,
          id: '1',
          isCompleted: true,
          isImportant: false,
        },
        {
          categoryId: 'cat-1',
          createdAt: new Date('2024-01-02'),
          dueDate: null,
          id: '2',
          isCompleted: false,
          isImportant: true,
        },
        {
          categoryId: 'cat-2',
          createdAt: new Date('2024-01-03'),
          dueDate: null,
          id: '3',
          isCompleted: true,
          isImportant: false,
        },
        {
          categoryId: 'cat-2',
          createdAt: new Date('2024-01-04'),
          dueDate: null,
          id: '4',
          isCompleted: false,
          isImportant: false,
        },
      ]

      const mockCategories = [
        { color: '#FF6B6B', id: 'cat-1', name: 'Work' },
        { color: '#4ECDC4', id: 'cat-2', name: 'Personal' },
      ]

      mockPrismaClient.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      mockPrismaClient.category.findMany = vi
        .fn()
        .mockResolvedValue(mockCategories)

      // Act
      const result = await resolver.todoStats(
        { period: StatsPeriod.MONTH },
        mockGraphQLContext
      )

      // Assert
      expect(result).toEqual({
        averageCompletionTime: expect.any(Number),
        cancelled: 0,
        categories: [
          {
            color: '#FF6B6B',
            completed: 1,
            completionRate: 0.5,
            id: 'cat-1',
            name: 'Work',
            pending: 1,
            total: 2,
          },
          {
            color: '#4ECDC4',
            completed: 1,
            completionRate: 0.5,
            id: 'cat-2',
            name: 'Personal',
            pending: 1,
            total: 2,
          },
        ],
        completed: 2,
        completionRate: 0.5,
        dailyStats: expect.any(Array),
        generatedAt: expect.any(Date),
        inProgress: 0,
        overdue: 0,
        pending: 2,
        period: StatsPeriod.MONTH,
        total: 4,
      })
    })

    it('認証されていないユーザーはエラーを返す', async () => {
      // Arrange
      const unauthenticatedContext = {
        ...mockGraphQLContext,
        session: undefined,
      }

      // Act & Assert
      await expect(
        resolver.todoStats(
          { period: StatsPeriod.MONTH },
          unauthenticatedContext
        )
      ).rejects.toThrow('ログインが必要です')
    })

    it('統計データが空の場合は初期値を返す', async () => {
      // Arrange
      mockPrismaClient.todo.findMany = vi.fn().mockResolvedValue([])
      mockPrismaClient.category.findMany = vi.fn().mockResolvedValue([])

      // Act
      const result = await resolver.todoStats(
        { period: StatsPeriod.MONTH },
        mockGraphQLContext
      )

      // Assert
      expect(result).toEqual({
        averageCompletionTime: 0,
        cancelled: 0,
        categories: [],
        completed: 0,
        completionRate: 0,
        dailyStats: [],
        generatedAt: expect.any(Date),
        inProgress: 0,
        overdue: 0,
        pending: 0,
        period: StatsPeriod.MONTH,
        total: 0,
      })
    })
  })

  describe('dashboardStats クエリ', () => {
    it('今日の統計を返す', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: 'cat-1',
          createdAt: new Date('2024-01-01'),
          dueDate: null,
          id: '1',
          isCompleted: true,
          isImportant: false,
        },
        {
          categoryId: 'cat-1',
          createdAt: new Date('2024-01-02'),
          dueDate: null,
          id: '2',
          isCompleted: false,
          isImportant: true,
        },
      ]

      const mockCategories = [{ color: '#FF6B6B', id: 'cat-1', name: 'Work' }]

      mockPrismaClient.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      mockPrismaClient.category.findMany = vi
        .fn()
        .mockResolvedValue(mockCategories)

      // Act
      const result = await resolver.dashboardStats(mockGraphQLContext)

      // Assert
      expect(result.period).toBe(StatsPeriod.TODAY)
      expect(result.total).toBe(2)
      expect(result.completed).toBe(1)
      expect(result.pending).toBe(1)
    })

    it('認証されていないユーザーはエラーを返す', async () => {
      // Arrange
      const unauthenticatedContext = {
        ...mockGraphQLContext,
        session: undefined,
      }

      // Act & Assert
      await expect(
        resolver.dashboardStats(unauthenticatedContext)
      ).rejects.toThrow('ログインが必要です')
    })
  })
})
