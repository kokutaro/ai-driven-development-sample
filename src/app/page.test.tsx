import { MockedProvider } from '@apollo/client/testing'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TodoPage from './page'

import { useTodoStatsGraphQL } from '@/hooks/use-todo-stats-graphql'
import { useTodosGraphQL } from '@/hooks/use-todos-graphql'
import { type Todo, type TodoStats } from '@/types/todo'

// Mock the GraphQL hooks
vi.mock('@/hooks/use-todos-graphql')
vi.mock('@/hooks/use-todo-stats-graphql')

// Mock the UI store
const mockSetSelectedFilter = vi.fn()
const mockSetSelectedTodo = vi.fn()
const mockSetDrawerOpen = vi.fn()
const mockSetViewMode = vi.fn()

vi.mock('@/stores/ui-store', () => ({
  useUiStore: () => ({
    isDrawerOpen: false,
    selectedFilter: 'all',
    selectedTodo: undefined,
    setDrawerOpen: mockSetDrawerOpen,
    setSelectedFilter: mockSetSelectedFilter,
    setSelectedTodo: mockSetSelectedTodo,
    setViewMode: mockSetViewMode,
    viewMode: 'list',
  }),
}))

vi.mock('@/hooks/use-client-only', () => ({
  useClientOnly: () => true,
}))

/**
 * Page GraphQL統合テスト
 *
 * TDD: ページレベルでのGraphQL統合をテストドリブンで実装
 */
describe('TodoPage GraphQL Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTodos: Todo[] = [
    {
      category: {
        color: '#FF6B6B',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        id: 'cat1',
        name: 'Work',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        userId: 'user1',
      },
      categoryId: 'cat1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      description: 'Testing page integration',
      dueDate: new Date('2024-01-15T23:59:59Z'),
      id: '1',
      isCompleted: false,
      isImportant: true,
      order: 0,
      title: 'Integration Test Todo 1',
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      userId: 'user1',
    },
    {
      categoryId: undefined,
      createdAt: new Date('2024-01-02T00:00:00Z'),
      description: 'Another integration test',
      dueDate: undefined,
      id: '2',
      isCompleted: true,
      isImportant: false,
      order: 1,
      title: 'Integration Test Todo 2',
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      userId: 'user1',
    },
  ]

  const mockStats: TodoStats = {
    assignedCount: 8,
    completedCount: 4,
    completionRate: 40,
    importantCount: 3,
    overdueCount: 1,
    todayCount: 2,
    totalCount: 10,
    upcomingCount: 5,
  }

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>
      <ModalsProvider>
        <MockedProvider addTypename={false} mocks={[]}>
          {children}
        </MockedProvider>
      </ModalsProvider>
    </MantineProvider>
  )

  describe('GraphQL Page Layout', () => {
    it('should render page with GraphQL sidebar and main content', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      // Mock window.matchMedia for responsive behavior
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation((query) => ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: query === '(min-width: 62em)',
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        })),
        writable: true,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // サイドバーの統計データが表示される
        expect(screen.getByText('今日の予定')).toBeInTheDocument()
        expect(screen.getByText('重要')).toBeInTheDocument()
        expect(screen.getByText('タスク')).toBeInTheDocument()

        // メインコンテンツのタスクが表示される
        expect(screen.getByText('Integration Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('Integration Test Todo 2')).toBeInTheDocument()
      })
    })

    it('should handle GraphQL loading state across components', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: true,
        refetch: vi.fn(),
        todos: [],
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // ローディング状態が表示される
        const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })

    it('should handle GraphQL error state gracefully', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: new Error('GraphQL Integration Error'),
        loading: false,
        refetch: vi.fn(),
        todos: [],
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // エラー状態が適切に表示される
        expect(
          screen.getByText('データの取得に失敗しました')
        ).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL Component Integration', () => {
    it('should integrate sidebar and main content GraphQL data', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // サイドバーの統計データとメインコンテンツのタスクが連携している
        expect(screen.getByText('10')).toBeInTheDocument() // 全タスク数
        expect(screen.getByText('4')).toBeInTheDocument() // 完了済み数
        expect(screen.getByText('Integration Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('Integration Test Todo 2')).toBeInTheDocument()
      })
    })

    it('should handle responsive layout with GraphQL components', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      // モバイルサイズをシミュレート
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation((query) => ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: query !== '(min-width: 62em)',
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        })),
        writable: true,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // レスポンシブ対応でモバイルレイアウトが適切に動作する
        expect(screen.getByText('Integration Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('Integration Test Todo 2')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL Data Consistency', () => {
    it('should maintain data consistency between GraphQL components', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        // 統計データとタスクデータの整合性が保たれている
        expect(screen.getByText('10')).toBeInTheDocument() // 統計の全タスク数
        expect(screen.getByText('4')).toBeInTheDocument() // 統計の完了済み数

        // 実際のタスクデータも表示されている
        expect(screen.getByText('Integration Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('Integration Test Todo 2')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL Performance', () => {
    it('should handle GraphQL page rendering efficiently', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      const startTime = performance.now()

      render(
        <TestWrapper>
          <TodoPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Integration Test Todo 1')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // ページ全体の描画が1秒以内に完了する
      expect(renderTime).toBeLessThan(1000)
    })
  })
})
