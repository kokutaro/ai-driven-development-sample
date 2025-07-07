import { renderHook } from '@testing-library/react'

import { useTodos } from './use-todos'

import { useTodoStore } from '@/stores/todo-store'

// TodoStoreのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

const mockFetchTodos = vi.fn()
const mockTodos = [
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 1',
    dueDate: new Date(),
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    order: 0,
    title: 'Task 1',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 2',
    dueDate: undefined,
    id: 'todo-2',
    isCompleted: false,
    isImportant: true,
    order: 1,
    title: 'Task 2',
    updatedAt: new Date(),
    userId: 'user-1',
  },
]

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodoStore).mockReturnValue({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: mockFetchTodos,
      isLoading: false,
      todos: mockTodos,
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    })
  })

  it('デフォルトフィルタ（all）でTODOを取得する', () => {
    // Act
    const { result } = renderHook(() => useTodos())

    // Assert
    expect(result.current.todos).toEqual(mockTodos)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(undefined)
    expect(mockFetchTodos).toHaveBeenCalledWith('all')
  })

  it('指定されたフィルタでTODOを取得する', () => {
    // Act
    const { result } = renderHook(() => useTodos('important'))

    // Assert
    expect(result.current.todos).toEqual(mockTodos)
    expect(mockFetchTodos).toHaveBeenCalledWith('important')
  })

  it('フィルタが変更されると新しいフィルタでfetchTodosが呼ばれる', () => {
    // Arrange
    const { rerender } = renderHook(({ filter }) => useTodos(filter), {
      initialProps: { filter: 'all' },
    })

    // Act
    rerender({ filter: 'today' })

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledWith('today')
  })

  it('ローディング状態を正しく返す', () => {
    // Arrange
    vi.mocked(useTodoStore).mockReturnValue({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: undefined,
      fetchTodos: mockFetchTodos,
      isLoading: true,
      todos: [],
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    })

    // Act
    const { result } = renderHook(() => useTodos())

    // Assert
    expect(result.current.isLoading).toBe(true)
    expect(result.current.todos).toEqual([])
  })

  it('エラー状態を正しく返す', () => {
    // Arrange
    const errorMessage = 'Failed to fetch todos'
    vi.mocked(useTodoStore).mockReturnValue({
      clearError: vi.fn(),
      createTodo: vi.fn(),
      deleteTodo: vi.fn(),
      error: errorMessage,
      fetchTodos: mockFetchTodos,
      isLoading: false,
      todos: [],
      toggleTodo: vi.fn(),
      updateTodo: vi.fn(),
    })

    // Act
    const { result } = renderHook(() => useTodos())

    // Assert
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.isLoading).toBe(false)
  })

  it('refetch関数が正しく動作する', () => {
    // Act
    const { result } = renderHook(() => useTodos('important'))

    // Act - refetch実行
    result.current.refetch()

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledWith('important')
    expect(mockFetchTodos).toHaveBeenCalledTimes(2) // 初回 + refetch
  })

  it('フィルタが同じ場合でもマウント時にfetchTodosが呼ばれる', () => {
    // Act
    renderHook(() => useTodos('all'))

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledTimes(1)
    expect(mockFetchTodos).toHaveBeenCalledWith('all')
  })

  it('undefinedフィルタの場合はデフォルト値（all）が使用される', () => {
    // Act
    const { result } = renderHook(() => useTodos())

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledWith('all')
    expect(result.current.todos).toEqual(mockTodos)
  })

  it('空文字列フィルタの場合はそのまま渡される', () => {
    // Act
    renderHook(() => useTodos(''))

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledWith('')
  })

  it('無効なフィルタでも正常に動作する', () => {
    // Act
    renderHook(() => useTodos('invalid-filter'))

    // Assert
    expect(mockFetchTodos).toHaveBeenCalledWith('invalid-filter')
    // ストアの状態は変わらず正常に返される
    expect(useTodoStore).toHaveBeenCalled()
  })

  it('複数のコンポーネントで同じフィルタを使用しても正しく動作する', () => {
    // Act
    const { result: result1 } = renderHook(() => useTodos('important'))
    const { result: result2 } = renderHook(() => useTodos('important'))

    // Assert
    expect(result1.current.todos).toEqual(mockTodos)
    expect(result2.current.todos).toEqual(mockTodos)
    expect(mockFetchTodos).toHaveBeenCalledTimes(2)
  })

  it('コンポーネントがアンマウントされてもエラーが発生しない', () => {
    // Act
    const { unmount } = renderHook(() => useTodos('all'))

    // Assert - アンマウント時にエラーが発生しないことを確認
    expect(() => unmount()).not.toThrow()
  })
})
