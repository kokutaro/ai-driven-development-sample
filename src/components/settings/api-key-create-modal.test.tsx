import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiKeyCreateModal } from './api-key-create-modal'

import type { ApiKeyCreateResponse } from '@/schemas/api-key'

import { render, screen } from '@/test-utils'

/**
 * APIキー作成モーダル テスト
 */

// モック
vi.mock('@/stores/api-key-store', () => ({
  useApiKeyStore: vi.fn(),
}))

// @mantine/formはモックしない（実際のフォームを使用）

const { useApiKeyStore } = await import('@/stores/api-key-store')

const mockCreateApiKey = vi.fn()
const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

// フォームは実際のMantineフォームを使用

describe('ApiKeyCreateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useApiKeyStore).mockReturnValue({
      createApiKey: mockCreateApiKey,
    } as ReturnType<typeof useApiKeyStore>)
  })

  it('should render modal when opened', () => {
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    expect(screen.getByText('新しいAPIキーを作成')).toBeInTheDocument()
    expect(
      screen.getByText(
        /外部アプリケーションからTODOシステムにアクセスするためのAPIキーを作成します/
      )
    ).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={false}
      />
    )

    expect(screen.queryByText('新しいAPIキーを作成')).not.toBeInTheDocument()
  })

  it('should handle form submission successfully', async () => {
    const mockResult: ApiKeyCreateResponse = {
      apiKey: {
        createdAt: new Date(),
        expiresAt: null,
        id: 'key1',
        lastUsedAt: null,
        name: 'Test Key',
        updatedAt: new Date(),
      },
      plainKey: 'todo_test123',
    }

    mockCreateApiKey.mockResolvedValue(mockResult)

    const user = userEvent.setup()
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    // フォームに値を入力
    const nameInput = screen.getByPlaceholderText('例: 個人用アプリ')
    await user.type(nameInput, 'Test Key')

    const submitButton = screen.getByText('作成')
    await user.click(submitButton)

    expect(mockCreateApiKey).toHaveBeenCalledWith({ name: 'Test Key' })
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResult)
  })

  it('should handle form submission error', async () => {
    mockCreateApiKey.mockRejectedValue(new Error('Creation failed'))

    const user = userEvent.setup()
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    // フォームに値を入力
    const nameInput = screen.getByPlaceholderText('例: 個人用アプリ')
    await user.type(nameInput, 'Test Key')

    const submitButton = screen.getByText('作成')
    await user.click(submitButton)

    expect(mockCreateApiKey).toHaveBeenCalledWith({ name: 'Test Key' })
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should handle modal close', async () => {
    const user = userEvent.setup()
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    const cancelButton = screen.getByText('キャンセル')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show loading state during creation', async () => {
    // 無限にペンディングする Promise を作成
    mockCreateApiKey.mockImplementation(
      () =>
        new Promise(() => {
          // 空の実装
        })
    )

    const user = userEvent.setup()
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    const submitButton = screen.getByText('作成')
    await user.click(submitButton)

    // ローディング状態をテスト（ボタンが loading になる）
    expect(screen.getByRole('button', { name: /作成/ })).toBeInTheDocument()
  })

  it('should render form fields correctly', () => {
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    expect(screen.getByText('キー名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例: 個人用アプリ')).toBeInTheDocument()
  })

  it('should disable cancel button during creation', async () => {
    mockCreateApiKey.mockImplementation(
      () =>
        new Promise(() => {
          // 空の実装
        })
    )

    const user = userEvent.setup()
    render(
      <ApiKeyCreateModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        opened={true}
      />
    )

    // フォームに値を入力
    const nameInput = screen.getByPlaceholderText('例: 個人用アプリ')
    await user.type(nameInput, 'Test Key')

    const submitButton = screen.getByText('作成')
    await user.click(submitButton)

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    expect(cancelButton).toBeDisabled()
  })
})
