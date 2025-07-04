import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTodoStore } from '@/stores/todo-store'

/**
 * Todoストアのテスト
 *
 * @description Zustandストアの状態管理機能をテスト
 * - 初期状態の確認
 * - アクションの動作確認
 * - エラーハンドリングのテスト
 */

// fetch APIをモック化
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useTodoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ストアの状態をリセット
    useTodoStore.setState({
      todos: [],
      loading: false,
      error: null,
    })
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useTodoStore())

    expect(result.current.todos).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('setLoadingが正しく動作する', () => {
    const { result } = renderHook(() => useTodoStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.loading).toBe(true)
  })

  it('setErrorが正しく動作する', () => {
    const { result } = renderHook(() => useTodoStore())

    act(() => {
      result.current.setError('テストエラー')
    })

    expect(result.current.error).toBe('テストエラー')
  })

  it('fetchTodosが成功した場合', async () => {
    const mockTodos = [
      {
        id: '1',
        title: 'テストTodo',
        description: 'テスト用',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTodos,
    })

    const { result } = renderHook(() => useTodoStore())

    await act(async () => {
      await result.current.fetchTodos()
    })

    expect(result.current.todos).toEqual(mockTodos)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('fetchTodosが失敗した場合', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useTodoStore())

    await act(async () => {
      await result.current.fetchTodos()
    })

    expect(result.current.todos).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Todoの取得に失敗しました')
  })
})
