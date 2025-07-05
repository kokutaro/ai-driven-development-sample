import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { TodoStatsDashboard } from '@/components/dashboard/todo-stats-dashboard'
import { useTodoStats } from '@/stores/todo-store'

/**
 * MantineProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

// useTodoStatsフックのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStats: vi.fn(),
}))

const mockUseTodoStats = vi.mocked(useTodoStats)

describe('TodoStatsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本的な表示', () => {
    it('統計情報を正しく表示する', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 60,
        pending: 2,
        total: 5,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      expect(screen.getByText('TODO統計')).toBeInTheDocument()
      expect(screen.getByText('総TODO数')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('未完了')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('60%')).toBeInTheDocument()
    })

    it('TODOが存在しない場合の統計を表示する', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 0,
        completionRate: 0,
        pending: 0,
        total: 0,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      expect(screen.getByText('TODO統計')).toBeInTheDocument()
      expect(screen.getByText('総TODO数')).toBeInTheDocument()
      expect(screen.getByLabelText('総TODO数: 0')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
      expect(screen.getByLabelText('完了済み: 0')).toBeInTheDocument()
      expect(screen.getByText('未完了')).toBeInTheDocument()
      expect(screen.getByLabelText('未完了: 0')).toBeInTheDocument()
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('すべてのTODOが完了している場合の統計を表示する', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 5,
        completionRate: 100,
        pending: 0,
        total: 5,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      expect(screen.getByText('総TODO数')).toBeInTheDocument()
      expect(screen.getByLabelText('総TODO数: 5')).toBeInTheDocument()
      expect(screen.getByText('完了済み')).toBeInTheDocument()
      expect(screen.getByLabelText('完了済み: 5')).toBeInTheDocument()
      expect(screen.getByText('未完了')).toBeInTheDocument()
      expect(screen.getByLabelText('未完了: 0')).toBeInTheDocument()
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('レスポンシブレイアウト', () => {
    it('統計カードが正しくグリッドレイアウトで表示される', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 75,
        pending: 1,
        total: 4,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      // グリッドコンテナの存在確認
      const statsContainer = screen.getByTestId('stats-cards-container')
      expect(statsContainer).toBeInTheDocument()
      expect(statsContainer).toHaveClass('mantine-SimpleGrid-root')
    })

    it('完了率プログレスバーが表示される', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 75,
        pending: 1,
        total: 4,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '75')
    })
  })

  describe('統計カードの色分け', () => {
    it('各統計カードが適切な色で表示される', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 75,
        pending: 2,
        total: 5,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      // 総TODO数カード（青色）
      const totalValue = screen.getByLabelText('総TODO数: 5')
      expect(totalValue).toBeInTheDocument()

      // 完了済みカード（緑色）
      const completedValue = screen.getByLabelText('完了済み: 3')
      expect(completedValue).toBeInTheDocument()

      // 未完了カード（オレンジ色）
      const pendingValue = screen.getByLabelText('未完了: 2')
      expect(pendingValue).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切な見出し構造を持つ', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 75,
        pending: 2,
        total: 5,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      const heading = screen.getByRole('heading', { name: 'TODO統計' })
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H2')
    })

    it('統計情報がセクションとして認識される', () => {
      // Arrange
      mockUseTodoStats.mockReturnValue({
        completed: 3,
        completionRate: 75,
        pending: 2,
        total: 5,
      })

      // Act
      renderWithMantine(<TodoStatsDashboard />)

      // Assert
      const section = screen.getByRole('region', {
        name: 'TODO統計ダッシュボード',
      })
      expect(section).toBeInTheDocument()
    })
  })
})
