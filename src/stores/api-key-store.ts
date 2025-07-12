import { create } from 'zustand'

import type {
  ApiKeyCreateInput,
  ApiKeyCreateResponse,
  ApiKeyResponse,
} from '@/schemas/api-key'

interface ApiKeyStore {
  apiKeys: ApiKeyResponse[]
  clearError: () => void
  createApiKey: (data: ApiKeyCreateInput) => Promise<ApiKeyCreateResponse>

  deleteApiKey: (id: string) => Promise<void>
  error: string | undefined
  // Actions
  fetchApiKeys: () => Promise<void>
  isLoading: boolean
}

/**
 * APIキー管理用Zustandストア
 *
 * APIキーの状態とアクションを管理します。
 * - APIキーの一覧取得
 * - APIキーの作成
 * - APIキーの削除
 * - エラー処理
 */
export const useApiKeyStore = create<ApiKeyStore>((set, _get) => ({
  apiKeys: [],
  clearError: () => set({ error: undefined }),
  createApiKey: async (data: ApiKeyCreateInput) => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch('/api/api-keys', {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string }
        }
        throw new Error(
          errorData.error?.message ?? 'APIキーの作成に失敗しました'
        )
      }

      const responseData = await response.json()
      const result: ApiKeyCreateResponse = responseData.data

      // 新しいAPIキーを一覧に追加
      set((state) => ({
        apiKeys: [result.apiKey, ...state.apiKeys],
        isLoading: false,
      }))

      return result
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'APIキーの作成に失敗しました',
        isLoading: false,
      })
      throw error
    }
  },

  deleteApiKey: async (id: string) => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string }
        }
        throw new Error(
          errorData.error?.message ?? 'APIキーの削除に失敗しました'
        )
      }

      // 削除されたAPIキーを一覧から除外
      set((state) => ({
        apiKeys: state.apiKeys.filter((key) => key.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'APIキーの削除に失敗しました',
        isLoading: false,
      })
      throw error
    }
  },

  error: undefined,

  fetchApiKeys: async () => {
    set({ error: undefined, isLoading: true })
    try {
      const response = await fetch('/api/api-keys')
      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string }
        }
        throw new Error(
          errorData.error?.message ?? 'APIキーの取得に失敗しました'
        )
      }

      const data = await response.json()
      set({ apiKeys: data.data, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'APIキーの取得に失敗しました',
        isLoading: false,
      })
    }
  },

  isLoading: false,
}))
