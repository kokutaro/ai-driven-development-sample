import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

// global fetchをモック化
const mockFetch = vi.fn()
global.fetch = mockFetch

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

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.getTodos.mockRejectedValue('Unknown error')
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('タスクの取得に失敗しました')
    })

    it('レスポンスのtodosがundefinedの場合は空配列を設定する', async () => {
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
        todos: undefined as unknown as Todo[],
      })
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos()
      })

      // Assert
      expect(result.current.todos).toEqual([])
    })

    it('無効なTODOデータをフィルタリングする', async () => {
      // Arrange
      const invalidTodos = [
        // 有効なTODO
        {
          createdAt: new Date(),
          id: 'todo-1',
          isCompleted: false,
          isImportant: false,
          order: 0,
          title: '有効なタスク',
          updatedAt: new Date(),
          userId: 'user-1',
        },
        // 無効なTODO（idがない）
        {
          createdAt: new Date(),
          isCompleted: false,
          isImportant: false,
          order: 0,
          title: '無効なタスク1',
          updatedAt: new Date(),
          userId: 'user-1',
        },
        // 無効なTODO（titleがない）
        {
          createdAt: new Date(),
          id: 'todo-3',
          isCompleted: false,
          isImportant: false,
          order: 0,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        // nullオブジェクト
        null,
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
        todos: invalidTodos as Todo[],
      })
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.fetchTodos()
      })

      // Assert - 有効なTODOのみが残る
      expect(result.current.todos).toHaveLength(1)
      expect(result.current.todos[0].title).toBe('有効なタスク')
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
      expect(result.current.isLoading).toBe(false)
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
      expect(result.current.isLoading).toBe(false)
    })

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.createTodo.mockRejectedValue('Unknown error')
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.createTodo({ title: 'テスト' })
      })

      // Assert
      expect(result.current.error).toBe('タスクの作成に失敗しました')
      expect(result.current.isLoading).toBe(false)
    })

    it('無効なTODOデータが返された場合はエラーを投げる', async () => {
      // Arrange
      const invalidTodo = {
        // idとtitleが不正
        description: 'テスト説明',
      }
      mockTodoClient.createTodo.mockResolvedValue(invalidTodo as Todo)
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.createTodo({ title: 'テスト' })
      })

      // Assert
      expect(result.current.error).toBe('APIから無効なtodoデータが返されました')
      expect(result.current.isLoading).toBe(false)
    })

    it('作成したTODOがリストの先頭に追加される', async () => {
      // Arrange
      const existingTodo: Todo = {
        createdAt: new Date(),
        id: 'todo-existing',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '既存のタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const newTodo: Todo = {
        createdAt: new Date(),
        id: 'todo-new',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '新しいタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      mockTodoClient.createTodo.mockResolvedValue(newTodo)
      const { result } = renderHook(() => useTodoStore())

      // 既存のTODOを設定
      act(() => {
        useTodoStore.setState({ todos: [existingTodo] })
      })

      // Act
      await act(async () => {
        await result.current.createTodo({ title: '新しいタスク' })
      })

      // Assert - 新しいTODOが先頭に追加される
      expect(result.current.todos).toHaveLength(2)
      expect(result.current.todos[0].id).toBe('todo-new')
      expect(result.current.todos[1].id).toBe('todo-existing')
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

    it('エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.updateTodo.mockRejectedValue(new Error('Update Error'))
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.updateTodo('todo-1', { title: '更新' })
      })

      // Assert
      expect(result.current.error).toBe('Update Error')
    })

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.updateTodo.mockRejectedValue('Unknown error')
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.updateTodo('todo-1', { title: '更新' })
      })

      // Assert
      expect(result.current.error).toBe('タスクの更新に失敗しました')
    })

    it('無効なTODOデータが返された場合はエラーを投げる', async () => {
      // Arrange
      const invalidTodo = {
        // idとtitleが不正
        description: '更新された説明',
      }
      mockTodoClient.updateTodo.mockResolvedValue(invalidTodo as Todo)
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.updateTodo('todo-1', { title: '更新' })
      })

      // Assert
      expect(result.current.error).toBe('APIから無効なtodoデータが返されました')
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
      expect(result.current.isLoading).toBe(false)
    })

    it('複数のタスクから指定されたタスクのみを削除する', async () => {
      // Arrange
      const todo1: Todo = {
        createdAt: new Date(),
        id: 'todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: '削除予定タスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const todo2: Todo = {
        createdAt: new Date(),
        id: 'todo-2',
        isCompleted: false,
        isImportant: false,
        order: 1,
        title: '残すタスク',
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
        useTodoStore.setState({ todos: [todo1, todo2] })
      })

      // Act
      await act(async () => {
        await result.current.deleteTodo('todo-1')
      })

      // Assert
      expect(result.current.todos).toHaveLength(1)
      expect(result.current.todos[0].id).toBe('todo-2')
    })

    it('エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.deleteTodo.mockRejectedValue(new Error('Delete Error'))
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.deleteTodo('todo-1')
      })

      // Assert
      expect(result.current.error).toBe('Delete Error')
      expect(result.current.isLoading).toBe(false)
    })

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
      // Arrange
      mockTodoClient.deleteTodo.mockRejectedValue('Unknown error')
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.deleteTodo('todo-1')
      })

      // Assert
      expect(result.current.error).toBe('タスクの削除に失敗しました')
      expect(result.current.isLoading).toBe(false)
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

    it('存在しないタスクの場合は何もしない', async () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.toggleTodo('non-existent-id')
      })

      // Assert
      expect(mockTodoClient.toggleTodo).not.toHaveBeenCalled()
    })

    it('エラー時にエラーメッセージを設定する', async () => {
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
      mockTodoClient.toggleTodo.mockRejectedValue(new Error('Toggle Error'))
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
      expect(result.current.error).toBe('Toggle Error')
    })

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
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
      mockTodoClient.toggleTodo.mockRejectedValue('Unknown error')
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
      expect(result.current.error).toBe('タスクの状態更新に失敗しました')
    })
  })

  describe('moveToKanbanColumn', () => {
    beforeEach(() => {
      mockFetch.mockClear()
    })

    it('タスクをカンバンカラムに移動する', async () => {
      // Arrange
      const existingTodo: Todo = {
        createdAt: new Date(),
        id: 'todo-1',
        isCompleted: false,
        isImportant: false,
        kanbanColumnId: 'column-1',
        order: 0,
        title: '移動予定タスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const updatedTodo: Todo = {
        ...existingTodo,
        kanbanColumnId: 'column-2',
      }

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          data: updatedTodo,
        }),
        ok: true,
      } as unknown as Response)

      const { result } = renderHook(() => useTodoStore())

      // 初期データを設定
      act(() => {
        useTodoStore.setState({ todos: [existingTodo] })
      })

      // Act
      await act(async () => {
        await result.current.moveToKanbanColumn('todo-1', 'column-2')
      })

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/todo-1/move-to-column',
        {
          body: JSON.stringify({ kanbanColumnId: 'column-2' }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PATCH',
        }
      )
      expect(result.current.todos[0].kanbanColumnId).toBe('column-2')
    })

    it('レスポンスが不正な場合はエラーを投げる', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      } as Response)

      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.moveToKanbanColumn('todo-1', 'column-2')
      })

      // Assert
      expect(result.current.error).toBe('タスクの移動に失敗しました')
    })

    it('無効なTODOデータが返された場合はエラーを投げる', async () => {
      // Arrange
      const invalidTodo = {
        // idとtitleが不正
        kanbanColumnId: 'column-2',
      }

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          data: invalidTodo,
        }),
        ok: true,
      } as unknown as Response)

      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.moveToKanbanColumn('todo-1', 'column-2')
      })

      // Assert
      expect(result.current.error).toBe('APIから無効なtodoデータが返されました')
    })

    it('fetch エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network Error'))
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.moveToKanbanColumn('todo-1', 'column-2')
      })

      // Assert
      expect(result.current.error).toBe('Network Error')
    })

    it('Error以外のエラー時にデフォルトメッセージを設定する', async () => {
      // Arrange
      mockFetch.mockRejectedValue('Unknown error')
      const { result } = renderHook(() => useTodoStore())

      // Act
      await act(async () => {
        await result.current.moveToKanbanColumn('todo-1', 'column-2')
      })

      // Assert
      expect(result.current.error).toBe('タスクの移動に失敗しました')
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

  describe('reset', () => {
    it('すべての状態を初期値にリセットする', () => {
      // Arrange
      const { result } = renderHook(() => useTodoStore())
      // 状態を変更
      act(() => {
        useTodoStore.setState({
          error: 'テストエラー',
          isLoading: true,
          todos: [
            {
              createdAt: new Date(),
              id: 'todo-1',
              isCompleted: false,
              isImportant: false,
              order: 0,
              title: 'テストタスク',
              updatedAt: new Date(),
              userId: 'user-1',
            },
          ],
        })
      })

      // Act
      act(() => {
        result.current.reset()
      })

      // Assert
      expect(result.current.todos).toEqual([])
      expect(result.current.error).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })
  })
})
