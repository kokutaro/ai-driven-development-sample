import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listTodos } from './todo-list'

import type { ListTodosInput } from '../schemas/todo-mcp'
import type { Todo } from '@prisma/client'

// モックの設定
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/todo-filters', () => ({
  buildFilterConditions: vi.fn(),
}))

const { prisma } = await import('@/lib/db')
const { getCurrentUser } = await import('@/lib/auth')
const { buildFilterConditions } = await import('@/lib/todo-filters')

const mockPrismaFindMany = vi.mocked(prisma.todo.findMany)
const mockPrismaCount = vi.mocked(prisma.todo.count)
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockBuildFilterConditions = vi.mocked(buildFilterConditions)

describe('listTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildFilterConditions.mockReturnValue({})
  })

  const defaultParams: ListTodosInput = {
    filter: 'all',
    limit: 20,
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }

  const mockUser = {
    createdAt: new Date(),
    email: 'test@example.com',
    id: 'user-1',
    name: 'Test User',
    updatedAt: new Date(),
  }

  const mockTodos: Array<
    Todo & {
      category: null | { color: string; id: string; name: string }
      subTasks: Array<{ id: string; isCompleted: boolean; title: string }>
    }
  > = [
    {
      category: {
        color: '#FF6B6B',
        id: 'cat-1',
        name: '仕事',
      },
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      description: 'テスト用のタスクです',
      dueDate: new Date('2024-01-31'),
      id: 'todo-1',
      isCompleted: false,
      isImportant: true,
      kanbanColumnId: null,
      order: 0,
      subTasks: [
        {
          id: 'sub-1',
          isCompleted: false,
          title: 'サブタスク1',
        },
        {
          id: 'sub-2',
          isCompleted: true,
          title: 'サブタスク2',
        },
      ],
      title: 'テストタスク1',
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      userId: mockUser.id,
    },
    {
      category: null,
      categoryId: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      description: null,
      dueDate: null,
      id: 'todo-2',
      isCompleted: true,
      isImportant: false,
      kanbanColumnId: null,
      order: 1,
      subTasks: [],
      title: 'テストタスク2',
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      userId: mockUser.id,
    },
  ]

  it('正常なパラメータで TODO 一覧を取得できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindMany.mockResolvedValue(mockTodos)
    mockPrismaCount.mockResolvedValue(2)

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODO一覧')
    expect(result.content[0].text).toContain('テストタスク1')
    expect(result.content[0].text).toContain('テストタスク2')
    expect(result.content[0].text).toContain('合計: 2件')
  })

  it('認証されていない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(undefined)

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('認証エラー')
  })

  it('フィルタ条件が正しく適用される', async () => {
    // Arrange
    const paramsWithFilter: ListTodosInput = {
      ...defaultParams,
      categoryId: 'cat-1',
      filter: 'important',
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockBuildFilterConditions.mockReturnValue({
      isCompleted: false,
      isImportant: true,
    })
    mockPrismaFindMany.mockResolvedValue([])
    mockPrismaCount.mockResolvedValue(0)

    // Act
    await listTodos(paramsWithFilter)

    // Assert
    expect(mockPrismaFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'cat-1',
          isImportant: true,
          userId: mockUser.id,
        }),
      })
    )
  })

  it('ページネーション情報が正しく計算される', async () => {
    // Arrange
    const paramsWithPagination: ListTodosInput = {
      ...defaultParams,
      limit: 10,
      page: 2,
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindMany.mockResolvedValue([])
    mockPrismaCount.mockResolvedValue(25)

    // Act
    const result = await listTodos(paramsWithPagination)

    // Assert
    expect(result.content[0].text).toContain('ページ: 2/3')
    expect(result.content[0].text).toContain('前のページ: 有')
    expect(result.content[0].text).toContain('次のページ: 有')
  })

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindMany.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })

  it('TODO が見つからない場合は適切なメッセージを表示', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindMany.mockResolvedValue([])
    mockPrismaCount.mockResolvedValue(0)

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.content[0].text).toContain('TODOが見つかりませんでした')
  })
})
