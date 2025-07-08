import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { listTodos } from './todo-list'
import type { ListTodosInput } from '../schemas/todo-mcp'

// モック設定
vi.mock('../lib/db', () => ({
  mcpPrisma: {
    todo: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../lib/auth', () => ({
  getUserId: vi.fn(),
}))

vi.mock('../lib/todo-filters', () => ({
  buildFilterConditions: vi.fn(),
  getFilterDisplayName: vi.fn(),
}))

// モックのインポート
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'
import { buildFilterConditions, getFilterDisplayName } from '../lib/todo-filters'

describe('listTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should list todos successfully', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const mockTodos = [
      {
        id: 'todo-1',
        title: 'タスク1',
        description: '説明1',
        dueDate: new Date('2024-01-31'),
        isImportant: true,
        isCompleted: false,
        category: {
          id: 'category-1',
          name: '仕事',
          color: '#FF6B6B',
        },
        subTasks: [
          {
            id: 'subtask-1',
            title: 'サブタスク1',
            isCompleted: true,
          },
        ],
      },
      {
        id: 'todo-2',
        title: 'タスク2',
        description: null,
        dueDate: null,
        isImportant: false,
        isCompleted: true,
        category: null,
        subTasks: [],
      },
    ]

    const input: ListTodosInput = {
      filter: 'all',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(buildFilterConditions).mockReturnValue({})
    vi.mocked(getFilterDisplayName).mockReturnValue('すべて')
    vi.mocked(mcpPrisma.todo.findMany).mockResolvedValue(mockTodos)
    vi.mocked(mcpPrisma.todo.count).mockResolvedValue(2)

    // Act
    const result = await listTodos(input)

    // Assert
    expect(getUserId).toHaveBeenCalled()
    expect(buildFilterConditions).toHaveBeenCalledWith('all')
    expect(getFilterDisplayName).toHaveBeenCalledWith('all')
    expect(mcpPrisma.todo.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 20,
    })
    expect(mcpPrisma.todo.count).toHaveBeenCalledWith({
      where: { userId: mockUserId },
    })

    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODO一覧')
    expect(result.content[0].text).toContain('タスク1')
    expect(result.content[0].text).toContain('タスク2')
    expect(result.content[0].text).toContain('合計: 2件')
    expect(result.isError).toBeUndefined()
  })

  it('should handle authentication error', async () => {
    // Arrange
    const input: ListTodosInput = {
      filter: 'all',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }

    vi.mocked(getUserId).mockRejectedValue(new Error('認証が必要です'))

    // Act
    const result = await listTodos(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('認証エラー')
    expect(result.isError).toBe(true)
  })

  it('should handle filter conditions correctly', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const mockFilterConditions = { isImportant: true, isCompleted: false }

    const input: ListTodosInput = {
      filter: 'important',
      categoryId: 'category-1',
      page: 2,
      limit: 10,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(buildFilterConditions).mockReturnValue(mockFilterConditions)
    vi.mocked(getFilterDisplayName).mockReturnValue('重要')
    vi.mocked(mcpPrisma.todo.findMany).mockResolvedValue([])
    vi.mocked(mcpPrisma.todo.count).mockResolvedValue(0)

    // Act
    const result = await listTodos(input)

    // Assert
    expect(mcpPrisma.todo.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        ...mockFilterConditions,
        categoryId: 'category-1',
      },
      include: expect.any(Object),
      orderBy: {
        dueDate: 'asc',
      },
      skip: 10, // (page 2 - 1) * limit 10
      take: 10,
    })

    expect(result.content[0].text).toContain('重要')
    expect(result.content[0].text).toContain('ページ: 2/0')
  })

  it('should show empty state when no todos found', async () => {
    // Arrange
    const mockUserId = 'user-1'

    const input: ListTodosInput = {
      filter: 'all',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(buildFilterConditions).mockReturnValue({})
    vi.mocked(getFilterDisplayName).mockReturnValue('すべて')
    vi.mocked(mcpPrisma.todo.findMany).mockResolvedValue([])
    vi.mocked(mcpPrisma.todo.count).mockResolvedValue(0)

    // Act
    const result = await listTodos(input)

    // Assert
    expect(result.content[0].text).toContain('TODOが見つかりませんでした')
    expect(result.content[0].text).toContain('合計: 0件')
  })

  it('should handle pagination correctly', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const mockTodos = [{ 
      id: 'todo-1', 
      title: 'タスク1',
      description: null,
      dueDate: null,
      isImportant: false,
      isCompleted: false,
      category: null,
      subTasks: []
    }] as any

    const input: ListTodosInput = {
      filter: 'all',
      page: 2,
      limit: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(buildFilterConditions).mockReturnValue({})
    vi.mocked(getFilterDisplayName).mockReturnValue('すべて')
    vi.mocked(mcpPrisma.todo.findMany).mockResolvedValue(mockTodos)
    vi.mocked(mcpPrisma.todo.count).mockResolvedValue(3)

    // Act
    const result = await listTodos(input)

    // Assert
    expect(result.content[0].text).toContain('ページ: 2/3')
    expect(result.content[0].text).toContain('前のページ: 有')
    expect(result.content[0].text).toContain('次のページ: 有')
  })
})