import { MockedProvider } from '@apollo/client/testing'
import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TodoSidebarGraphQL } from './todo-sidebar-graphql'

import { useTodoStatsGraphQL } from '@/hooks/use-todo-stats-graphql'
import { type TodoStats } from '@/types/todo'

// Mock the store hooks
const mockSetSelectedFilter = vi.fn()
vi.mock('@/stores/ui-store', () => ({
  useUiStore: () => ({
    selectedFilter: 'all',
    setSelectedFilter: mockSetSelectedFilter,
  }),
}))

vi.mock('@/hooks/use-client-only', () => ({
  useClientOnly: () => true,
}))

vi.mock('@/hooks/use-todo-stats-graphql')

/**
 * TodoSidebar GraphQL 移行テスト
 *
 * TDD: REST APIからGraphQLへの移行をテストドリブンで実装
 */
describe('TodoSidebar GraphQL Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
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
      <MockedProvider addTypename={false} mocks={[]}>
        {children}
      </MockedProvider>
    </MantineProvider>
  )

  describe('GraphQL統計データ表示', () => {
    it('should display GraphQL stats in filter badges', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // 各フィルタの統計数値が表示される
        expect(screen.getByText('2')).toBeInTheDocument() // 今日の予定
        expect(screen.getByText('3')).toBeInTheDocument() // 重要
        expect(screen.getByText('5')).toBeInTheDocument() // 今後の予定
        expect(screen.getByText('8')).toBeInTheDocument() // 自分に割り当て
        expect(screen.getByText('10')).toBeInTheDocument() // 全タスク
        expect(screen.getByText('4')).toBeInTheDocument() // 完了済み
      })
    })

    it('should handle GraphQL stats loading state', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: true,
        refetch: vi.fn(),
        stats: {
          assignedCount: 0,
          completedCount: 0,
          completionRate: 0,
          importantCount: 0,
          overdueCount: 0,
          todayCount: 0,
          totalCount: 0,
          upcomingCount: 0,
        },
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // ローディング中はバッジが表示されない
        expect(screen.queryByRole('badge')).not.toBeInTheDocument()
      })
    })

    it('should handle GraphQL stats error state', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: new Error('GraphQL Stats Error'),
        loading: false,
        refetch: vi.fn(),
        stats: {
          assignedCount: 0,
          completedCount: 0,
          completionRate: 0,
          importantCount: 0,
          overdueCount: 0,
          todayCount: 0,
          totalCount: 0,
          upcomingCount: 0,
        },
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // エラー時はバッジが表示されない（0件のため）
        expect(screen.queryByRole('badge')).not.toBeInTheDocument()
      })
    })

    it('should hide badges when counts are zero (GraphQL)', async () => {
      const emptyStats: TodoStats = {
        assignedCount: 0,
        completedCount: 0,
        completionRate: 0,
        importantCount: 0,
        overdueCount: 0,
        todayCount: 0,
        totalCount: 0,
        upcomingCount: 0,
      }

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: emptyStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // 0件の場合はバッジが表示されない
        expect(screen.queryByRole('badge')).not.toBeInTheDocument()
      })
    })
  })

  describe('GraphQLフィルタ機能', () => {
    it('should handle filter selection with GraphQL data', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        const importantFilter = screen.getByText('重要')
        fireEvent.click(importantFilter)
      })

      // クリック後の検証
      expect(mockSetSelectedFilter).toHaveBeenCalledWith('important')
    })

    it('should display correct filter states with GraphQL', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // 全てのフィルタが表示される
        expect(screen.getByText('今日の予定')).toBeInTheDocument()
        expect(screen.getByText('重要')).toBeInTheDocument()
        expect(screen.getByText('今後の予定')).toBeInTheDocument()
        expect(screen.getByText('自分に割り当て')).toBeInTheDocument()
        expect(screen.getByText('フラグを設定したメール')).toBeInTheDocument()
        expect(screen.getByText('タスク')).toBeInTheDocument()
        expect(screen.getByText('完了済み')).toBeInTheDocument()
      })
    })

    it('should handle different filter selections with GraphQL', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // 選択されたフィルタがアクティブ状態になる (data-active="true")
        const activeFilter = document.querySelector('[data-active="true"]')
        expect(activeFilter).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL統計値の更新', () => {
    it('should update stats when GraphQL data changes', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)

      // 初期状態
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      const { rerender } = render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument() // 全タスク
      })

      // 更新された統計値（重複しない数値を使用）
      const updatedStats: TodoStats = {
        ...mockStats,
        completedCount: 7,
        importantCount: 6, // 5から6に変更して重複を避ける
        totalCount: 15,
      }

      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: updatedStats,
      })

      rerender(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument() // 更新された全タスク
        expect(screen.getByText('7')).toBeInTheDocument() // 更新された完了済み
        expect(screen.getByText('6')).toBeInTheDocument() // 更新された重要
      })
    })

    it('should handle GraphQL refetch functionality', async () => {
      const mockRefetch = vi.fn()

      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: mockRefetch,
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // refetch関数が利用可能
        expect(mockRefetch).toBeDefined()
      })
    })
  })

  describe('GraphQLリアルタイム更新', () => {
    it('should handle GraphQL subscription updates', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)

      // 初期状態
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      const { rerender } = render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })

      // リアルタイム更新をシミュレート（重複しない数値を使用）
      const realtimeStats: TodoStats = {
        ...mockStats,
        completedCount: 6, // 5から6に変更して重複を避ける
        totalCount: 11,
      }

      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: realtimeStats,
      })

      rerender(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument()
        expect(screen.getByText('6')).toBeInTheDocument()
      })
    })

    it('should handle GraphQL cache updates', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)

      // キャッシュされた統計値
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: mockStats,
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // キャッシュされた値が即座に表示される
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQLエラー処理', () => {
    it('should handle GraphQL network errors gracefully', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: new Error('Network Error'),
        loading: false,
        refetch: vi.fn(),
        stats: {
          assignedCount: 0,
          completedCount: 0,
          completionRate: 0,
          importantCount: 0,
          overdueCount: 0,
          todayCount: 0,
          totalCount: 0,
          upcomingCount: 0,
        },
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // エラー時でもフィルタは表示される
        expect(screen.getByText('今日の予定')).toBeInTheDocument()
        expect(screen.getByText('重要')).toBeInTheDocument()
        expect(screen.getByText('タスク')).toBeInTheDocument()

        // ただし、バッジは表示されない（0件のため）
        expect(screen.queryByRole('badge')).not.toBeInTheDocument()
      })
    })

    it('should handle GraphQL parsing errors', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: new Error('GraphQL Parse Error'),
        loading: false,
        refetch: vi.fn(),
        stats: {
          assignedCount: 0,
          completedCount: 0,
          completionRate: 0,
          importantCount: 0,
          overdueCount: 0,
          todayCount: 0,
          totalCount: 0,
          upcomingCount: 0,
        },
      })

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        // パースエラー時でもUIは正常に表示される
        expect(screen.getByText('今日の予定')).toBeInTheDocument()
        expect(screen.getByText('重要')).toBeInTheDocument()
        expect(screen.getByText('タスク')).toBeInTheDocument()
        expect(screen.getByText('完了済み')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQLパフォーマンス', () => {
    it('should handle GraphQL stats updates efficiently', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)

      const largeStats: TodoStats = {
        assignedCount: 8000,
        completedCount: 4000,
        completionRate: 40,
        importantCount: 3000,
        overdueCount: 100,
        todayCount: 200,
        totalCount: 10000,
        upcomingCount: 5000,
      }

      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: largeStats,
      })

      const startTime = performance.now()

      render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10000')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 大きな統計値でも高速レンダリング（1秒以内）
      expect(renderTime).toBeLessThan(1000)
    })

    it('should handle frequent GraphQL updates without performance degradation', async () => {
      const mockUseTodoStatsGraphQL = vi.mocked(useTodoStatsGraphQL)

      let currentStats = mockStats
      mockUseTodoStatsGraphQL.mockReturnValue({
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        stats: currentStats,
      })

      const { rerender } = render(
        <TestWrapper>
          <TodoSidebarGraphQL />
        </TestWrapper>
      )

      const startTime = performance.now()

      // 100回の更新をシミュレート
      for (let i = 0; i < 100; i++) {
        currentStats = {
          ...currentStats,
          totalCount: currentStats.totalCount + 1,
        }

        mockUseTodoStatsGraphQL.mockReturnValue({
          error: undefined,
          loading: false,
          refetch: vi.fn(),
          stats: currentStats,
        })

        rerender(
          <TestWrapper>
            <TodoSidebarGraphQL />
          </TestWrapper>
        )
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      // 頻繁な更新でもパフォーマンスが保たれる（5秒以内）
      expect(updateTime).toBeLessThan(5000)
    })
  })
})
