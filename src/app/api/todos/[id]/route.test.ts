import { NextRequest } from 'next/server'

import { DELETE, GET, PUT } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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
const mockFindUnique = vi.mocked(prisma.todo.findUnique)
const mockUpdate = vi.mocked(prisma.todo.update)
const mockDelete = vi.mocked(prisma.todo.delete)
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockGetUserIdFromRequest = vi.mocked(getUserIdFromRequest)

describe('/api/todos/[id]', () => {
  const mockTodo = {
    category: null,
    categoryId: null,
    createdAt: new Date(),
    description: 'テスト説明',
    dueDate: null,
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    kanbanColumnId: null,
    order: 0,
    reminders: [],
    subTasks: [],
    title: 'テストタスク',
    updatedAt: new Date(),
    userId: 'user-1',
  }

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

  describe('GET /api/todos/[id]', () => {
    it('タスク詳細を正常に取得できる', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockTodo)

      const request = new NextRequest('http://localhost:3000/api/todos/todo-1')

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('todo-1')
      expect(data.data.title).toBe('テストタスク')
    })

    it('存在しないタスクの場合404を返す', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent'
      )

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのタスクの場合403を返す', async () => {
      // Arrange
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      mockFindUnique.mockResolvedValue(otherUserTodo)

      const request = new NextRequest('http://localhost:3000/api/todos/todo-1')

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /api/todos/[id]', () => {
    it('タスクを正常に更新できる', async () => {
      // Arrange
      const updateData = {
        isImportant: true,
        title: '更新されたタスク',
      }

      const updatedTodo = {
        ...mockTodo,
        isImportant: true,
        title: '更新されたタスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('更新されたタスク')
      expect(data.data.isImportant).toBe(true)
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        title: '', // 必須項目が空
      }

      mockFindUnique.mockResolvedValue(mockTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('存在しないタスクの場合404を返す', async () => {
      // Arrange
      const updateData = { title: '更新されたタスク' }
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('DELETE /api/todos/[id]', () => {
    it('タスクを正常に削除できる', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockTodo)
      mockDelete.mockResolvedValue(mockTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('todo-1')
      expect(data.data.deleted).toBe(true)
    })

    it('存在しないタスクの場合404を返す', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのタスクの場合403を返す', async () => {
      // Arrange
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      mockFindUnique.mockResolvedValue(otherUserTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /api/todos/[id] - エッジケース', () => {
    it('空文字列のcategoryIdを正常に処理できる', async () => {
      // Arrange
      const updateData = {
        categoryId: '', // 空文字列
        title: 'カテゴリなしタスク',
      }

      const updatedTodo = {
        ...mockTodo,
        categoryId: null,
        title: 'カテゴリなしタスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('カテゴリなしタスク')
    })

    it('ISO形式の日付を正常に処理できる', async () => {
      // Arrange
      const dueDate = '2024-12-31T23:59:59.000Z'
      const updateData = {
        dueDate,
        title: '期限ありタスク',
      }

      const updatedTodo = {
        ...mockTodo,
        dueDate: new Date(dueDate),
        title: '期限ありタスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('期限ありタスク')
    })

    it('dueDateにundefinedを正常に処理できる', async () => {
      // Arrange
      const updateData = {
        dueDate: undefined,
        title: '期限なしタスク',
      }

      const updatedTodo = {
        ...mockTodo,
        dueDate: null,
        title: '期限なしタスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('期限なしタスク')
    })

    it('無効な日付形式の場合400を返す', async () => {
      // Arrange
      const updateData = {
        dueDate: 'invalid-date',
        title: '無効な日付タスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('無効なUUID形式のcategoryIdの場合400を返す', async () => {
      // Arrange
      const updateData = {
        categoryId: 'invalid-uuid',
        title: '無効なカテゴリタスク',
      }

      mockFindUnique.mockResolvedValue(mockTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('categoryIdにnullを正常に処理できる', async () => {
      // Arrange
      const updateData = {
        categoryId: null,
        title: 'カテゴリなしタスク（null）',
      }

      const updatedTodo = {
        ...mockTodo,
        categoryId: null,
        title: 'カテゴリなしタスク（null）',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('カテゴリなしタスク（null）')
    })

    it('dueDateにnullを正常に処理できる', async () => {
      // Arrange
      const updateData = {
        dueDate: null,
        title: '期限なしタスク（null）',
      }

      const updatedTodo = {
        ...mockTodo,
        dueDate: null,
        title: '期限なしタスク（null）',
      }

      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockResolvedValue(updatedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1',
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )

      // Act
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('期限なしタスク（null）')
    })
  })
})
