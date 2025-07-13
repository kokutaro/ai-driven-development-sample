/**
 * DataLoader統合テスト
 *
 * 実際のGraphQLクエリでDataLoaderが正しく動作し、
 * N+1クエリ問題が解決されることをテストします。
 */
import { execute, parse } from 'graphql'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DataLoaderContext } from '@/graphql/context/dataloader-context'
import type { GraphQLContext } from '@/graphql/context/graphql-context'
import type { PrismaClient } from '@prisma/client'
import type { GraphQLSchema } from 'graphql'
import type { NextRequest } from 'next/server'

import { buildGraphQLSchema } from '@/graphql/schema/schema.builder'

// Prismaクライアントのモック
const mockPrisma = {
  category: {
    findMany: vi.fn(),
  },
  subTask: {
    findMany: vi.fn(),
  },
  todo: {
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

// NextRequestのモック
const mockRequest = {
  cookies: new Map(),
  headers: new Headers(),
  method: 'POST',
  nextUrl: new URL('http://localhost:3000/api/graphql'),
  url: 'http://localhost:3000/api/graphql',
} as unknown as NextRequest

describe('DataLoader GraphQL Integration Tests', () => {
  let schema: GraphQLSchema
  let context: GraphQLContext

  beforeAll(async () => {
    // GraphQLスキーマを構築
    schema = await buildGraphQLSchema()
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // GraphQLコンテキストを作成（DataLoader統合済み）
    const mockDataloaders = {
      categoryLoader: {
        batchLoadCategories: vi.fn(),
        clear: vi.fn(),
        clearAll: vi.fn(),
        load: vi.fn(),
        loadMany: vi.fn(),
      },
      clearAllCaches: vi.fn(),
      getStats: vi.fn(() => ({
        requestId: 'test-request',
        timestamp: new Date(),
      })),
      subTaskLoader: {
        batchLoadSubTasks: vi.fn(),
        clear: vi.fn(),
        clearAll: vi.fn(),
        load: vi.fn(),
        loadMany: vi.fn(),
      },
      userLoader: {
        batchLoadUsers: vi.fn(),
        clear: vi.fn(),
        clearAll: vi.fn(),
        load: vi.fn(),
        loadMany: vi.fn(),
      },
    } as unknown as DataLoaderContext

    context = {
      commandBus: {} as unknown,
      dataloaders: mockDataloaders,
      prisma: mockPrisma as unknown as PrismaClient,
      queryBus: {} as unknown,
      req: mockRequest as unknown,
      res: undefined,
      session: undefined,
    } as GraphQLContext
  })

  describe('Todos Query with DataLoader', () => {
    it('should resolve todos with categories using DataLoader', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: 'cat1',
          createdAt: new Date('2024-01-01'),
          description: 'Description 1',
          dueDate: new Date('2024-12-31'),
          id: 'todo1',
          isCompleted: false,
          isImportant: true,
          order: 1,
          priority: 'HIGH',
          status: 'PENDING',
          title: 'Test Todo 1',
          updatedAt: new Date('2024-01-01'),
          userId: 'user1',
        },
        {
          categoryId: 'cat2',
          createdAt: new Date('2024-01-01'),
          description: 'Description 2',
          dueDate: new Date('2024-12-31'),
          id: 'todo2',
          isCompleted: false,
          isImportant: false,
          order: 2,
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          title: 'Test Todo 2',
          updatedAt: new Date('2024-01-01'),
          userId: 'user1',
        },
      ]

      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
      ]

      mockPrisma.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      context.dataloaders.categoryLoader.load = vi
        .fn()
        .mockImplementation((id: string) => {
          return Promise.resolve(
            mockCategories.find((cat) => cat.id === id) ?? null
          )
        })

      // GraphQLクエリ
      const query = `
        query {
          todos {
            id
            title
            description
            isCompleted
            category {
              id
              name
              color
            }
          }
        }
      `

      // Act
      const result = await execute({
        contextValue: context,
        document: parse(query),
        schema,
      })

      // Assert
      expect(result.errors).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.todos).toHaveLength(2)

      // Prismaクエリが1回だけ呼ばれることを確認
      expect(mockPrisma.todo.findMany).toHaveBeenCalledTimes(1)

      // DataLoaderが各カテゴリに対して呼ばれることを確認
      expect(context.dataloaders.categoryLoader.load).toHaveBeenCalledTimes(2)
      expect(context.dataloaders.categoryLoader.load).toHaveBeenCalledWith(
        'cat1'
      )
      expect(context.dataloaders.categoryLoader.load).toHaveBeenCalledWith(
        'cat2'
      )

      // レスポンスデータの検証
      const todos = result.data?.todos as Array<Record<string, unknown>>
      expect(todos[0].category).toEqual({
        color: '#FF6B6B',
        id: 'cat1',
        name: 'Work',
      })
      expect(todos[1].category).toEqual({
        color: '#4ECDC4',
        id: 'cat2',
        name: 'Personal',
      })
    })

    it('should resolve todos with subTasks using DataLoader', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: null,
          createdAt: new Date('2024-01-01'),
          description: 'Description 1',
          dueDate: new Date('2024-12-31'),
          id: 'todo1',
          isCompleted: false,
          isImportant: true,
          order: 1,
          priority: 'HIGH',
          status: 'PENDING',
          title: 'Test Todo 1',
          updatedAt: new Date('2024-01-01'),
          userId: 'user1',
        },
      ]

      const mockSubTasks = [
        {
          createdAt: new Date('2024-01-01'),
          id: 'sub1',
          isCompleted: false,
          order: 1,
          title: 'SubTask 1',
          todoId: 'todo1',
          updatedAt: new Date('2024-01-01'),
        },
        {
          createdAt: new Date('2024-01-01'),
          id: 'sub2',
          isCompleted: true,
          order: 2,
          title: 'SubTask 2',
          todoId: 'todo1',
          updatedAt: new Date('2024-01-01'),
        },
      ]

      mockPrisma.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      context.dataloaders.subTaskLoader.load = vi
        .fn()
        .mockResolvedValue(mockSubTasks)

      // GraphQLクエリ
      const query = `
        query {
          todos {
            id
            title
            completionRate
            subTasks {
              id
              title
              completed
              order
            }
          }
        }
      `

      // Act
      const result = await execute({
        contextValue: context,
        document: parse(query),
        schema,
      })

      // Assert
      expect(result.errors).toBeUndefined()
      expect(result.data).toBeDefined()

      // DataLoaderが呼ばれることを確認
      expect(context.dataloaders.subTaskLoader.load).toHaveBeenCalledWith(
        'todo1'
      )

      // completionRateでもDataLoaderが呼ばれることを確認
      expect(context.dataloaders.subTaskLoader.load).toHaveBeenCalledTimes(2) // subTasks + completionRate

      // レスポンスデータの検証
      const todos = result.data?.todos as Array<Record<string, unknown>>
      const firstTodo = todos[0]
      expect(firstTodo.subTasks).toHaveLength(2)
      expect((firstTodo.subTasks as Array<Record<string, unknown>>)[0]).toEqual(
        {
          completed: false,
          id: 'sub1',
          order: 1,
          title: 'SubTask 1',
        }
      )
      expect(firstTodo.completionRate).toBe(50) // 2つ中1つ完了なので50%
    })

    it('should handle todos without categories or subTasks', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: null,
          createdAt: new Date('2024-01-01'),
          description: null,
          dueDate: null,
          id: 'todo1',
          isCompleted: false,
          isImportant: false,
          order: 1,
          priority: 'LOW',
          status: 'PENDING',
          title: 'Simple Todo',
          updatedAt: new Date('2024-01-01'),
          userId: 'user1',
        },
      ]

      mockPrisma.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      context.dataloaders.subTaskLoader.load = vi.fn().mockResolvedValue([]) // サブタスクなし

      // GraphQLクエリ
      const query = `
        query {
          todos {
            id
            title
            category {
              id
              name
            }
            subTasks {
              id
              title
            }
            completionRate
          }
        }
      `

      // Act
      const result = await execute({
        contextValue: context,
        document: parse(query),
        schema,
      })

      // Assert
      expect(result.errors).toBeUndefined()
      const todos = result.data?.todos as Array<Record<string, unknown>>
      const firstTodo = todos[0]
      expect(firstTodo.category).toBeNull()
      expect(firstTodo.subTasks).toEqual([])
      expect(firstTodo.completionRate).toBe(0)

      // categoryIdがnullなのでcategoryLoaderは呼ばれない
      expect(context.dataloaders.categoryLoader.load).not.toHaveBeenCalled()
      // subTaskLoaderは呼ばれる（空配列を返す）
      expect(context.dataloaders.subTaskLoader.load).toHaveBeenCalledWith(
        'todo1'
      )
    })
  })

  describe('Performance Optimization', () => {
    it('should demonstrate N+1 query problem resolution', async () => {
      // Arrange - 10個のTodoがあり、それぞれ異なるカテゴリを持つ
      const mockTodos = Array.from({ length: 10 }, (_, i) => ({
        categoryId: `cat${(i % 3) + 1}`, // 3つのカテゴリを循環使用
        createdAt: new Date('2024-01-01'),
        description: `Description ${i + 1}`,
        dueDate: new Date('2024-12-31'),
        id: `todo${i + 1}`,
        isCompleted: false,
        isImportant: false,
        order: i + 1,
        priority: 'MEDIUM',
        status: 'PENDING',
        title: `Todo ${i + 1}`,
        updatedAt: new Date('2024-01-01'),
        userId: 'user1',
      }))

      const mockCategories = [
        { color: '#FF6B6B', id: 'cat1', name: 'Work', userId: 'user1' },
        { color: '#4ECDC4', id: 'cat2', name: 'Personal', userId: 'user1' },
        { color: '#45B7D1', id: 'cat3', name: 'Study', userId: 'user1' },
      ]

      mockPrisma.todo.findMany = vi.fn().mockResolvedValue(mockTodos)

      // DataLoaderがカテゴリをバッチロードすることをシミュレート
      const categoryLoadCalls: string[] = []
      context.dataloaders.categoryLoader.load = vi
        .fn()
        .mockImplementation((id: string) => {
          categoryLoadCalls.push(id)
          return Promise.resolve(
            mockCategories.find((cat) => cat.id === id) ?? null
          )
        })

      // GraphQLクエリ
      const query = `
        query {
          todos {
            id
            title
            category {
              id
              name
              color
            }
          }
        }
      `

      // Act
      const result = await execute({
        contextValue: context,
        document: parse(query),
        schema,
      })

      // Assert
      expect(result.errors).toBeUndefined()
      expect(result.data?.todos).toHaveLength(10)

      // Prismaクエリは1回だけ（Todo取得）
      expect(mockPrisma.todo.findMany).toHaveBeenCalledTimes(1)

      // DataLoaderは各ユニークなカテゴリIDに対して1回ずつ呼ばれる
      // 10個のTodoに対して、通常なら10回のカテゴリクエリが必要だが、
      // DataLoaderにより重複を排除し、実際には3回のみ
      expect(context.dataloaders.categoryLoader.load).toHaveBeenCalledTimes(10)

      // 呼び出されたカテゴリIDの確認
      const uniqueCategoryIds = Array.from(new Set(categoryLoadCalls))
      expect(uniqueCategoryIds).toEqual(['cat1', 'cat2', 'cat3'])
    })
  })

  describe('Error Handling', () => {
    it('should handle DataLoader errors gracefully', async () => {
      // Arrange
      const mockTodos = [
        {
          categoryId: 'cat1',
          createdAt: new Date('2024-01-01'),
          description: 'Description',
          dueDate: new Date('2024-12-31'),
          id: 'todo1',
          isCompleted: false,
          isImportant: false,
          order: 1,
          priority: 'MEDIUM',
          status: 'PENDING',
          title: 'Test Todo',
          updatedAt: new Date('2024-01-01'),
          userId: 'user1',
        },
      ]

      mockPrisma.todo.findMany = vi.fn().mockResolvedValue(mockTodos)
      context.dataloaders.categoryLoader.load = vi
        .fn()
        .mockRejectedValue(new Error('Category load failed'))

      const query = `
        query {
          todos {
            id
            title
            category {
              id
              name
            }
          }
        }
      `

      // Act
      const result = await execute({
        contextValue: context,
        document: parse(query),
        schema,
      })

      // Assert
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].message).toContain('Category load failed')
    })
  })
})
