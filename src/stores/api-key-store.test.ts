import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useApiKeyStore } from './api-key-store'

import type {
  ApiKeyCreateInput,
  ApiKeyCreateResponse,
  ApiKeyResponse,
} from '@/schemas/api-key'

/**
 * APIキーストア テスト
 *
 * useApiKeyStoreの全機能をテストし、100%カバレッジを達成します。
 * - 初期状態のテスト
 * - fetchApiKeys関数のテスト（正常系・異常系）
 * - createApiKey関数のテスト（正常系・異常系）
 * - deleteApiKey関数のテスト（正常系・異常系）
 * - clearError関数のテスト
 */

// モックAPIキーデータ
const mockApiKeyResponse: ApiKeyResponse = {
  createdAt: new Date('2024-01-01'),
  expiresAt: null,
  id: 'test-api-key-id',
  lastUsedAt: null,
  name: 'Test API Key',
  updatedAt: new Date('2024-01-01'),
}

const mockApiKeyCreateResponse: ApiKeyCreateResponse = {
  apiKey: mockApiKeyResponse,
  plainKey: 'todo_test-plain-key-12345',
}

// fetchのモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useApiKeyStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useApiKeyStore.setState({
      apiKeys: [],
      error: undefined,
      isLoading: false,
    })
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { apiKeys, error, isLoading } = useApiKeyStore.getState()

      expect(apiKeys).toEqual([])
      expect(error).toBeUndefined()
      expect(isLoading).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      // エラー状態にセット
      useApiKeyStore.setState({ error: 'テストエラー' })

      const { clearError } = useApiKeyStore.getState()
      clearError()

      expect(useApiKeyStore.getState().error).toBeUndefined()
    })
  })

  describe('fetchApiKeys', () => {
    it('should fetch API keys successfully', async () => {
      const mockResponse = {
        data: [mockApiKeyResponse],
        ok: true,
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
      })

      const { fetchApiKeys } = useApiKeyStore.getState()
      await fetchApiKeys()

      const state = useApiKeyStore.getState()
      expect(state.apiKeys).toEqual([mockApiKeyResponse])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeUndefined()
    })

    it('should handle fetch API keys failure with error message', async () => {
      const errorMessage = 'カスタムエラーメッセージ'
      const mockErrorResponse = {
        error: { message: errorMessage },
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { fetchApiKeys } = useApiKeyStore.getState()
      await fetchApiKeys()

      const state = useApiKeyStore.getState()
      expect(state.error).toBe(errorMessage)
      expect(state.isLoading).toBe(false)
    })

    it('should handle fetch API keys failure without error message', async () => {
      const mockErrorResponse = {
        error: {},
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { fetchApiKeys } = useApiKeyStore.getState()
      await fetchApiKeys()

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの取得に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should handle fetch API keys network error', async () => {
      const networkError = new Error('ネットワークエラー')
      mockFetch.mockRejectedValueOnce(networkError)

      const { fetchApiKeys } = useApiKeyStore.getState()
      await fetchApiKeys()

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('ネットワークエラー')
      expect(state.isLoading).toBe(false)
    })

    it('should handle fetch API keys with non-Error exception', async () => {
      const nonErrorException = 'string error'
      mockFetch.mockRejectedValueOnce(nonErrorException)

      const { fetchApiKeys } = useApiKeyStore.getState()
      await fetchApiKeys()

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの取得に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should set isLoading to true during fetch', () => {
      // fetchが進行中の状態をテスト
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            // 一時的に遅延させてisLoadingをテスト
            setTimeout(() => {
              resolve({
                json: vi.fn().mockResolvedValue({ data: [] }),
                ok: true,
              })
            }, 0)
          })
      )

      const { fetchApiKeys } = useApiKeyStore.getState()
      void fetchApiKeys()

      // fetchが開始された直後はisLoadingがtrueになるはず
      expect(useApiKeyStore.getState().isLoading).toBe(true)
    })
  })

  describe('createApiKey', () => {
    const createInput: ApiKeyCreateInput = {
      name: 'Test Key',
    }

    it('should create API key successfully', async () => {
      const mockResponse = {
        data: mockApiKeyCreateResponse,
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
      })

      const { createApiKey } = useApiKeyStore.getState()
      const result = await createApiKey(createInput)

      expect(result).toEqual(mockApiKeyCreateResponse)

      const state = useApiKeyStore.getState()
      expect(state.apiKeys).toEqual([mockApiKeyResponse])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeUndefined()
    })

    it('should handle create API key failure with error message', async () => {
      const errorMessage = 'カスタム作成エラー'
      const mockErrorResponse = {
        error: { message: errorMessage },
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { createApiKey } = useApiKeyStore.getState()

      await expect(createApiKey(createInput)).rejects.toThrow(errorMessage)

      const state = useApiKeyStore.getState()
      expect(state.error).toBe(errorMessage)
      expect(state.isLoading).toBe(false)
    })

    it('should handle create API key failure without error message', async () => {
      const mockErrorResponse = {
        error: {},
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { createApiKey } = useApiKeyStore.getState()

      await expect(createApiKey(createInput)).rejects.toThrow(
        'APIキーの作成に失敗しました'
      )

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの作成に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should handle create API key network error', async () => {
      const networkError = new Error('ネットワークエラー')
      mockFetch.mockRejectedValueOnce(networkError)

      const { createApiKey } = useApiKeyStore.getState()

      await expect(createApiKey(createInput)).rejects.toThrow(
        'ネットワークエラー'
      )

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('ネットワークエラー')
      expect(state.isLoading).toBe(false)
    })

    it('should handle create API key with non-Error exception', async () => {
      const nonErrorException = 'string error'
      mockFetch.mockRejectedValueOnce(nonErrorException)

      const { createApiKey } = useApiKeyStore.getState()

      await expect(createApiKey(createInput)).rejects.toThrow(
        'APIキーの作成に失敗しました'
      )

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの作成に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should add new API key to the beginning of the list', async () => {
      // 既存のキーをセット
      const existingKey: ApiKeyResponse = {
        ...mockApiKeyResponse,
        id: 'existing-key-id',
        name: 'Existing Key',
      }
      useApiKeyStore.setState({ apiKeys: [existingKey] })

      const mockResponse = {
        data: mockApiKeyCreateResponse,
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
      })

      const { createApiKey } = useApiKeyStore.getState()
      await createApiKey(createInput)

      const state = useApiKeyStore.getState()
      expect(state.apiKeys).toEqual([mockApiKeyResponse, existingKey])
    })

    it('should clear error before creating API key', async () => {
      // 既存のエラーをセット
      useApiKeyStore.setState({ error: '既存のエラー' })

      const mockResponse = {
        data: mockApiKeyCreateResponse,
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockResponse),
        ok: true,
      })

      const { createApiKey } = useApiKeyStore.getState()
      await createApiKey(createInput)

      const state = useApiKeyStore.getState()
      expect(state.error).toBeUndefined()
    })
  })

  describe('deleteApiKey', () => {
    const apiKeyId = 'test-api-key-id'

    beforeEach(() => {
      // 削除対象のキーを含む初期状態をセット
      useApiKeyStore.setState({
        apiKeys: [
          mockApiKeyResponse,
          {
            ...mockApiKeyResponse,
            id: 'other-key-id',
            name: 'Other Key',
          },
        ],
      })
    })

    it('should delete API key successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({}),
        ok: true,
      })

      const { deleteApiKey } = useApiKeyStore.getState()
      await deleteApiKey(apiKeyId)

      const state = useApiKeyStore.getState()
      expect(state.apiKeys).toHaveLength(1)
      expect(state.apiKeys[0].id).toBe('other-key-id')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeUndefined()
    })

    it('should handle delete API key failure with error message', async () => {
      const errorMessage = 'カスタム削除エラー'
      const mockErrorResponse = {
        error: { message: errorMessage },
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { deleteApiKey } = useApiKeyStore.getState()

      await expect(deleteApiKey(apiKeyId)).rejects.toThrow(errorMessage)

      const state = useApiKeyStore.getState()
      expect(state.error).toBe(errorMessage)
      expect(state.isLoading).toBe(false)
    })

    it('should handle delete API key failure without error message', async () => {
      const mockErrorResponse = {
        error: {},
      }

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
        ok: false,
      })

      const { deleteApiKey } = useApiKeyStore.getState()

      await expect(deleteApiKey(apiKeyId)).rejects.toThrow(
        'APIキーの削除に失敗しました'
      )

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの削除に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should handle delete API key network error', async () => {
      const networkError = new Error('ネットワークエラー')
      mockFetch.mockRejectedValueOnce(networkError)

      const { deleteApiKey } = useApiKeyStore.getState()

      await expect(deleteApiKey(apiKeyId)).rejects.toThrow('ネットワークエラー')

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('ネットワークエラー')
      expect(state.isLoading).toBe(false)
    })

    it('should handle delete API key with non-Error exception', async () => {
      const nonErrorException = 'string error'
      mockFetch.mockRejectedValueOnce(nonErrorException)

      const { deleteApiKey } = useApiKeyStore.getState()

      await expect(deleteApiKey(apiKeyId)).rejects.toThrow(
        'APIキーの削除に失敗しました'
      )

      const state = useApiKeyStore.getState()
      expect(state.error).toBe('APIキーの削除に失敗しました')
      expect(state.isLoading).toBe(false)
    })

    it('should clear error before deleting API key', async () => {
      // 既存のエラーをセット
      useApiKeyStore.setState({ error: '既存のエラー' })

      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({}),
        ok: true,
      })

      const { deleteApiKey } = useApiKeyStore.getState()
      await deleteApiKey(apiKeyId)

      const state = useApiKeyStore.getState()
      expect(state.error).toBeUndefined()
    })
  })
})
