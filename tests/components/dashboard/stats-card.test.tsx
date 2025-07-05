import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'

import { StatsCard } from '@/components/dashboard/stats-card'

/**
 * MantineProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

describe('StatsCard', () => {
  describe('基本的な表示', () => {
    it('ラベルと値を表示する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard label="総TODO数" value={5} />)

      // Assert
      expect(screen.getByText('総TODO数')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('値が0の場合も正しく表示する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard label="完了済み" value={0} />)

      // Assert
      expect(screen.getByText('完了済み')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('大きな値も正しく表示する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard label="総TODO数" value={999} />)

      // Assert
      expect(screen.getByText('総TODO数')).toBeInTheDocument()
      expect(screen.getByText('999')).toBeInTheDocument()
    })
  })

  describe('カラーバリアント', () => {
    it('primaryカラーバリアントを適用する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard color="blue" label="総TODO数" value={5} />)

      // Assert
      const valueElement = screen.getByText('5')
      expect(valueElement).toHaveStyle({
        color: 'var(--mantine-color-blue-text)',
      })
    })

    it('successカラーバリアントを適用する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard color="green" label="完了済み" value={3} />)

      // Assert
      const valueElement = screen.getByText('3')
      expect(valueElement).toHaveStyle({
        color: 'var(--mantine-color-green-text)',
      })
    })

    it('warningカラーバリアントを適用する', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard color="orange" label="未完了" value={2} />)

      // Assert
      const valueElement = screen.getByText('2')
      expect(valueElement).toHaveStyle({
        color: 'var(--mantine-color-orange-text)',
      })
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なaria-labelを持つ', () => {
      // Arrange & Act
      renderWithMantine(<StatsCard label="総TODO数" value={5} />)

      // Assert
      expect(screen.getByLabelText('総TODO数: 5')).toBeInTheDocument()
    })
  })
})
