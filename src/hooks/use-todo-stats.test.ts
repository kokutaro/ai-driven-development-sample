import { renderHook } from '@testing-library/react'

import { useTodoStats } from './use-todo-stats'

import { useTodoStore } from '@/stores/todo-store'

// TodoStoreのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

const mockTodos = [
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 1',
    dueDate: new Date(),
    id: 'todo-1',
    isCompleted: false,
    isImportant: true,
    order: 0,
    title: 'Task 1',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 2',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
    id: 'todo-2',
    isCompleted: false,
    isImportant: false,
    order: 1,
    title: 'Task 2',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 3',
    dueDate: undefined,
    id: 'todo-3',
    isCompleted: true,
    isImportant: true,
    order: 2,
    title: 'Task 3',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 4',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨日（期限切れ）
    id: 'todo-4',
    isCompleted: false,
    isImportant: false,
    order: 3,
    title: 'Task 4',
    updatedAt: new Date(),
    userId: 'user-1',
  },
]

describe('useTodoStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正しい統計データを返す', () => {
    // Arrange
    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: mockTodos,
      // その他のプロパティはundefineにするか省略
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats).toEqual({
      assignedCount: 3, // 未完了のタスク数
      completedCount: 1, // 完了済みタスク数
      importantCount: 1, // 重要で未完了のタスク
      todayCount: 1, // 今日が期限のタスク
      totalCount: 4, // 全タスク数
      upcomingCount: 2, // 期限が今日以降の未完了タスク
    })
  })

  it('空のtodos配列の場合は全て0を返す', () => {
    // Arrange
    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: [],
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })
  })

  it('todosがundefinedの場合は全て0を返す', () => {
    // Arrange
    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: undefined,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats).toEqual({
      assignedCount: 0,
      completedCount: 0,
      importantCount: 0,
      todayCount: 0,
      totalCount: 0,
      upcomingCount: 0,
    })
  })

  it('todayCountの計算が正しい', () => {
    // Arrange
    const today = new Date()
    const todayTodos = [
      { ...mockTodos[0], dueDate: today, isCompleted: false },
      { ...mockTodos[1], dueDate: today, isCompleted: false },
      { ...mockTodos[2], dueDate: today, isCompleted: true }, // 完了済みは除外
      {
        ...mockTodos[3],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isCompleted: false,
      }, // 明日は除外
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: todayTodos,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.todayCount).toBe(2)
  })

  it('importantCountの計算が正しい', () => {
    // Arrange
    const importantTodos = [
      { ...mockTodos[0], isCompleted: false, isImportant: true },
      { ...mockTodos[1], isCompleted: false, isImportant: true },
      { ...mockTodos[2], isCompleted: true, isImportant: true }, // 完了済みは除外
      { ...mockTodos[3], isCompleted: false, isImportant: false }, // 重要でないものは除外
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: importantTodos,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.importantCount).toBe(2)
  })

  it('upcomingCountの計算が正しい', () => {
    // Arrange
    const now = new Date()
    const upcomingTodos = [
      { ...mockTodos[0], dueDate: now, isCompleted: false },
      {
        ...mockTodos[1],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isCompleted: false,
      },
      {
        ...mockTodos[2],
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isCompleted: false,
      }, // 過去は除外
      { ...mockTodos[3], dueDate: undefined, isCompleted: false }, // 期限なしは除外
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: upcomingTodos,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.upcomingCount).toBe(2)
  })

  it('assignedCountの計算が正しい（全ての未完了タスク）', () => {
    // Arrange
    const todos = [
      { ...mockTodos[0], isCompleted: false },
      { ...mockTodos[1], isCompleted: false },
      { ...mockTodos[2], isCompleted: true }, // 完了済みは除外
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.assignedCount).toBe(2)
  })

  it('completedCountの計算が正しい', () => {
    // Arrange
    const todos = [
      { ...mockTodos[0], isCompleted: true },
      { ...mockTodos[1], isCompleted: true },
      { ...mockTodos[2], isCompleted: false }, // 未完了は除外
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.completedCount).toBe(2)
  })

  it('dueDateがundefinedのタスクは適切に処理される', () => {
    // Arrange
    const todosWithundefinedDates = [
      { ...mockTodos[0], dueDate: undefined, isCompleted: false },
      { ...mockTodos[1], dueDate: undefined, isCompleted: false },
    ]

    vi.mocked(useTodoStore).mockReturnValue({
      error: undefined,
      isLoading: false,
      todos: todosWithundefinedDates,
    } as ReturnType<typeof useTodoStore>)

    // Act
    const { result } = renderHook(() => useTodoStats())

    // Assert
    expect(result.current.stats.todayCount).toBe(0) // 期限なしは今日の予定に含まれない
    expect(result.current.stats.upcomingCount).toBe(0) // 期限なしは今後の予定に含まれない
    expect(result.current.stats.assignedCount).toBe(2) // 未完了なので割り当てに含まれる
  })
})
