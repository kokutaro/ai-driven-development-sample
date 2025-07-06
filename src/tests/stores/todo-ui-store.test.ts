import { act, renderHook } from '@testing-library/react'

import { useTodoUIStore } from '@/stores/todo-ui-store'

describe('useTodoUIStore', () => {
  beforeEach(() => {
    // ストアをリセット
    const { result } = renderHook(() => useTodoUIStore())
    act(() => {
      result.current.setSelectedTodoId(undefined)
      result.current.setFilter('all')
    })
  })

  describe('フィルタ機能', () => {
    it('初期状態では"all"フィルタが選択されている', () => {
      const { result } = renderHook(() => useTodoUIStore())
      expect(result.current.currentFilter).toBe('all')
    })

    it('フィルタを変更できる', () => {
      const { result } = renderHook(() => useTodoUIStore())

      act(() => {
        result.current.setFilter('today')
      })

      expect(result.current.currentFilter).toBe('today')
    })

    it('有効なフィルタのみ設定できる', () => {
      const { result } = renderHook(() => useTodoUIStore())

      act(() => {
        result.current.setFilter('thisWeek')
      })

      expect(result.current.currentFilter).toBe('thisWeek')

      act(() => {
        result.current.setFilter('thisMonth')
      })

      expect(result.current.currentFilter).toBe('thisMonth')

      act(() => {
        result.current.setFilter('completed')
      })

      expect(result.current.currentFilter).toBe('completed')
    })
  })

  describe('TODO選択機能', () => {
    it('初期状態ではTODOが選択されていない', () => {
      const { result } = renderHook(() => useTodoUIStore())
      expect(result.current.selectedTodoId).toBeUndefined()
    })

    it('TODOを選択できる', () => {
      const { result } = renderHook(() => useTodoUIStore())
      const todoId = 'test-todo-id'

      act(() => {
        result.current.setSelectedTodoId(todoId)
      })

      expect(result.current.selectedTodoId).toBe(todoId)
    })

    it('TODO選択を解除できる', () => {
      const { result } = renderHook(() => useTodoUIStore())
      const todoId = 'test-todo-id'

      act(() => {
        result.current.setSelectedTodoId(todoId)
      })

      expect(result.current.selectedTodoId).toBe(todoId)

      act(() => {
        result.current.setSelectedTodoId(undefined)
      })

      expect(result.current.selectedTodoId).toBeUndefined()
    })
  })

  describe('詳細パネル表示状態', () => {
    it('TODOが選択されていない場合は詳細パネルが非表示', () => {
      const { result } = renderHook(() => useTodoUIStore())
      expect(result.current.isDetailPanelVisible).toBe(false)
    })

    it('TODOが選択されている場合は詳細パネルが表示', () => {
      const { result } = renderHook(() => useTodoUIStore())

      act(() => {
        result.current.setSelectedTodoId('test-todo-id')
      })

      expect(result.current.isDetailPanelVisible).toBe(true)
    })
  })
})
