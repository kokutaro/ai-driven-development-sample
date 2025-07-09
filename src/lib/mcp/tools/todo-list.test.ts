import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listTodos } from './todo-list'

import type { ListTodosInput } from '../schemas/todo-mcp'

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

const mockPrisma = {
  todo: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
}

const mockGetCurrentUser = vi.fn()
const mockBuildFilterConditions = vi.fn()

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

  const mockTodos = [
    {
      category: {
        color: '#FF6B6B',
        id: 'cat-1',
        name: '仕事',
      },
      description: 'テスト用のタスクです',
      dueDate: new Date('2024-01-31'),
      id: 'todo-1',
      isCompleted: false,
      isImportant: true,
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
    },
    {
      category: undefined,
      description: undefined,
      dueDate: undefined,
      id: 'todo-2',
      isCompleted: true,
      isImportant: false,
      subTasks: [],
      title: 'テストタスク2',
    },
  ]

  it('正常なパラメータで TODO 一覧を取得できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findMany.mockResolvedValue(mockTodos)
    mockPrisma.todo.count.mockResolvedValue(2)

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
    mockBuildFilterConditions.mockReturnValue({ isImportant: true })
    mockPrisma.todo.findMany.mockResolvedValue([])
    mockPrisma.todo.count.mockResolvedValue(0)

    // Act
    await listTodos(paramsWithFilter)

    // Assert
    expect(mockPrisma.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'cat-1',
          isImportant: true,
          userId: mockUser.id,
        },
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
    mockPrisma.todo.findMany.mockResolvedValue([])
    mockPrisma.todo.count.mockResolvedValue(25)

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
    mockPrisma.todo.findMany.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })

  it('TODO が見つからない場合は適切なメッセージを表示', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findMany.mockResolvedValue([])
    mockPrisma.todo.count.mockResolvedValue(0)

    // Act
    const result = await listTodos(defaultParams)

    // Assert
    expect(result.content[0].text).toContain('TODOが見つかりませんでした')
  })
})
