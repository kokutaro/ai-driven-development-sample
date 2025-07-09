import { beforeEach, describe, expect, it, vi } from 'vitest'

import { completeTodo } from './todo-complete'

import type { CompleteTodoInput } from '../schemas/todo-mcp'

// モックの設定
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

const mockPrisma = {
  todo: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}

const mockGetCurrentUser = vi.fn()

describe('completeTodo', () => {
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

  const params: CompleteTodoInput = {
    id: 'todo-1',
  }

  const mockTodo = {
    category: {
      name: '仕事',
    },
    id: 'todo-1',
    isCompleted: false,
    title: 'テストタスク',
  }

  it('未完了の TODO を完了にできる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(mockTodo)
    mockPrisma.todo.update.mockResolvedValue({
      ...mockTodo,
      isCompleted: true,
    })

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(mockPrisma.todo.findFirst).toHaveBeenCalledWith({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      where: {
        id: 'todo-1',
        userId: mockUser.id,
      },
    })
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      data: {
        isCompleted: true,
      },
      where: {
        id: 'todo-1',
      },
    })
    expect(result.content[0].text).toContain('完了')
    expect(result.content[0].text).toContain('✅')
  })

  it('完了済みの TODO を未完了にできる', async () => {
    // Arrange
    const completedTodo = {
      ...mockTodo,
      isCompleted: true,
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(completedTodo)
    mockPrisma.todo.update.mockResolvedValue({
      ...completedTodo,
      isCompleted: false,
    })

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      data: {
        isCompleted: false,
      },
      where: {
        id: 'todo-1',
      },
    })
    expect(result.content[0].text).toContain('未完了')
    expect(result.content[0].text).toContain('⬜')
  })

  it('認証されていない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(undefined)

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('認証エラー')
  })

  it('指定された TODO が見つからない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(null)

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('指定されたTODOが見つかりません')
  })

  it('カテゴリなしの TODO でも正常に動作する', async () => {
    // Arrange
    const todoWithoutCategory = {
      ...mockTodo,
      category: null,
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockResolvedValue(todoWithoutCategory)
    mockPrisma.todo.update.mockResolvedValue({
      ...todoWithoutCategory,
      isCompleted: true,
    })

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(result.content[0].text).toContain('テストタスク')
    expect(result.content[0].text).not.toContain('[')
  })

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.findFirst.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await completeTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })
})
