import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTodo } from './todo-create'

import type { CreateTodoInput } from '../schemas/todo-mcp'

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

const mockPrisma = {
  todo: {
    create: vi.fn(),
  },
}

const mockGetCurrentUser = vi.fn()

// モックされたモジュール関数を取得
vi.doMock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

vi.doMock('@/lib/auth', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

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
    description: 'テスト用のタスクです',
    dueDate: new Date('2024-01-31'),
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    title: 'テストタスク',
  }

  it('基本的なパラメータで TODO を作成できる', async () => {
    // Arrange
    mockGetCurrentUser.mockResolvedValue(mockUser)
    mockPrisma.todo.create.mockResolvedValue(mockCreatedTodo)

    // Act
    const result = await createTodo(basicParams)

    // Assert
    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
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
    mockPrisma.todo.create.mockResolvedValue({
      ...mockCreatedTodo,
      isImportant: true,
      title: 'フルパラメータタスク',
    })

    // Act
    const result = await createTodo(fullParams)

    // Assert
    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
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
    mockPrisma.todo.create.mockRejectedValue(new Error('Database error'))

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
    mockPrisma.todo.create.mockResolvedValue({
      ...mockCreatedTodo,
      category: undefined,
      description: undefined,
      dueDate: undefined,
      title: 'ミニマルタスク',
    })

    // Act
    const result = await createTodo(minimalParams)

    // Assert
    expect(result.content[0].text).toContain('ミニマルタスク')
    expect(result.content[0].text).not.toContain('説明:')
    expect(result.content[0].text).not.toContain('期限:')
    expect(result.content[0].text).not.toContain('[')
  })
})
