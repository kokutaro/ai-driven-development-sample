import { act, renderHook } from '@testing-library/react'

import { useUiStore } from './ui-store'

import type { Todo } from '@/types/todo'

describe('useUiStore', () => {
  beforeEach(() => {
    // ストアを初期状態にリセット
    useUiStore.getState().reset()
  })

  describe('初期状態', () => {
    it('デフォルトのフィルタが"all"に設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUiStore())

      // Assert
      expect(result.current.selectedFilter).toBe('all')
    })

    it('選択されたタスクがundefinedに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUiStore())

      // Assert
      expect(result.current.selectedTodo).toBeUndefined()
    })

    it('サイドバーが展開状態に設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUiStore())

      // Assert
      expect(result.current.sidebarCollapsed).toBe(false)
    })
  })

  describe('フィルタ選択', () => {
    it('setSelectedFilterでフィルタを変更できる', () => {
      // Arrange
      const { result } = renderHook(() => useUiStore())

      // Act
      act(() => {
        result.current.setSelectedFilter('important')
      })

      // Assert
      expect(result.current.selectedFilter).toBe('important')
    })

    it('異なるフィルタを設定できる', () => {
      // Arrange
      const { result } = renderHook(() => useUiStore())

      // Act & Assert
      act(() => {
        result.current.setSelectedFilter('today')
      })
      expect(result.current.selectedFilter).toBe('today')

      act(() => {
        result.current.setSelectedFilter('completed')
      })
      expect(result.current.selectedFilter).toBe('completed')
    })
  })

  describe('タスク選択', () => {
    it('setSelectedTodoでタスクを選択できる', () => {
      // Arrange
      const mockTodo: Todo = {
        createdAt: new Date(),
        id: 'test-todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'テストタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const { result } = renderHook(() => useUiStore())

      // Act
      act(() => {
        result.current.setSelectedTodo(mockTodo)
      })

      // Assert
      expect(result.current.selectedTodo).toEqual(mockTodo)
    })

    it('setSelectedTodoでundefinedを設定できる', () => {
      // Arrange
      const mockTodo: Todo = {
        createdAt: new Date(),
        id: 'test-todo-1',
        isCompleted: false,
        isImportant: false,
        order: 0,
        title: 'テストタスク',
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const { result } = renderHook(() => useUiStore())

      // Act - 最初にタスクを選択
      act(() => {
        result.current.setSelectedTodo(mockTodo)
      })
      // Act - undefinedに設定
      act(() => {
        result.current.setSelectedTodo(undefined)
      })

      // Assert
      expect(result.current.selectedTodo).toBeUndefined()
    })
  })

  describe('サイドバー状態', () => {
    it('setSidebarCollapsedでサイドバーの状態を変更できる', () => {
      // Arrange
      const { result } = renderHook(() => useUiStore())

      // Act
      act(() => {
        result.current.setSidebarCollapsed(true)
      })

      // Assert
      expect(result.current.sidebarCollapsed).toBe(true)
    })

    it('サイドバーの状態を再度変更できる', () => {
      // Arrange
      const { result } = renderHook(() => useUiStore())

      // Act
      act(() => {
        result.current.setSidebarCollapsed(true)
      })
      act(() => {
        result.current.setSidebarCollapsed(false)
      })

      // Assert
      expect(result.current.sidebarCollapsed).toBe(false)
    })
  })
})
