import { NextRequest } from 'next/server'

import { PATCH } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getUserIdFromRequest: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const { getUserIdFromRequest } = await import('@/lib/auth')

// モック関数の型付け
const mockFindUnique = vi.mocked(prisma.todo.findUnique)
const mockUpdate = vi.mocked(prisma.todo.update)
const mockGetUserIdFromRequest = vi.mocked(getUserIdFromRequest)

describe('/api/todos/[id]/toggle', () => {
  const mockTodo = {
    categoryId: null,
    createdAt: new Date(),
    description: 'テスト説明',
    dueDate: null,
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    order: 0,
    title: 'テストタスク',
    updatedAt: new Date(),
    userId: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック設定
    mockGetUserIdFromRequest.mockResolvedValue('user-1')
  })

  describe('PATCH /api/todos/[id]/toggle', () => {
    it('未完了タスクを完了に切り替えられる', async () => {
      // Arrange
      const uncompletedTodo = { ...mockTodo, isCompleted: false }
      const completedTodo = { ...mockTodo, isCompleted: true }

      mockFindUnique.mockResolvedValue(uncompletedTodo)
      mockUpdate.mockResolvedValue(completedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isCompleted).toBe(true)
      const updateSpy = mockUpdate
      expect(updateSpy).toHaveBeenCalledWith({
        data: { isCompleted: true },
        where: { id: 'todo-1' },
      })
    })

    it('完了済みタスクを未完了に切り替えられる', async () => {
      // Arrange
      const completedTodo = { ...mockTodo, isCompleted: true }
      const uncompletedTodo = { ...mockTodo, isCompleted: false }

      mockFindUnique.mockResolvedValue(completedTodo)
      mockUpdate.mockResolvedValue(uncompletedTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isCompleted).toBe(false)
      const updateSpy = mockUpdate
      expect(updateSpy).toHaveBeenCalledWith({
        data: { isCompleted: false },
        where: { id: 'todo-1' },
      })
    })

    it('存在しないタスクの場合404を返す', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
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
        'http://localhost:3000/api/todos/todo-1/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetUserIdFromRequest.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('データベースエラーの場合500を返す', async () => {
      // Arrange
      mockFindUnique.mockResolvedValue(mockTodo)
      mockUpdate.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/toggle',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
    })
  })
})
