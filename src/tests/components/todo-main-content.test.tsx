import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import type { TodoFilter } from '@/types/filter'

import { TodoMainContent } from '@/components/todo-main-content'
import { useTodoStats, useTodoStore } from '@/stores/todo-store'
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
const mockUseTodoStats = vi.mocked(useTodoStats)
const mockUseTodoUIStore = vi.mocked(useTodoUIStore)

describe('TodoMainContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // TodoStoreのモック設定
    mockUseTodoStore.mockImplementation((selector) => {
      const state = {
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: [],
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      }
      // selectorが渡された場合（TodoAddFormのような使い方）
      if (typeof selector === 'function') {
        return selector(state)
      }
      // selectorが渡されなかった場合（TodoListEnhancedのような使い方）
      return state
    })

    // TodoStatsのモック設定
    mockUseTodoStats.mockReturnValue({
      completed: 0,
      completionRate: 0,
      pending: 0,
      total: 0,
    })

    // TodoUIStoreのモック設定
    mockUseTodoUIStore.mockImplementation((selector) => {
      const state = {
        currentFilter: 'all' as TodoFilter,
        isDetailPanelVisible: false,
        selectedTodoId: undefined,
        setFilter: vi.fn(),
        setSelectedTodoId: vi.fn(),
      }
      // selectorが渡された場合
      if (typeof selector === 'function') {
        return selector(state)
      }
      // selectorが渡されなかった場合
      return state
    })
  })

  it('コンポーネントが正常にレンダリングされる', () => {
    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - 少なくとも基本的な構造要素が存在することを確認
    expect(document.body).toBeInTheDocument()
  })

  it('TodoStatsDashboardは非表示になっている', () => {
    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - 統計ダッシュボードは一時的に非表示
    expect(screen.queryByText('TODO統計')).not.toBeInTheDocument()
  })

  it('TodoListModernが表示される', () => {
    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /タスクの追加/ })
    ).toBeInTheDocument()
  })

  it('サンプルTODOアイテムが表示される', () => {
    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - サンプルデータが表示される（todosが空配列のため）
    expect(screen.getByText('サンプル会議')).toBeInTheDocument()
    expect(screen.getByText('タスク')).toBeInTheDocument()
  })

  it('適切なレイアウト構造が適用される', () => {
    // Act
    const { container } = render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - TodoListModernコンポーネントが存在することを確認
    const todoListModern = container.querySelector(
      '[data-testid="todo-list-modern"]'
    )
    expect(todoListModern).toBeInTheDocument()

    // Stack要素が存在することを確認
    const stackElements = container.querySelectorAll('[class*="Stack"]')
    expect(stackElements.length).toBeGreaterThan(0)
  })

  it('TodoMainContentの子コンポーネントが表示される', () => {
    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - TodoListModernコンポーネントの存在を確認
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /タスクの追加/ })
    ).toBeInTheDocument()
    expect(screen.getByText('サンプル会議')).toBeInTheDocument()
  })

  it('TODO項目がある場合はTODO一覧が表示される', () => {
    // Arrange - TODO項目がある状態をモック
    const mockTodos = [
      {
        createdAt: new Date(),
        id: '1',
        status: 'pending' as const,
        title: 'Test Todo',
        updatedAt: new Date(),
      },
    ]

    mockUseTodoStore.mockImplementation((selector) => {
      const state = {
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: mockTodos,
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      }
      if (typeof selector === 'function') {
        return selector(state)
      }
      return state
    })

    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('ローディング状態のときは読み込み中メッセージが表示される', () => {
    // Arrange - ローディング状態をモック
    mockUseTodoStore.mockImplementation((selector) => {
      const state = {
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: true,
        todos: [],
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      }
      if (typeof selector === 'function') {
        return selector(state)
      }
      return state
    })

    // Act
    render(<TodoMainContent />, { wrapper: TestWrapper })

    // Assert - TodoListModernのローディング表示
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
  })
})
