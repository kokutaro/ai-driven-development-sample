import { apiClient } from './api-client'

import type { ApiResponse, Category } from '@/types/todo'

/**
 * カテゴリAPIクライアント
 *
 * カテゴリに関するAPI操作を提供します。
 * 401エラー時の自動サインインページリダイレクトと
 * 統一されたエラーハンドリングを提供します。
 */
export const categoryClient = {
  /**
   * カテゴリを作成
   *
   * @param categoryData - カテゴリ作成データ
   * @returns 作成されたカテゴリのAPIレスポンス
   */
  async createCategory(categoryData: {
    color: string
    name: string
  }): Promise<ApiResponse<Category>> {
    const data = await apiClient.post<Category>('/api/categories', categoryData)
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * カテゴリを削除
   *
   * @param id - カテゴリID
   * @returns 削除結果のAPIレスポンス
   */
  async deleteCategory(
    id: string
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    const data = await apiClient.delete<{ deleted: boolean; id: string }>(
      `/api/categories/${id}`
    )
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * カテゴリ一覧を取得
   *
   * @returns カテゴリ一覧のAPIレスポンス
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const data = await apiClient.get<Category[]>('/api/categories')
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * カテゴリを更新
   *
   * @param id - カテゴリID
   * @param categoryData - カテゴリ更新データ
   * @returns 更新されたカテゴリのAPIレスポンス
   */
  async updateCategory(
    id: string,
    categoryData: { color?: string; name?: string }
  ): Promise<ApiResponse<Category>> {
    const data = await apiClient.put<Category>(
      `/api/categories/${id}`,
      categoryData
    )
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },
}
