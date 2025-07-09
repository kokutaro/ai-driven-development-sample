import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTodo } from './todo-create'

import type { CreateTodoInput } from '../schemas/todo-mcp'
import type { Todo } from '@prisma/client'

// モックの設定
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

const { prisma } = await import('@/lib/db')
const { getCurrentUser } = await import('@/lib/auth')

const mockPrismaCreate = vi.mocked(prisma.todo.create)
const mockGetCurrentUser = vi.mocked(getCurrentUser)

describe('createTodo', () => {
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

  const basicParams: CreateTodoInput = {
    description: 'テスト用のタスクです',
    isImportant: false,
    title: 'テストタスク',
  }

  const mockCreatedTodo = {
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
    isImportant: false,
    kanbanColumnId: null,
    order: 0,
    title: 'テストタスク',
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    userId: mockUser.id,
  } satisfies Todo & {
    category: null | { color: string; id: string; name: string }
  }

  it('基本的なパラメータで TODO を作成できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaCreate.mockResolvedValue(mockCreatedTodo as Todo)

    // Act
    const result = await createTodo(basicParams)

    // Assert
    expect(mockPrismaCreate).toHaveBeenCalledWith({
      data: {
        categoryId: undefined,
        description: 'テスト用のタスクです',
        dueDate: undefined,
        isImportant: false,
        title: 'テストタスク',
        userId: mockUser.id,
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
      },
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].text).toContain('TODOが作成されました')
    expect(result.content[0].text).toContain('テストタスク')
  })

  it('すべてのパラメータを指定して TODO を作成できる', async () => {
    // Arrange
    const fullParams: CreateTodoInput = {
      categoryId: 'cat-1',
      description: '全パラメータ指定のテスト',
      dueDate: '2024-01-31T23:59:59.000Z',
      isImportant: true,
      title: 'フルパラメータタスク',
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaCreate.mockResolvedValue({
      ...mockCreatedTodo,
      isImportant: true,
      title: 'フルパラメータタスク',
    } as Todo)

    // Act
    const result = await createTodo(fullParams)

    // Assert
    expect(mockPrismaCreate).toHaveBeenCalledWith({
      data: {
        categoryId: 'cat-1',
        description: '全パラメータ指定のテスト',
        dueDate: new Date('2024-01-31T23:59:59.000Z'),
        isImportant: true,
        title: 'フルパラメータタスク',
        userId: mockUser.id,
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
      },
    })
    expect(result.content[0].text).toContain('⭐')
    expect(result.content[0].text).toContain('[仕事]')
  })

  it('認証されていない場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(undefined)

    // Act
    const result = await createTodo(basicParams)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('認証エラー')
  })

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaCreate.mockRejectedValue(new Error('Database error'))

    // Act
    const result = await createTodo(basicParams)

    // Assert
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('エラー')
  })

  it('最小限のパラメータで TODO を作成できる', async () => {
    // Arrange
    const minimalParams: CreateTodoInput = {
      isImportant: false,
      title: 'ミニマルタスク',
    }

    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrismaCreate.mockResolvedValue({
      ...mockCreatedTodo,
      category: null,
      categoryId: null,
      description: null,
      dueDate: null,
      title: 'ミニマルタスク',
    } as Todo)

    // Act
    const result = await createTodo(minimalParams)

    // Assert
    expect(result.content[0].text).toContain('ミニマルタスク')
    expect(result.content[0].text).not.toContain('説明:')
    expect(result.content[0].text).not.toContain('期限:')
    expect(result.content[0].text).not.toContain('[')
  })
})
