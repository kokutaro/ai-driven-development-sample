import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import type { Todo } from '@/types/todo'

import { TodoListEnhanced } from '@/components/todo-list-enhanced'
import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * テスト用のMantineProviderラッパー
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}

// ストアのモック
vi.mock('@/stores/todo-store')
vi.mock('@/stores/todo-ui-store')

const mockUseTodoStore = vi.mocked(useTodoStore)
const mockUseTodoUIStore = vi.mocked(useTodoUIStore)

/**
 * テスト用のTODO項目を作成するヘルパー関数
 */
function createTestTodo(
  id: string,
  title: string,
  createdAt: Date,
  status: 'completed' | 'pending' = 'pending'
): Todo {
  return {
    createdAt,
    id,
    status,
    title,
    updatedAt: createdAt,
  }
}

describe('TodoListEnhanced', () => {
  const mockDeleteTodo = vi.fn()
  const mockToggleTodoStatus = vi.fn()
  const mockSetSelectedTodoId = vi.fn()

  const testTodos: Todo[] = [
    createTestTodo('1', 'Today todo', new Date('2024-01-15T10:00:00Z')),
    createTestTodo('2', 'This week todo', new Date('2024-01-17T10:00:00Z')),
    createTestTodo('3', 'Last month todo', new Date('2023-12-15T10:00:00Z')),
    createTestTodo(
      '4',
      'Completed todo',
      new Date('2024-01-15T10:00:00Z'),
      'completed'
    ),
  ]

  beforeEach(() => {
    // 現在時刻をモック（2024年1月15日、月曜日）
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))

    mockDeleteTodo.mockClear()
    mockToggleTodoStatus.mockClear()
    mockSetSelectedTodoId.mockClear()

    mockUseTodoStore.mockReturnValue({
      addTodo: vi.fn(),
      deleteTodo: mockDeleteTodo,
      getAllTodos: vi.fn(),
      getCompletedTodos: vi.fn(),
      getPendingTodos: vi.fn(),
      getTodoById: vi.fn(),
      initializeTodos: vi.fn(),
      isLoading: false,
      todos: testTodos,
      toggleTodoStatus: mockToggleTodoStatus,
      updateTodo: vi.fn(),
    })

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('フィルタ"all"で全てのTODOが表示される', () => {
    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    expect(screen.getByText('Today todo')).toBeInTheDocument()
    expect(screen.getByText('This week todo')).toBeInTheDocument()
    expect(screen.getByText('Last month todo')).toBeInTheDocument()
    expect(screen.getByText('Completed todo')).toBeInTheDocument()
  })

  it('フィルタ"today"で今日のTODOのみ表示される', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'today',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    expect(screen.getByText('Today todo')).toBeInTheDocument()
    expect(screen.getByText('Completed todo')).toBeInTheDocument()
    expect(screen.queryByText('This week todo')).not.toBeInTheDocument()
    expect(screen.queryByText('Last month todo')).not.toBeInTheDocument()
  })

  it('フィルタ"completed"で完了済みTODOのみ表示される', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'completed',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    expect(screen.getByText('Completed todo')).toBeInTheDocument()
    expect(screen.queryByText('Today todo')).not.toBeInTheDocument()
    expect(screen.queryByText('This week todo')).not.toBeInTheDocument()
    expect(screen.queryByText('Last month todo')).not.toBeInTheDocument()
  })

  it('TODO項目をクリックすると選択される', async () => {
    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    // テキスト要素を見つけてそれをクリック（カードのclick eventが発火される）
    const titleText = screen.getByText('Today todo')
    expect(titleText).toBeInTheDocument()

    fireEvent.click(titleText)

    expect(mockSetSelectedTodoId).toHaveBeenCalledWith('1')
  })

  it('選択されたTODO項目がハイライト表示される', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    const selectedTodoContainer = screen
      .getByText('Today todo')
      .closest('[data-selected="true"]')
    expect(selectedTodoContainer).toBeInTheDocument()
  })

  it('ローディング中はスピナーが表示される', () => {
    mockUseTodoStore.mockReturnValue({
      addTodo: vi.fn(),
      deleteTodo: mockDeleteTodo,
      getAllTodos: vi.fn(),
      getCompletedTodos: vi.fn(),
      getPendingTodos: vi.fn(),
      getTodoById: vi.fn(),
      initializeTodos: vi.fn(),
      isLoading: true,
      todos: [],
      toggleTodoStatus: mockToggleTodoStatus,
      updateTodo: vi.fn(),
    })

    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('フィルタされたTODOが0件の場合は適切なメッセージが表示される', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'today',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockUseTodoStore.mockReturnValue({
      addTodo: vi.fn(),
      deleteTodo: mockDeleteTodo,
      getAllTodos: vi.fn(),
      getCompletedTodos: vi.fn(),
      getPendingTodos: vi.fn(),
      getTodoById: vi.fn(),
      initializeTodos: vi.fn(),
      isLoading: false,
      todos: [
        createTestTodo('1', 'Old todo', new Date('2023-01-01T10:00:00Z')),
      ],
      toggleTodoStatus: mockToggleTodoStatus,
      updateTodo: vi.fn(),
    })

    render(<TodoListEnhanced />, { wrapper: TestWrapper })

    expect(screen.getByText('該当するTODO項目がありません')).toBeInTheDocument()
  })
})
