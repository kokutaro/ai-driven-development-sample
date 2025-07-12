import { NextRequest } from 'next/server'

import { GET, POST } from './route'

// Prismaクライアントのモック
vi.mock('@/lib/db', () => ({
  prisma: {
    subTask: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    todo: {
      findUnique: vi.fn(),
    },
  },
}))

// Auth utilsのモック
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  getCurrentUserFromRequest: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  getUserIdFromRequestWithApiKey: vi.fn(),
}))

// モックされたモジュールのインポート
const { prisma } = await import('@/lib/db')
const {
  getCurrentUser,
  getCurrentUserFromRequest,
  getUserIdFromRequest,
  getUserIdFromRequestWithApiKey,
} = await import('@/lib/auth')

// モック関数の型付け
const mockSubTaskCreate = vi.mocked(prisma.subTask.create)
const mockSubTaskFindMany = vi.mocked(prisma.subTask.findMany)
const mockTodoFindUnique = vi.mocked(prisma.todo.findUnique)
const mockGetCurrentUser = vi.mocked(getCurrentUser)
const mockGetCurrentUserFromRequest = vi.mocked(getCurrentUserFromRequest)
const mockGetUserIdFromRequest = vi.mocked(getUserIdFromRequest)
const mockGetUserIdFromRequestWithApiKey = vi.mocked(
  getUserIdFromRequestWithApiKey
)

describe('/api/todos/[id]/subtasks', () => {
  const mockTodo = {
    categoryId: null,
    createdAt: new Date(),
    description: 'テスト説明',
    dueDate: null,
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    kanbanColumnId: null,
    order: 0,
    title: 'テストタスク',
    updatedAt: new Date(),
    userId: 'user-1',
  }

  const mockSubTasks = [
    {
      createdAt: new Date(),
      id: 'subtask-1',
      isCompleted: false,
      order: 0,
      title: 'サブタスク1',
      todoId: 'todo-1',
      updatedAt: new Date(),
    },
    {
      createdAt: new Date(),
      id: 'subtask-2',
      isCompleted: true,
      order: 1,
      title: 'サブタスク2',
      todoId: 'todo-1',
      updatedAt: new Date(),
    },
  ]

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
    mockGetCurrentUserFromRequest.mockResolvedValue({
      createdAt: new Date(),
      email: 'test@example.com',
      id: 'user-1',
      name: 'Test User',
      updatedAt: new Date(),
    })
    mockGetUserIdFromRequest.mockResolvedValue('user-1')
    mockGetUserIdFromRequestWithApiKey.mockResolvedValue('user-1')
  })

  describe('GET /api/todos/[id]/subtasks', () => {
    it('サブタスク一覧を正常に取得できる', async () => {
      // Arrange
      mockTodoFindUnique.mockResolvedValue(mockTodo)
      mockSubTaskFindMany.mockResolvedValue(mockSubTasks)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks'
      )

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].title).toBe('サブタスク1')
      expect(data.data[1].title).toBe('サブタスク2')
      const findManySpy = mockSubTaskFindMany
      expect(findManySpy).toHaveBeenCalledWith({
        orderBy: {
          order: 'asc',
        },
        where: {
          todoId: 'todo-1',
        },
      })
    })

    it('存在しないTODOの場合404を返す', async () => {
      // Arrange
      mockTodoFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent/subtasks'
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

    it('他のユーザーのTODOの場合403を返す', async () => {
      // Arrange
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      mockTodoFindUnique.mockResolvedValue(otherUserTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks'
      )

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

    it('認証エラーの場合401を返す', async () => {
      // Arrange
      mockGetCurrentUser.mockResolvedValue(undefined)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks'
      )

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/todos/[id]/subtasks', () => {
    it('新しいサブタスクを正常に作成できる', async () => {
      // Arrange
      const newSubTaskData = {
        title: '新しいサブタスク',
      }

      const createdSubTask = {
        createdAt: new Date(),
        id: 'subtask-new',
        isCompleted: false,
        order: 2,
        title: '新しいサブタスク',
        todoId: 'todo-1',
        updatedAt: new Date(),
      }

      mockTodoFindUnique.mockResolvedValue(mockTodo)
      mockSubTaskCreate.mockResolvedValue(createdSubTask)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks',
        {
          body: JSON.stringify(newSubTaskData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('新しいサブタスク')
      expect(data.data.todoId).toBe('todo-1')
      const createSpy = mockSubTaskCreate
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          isCompleted: false,
          title: '新しいサブタスク',
          todoId: 'todo-1',
        },
      })
    })

    it('バリデーションエラーの場合400を返す', async () => {
      // Arrange
      const invalidData = {
        title: '', // 必須項目が空
      }

      mockTodoFindUnique.mockResolvedValue(mockTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks',
        {
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('存在しないTODOの場合404を返す', async () => {
      // Arrange
      const newSubTaskData = {
        title: '新しいサブタスク',
      }

      mockTodoFindUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/nonexistent/subtasks',
        {
          body: JSON.stringify(newSubTaskData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ id: 'nonexistent' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })

    it('他のユーザーのTODOの場合403を返す', async () => {
      // Arrange
      const newSubTaskData = {
        title: '新しいサブタスク',
      }
      const otherUserTodo = { ...mockTodo, userId: 'other-user' }
      mockTodoFindUnique.mockResolvedValue(otherUserTodo)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks',
        {
          body: JSON.stringify(newSubTaskData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Act
      const response = await POST(request, {
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
      const newSubTaskData = {
        title: '新しいサブタスク',
      }
      mockGetCurrentUser.mockResolvedValue(undefined)

      const request = new NextRequest(
        'http://localhost:3000/api/todos/todo-1/subtasks',
        {
          body: JSON.stringify(newSubTaskData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Act
      const response = await POST(request, {
        params: Promise.resolve({ id: 'todo-1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })
})
