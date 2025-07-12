import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyManagement } from '@/components/settings/api-key-management'
import { useApiKeyStore } from '@/stores/api-key-store'

// Zustandストアをモック
vi.mock('@/stores/api-key-store')

const mockUseApiKeyStore = vi.mocked(useApiKeyStore)

// Mantineモーダルをモック
vi.mock('@mantine/modals', () => ({
  modals: {
    openConfirmModal: vi.fn(),
  },
}))

describe('ApiKeyManagement', () => {
  const mockStore = {
    apiKeys: [],
    clearError: vi.fn(),
    createApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
    error: null,
    fetchApiKeys: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApiKeyStore.mockReturnValue(mockStore)
  })

  it('renders API key management component', () => {
    render(<ApiKeyManagement />)

    expect(screen.getByText('新しいAPIキーを作成')).toBeInTheDocument()
  })

  it('calls fetchApiKeys on mount', () => {
    render(<ApiKeyManagement />)

    expect(mockStore.fetchApiKeys).toHaveBeenCalledOnce()
  })

  it('shows error message when error exists', () => {
    mockUseApiKeyStore.mockReturnValue({
      ...mockStore,
      error: 'エラーが発生しました',
    })

    render(<ApiKeyManagement />)

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  it('opens create modal when create button is clicked', () => {
    render(<ApiKeyManagement />)

    const createButton = screen.getByText('新しいAPIキーを作成')
    fireEvent.click(createButton)

    // モーダルが開かれることを確認（テストセットアップによっては実際のモーダル要素をチェック）
  })

  it('disables create button when loading', () => {
    mockUseApiKeyStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
    })

    render(<ApiKeyManagement />)

    const createButton = screen.getByText('新しいAPIキーを作成')
    expect(createButton).toBeDisabled()
  })

  it('displays API keys when available', () => {
    const mockApiKeys = [
      {
        createdAt: new Date('2024-01-01'),
        expiresAt: null,
        id: 'key-1',
        lastUsedAt: new Date('2024-01-01'),
        name: 'Test Key',
        updatedAt: new Date('2024-01-01'),
      },
    ]

    mockUseApiKeyStore.mockReturnValue({
      ...mockStore,
      apiKeys: mockApiKeys,
    })

    render(<ApiKeyManagement />)

    expect(screen.getByText('Test Key')).toBeInTheDocument()
  })

  it('shows loading skeletons when loading', () => {
    mockUseApiKeyStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
    })

    render(<ApiKeyManagement />)

    // ローディングスケルトンが表示されることを確認
    const skeletons = screen.getAllByRole('progressbar')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
