import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteTodo } from './todo-delete'

import type { DeleteTodoInput } from '../schemas/todo-mcp'
import type { Todo } from '@prisma/client'

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

const { prisma } = await import('@/lib/db')
const { getCurrentUser } = await import('@/lib/auth')

const mockPrismaFindFirst = vi.mocked(prisma.todo.findFirst)
const mockPrismaDelete = vi.mocked(prisma.todo.delete)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

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
    categoryId: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    description: null,
    dueDate: null,
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    kanbanColumnId: null,
    order: 0,
    subTasks: [
      { id: 'sub-1', isCompleted: false, title: 'サブタスク1' },
      { id: 'sub-2', isCompleted: false, title: 'サブタスク2' },
    ],
    title: 'テストタスク',
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    userId: mockUser.id,
  } satisfies Todo & {
    category: null | { name: string }
    subTasks: Array<{ id: string; isCompleted: boolean; title: string }>
  }

  it('TODO を正常に削除できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindFirst.mockResolvedValue(mockTodo)
    mockPrismaDelete.mockResolvedValue(mockTodo)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
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
    expect(mockPrismaDelete).toHaveBeenCalledWith({
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
    mockPrismaFindFirst.mockResolvedValue(todoWithoutSubTasks)
    mockPrismaDelete.mockResolvedValue(todoWithoutSubTasks)

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
    mockPrismaFindFirst.mockResolvedValue(todoWithoutCategory)
    mockPrismaDelete.mockResolvedValue(todoWithoutCategory)

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
    mockPrismaFindFirst.mockResolvedValue(null)

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('指定されたTODOが見つかりません')
  })

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindFirst.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })

  it('削除操作が失敗した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaFindFirst.mockResolvedValue(mockTodo)
    mockPrismaDelete.mockRejectedValue(new Error('Delete failed'))

    // Act
    const result = await deleteTodo(params)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })
})
