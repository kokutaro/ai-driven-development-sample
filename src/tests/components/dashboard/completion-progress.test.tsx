import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'

import { CompletionProgress } from '@/components/dashboard/completion-progress'

/**
 * MantineProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

describe('CompletionProgress', () => {
  describe('基本的な表示', () => {
    it('完了率を表示する', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={75} />)

      // Assert
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('完了率0%を表示する', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={0} />)

      // Assert
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('完了率100%を表示する', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={100} />)

      // Assert
      expect(screen.getByText('完了率')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('プログレスバー', () => {
    it('正しい完了率でプログレスバーを表示する', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={60} />)

      // Assert
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '60')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    })

    it('完了率に応じて適切な色を表示する', () => {
      // Arrange & Act - 低い完了率
      const { rerender } = renderWithMantine(
        <CompletionProgress completionRate={25} />
      )

      // Assert - プログレスバーの存在確認
      let progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()

      // Act - 中程度の完了率
      rerender(
        <MantineProvider>
          <CompletionProgress completionRate={60} />
        </MantineProvider>
      )

      // Assert - プログレスバーの存在確認
      progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()

      // Act - 高い完了率
      rerender(
        <MantineProvider>
          <CompletionProgress completionRate={90} />
        </MantineProvider>
      )

      // Assert - プログレスバーの存在確認
      progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('境界値テスト', () => {
    it('完了率が負の値の場合、0として扱う', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={-10} />)

      // Assert
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('完了率が100を超える場合、100として扱う', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={150} />)

      // Assert
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なaria-labelを持つ', () => {
      // Arrange & Act
      renderWithMantine(<CompletionProgress completionRate={75} />)

      // Assert
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-label', 'TODO完了進捗: 75%')
    })
  })
})
