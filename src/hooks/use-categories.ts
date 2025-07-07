import { useCallback, useEffect, useState } from 'react'

import { categoryClient } from '@/lib/api/category-client'
import { type Category } from '@/types/todo'

interface UseCategoriesReturn {
  categories: Category[]
  clearError: () => void
  // Actions
  createCategory: (data: { color: string; name: string }) => Promise<void>

  deleteCategory: (id: string) => Promise<void>
  error: string | undefined
  isLoading: boolean
  updateCategory: (
    id: string,
    data: { color?: string; name?: string }
  ) => Promise<void>
}

/**
 * カテゴリデータを管理するカスタムフック
 *
 * カテゴリの取得・作成・更新・削除を提供します。
 *
 * @returns カテゴリデータとCRUD操作関数
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true)
        setError(undefined)
        const response = await categoryClient.getCategories()

        if (response?.data && Array.isArray(response.data)) {
          setCategories(response.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error_) {
        console.error('カテゴリ取得エラー:', error_)
        setError('カテゴリの取得に失敗しました')
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCategories()
  }, [])

  // 新しいカテゴリを作成
  const createCategory = useCallback(
    async (data: { color: string; name: string }) => {
      setError(undefined)

      try {
        const response = await categoryClient.createCategory(data)
        setCategories((prev) => [...prev, response.data])
      } catch {
        setError('カテゴリの作成に失敗しました')
      }
    },
    []
  )

  // カテゴリを更新
  const updateCategory = useCallback(
    async (id: string, data: { color?: string; name?: string }) => {
      setError(undefined)

      try {
        const response = await categoryClient.updateCategory(id, data)
        setCategories((prev) =>
          prev.map((category) =>
            category.id === id ? { ...category, ...response.data } : category
          )
        )
      } catch {
        setError('カテゴリの更新に失敗しました')
      }
    },
    []
  )

  // カテゴリを削除
  const deleteCategory = useCallback(async (id: string) => {
    setError(undefined)

    try {
      await categoryClient.deleteCategory(id)
      setCategories((prev) => prev.filter((category) => category.id !== id))
    } catch {
      setError('カテゴリの削除に失敗しました')
    }
  }, [])

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(undefined)
  }, [])

  return {
    categories,
    clearError,
    createCategory,
    deleteCategory,
    error,
    isLoading,
    updateCategory,
  }
}
