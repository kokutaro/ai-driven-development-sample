import { NextRequest } from 'next/server'

import { GET, POST } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  getUserIdFromRequest: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const { getCurrentUser, getUserIdFromRequest } = await import('@/lib/auth')

// モック関数の型付け
const mockCount = vi.mocked(prisma.todo.count)
const mockCreate = vi.mocked(prisma.todo.create)
const mockFindMany = vi.mocked(prisma.todo.findMany)
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockGetUserIdFromRequest = vi.mocked(getUserIdFromRequest)

describe('/api/todos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック設定
    mockGetCurrentUser.mockResolvedValue({
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'user-1',
      name: 'Test User',
      updatedAt: new Date(),
    })
    mockGetUserIdFromRequest.mockResolvedValue('user-1')
  })

  describe('GET /api/todos', () => {
    it('タスク一覧を正常に取得できる', async () => {
      // Arrange
      const mockTodos = [
        {
          category: null,
          categoryId: null,
          createdAt: new Date(),
          description: 'テスト説明1',
          dueDate: null,
          id: 'todo-1',
          isCompleted: false,
          isImportant: false,
          order: 0,
          subTasks: [],
          title: 'テストタスク1',
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          category: null,
          categoryId: null,
          createdAt: new Date(),
          description: null,
          dueDate: new Date(),
          id: 'todo-2',
          isCompleted: false,
          isImportant: true,
          order: 1,
          subTasks: [],
          title: 'テストタスク2',
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockFindMany.mockResolvedValue(mockTodos)
      mockCount.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/todos')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.todos).toHaveLength(2)
      expect(data.data.todos[0].title).toBe('テストタスク1')
      expect(data.data.pagination.total).toBe(2)
    })

    it('フィルタパラメータを正しく処理できる', async () => {
      // Arrange
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const request = new NextRequest(
        'http://localhost:3000/api/todos?filter=important&sortBy=dueDate&sortOrder=asc'
      )

      // Act
      const response = await GET(request)

      // Assert
      expect(response.status).toBe(200)
      const findManySpy = mockFindMany
      expect(findManySpy).toHaveBeenCalledWith({
        include: {
          category: {
            select: {
              color: true,
              id: true,
              name: true,
            },
          },
          subTasks: {
            orderBy: {
              order: 'asc',
            },
            select: {
              id: true,
              isCompleted: true,
              title: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        skip: 0,
        take: 50,
        where: {
          isCompleted: false,
          isImportant: true,
          userId: 'user-1',
        },
      })
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetCurrentUser.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/todos')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('データベースエラーの場合500を返す', async () => {
      // Arrange
      mockFindMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/todos')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })

  describe('POST /api/todos', () => {
    it('新しいタスクを正常に作成できる', async () => {
      // Arrange
      const newTodoData = {
        description: 'テスト説明',
        isImportant: false,
        title: '新しいタスク',
      }

      const createdTodo = {
        category: null,
        categoryId: null,
        createdAt: new Date(),
        description: 'テスト説明',
        dueDate: null,
        id: 'todo-new',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '新しいタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockCreate.mockResolvedValue(createdTodo)

      const request = new NextRequest('http://localhost:3000/api/todos', {
        body: JSON.stringify(newTodoData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('新しいタスク')
      expect(data.data.userId).toBe('user-1')
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        description: 'a'.repeat(1001), // 長すぎる説明
        title: '', // 必須項目が空
      }

      const request = new NextRequest('http://localhost:3000/api/todos', {
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetUserIdFromRequest.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost:3000/api/todos', {
        body: JSON.stringify({ title: 'テスト' }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
