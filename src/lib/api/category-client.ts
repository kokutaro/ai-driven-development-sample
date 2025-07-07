import { type ApiResponse, type Category } from '@/types/todo'

/**
 * カテゴリAPIクライアント
 *
 * カテゴリに関するAPI操作を提供します。
 */
export const categoryClient = {
  /**
   * カテゴリを作成
   *
   * @param categoryData カテゴリ作成データ
   * @returns 作成されたカテゴリのAPIレスポンス
   */
  async createCategory(categoryData: {
    color: string
    name: string
  }): Promise<ApiResponse<Category>> {
    try {
      const response = await fetch('/api/categories', {
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json() as Promise<ApiResponse<Category>>
    } catch (error) {
      console.error('カテゴリ作成API呼び出しエラー:', error)
      throw error
    }
  },

  /**
   * カテゴリを削除
   *
   * @param id カテゴリID
   * @returns 削除結果のAPIレスポンス
   */
  async deleteCategory(
    id: string
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json() as Promise<
        ApiResponse<{ deleted: boolean; id: string }>
      >
    } catch (error) {
      console.error('カテゴリ削除API呼び出しエラー:', error)
      throw error
    }
  },

  /**
   * カテゴリ一覧を取得
   *
   * @returns カテゴリ一覧のAPIレスポンス
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json() as Promise<ApiResponse<Category[]>>
    } catch (error) {
      console.error('カテゴリ取得API呼び出しエラー:', error)
      throw error
    }
  },

  /**
   * カテゴリを更新
   *
   * @param id カテゴリID
   * @param categoryData カテゴリ更新データ
   * @returns 更新されたカテゴリのAPIレスポンス
   */
  async updateCategory(
    id: string,
    categoryData: { color?: string; name?: string }
  ): Promise<ApiResponse<Category>> {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        body: JSON.stringify(categoryData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json() as Promise<ApiResponse<Category>>
    } catch (error) {
      console.error('カテゴリ更新API呼び出しエラー:', error)
      throw error
    }
  },
}
