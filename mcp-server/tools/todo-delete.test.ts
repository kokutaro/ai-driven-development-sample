import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { deleteTodo } from './todo-delete'
import type { DeleteTodoInput } from '../schemas/todo-mcp'

// モック設定
vi.mock('../lib/db', () => ({
  mcpPrisma: {
    todo: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../lib/auth', () => ({
  getUserId: vi.fn(),
}))

// モックのインポート
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

describe('deleteTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should delete todo successfully', async () => {
    // Arrange
    const mockUserId = 'user-1'
    const todoId = 'todo-123'
    const existingTodo = {
      id: todoId,
      title: 'テストタスク',
      description: 'テスト用の説明',
      dueDate: new Date('2024-01-31'),
      isImportant: false,
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

    const input: DeleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.delete).mockResolvedValue(existingTodo)

    // Act
    const result = await deleteTodo(input)

    // Assert
    expect(getUserId).toHaveBeenCalled()
    expect(mcpPrisma.todo.findUnique).toHaveBeenCalledWith({
      where: {
        id: todoId,
        userId: mockUserId,
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
    expect(mcpPrisma.todo.delete).toHaveBeenCalledWith({
      where: {
        id: todoId,
      },
    })

    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODO削除完了')
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).toContain(todoId)
    expect(result.isError).toBeUndefined()
  })

  it('should handle authentication error', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const input: DeleteTodoInput = {
      id: 'todo-123',
    }

    vi.mocked(getUserId).mockRejectedValue(new Error('認証が必要です'))

    // Act
    const result = await deleteTodo(input)

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
    const input: DeleteTodoInput = {
      id: 'non-existent-todo',
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(null)

    // Act
    const result = await deleteTodo(input)

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

    const input: DeleteTodoInput = {
      id: 'todo-123',
    }

    vi.mocked(getUserId).mockResolvedValue('user-1')
    vi.mocked(mcpPrisma.todo.findUnique).mockRejectedValue(new Error('Database connection error'))

    // Act
    const result = await deleteTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('Database connection error')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })

  it('should handle database error during delete', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const mockUserId = 'user-1'
    const todoId = 'todo-123'
    const existingTodo = {
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

    const input: DeleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.delete).mockRejectedValue(new Error('Delete failed'))

    // Act
    const result = await deleteTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('Delete failed')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })

  it('should handle foreign key constraint error', async () => {
    // Arrange - エラーログを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中のエラーログを抑制
    })

    const mockUserId = 'user-1'
    const todoId = 'todo-123'
    const existingTodo = {
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
      subTasks: [
        {
          id: 'subtask-1',
          title: 'サブタスク1',
          isCompleted: false,
        },
      ],
    }

    const input: DeleteTodoInput = {
      id: todoId,
    }

    vi.mocked(getUserId).mockResolvedValue(mockUserId)
    vi.mocked(mcpPrisma.todo.findUnique).mockResolvedValue(existingTodo)
    vi.mocked(mcpPrisma.todo.delete).mockRejectedValue(new Error('Foreign key constraint'))

    // Act
    const result = await deleteTodo(input)

    // Assert
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('データベースエラー: 関連するデータの制約により削除できませんでした。')
    expect(result.isError).toBe(true)

    // Cleanup
    consoleSpy.mockRestore()
  })
})