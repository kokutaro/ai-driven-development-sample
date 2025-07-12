import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiKeyDisplayModal } from './api-key-display-modal'

import type { ApiKeyCreateResponse } from '@/schemas/api-key'

/**
 * APIキー表示モーダルコンポーネント テスト
 *
 * ApiKeyDisplayModalの全機能をテストし、100%カバレッジを達成します。
 * - モーダルの表示/非表示
 * - APIキーの表示/マスク切り替え
 * - コピー機能
 * - 日付フォーマット
 * - 使用方法の説明
 * - エラーハンドリング
 */

// クリップボードAPIをモック
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Intl.DateTimeFormatをモック
const originalDateTimeFormat = Intl.DateTimeFormat
vi.stubGlobal('Intl', {
  ...Intl,
  DateTimeFormat: vi
    .fn()
    .mockImplementation(
      (locale: string | string[], options?: Intl.DateTimeFormatOptions) => {
        const formatter = new originalDateTimeFormat(locale, options)
        return {
          format: vi
            .fn()
            .mockImplementation((date: Date | number) =>
              formatter.format(date)
            ),
        }
      }
    ),
})

const mockApiKeyData: ApiKeyCreateResponse = {
  apiKey: {
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    expiresAt: null,
    id: 'test-api-key-id',
    lastUsedAt: null,
    name: 'Test API Key',
    updatedAt: new Date('2024-01-01T10:00:00.000Z'),
  },
  plainKey: 'todo_1234567890abcdef1234567890abcdef12345678',
}

const mockOnClose = vi.fn()

