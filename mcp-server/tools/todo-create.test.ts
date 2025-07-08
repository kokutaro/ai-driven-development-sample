import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTodo } from './todo-create'
import type { CreateTodoInput } from '../schemas/todo-mcp'

// モック設定
vi.mock('../lib/db', () => ({
  mcpPrisma: {
    todo: {
      create: vi.fn(),
    },
  },
}))

vi.mock('../lib/auth', () => ({
  getUserId: vi.fn(),
}))

// モックのインポート
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

describe('createTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a todo successfully', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const mockTodo = {
      id: 'todo-123',
      title: 'テストタスク',
      description: 'テスト用の説明',
      dueDate: new Date('2024-01-31'),
      isImportant: true,
      isCompleted: false,
      categoryId: 'category-1',
      userId: mockUserId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'category-1',
        name: '仕事',
        color: '#FF6B6B',
      },
      subTasks: [],
    }

    const input: CreateTodoInput = {
      title: 'テストタスク',
      description: 'テスト用の説明',
      dueDate: '2024-01-31T23:59:59.000Z',
      isImportant: true,
      categoryId: 'category-1',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.create).mockResolvedValue(mockTodo)

    // Act
    const result = await createTodo(input)

    // Assert
    expect(getUserId).toHaveBeenCalled()
    expect(mcpPrisma.todo.create).toHaveBeenCalledWith({
      data: {
        title: 'テストタスク',
        description: 'テスト用の説明',
        dueDate: new Date('2024-01-31T23:59:59.000Z'),
        isImportant: true,
        isCompleted: false,
        categoryId: 'category-1',
        userId: mockUserId,
        order: 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODO作成完了')
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).toContain('todo-123')
    expect(result.isError).toBeUndefined()
  })

  it('should handle authentication error', async () => {
    // Arrange
    const input: CreateTodoInput = {
      title: 'テストタスク',
    }

    vi.mocked(getUserId).mockRejectedValue(new Error('認証が必要です'))

    // Act
    const result = await createTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('認証エラー')
    expect(result.isError).toBe(true)
  })

  it('should handle database error', async () => {
    // Arrange
    const input: CreateTodoInput = {
      title: 'テストタスク',
    }

    vi.mocked(getUserId).mockResolvedValue('user-1')
    vi.mocked(mcpPrisma.todo.create).mockRejectedValue(new Error('Database error'))

    // Act
    const result = await createTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('Database error')
    expect(result.isError).toBe(true)
  })

  it('should create todo with minimal input', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const mockTodo = {
      id: 'todo-456',
      title: 'シンプルなタスク',
      description: null,
      dueDate: null,
      isImportant: false,
      isCompleted: false,
      categoryId: null,
      userId: mockUserId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: null,
      subTasks: [],
    }

    const input: CreateTodoInput = {
      title: 'シンプルなタスク',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.create).mockResolvedValue(mockTodo)

    // Act
    const result = await createTodo(input)

    // Assert
    expect(mcpPrisma.todo.create).toHaveBeenCalledWith({
      data: {
        title: 'シンプルなタスク',
        description: null,
        dueDate: null,
        isImportant: false,
        isCompleted: false,
        categoryId: null,
        userId: mockUserId,
        order: 0,
      },
      include: expect.any(Object),
    })

    expect(result.content[0].text).toContain('シンプルなタスク')
    expect(result.isError).toBeUndefined()
  })
})