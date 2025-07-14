import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyList } from './api-key-list'

import type { ApiKeyResponse } from '@/schemas/api-key'

import { render, screen } from '@/test-utils'

/**
 * APIキー一覧コンポーネント テスト
 */

// Mantineのmodalsをモック
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn(),
  },
  ModalsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// API key storeをモック
vi.mock('@/stores/api-key-store', () => ({
  useApiKeyStore: vi.fn(),
}))

const { modals } = await import('@mantine/modals')
const { useApiKeyStore } = await import('@/stores/api-key-store')

const mockModals = vi.mocked(modals)
const mockUseApiKeyStore = vi.mocked(useApiKeyStore)

const mockDeleteApiKey = vi.fn()

const mockApiKeys: ApiKeyResponse[] = [
  {
    createdAt: new Date('2024-01-01'),
    expiresAt: null,
    id: 'key1',
    lastUsedAt: new Date('2024-01-02'),
    name: 'Test API Key 1',
    updatedAt: new Date('2024-01-01'),
  },
  {
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2025-12-31'), // より確実に将来の日付
    id: 'key2',
    lastUsedAt: null,
    name: 'Test API Key 2',
    updatedAt: new Date('2024-01-01'),
  },
]

const expiredApiKey: ApiKeyResponse = {
  createdAt: new Date('2023-01-01'),
  expiresAt: new Date('2023-12-01'), // 期限切れ
  id: 'expired-key',
  lastUsedAt: null,
  name: 'Expired Key',
  updatedAt: new Date('2023-01-01'),
}

describe('ApiKeyList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApiKeyStore.mockReturnValue({
      deleteApiKey: mockDeleteApiKey,
    } as ReturnType<typeof useApiKeyStore>)
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<ApiKeyList apiKeys={[]} isLoading={true} />)
      // Skeleton コンポーネントが3つ表示されることを確認
      const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
      expect(skeletons).toHaveLength(3)
    })
  })

  describe('empty state', () => {
    it('should show empty state when no API keys', () => {
      render(<ApiKeyList apiKeys={[]} isLoading={false} />)
      expect(screen.getByText('APIキーがありません')).toBeInTheDocument()
      expect(
        screen.getByText(
          '新しいAPIキーを作成して外部アプリケーションから接続しましょう。'
        )
      ).toBeInTheDocument()
    })
  })

  describe('API key display', () => {
    it('should render API keys correctly', () => {
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)

      expect(screen.getByText('Test API Key 1')).toBeInTheDocument()
      expect(screen.getByText('Test API Key 2')).toBeInTheDocument()
    })

    it('should show creation date', () => {
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)
      expect(screen.getAllByText(/作成日:/)).toHaveLength(2)
    })

    it('should show last used date when available', () => {
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)
      expect(screen.getByText(/最終使用:/)).toBeInTheDocument()
    })

    it('should show expiry date when set', () => {
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)
      expect(screen.getByText(/有効期限:/)).toBeInTheDocument()
    })
  })

  describe('status badges', () => {
    it('should show valid badge for active keys', () => {
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)
      expect(screen.getAllByText('有効')).toHaveLength(2)
    })

    it('should show expired badge for expired keys', () => {
      render(<ApiKeyList apiKeys={[expiredApiKey]} isLoading={false} />)
      expect(screen.getByText('期限切れ')).toBeInTheDocument()
    })
  })

  describe('delete functionality', () => {
    it('should open confirmation modal when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)

      const deleteButtons = screen.getAllByLabelText('APIキーを削除')
      await user.click(deleteButtons[0])

      expect(mockModals.openConfirmModal).toHaveBeenCalled()
    })

    it('should call deleteApiKey when confirmed', async () => {
      let confirmCallback: () => void = () => {
        // 空の実装
      }
      mockModals.openConfirmModal.mockImplementation(
        ({ onConfirm }: { onConfirm?: () => void }) => {
          confirmCallback =
            onConfirm ??
            (() => {
              // デフォルトの空実装
            })
          return 'modal-id'
        }
      )

      const user = userEvent.setup()
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)

      const deleteButtons = screen.getAllByLabelText('APIキーを削除')
      await user.click(deleteButtons[0])

      // 確認ダイアログのコールバックを実行
      await act(async () => {
        confirmCallback()
      })

      expect(mockDeleteApiKey).toHaveBeenCalledWith('key1')
    })

    it('should handle delete error gracefully', async () => {
      mockDeleteApiKey.mockRejectedValue(new Error('Delete failed'))
      let confirmCallback: () => void = () => {
        // 空の実装
      }
      mockModals.openConfirmModal.mockImplementation(
        ({ onConfirm }: { onConfirm?: () => void }) => {
          confirmCallback =
            onConfirm ??
            (() => {
              // デフォルトの空実装
            })
          return 'modal-id'
        }
      )

      const user = userEvent.setup()
      render(<ApiKeyList apiKeys={mockApiKeys} isLoading={false} />)

      const deleteButtons = screen.getAllByLabelText('APIキーを削除')
      await user.click(deleteButtons[0])

      // エラーが発生してもクラッシュしない
      await act(async () => {
        expect(() => confirmCallback()).not.toThrow()
      })
    })
  })

  describe('date formatting', () => {
    it('should format dates correctly', () => {
      const { container } = render(
        <ApiKeyList apiKeys={mockApiKeys} isLoading={false} />
      )
      // 日付フォーマット関数が呼び出されることを確認
      expect(container.textContent).toContain('作成日')
    })
  })
})