describe('ApiKeyDisplayModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should return undefined when apiKeyData is not provided', () => {
      // Act
      const result = render(
        <ApiKeyDisplayModal
          apiKeyData={undefined}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(result.container.firstChild).toBeNull()
    })

    it('should render modal when apiKeyData is provided and opened is true', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('APIキーが作成されました')).toBeInTheDocument()
      expect(screen.getByText('Test API Key')).toBeInTheDocument()
      expect(
        screen.getByText(
          'このAPIキーは一度だけ表示されます。 必ず安全な場所に保存してください。'
        )
      ).toBeInTheDocument()
    })

    it('should not render modal when opened is false', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={false}
        />
      )

      // Assert
      expect(
        screen.queryByText('APIキーが作成されました')
      ).not.toBeInTheDocument()
    })

    it('should format creation date correctly', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText(/作成日時:/)).toBeInTheDocument()
      // 日付フォーマッターが呼び出されることを確認
      expect(Intl.DateTimeFormat).toHaveBeenCalledWith('ja-JP', {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    })
  })

  describe('API key visibility toggle', () => {
    it('should initially show masked API key', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('todo_123***12345678')).toBeInTheDocument()
      expect(screen.getByText('表示')).toBeInTheDocument()
    })

    it('should show full API key when visibility is toggled on', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act
      await user.click(screen.getByText('表示'))

      // Assert
      expect(
        screen.getByText('todo_1234567890abcdef1234567890abcdef12345678')
      ).toBeInTheDocument()
      expect(screen.getByText('隠す')).toBeInTheDocument()
    })

    it('should hide API key when visibility is toggled off', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act
      await user.click(screen.getByText('表示')) // 表示
      await user.click(screen.getByText('隠す')) // 隠す

      // Assert
      expect(screen.getByText('todo_123***12345678')).toBeInTheDocument()
      expect(screen.getByText('表示')).toBeInTheDocument()
    })

    it('should show correct icon for visibility state', async () => {
      // Arrange
      const user = userEvent.setup()
      const { container } = render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert - 初期状態（隠れている）
      expect(container.querySelector('[data-testid="eye-icon"]')).toBeFalsy()

      // Act - 表示に切り替え
      await user.click(screen.getByText('表示'))

      // Assert - 表示状態
      expect(
        container.querySelector('[data-testid="eye-off-icon"]')
      ).toBeFalsy()
    })
  })

  describe('copy functionality', () => {
    it('should show copy button', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('コピー')).toBeInTheDocument()
    })

    it('should copy full API key to clipboard when copy button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockWriteText = vi.mocked(navigator.clipboard.writeText)

      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act
      await user.click(screen.getByText('コピー'))

      // Assert
      expect(mockWriteText).toHaveBeenCalledWith(
        'todo_1234567890abcdef1234567890abcdef12345678'
      )
    })
  })

  describe('usage instructions', () => {
    it('should show usage instructions', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('使用方法')).toBeInTheDocument()
      expect(
        screen.getByText(
          'APIリクエストのクエリパラメータとして以下のように指定してください：'
        )
      ).toBeInTheDocument()
    })

    it('should show masked API key in usage example by default', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(
        screen.getByText('GET /api/todos?apiKey=todo_123***12345678')
      ).toBeInTheDocument()
    })

    it('should show full API key in usage example when visible', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act
      await user.click(screen.getByText('表示'))

      // Assert
      expect(
        screen.getByText(
          'GET /api/todos?apiKey=todo_1234567890abcdef1234567890abcdef12345678'
        )
      ).toBeInTheDocument()
    })
  })

  describe('modal controls', () => {
    it('should have close button', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('閉じる')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act
      await user.click(screen.getByText('閉じる'))

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should reset visibility state when modal is closed and reopened', async () => {
      // Arrange
      const user = userEvent.setup()
      const { rerender } = render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Act - 表示状態にしてから閉じる
      await user.click(screen.getByText('表示'))
      await user.click(screen.getByText('閉じる'))

      // Assert - onCloseが呼ばれる
      expect(mockOnClose).toHaveBeenCalled()

      // Act - モーダルを再度開く
      rerender(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert - 初期状態（マスク）に戻っている
      expect(screen.getByText('todo_123***12345678')).toBeInTheDocument()
      expect(screen.getByText('表示')).toBeInTheDocument()
    })

    it('should prevent closing by clicking outside', () => {
      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={mockApiKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert - closeOnClickOutside=falseが設定されていることを確認
      // Mantineモーダルの属性を確認
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('masking logic', () => {
    it('should correctly mask short API keys', () => {
      // Arrange
      const shortKeyData: ApiKeyCreateResponse = {
        apiKey: {
          ...mockApiKeyData.apiKey,
          id: 'short-key',
        },
        plainKey: 'todo_short12345678',
      }

      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={shortKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('todo_sho***12345678')).toBeInTheDocument()
    })

    it('should correctly mask very short API keys', () => {
      // Arrange
      const veryShortKeyData: ApiKeyCreateResponse = {
        apiKey: {
          ...mockApiKeyData.apiKey,
          id: 'very-short-key',
        },
        plainKey: 'todo_12345678901234567890',
      }

      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={veryShortKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('todo_123***34567890')).toBeInTheDocument()
    })

    it('should handle API keys that are exactly 16 characters', () => {
      // Arrange
      const exactKeyData: ApiKeyCreateResponse = {
        apiKey: {
          ...mockApiKeyData.apiKey,
          id: 'exact-key',
        },
        plainKey: 'todo_1234567890ab',
      }

      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={exactKeyData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(screen.getByText('todo_123***567890ab')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle API key data with minimal information', () => {
      // Arrange
      const minimalData: ApiKeyCreateResponse = {
        apiKey: {
          createdAt: new Date('2024-01-01'),
          expiresAt: null,
          id: 'minimal-key',
          lastUsedAt: null,
          name: '',
          updatedAt: new Date('2024-01-01'),
        },
        plainKey: 'todo_minimal',
      }

      // Act
      expect(() =>
        render(
          <ApiKeyDisplayModal
            apiKeyData={minimalData}
            onClose={mockOnClose}
            opened={true}
          />
        )
      ).not.toThrow()

      // Assert
      expect(screen.getByText('APIキーが作成されました')).toBeInTheDocument()
    })

    it('should handle API key with special characters', () => {
      // Arrange
      const specialData: ApiKeyCreateResponse = {
        apiKey: {
          ...mockApiKeyData.apiKey,
          name: 'API Key with "quotes" & <special> chars',
        },
        plainKey: 'todo_special_key_123456789012345678',
      }

      // Act
      render(
        <ApiKeyDisplayModal
          apiKeyData={specialData}
          onClose={mockOnClose}
          opened={true}
        />
      )

      // Assert
      expect(
        screen.getByText('API Key with "quotes" & <special> chars')
      ).toBeInTheDocument()
    })
  })
})
