import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTodoStats } from './use-todo-stats'

import type { ApiResponse, TodoStats } from '@/types/api'

import { useClientOnly } from '@/hooks/use-client-only'
import { statsClient } from '@/lib/api/stats-client'
import { useTodoStore } from '@/stores/todo-store'

// モックの設定
vi.mock('@/lib/api/stats-client')
vi.mock('@/hooks/use-client-only')
vi.mock('@/stores/todo-store')

describe('useTodoStats', () => {
  const mockStats: TodoStats = {
    assignedCount: 5,
    completedCount: 3,
    importantCount: 2,
    todayCount: 1,
    totalCount: 10,
    upcomingCount: 4,
  }

  const mockSuccessResponse: ApiResponse<TodoStats> = {
    data: mockStats,
    success: true,
    timestamp: '2024-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useClientOnly).mockReturnValue(true)
    // デフォルトのTodoStoreモック
    vi.mocked(useTodoStore).mockReturnValue({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: vi.fn(),
      isLoading: false,
      reset: vi.fn(),
      todos: [],
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('正常に統計情報を取得する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    const { result } = renderHook(() => useTodoStats())

    // 初期状態はローディング
    expect(result.current.isLoading).toBe(true)
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })

    // データ取得完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.error).toBeUndefined()
    // 初回読み込み + todos配列の監視で2回呼ばれる
    expect(statsClient.getTodoStats).toHaveBeenCalledTimes(2)
  })

  it('APIエラーを適切に処理する', async () => {
    const mockErrorResponse: ApiResponse<never> = {
      data: null as never,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      },
      success: false,
      timestamp: '2024-01-01T00:00:00.000Z',
    }

    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockErrorResponse)

    const { result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('認証が必要です')
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })
  })

  it('ネットワークエラーを適切に処理する', async () => {
    vi.mocked(statsClient.getTodoStats).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('統計情報の取得に失敗しました')
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })
  })

  it('クライアントサイドでない場合は何もしない', async () => {
    // useClientOnly を false にモック
    vi.mocked(useClientOnly).mockReturnValue(false)

    const { result } = renderHook(() => useTodoStats())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })
    expect(result.current.error).toBeUndefined()
    expect(statsClient.getTodoStats).not.toHaveBeenCalled()
  })

  it('統計情報を再取得する機能を提供する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    const { result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 再取得を実行
    result.current.refetch()

    await waitFor(() => {
      // 初回(2回) + 手動refetch(1回) = 3回
      expect(statsClient.getTodoStats).toHaveBeenCalledTimes(3)
    })
  })

  it('TODO操作時に統計情報を自動更新する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    let todoList: {
      createdAt: Date
      id: string
      isCompleted: boolean
      isImportant: boolean
      order: number
      title: string
      updatedAt: Date
      userId: string
    }[] = []

    const todoLoading = false

    // 動的にtodosを変更できるモック
    vi.mocked(useTodoStore).mockImplementation(() => ({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: vi.fn(),
      isLoading: todoLoading,
      reset: vi.fn(),
      todos: todoList,
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    }))

    const { rerender, result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 初回取得確認 (初回読み込み + todos配列の監視で2回呼ばれる)
    expect(statsClient.getTodoStats).toHaveBeenCalledTimes(2)

    // TODO操作をシミュレート（新しいTODOを追加）
    todoList = [
      {
        createdAt: new Date(),
        id: 'todo1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'Test Todo',
        updatedAt: new Date(),
        userId: 'user1',
      },
    ]

    // rerenderでtodosの変更を反映
    rerender()

    await waitFor(() => {
      expect(statsClient.getTodoStats).toHaveBeenCalledTimes(3)
    })
  })

  it('TODO削除時に統計情報を自動更新する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    let todoList = [
      {
        createdAt: new Date(),
        id: 'todo1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'Test Todo 1',
        updatedAt: new Date(),
        userId: 'user1',
      },
      {
        createdAt: new Date(),
        id: 'todo2',
        isCompleted: true,
        isImportant: true,
        order: 1,
        title: 'Test Todo 2',
        updatedAt: new Date(),
        userId: 'user1',
      },
    ]

    vi.mocked(useTodoStore).mockImplementation(() => ({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: vi.fn(),
      isLoading: false,
      reset: vi.fn(),
      todos: todoList,
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    }))

    const { rerender, result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 初回取得確認
    expect(statsClient.getTodoStats).toHaveBeenCalledTimes(2)

    // TODO削除をシミュレート
    todoList = todoList.filter((todo) => todo.id !== 'todo1')
    rerender()

    await waitFor(() => {
      expect(statsClient.getTodoStats).toHaveBeenCalledTimes(3)
    })
  })

  it('TODO完了状態切り替え時に統計情報を自動更新する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    let todoList = [
      {
        createdAt: new Date(),
        id: 'todo1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'Test Todo',
        updatedAt: new Date(),
        userId: 'user1',
      },
    ]

    vi.mocked(useTodoStore).mockImplementation(() => ({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: vi.fn(),
      isLoading: false,
      reset: vi.fn(),
      todos: todoList,
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    }))

    const { rerender, result } = renderHook(() => useTodoStats())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 初回取得確認
    expect(statsClient.getTodoStats).toHaveBeenCalledTimes(2)

    // TODO完了状態切り替えをシミュレート（新しい配列として作成）
    todoList = [{ ...todoList[0], isCompleted: true }]
    rerender()

    await waitFor(() => {
      expect(statsClient.getTodoStats).toHaveBeenCalledTimes(3)
    })
  })

  it('TODO読み込み完了時に統計情報を更新する', async () => {
    vi.mocked(statsClient.getTodoStats).mockResolvedValue(mockSuccessResponse)

    let todoLoading = true

    vi.mocked(useTodoStore).mockImplementation(() => ({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: vi.fn(),
      isLoading: todoLoading,
      reset: vi.fn(),
      todos: [],
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    }))

    const { rerender } = renderHook(() => useTodoStats())

    // TODO読み込み完了をシミュレート
    todoLoading = false
    rerender()

    // 読み込み完了後に統計情報が更新されることを確認
    await waitFor(() => {
      expect(statsClient.getTodoStats).toHaveBeenCalled()
    })
  })
})
