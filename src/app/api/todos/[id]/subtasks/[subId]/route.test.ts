import { NextRequest } from 'next/server'

import { DELETE, PATCH, PUT } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    subTask: {
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    todo: {
      findUnique: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getCurrentUserFromRequest: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const { getCurrentUserFromRequest } = await import('@/lib/auth')

// モック関数の型付け
const mockSubTaskFindUnique = vi.mocked(prisma.subTask.findUnique)
const mockSubTaskUpdate = vi.mocked(prisma.subTask.update)
const mockSubTaskDelete = vi.mocked(prisma.subTask.delete)
const _mockTodoFindUnique = vi.mocked(prisma.todo.findUnique)
const mockGetCurrentUserFromRequest = vi.mocked(getCurrentUserFromRequest)

describe('/api/todos/[id]/subtasks/[subId]', () => {
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

  const mockSubTask = {
    createdAt: new Date(),
    id: 'subtask-1',
    isCompleted: false,
    order: 0,
    title: 'テストサブタスク',
    todo: mockTodo, // include the todo relation
    todoId: 'todo-1',
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック設定
    mockGetCurrentUserFromRequest.mockResolvedValue({
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'user-1',
      name: 'Test User',
      updatedAt: new Date(),
    })
  })

  describe('PUT /api/todos/[id]/subtasks/[subId]', () => {
    it('サブタスクを正常に更新できる', async () => {
      // Arrange
      const updateData = {
        isCompleted: true,
        title: '更新されたサブタスク',
      }

      const updatedSubTask = {
        ...mockSubTask,
        isCompleted: true,
        title: '更新されたサブタスク',
      }

      mockSubTaskFindUnique.mockResolvedValue(mockSubTask)
      mockSubTaskUpdate.mockResolvedValue(updatedSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
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
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('更新されたサブタスク')
      expect(data.data.isCompleted).toBe(true)
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        title: '', // 必須項目が空
      }

      mockSubTaskFindUnique.mockResolvedValue(mockSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
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
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('存在しないサブタスクの場合404を返す', async () => {
      // Arrange
      const updateData = { title: '更新されたサブタスク' }
      mockSubTaskFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/nonexistent',
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
        params: Promise.resolve({ id: 'todo-1', subId: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのサブタスクの場合403を返す', async () => {
      // Arrange
      const updateData = { title: '更新されたサブタスク' }
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      const otherUserSubTask = { ...mockSubTask, todo: otherUserTodo }
      mockSubTaskFindUnique.mockResolvedValue(otherUserSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
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
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PATCH /api/todos/[id]/subtasks/[subId]/toggle', () => {
    it('未完了サブタスクを完了に切り替えられる', async () => {
      // Arrange
      const uncompletedSubTask = { ...mockSubTask, isCompleted: false }
      const completedSubTask = { ...mockSubTask, isCompleted: true }

      mockSubTaskFindUnique.mockResolvedValue(uncompletedSubTask)
      mockSubTaskUpdate.mockResolvedValue(completedSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isCompleted).toBe(true)
      const updateSpy = mockSubTaskUpdate
      expect(updateSpy).toHaveBeenCalledWith({
        data: { isCompleted: true },
        where: { id: 'subtask-1' },
      })
    })

    it('完了済みサブタスクを未完了に切り替えられる', async () => {
      // Arrange
      const completedSubTask = { ...mockSubTask, isCompleted: true }
      const uncompletedSubTask = { ...mockSubTask, isCompleted: false }

      mockSubTaskFindUnique.mockResolvedValue(completedSubTask)
      mockSubTaskUpdate.mockResolvedValue(uncompletedSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
        {
          method: 'PATCH',
        }
      )

      // Act
      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isCompleted).toBe(false)
      const updateSpy = mockSubTaskUpdate
      expect(updateSpy).toHaveBeenCalledWith({
        data: { isCompleted: false },
        where: { id: 'subtask-1' },
      })
    })
  })

  describe('DELETE /api/todos/[id]/subtasks/[subId]', () => {
    it('サブタスクを正常に削除できる', async () => {
      // Arrange
      mockSubTaskFindUnique.mockResolvedValue(mockSubTask)
      mockSubTaskDelete.mockResolvedValue(mockSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('subtask-1')
      expect(data.data.deleted).toBe(true)
    })

    it('存在しないサブタスクの場合404を返す', async () => {
      // Arrange
      mockSubTaskFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/nonexistent',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのサブタスクの場合403を返す', async () => {
      // Arrange
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      const otherUserSubTask = { ...mockSubTask, todo: otherUserTodo }
      mockSubTaskFindUnique.mockResolvedValue(otherUserSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetCurrentUserFromRequest.mockResolvedValue(undefined)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks/subtask-1',
        {
          method: 'DELETE',
        }
      )

      // Act
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'todo-1', subId: 'subtask-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
