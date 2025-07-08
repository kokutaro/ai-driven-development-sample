import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { completeTodo } from './todo-complete'
import type { CompleteTodoInput } from '../schemas/todo-mcp'

// モック設定
vi.mock('../lib/db', () => ({
  mcpPrisma: {
    todo: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../lib/auth', () => ({
  getUserId: vi.fn(),
}))

// モックのインポート
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

describe('completeTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should toggle todo from incomplete to complete successfully', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const todoId = 'todo-123'
    const existingTodo = {
      id: todoId,
      title: 'テストタスク',
      isCompleted: false,
      userId: mockUserId,
    }
    const updatedTodo = {
      id: todoId,
      title: 'テストタスク',
      description: 'テスト用の説明',
      dueDate: new Date('2024-01-31'),
      isImportant: false,
      isCompleted: true,
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

    const input: CompleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.update).mockResolvedValue(updatedTodo)

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(getUserId).toHaveBeenCalled()
    expect(mcpPrisma.todo.findUnique).toHaveBeenCalledWith({
      where: {
        id: todoId,
        userId: mockUserId,
      },
      select: {
        id: true,
        isCompleted: true,
      },
    })
    expect(mcpPrisma.todo.update).toHaveBeenCalledWith({
      where: {
        id: todoId,
      },
      data: {
        isCompleted: true,
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
    expect(result.content[0].text).toContain('TODO完了状態更新完了')
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).toContain('完了')
    expect(result.content[0].text).toContain(todoId)
    expect(result.isError).toBeUndefined()
  })

  it('should toggle todo from complete to incomplete successfully', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const todoId = 'todo-456'
    const existingTodo = {
      id: todoId,
      title: 'テストタスク',
      isCompleted: true,
      userId: mockUserId,
    }
    const updatedTodo = {
      id: todoId,
      title: 'テストタスク',
      description: 'テスト用の説明',
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

    const input: CompleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.update).mockResolvedValue(updatedTodo)

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(mcpPrisma.todo.update).toHaveBeenCalledWith({
      where: {
        id: todoId,
      },
      data: {
        isCompleted: false,
      },
      include: expect.any(Object),
    })

    expect(result.content[0].text).toContain('TODO完了状態更新完了')
    expect(result.content[0].text).toContain('未完了')
    expect(result.isError).toBeUndefined()
  })

  it('should handle authentication error', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const input: CompleteTodoInput = {
      id: 'todo-123',
    }

    vi.mocked(getUserId).mockRejectedValue(new Error('認証が必要です'))

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('認証エラー')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })

  it('should handle todo not found error', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const input: CompleteTodoInput = {
      id: 'non-existent-todo',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(null)

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODOが見つかりません')
    expect(result.isError).toBe(true)
  })

  it('should handle database error during find', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const input: CompleteTodoInput = {
      id: 'todo-123',
    }

    vi.mocked(getUserId).mockResolvedValue('user-1')
    vi.mocked(mcpPrisma.todo.findUnique).mockRejectedValue(new Error('Database connection error'))

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('Database connection error')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })

  it('should handle database error during update', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const mockUserId = 'user-1'
    const todoId = 'todo-123'
    const existingTodo = {
      id: todoId,
      title: 'テストタスク',
      isCompleted: false,
      userId: mockUserId,
    }

    const input: CompleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.update).mockRejectedValue(new Error('Update failed'))

    // Act
    const result = await completeTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('Update failed')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })
})