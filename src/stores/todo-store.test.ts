import { act, renderHook } from '@testing-library/react'

import { useTodoStore } from './todo-store'

import type { Todo } from '@/types/todo'

// APIクライアントのモック
vi.mock('@/lib/api/todo-client', () => ({
  todoClient: {
    createTodo: vi.fn(),
    deleteTodo: vi.fn(),
    getTodos: vi.fn(),
    toggleTodo: vi.fn(),
    updateTodo: vi.fn(),
  },
}))

// モックされたAPIクライアントの参照を取得
const { todoClient } = await import('@/lib/api/todo-client')
const mockTodoClient = vi.mocked(todoClient)

describe('useTodoStore', () => {
  beforeEach(() => {
    // ストアを初期状態にリセット
    useTodoStore.getState().reset()
    // モックをクリア
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('空のタスク配列が設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTodoStore())

      // Assert
      expect(result.current.todos).toEqual([])
    })

    it('ローディング状態がfalseに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTodoStore())

      // Assert
      expect(result.current.isLoading).toBe(false)
    })

    it('エラーがundefinedに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTodoStore())

      // Assert
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('fetchTodos', () => {
    it('ローディング状態を管理する', async () => {
      // Arrange
      const mockTodos: Todo[] = [
        {
          createdAt: new Date(),
          id: 'todo-1',
          isCompleted: false,
          isImportant: false,
          order: 0,
          title: 'テストタスク1',
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      mockTodoClient.getTodos.mockResolvedValue({
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 1,
          totalPages: 1,
        },
        todos: mockTodos,
      })
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.todos).toEqual(mockTodos)
      expect(result.current.error).toBeUndefined()
    })

    it('エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.getTodos.mockRejectedValue(new Error('API Error'))
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.todos).toEqual([])
      expect(result.current.error).toBe('API Error')
    })

    it('フィルタパラメータをAPIに渡す', async () => {
      // Arrange
      mockTodoClient.getTodos.mockResolvedValue({
        pagination: {
          hasNext: false,
          hasPrev: false,
          limit: 50,
          page: 1,
          total: 0,
          totalPages: 0,
        },
        todos: [],
      })
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos('important')
      })

      // Assert
      expect(mockTodoClient.getTodos).toHaveBeenCalledWith({
        filter: 'important',
      })
    })
  })

  describe('createTodo', () => {
    it('新しいタスクを作成してリストに追加する', async () => {
      // Arrange
      const newTodoData = {
        description: 'テスト説明',
        isImportant: false,
        title: '新しいタスク',
      }
      const createdTodo: Todo = {
        createdAt: new Date(),
        description: 'テスト説明',
        id: 'todo-new',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '新しいタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      mockTodoClient.createTodo.mockResolvedValue(createdTodo)
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.createTodo(newTodoData)
      })

      // Assert
      expect(result.current.todos).toContain(createdTodo)
      expect(result.current.error).toBeUndefined()
    })

    it('作成エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.createTodo.mockRejectedValue(new Error('API Error'))
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.createTodo({ title: 'テスト' })
      })

      // Assert
      expect(result.current.error).toBe('API Error')
    })
  })

  describe('updateTodo', () => {
    it('既存のタスクを更新する', async () => {
      // Arrange
      const existingTodo: Todo = {
        createdAt: new Date(),
        id: 'todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '元のタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const updatedTodo: Todo = {
        ...existingTodo,
        isImportant: true,
        title: '更新されたタスク',
      }
      mockTodoClient.updateTodo.mockResolvedValue(updatedTodo)
      const { result } = renderHook(() => useTodoStore())

      // 初期データを設定
      act(() => {
        useTodoStore.setState({ todos: [existingTodo] })
      })

      // Act
      await act(async () => {
        await result.current.updateTodo('todo-1', {
          isImportant: true,
          title: '更新されたタスク',
        })
      })

      // Assert
      expect(result.current.todos[0].title).toBe('更新されたタスク')
      expect(result.current.todos[0].isImportant).toBe(true)
    })
  })

  describe('deleteTodo', () => {
    it('タスクを削除する', async () => {
      // Arrange
      const todoToDelete: Todo = {
        createdAt: new Date(),
        id: 'todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '削除予定タスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      mockTodoClient.deleteTodo.mockResolvedValue({
        deleted: true,
        id: 'todo-1',
      })
      const { result } = renderHook(() => useTodoStore())

      // 初期データを設定
      act(() => {
        useTodoStore.setState({ todos: [todoToDelete] })
      })

      // Act
      await act(async () => {
        await result.current.deleteTodo('todo-1')
      })

      // Assert
      expect(result.current.todos).toHaveLength(0)
    })
  })

  describe('toggleTodo', () => {
    it('タスクの完了状態を切り替える', async () => {
      // Arrange
      const todoToToggle: Todo = {
        createdAt: new Date(),
        id: 'todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'トグル予定タスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const toggledTodo = { ...todoToToggle, isCompleted: true }
      mockTodoClient.toggleTodo.mockResolvedValue(toggledTodo)
      const { result } = renderHook(() => useTodoStore())

      // 初期データを設定
      act(() => {
        useTodoStore.setState({ todos: [todoToToggle] })
      })

      // Act
      await act(async () => {
        await result.current.toggleTodo('todo-1')
      })

      // Assert
      expect(result.current.todos[0].isCompleted).toBe(true)
    })
  })

  describe('clearError', () => {
    it('エラーをクリアする', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      // エラーを設定
      act(() => {
        useTodoStore.setState({ error: 'テストエラー' })
      })

      // Act
      act(() => {
        result.current.clearError()
      })

      // Assert
      expect(result.current.error).toBeUndefined()
    })
  })
})
