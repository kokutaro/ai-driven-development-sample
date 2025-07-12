import { beforeEach, describe, expect, it, vi } from 'vitest'

// apiClient をモック化
vi.mock('./api-client', () => {
  // APIClientError クラスのモック実装
  class APIClientError extends Error {
    public readonly response?: unknown
    public readonly status: number

    constructor(message: string, status: number, response?: unknown) {
      super(message)
      this.name = 'APIClientError'
      this.status = status
      this.response = response
    }
  }

  return {
    apiClient: {
      delete: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
    APIClientError: APIClientError,
  }
})

// モック化されたapiClientをインポート
import { apiClient, APIClientError } from './api-client'
import { type GetTodosParams, todoClient } from './todo-client'

import type { Todo, TodoListResponse, UpdateTodoApiData } from '@/types/todo'

const mockApiClient = apiClient as {
  delete: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
}

describe('todoClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTodo', () => {
    it('正常系: 有効なデータでTODOを作成できる', async () => {
      // Arrange
      const todoData: Partial<Todo> = {
        description: 'テスト用の説明',
        isImportant: false,
        title: 'テストタスク',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        description: 'テスト用の説明',
        id: 'todo_123',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'テストタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.post.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.createTodo(todoData)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 最小限のデータ（タイトルのみ）でTODOを作成できる', async () => {
      // Arrange
      const todoData: Partial<Todo> = {
        title: 'タイトルのみのタスク',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: 'todo_456',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'タイトルのみのタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.post.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.createTodo(todoData)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 全ての項目を含むデータでTODOを作成できる', async () => {
      // Arrange
      const todoData: Partial<Todo> = {
        categoryId: 'category_123',
        description: '詳細な説明',
        dueDate: new Date('2024-01-31T23:59:59.000Z'),
        isImportant: true,
        title: '完全なタスク',
      }

      const expectedTodo: Todo = {
        categoryId: 'category_123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        description: '詳細な説明',
        dueDate: new Date('2024-01-31T23:59:59.000Z'),
        id: 'todo_789',
        isCompleted: false,
        isImportant: true,
        order: 0,
        title: '完全なタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.post.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.createTodo(todoData)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
      expect(result).toEqual(expectedTodo)
    })

    it('異常系: APIエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const todoData: Partial<Todo> = {
        title: 'エラーケース',
      }

      const apiError = new APIClientError('バリデーションエラー', 400, {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: { title: 'タイトルは必須です' },
          message: 'バリデーションエラー',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.post.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.createTodo(todoData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
    })

    it('異常系: ネットワークエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const todoData: Partial<Todo> = {
        title: 'ネットワークエラーケース',
      }

      const networkError = new Error('Network Error')
      mockApiClient.post.mockRejectedValue(networkError)

      // Act & Assert
      await expect(todoClient.createTodo(todoData)).rejects.toThrow(
        'Network Error'
      )
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
    })

    it('異常系: 空のオブジェクトでTODO作成を試行してもAPIに送信される', async () => {
      // Arrange
      const todoData: Partial<Todo> = {}
      const apiError = new APIClientError('タイトルは必須です', 400)

      mockApiClient.post.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.createTodo(todoData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/todos', todoData)
    })
  })

  describe('deleteTodo', () => {
    it('正常系: 有効なIDでTODOを削除できる', async () => {
      // Arrange
      const todoId = 'todo_123'
      const expectedResponse = {
        deleted: true,
        id: todoId,
      }

      mockApiClient.delete.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.deleteTodo(todoId)

      // Assert
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: UUID形式のIDでTODOを削除できる', async () => {
      // Arrange
      const todoId = 'cuid_abcd1234efgh5678'
      const expectedResponse = {
        deleted: true,
        id: todoId,
      }

      mockApiClient.delete.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.deleteTodo(todoId)

      // Assert
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
      expect(result).toEqual(expectedResponse)
    })

    it('異常系: 存在しないIDでTODO削除を試行した場合は404エラーをスローする', async () => {
      // Arrange
      const todoId = 'non_existent_id'
      const apiError = new APIClientError('TODOが見つかりません', 404, {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'TODOが見つかりません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.deleteTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
    })

    it('異常系: 認証エラー（401）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const apiError = new APIClientError('認証が必要です', 401, {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.deleteTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
    })

    it('異常系: 権限エラー（403）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const apiError = new APIClientError('権限がありません', 403, {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: '権限がありません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.deleteTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
    })

    it('異常系: 空文字列のIDでTODO削除を試行してもAPIに送信される', async () => {
      // Arrange
      const todoId = ''
      const apiError = new APIClientError('不正なIDです', 400)

      mockApiClient.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.deleteTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/todos/')
    })

    it('異常系: ネットワークエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const networkError = new Error('Network Error')

      mockApiClient.delete.mockRejectedValue(networkError)

      // Act & Assert
      await expect(todoClient.deleteTodo(todoId)).rejects.toThrow(
        'Network Error'
      )
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/todos/${todoId}`)
    })
  })

  describe('getTodos', () => {
    it('正常系: パラメータなしでTODO一覧を取得できる', async () => {
      // Arrange
      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: [
          {
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            id: 'todo_123',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: 'テストタスク1',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos()

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', {})
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: 空のパラメータオブジェクトでTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {}
      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 0,
          totalPages: 0,
        },
        todos: [],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: フィルタ条件でTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        filter: 'important',
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: [
          {
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            id: 'todo_123',
            isCompleted: false,
            isImportant: true,
            order: 0,
            title: '重要なタスク',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: ページネーション条件でTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        limit: 10,
        page: 2,
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: true,
          limit: 10,
          page: 2,
          total: 15,
          totalPages: 2,
        },
        todos: [
          {
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            id: 'todo_456',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: 'ページ2のタスク',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: ソート条件でTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        sortBy: 'dueDate',
        sortOrder: 'asc',
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: [
          {
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            dueDate: new Date('2024-01-15T00:00:00.000Z'),
            id: 'todo_123',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: '期限が近いタスク',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: カテゴリIDでTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        categoryId: 'category_123',
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: [
          {
            categoryId: 'category_123',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            id: 'todo_123',
            isCompleted: false,
            isImportant: false,
            order: 0,
            title: '仕事のタスク',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: 全てのパラメータを指定してTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        categoryId: 'category_123',
        filter: 'today',
        limit: 20,
        page: 1,
        sortBy: 'title',
        sortOrder: 'desc',
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 20,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: [
          {
            categoryId: 'category_123',
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            dueDate: new Date('2024-01-01T23:59:59.000Z'),
            id: 'todo_123',
            isCompleted: false,
            isImportant: true,
            order: 0,
            title: '今日のタスク',
            updatedAt: new Date('2024-01-01T00:00:00.000Z'),
            userId: 'user_123',
          },
        ],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('正常系: undefinedの値を含むパラメータでTODO一覧を取得できる', async () => {
      // Arrange
      const params: GetTodosParams = {
        categoryId: undefined,
        filter: 'all',
        limit: undefined,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: undefined,
      }

      const expectedResponse: TodoListResponse = {
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 0,
          totalPages: 0,
        },
        todos: [],
      }

      mockApiClient.get.mockResolvedValue(expectedResponse)

      // Act
      const result = await todoClient.getTodos(params)

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
      expect(result).toEqual(expectedResponse)
    })

    it('異常系: 認証エラー（401）が発生した場合は例外をスローする', async () => {
      // Arrange
      const params: GetTodosParams = { filter: 'all' }
      const apiError = new APIClientError('認証が必要です', 401, {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.get.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.getTodos(params)).rejects.toThrow(APIClientError)
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
    })

    it('異常系: サーバーエラー（500）が発生した場合は例外をスローする', async () => {
      // Arrange
      const params: GetTodosParams = {}
      const apiError = new APIClientError('サーバーエラーが発生しました', 500, {
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.get.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.getTodos(params)).rejects.toThrow(APIClientError)
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
    })

    it('異常系: ネットワークエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const params: GetTodosParams = { filter: 'important' }
      const networkError = new Error('Network Error')

      mockApiClient.get.mockRejectedValue(networkError)

      // Act & Assert
      await expect(todoClient.getTodos(params)).rejects.toThrow('Network Error')
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/todos', params)
    })
  })

  describe('toggleTodo', () => {
    it('正常系: 有効なIDでTODOの完了状態を切り替えできる（未完了→完了）', async () => {
      // Arrange
      const todoId = 'todo_123'
      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: true,
        isImportant: false,
        order: 0,
        title: 'テストタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.patch.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.toggleTodo(todoId)

      // Assert
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 有効なIDでTODOの完了状態を切り替えできる（完了→未完了）', async () => {
      // Arrange
      const todoId = 'todo_456'
      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: true,
        order: 0,
        title: '完了済みタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.patch.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.toggleTodo(todoId)

      // Assert
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: UUID形式のIDでTODOの完了状態を切り替えできる', async () => {
      // Arrange
      const todoId = 'cuid_abcd1234efgh5678'
      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: true,
        isImportant: false,
        order: 0,
        title: 'UUIDタスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.patch.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.toggleTodo(todoId)

      // Assert
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
      expect(result).toEqual(expectedTodo)
    })

    it('異常系: 存在しないIDでTODO切り替えを試行した場合は404エラーをスローする', async () => {
      // Arrange
      const todoId = 'non_existent_id'
      const apiError = new APIClientError('TODOが見つかりません', 404, {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'TODOが見つかりません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.patch.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.toggleTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
    })

    it('異常系: 認証エラー（401）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const apiError = new APIClientError('認証が必要です', 401, {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.patch.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.toggleTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
    })

    it('異常系: 権限エラー（403）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const apiError = new APIClientError('権限がありません', 403, {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: '権限がありません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.patch.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.toggleTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
    })

    it('異常系: 空文字列のIDでTODO切り替えを試行してもAPIに送信される', async () => {
      // Arrange
      const todoId = ''
      const apiError = new APIClientError('不正なIDです', 400)

      mockApiClient.patch.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.toggleTodo(todoId)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/todos//toggle')
    })

    it('異常系: ネットワークエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const networkError = new Error('Network Error')

      mockApiClient.patch.mockRejectedValue(networkError)

      // Act & Assert
      await expect(todoClient.toggleTodo(todoId)).rejects.toThrow(
        'Network Error'
      )
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/todos/${todoId}/toggle`
      )
    })
  })

  describe('updateTodo', () => {
    it('正常系: 部分的なデータでTODOを更新できる', async () => {
      // Arrange
      const todoId = 'todo_123'
      const updateData: UpdateTodoApiData = {
        title: '更新されたタイトル',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        description: '既存の説明',
        id: todoId,
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '更新されたタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 完全なデータでTODOを更新できる', async () => {
      // Arrange
      const todoId = 'todo_456'
      const updateData: UpdateTodoApiData = {
        categoryId: 'category_456',
        description: '更新された説明',
        dueDate: '2024-01-31T23:59:59.000Z',
        isImportant: true,
        title: '完全更新タスク',
      }

      const expectedTodo: Todo = {
        categoryId: 'category_456',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        description: '更新された説明',
        dueDate: new Date('2024-01-31T23:59:59.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: true,
        order: 0,
        title: '完全更新タスク',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: タイトルのみを更新できる', async () => {
      // Arrange
      const todoId = 'todo_789'
      const updateData: UpdateTodoApiData = {
        title: 'タイトルのみ更新',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'タイトルのみ更新',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 説明のみを更新できる', async () => {
      // Arrange
      const todoId = 'todo_abc'
      const updateData: UpdateTodoApiData = {
        description: '説明のみ更新',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        description: '説明のみ更新',
        id: todoId,
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '既存のタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 期限日のみを更新できる', async () => {
      // Arrange
      const todoId = 'todo_def'
      const updateData: UpdateTodoApiData = {
        dueDate: '2024-02-15T23:59:59.000Z',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        dueDate: new Date('2024-02-15T23:59:59.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '既存のタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: 重要度フラグのみを更新できる', async () => {
      // Arrange
      const todoId = 'todo_ghi'
      const updateData: UpdateTodoApiData = {
        isImportant: true,
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: true,
        order: 0,
        title: '既存のタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: カテゴリIDのみを更新できる', async () => {
      // Arrange
      const todoId = 'todo_jkl'
      const updateData: UpdateTodoApiData = {
        categoryId: 'category_new',
      }

      const expectedTodo: Todo = {
        categoryId: 'category_new',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '既存のタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('正常系: undefinedの値を含む更新データでTODOを更新できる', async () => {
      // Arrange
      const todoId = 'todo_mno'
      const updateData: UpdateTodoApiData = {
        categoryId: undefined,
        description: undefined,
        dueDate: undefined,
        isImportant: true,
        title: '更新されたタイトル',
      }

      const expectedTodo: Todo = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        id: todoId,
        isCompleted: false,
        isImportant: true,
        order: 0,
        title: '更新されたタイトル',
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        userId: 'user_123',
      }

      mockApiClient.put.mockResolvedValue(expectedTodo)

      // Act
      const result = await todoClient.updateTodo(todoId, updateData)

      // Assert
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
      expect(result).toEqual(expectedTodo)
    })

    it('異常系: 存在しないIDでTODO更新を試行した場合は404エラーをスローする', async () => {
      // Arrange
      const todoId = 'non_existent_id'
      const updateData: UpdateTodoApiData = {
        title: '存在しないタスク',
      }

      const apiError = new APIClientError('TODOが見つかりません', 404, {
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'TODOが見つかりません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.put.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
    })

    it('異常系: バリデーションエラー（400）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const updateData: UpdateTodoApiData = {
        title: '', // 空のタイトル
      }

      const apiError = new APIClientError('バリデーションエラー', 400, {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: { title: 'タイトルは必須です' },
          message: 'バリデーションエラー',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.put.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
    })

    it('異常系: 認証エラー（401）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const updateData: UpdateTodoApiData = {
        title: '認証エラーケース',
      }

      const apiError = new APIClientError('認証が必要です', 401, {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.put.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
    })

    it('異常系: 権限エラー（403）が発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const updateData: UpdateTodoApiData = {
        title: '権限エラーケース',
      }

      const apiError = new APIClientError('権限がありません', 403, {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: '権限がありません',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      })

      mockApiClient.put.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
    })

    it('異常系: ネットワークエラーが発生した場合は例外をスローする', async () => {
      // Arrange
      const todoId = 'todo_123'
      const updateData: UpdateTodoApiData = {
        title: 'ネットワークエラーケース',
      }

      const networkError = new Error('Network Error')

      mockApiClient.put.mockRejectedValue(networkError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        'Network Error'
      )
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/todos/${todoId}`,
        updateData
      )
    })

    it('異常系: 空文字列のIDでTODO更新を試行してもAPIに送信される', async () => {
      // Arrange
      const todoId = ''
      const updateData: UpdateTodoApiData = {
        title: '空IDケース',
      }

      const apiError = new APIClientError('不正なIDです', 400)

      mockApiClient.put.mockRejectedValue(apiError)

      // Act & Assert
      await expect(todoClient.updateTodo(todoId, updateData)).rejects.toThrow(
        APIClientError
      )
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/todos/', updateData)
    })
  })

  describe('GetTodosParams型バリデーション', () => {
    it('GetTodosParams型: string型のパラメータを正しく処理する', () => {
      // Arrange & Act
      const params: GetTodosParams = {
        categoryId: 'category_123',
        filter: 'important',
        sortBy: 'title',
        sortOrder: 'asc',
      }

      // Assert
      expect(typeof params.filter).toBe('string')
      expect(typeof params.categoryId).toBe('string')
      expect(typeof params.sortBy).toBe('string')
      expect(typeof params.sortOrder).toBe('string')
    })

    it('GetTodosParams型: number型のパラメータを正しく処理する', () => {
      // Arrange & Act
      const params: GetTodosParams = {
        limit: 50,
        page: 1,
      }

      // Assert
      expect(typeof params.page).toBe('number')
      expect(typeof params.limit).toBe('number')
    })

    it('GetTodosParams型: undefined値を正しく処理する', () => {
      // Arrange & Act
      const params: GetTodosParams = {
        categoryId: undefined,
        filter: undefined,
        limit: undefined,
        page: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      }

      // Assert
      expect(params.filter).toBeUndefined()
      expect(params.categoryId).toBeUndefined()
      expect(params.page).toBeUndefined()
      expect(params.limit).toBeUndefined()
      expect(params.sortBy).toBeUndefined()
      expect(params.sortOrder).toBeUndefined()
    })

    it('GetTodosParams型: boolean型の追加プロパティを正しく処理する', () => {
      // Arrange & Act
      const params: GetTodosParams = {
        filter: 'all',
        includeCompleted: true,
        useCache: false,
      }

      // Assert
      expect(typeof params.filter).toBe('string')
      expect(typeof params.includeCompleted).toBe('boolean')
      expect(typeof params.useCache).toBe('boolean')
    })

    it('GetTodosParams型: 混合型のパラメータを正しく処理する', () => {
      // Arrange & Act
      const params: GetTodosParams = {
        booleanParam: true,
        customParam: 'custom_value',
        filter: 'today',
        includeArchived: false,
        numericParam: 100,
        page: 2,
      }

      // Assert
      expect(typeof params.filter).toBe('string')
      expect(typeof params.page).toBe('number')
      expect(typeof params.includeArchived).toBe('boolean')
      expect(typeof params.customParam).toBe('string')
      expect(typeof params.numericParam).toBe('number')
      expect(typeof params.booleanParam).toBe('boolean')
    })
  })
})
