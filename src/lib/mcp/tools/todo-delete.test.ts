import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteTodo } from './todo-delete'

import type { DeleteTodoInput } from '../schemas/todo-mcp'

// モックの設定
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

const mockPrisma = {
  todo: {
    delete: vi.fn(),
    findFirst: vi.fn(),
  },
}

const mockGetCurrentUser = vi.fn()

describe('deleteTodo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    createdAt: new Date(),
    email: 'test@example.com',
    id: 'user-1',
    name: 'Test User',
    updatedAt: new Date(),
  }

  const params: DeleteTodoInput = {
    id: 'todo-1',
  }

  const mockTodo = {
    category: {
      name: '仕事',
    },
    id: 'todo-1',
    subTasks: [
      { id: 'sub-1', title: 'サブタスク1' },
      { id: 'sub-2', title: 'サブタスク2' },
    ],
    title: 'テストタスク',
  }

  it('TODO を正常に削除できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(mockTodo)
    mockPrisma.todo.delete.mockResolvedValue(mockTodo)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(mockPrisma.todo.findFirst).toHaveBeenCalledWith({
      include: {
        category: {
          select: {
            name: true,
          },
        },
        subTasks: true,
      },
      where: {
        id: 'todo-1',
        userId: mockUser.id,
      },
    })
    expect(mockPrisma.todo.delete).toHaveBeenCalledWith({
      where: {
        id: 'todo-1',
      },
    })
    expect(result.content[0].text).toContain('TODOが削除されました')
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).toContain('[仕事]')
    expect(result.content[0].text).toContain('サブタスク 2 件も削除されました')
  })

  it('サブタスクなしの TODO を削除できる', async () => {
    // Arrange
    const todoWithoutSubTasks = {
      ...mockTodo,
      subTasks: [],
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(todoWithoutSubTasks)
    mockPrisma.todo.delete.mockResolvedValue(todoWithoutSubTasks)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.content[0].text).toContain('削除されました')
    expect(result.content[0].text).not.toContain('サブタスク')
  })

  it('カテゴリなしの TODO を削除できる', async () => {
    // Arrange
    const todoWithoutCategory = {
      ...mockTodo,
      category: null,
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(todoWithoutCategory)
    mockPrisma.todo.delete.mockResolvedValue(todoWithoutCategory)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).not.toContain('[')
  })

  it('認証されていない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(undefined)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('認証エラー')
  })

  it('指定された TODO が見つからない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(null)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('指定されたTODOが見つかりません')
  })

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })

  it('削除操作が失敗した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(mockTodo)
    mockPrisma.todo.delete.mockRejectedValue(new Error('Delete failed'))

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })
})
