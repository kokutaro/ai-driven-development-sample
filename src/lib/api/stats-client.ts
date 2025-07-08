import { apiClient } from './api-client'

import type { ApiResponse, TodoStats } from '@/types/api'

/**
 * 統計情報 API クライアント
 *
 * 統計情報に関するAPI通信を行うクライアントです。
 * 401エラー時の自動サインインページリダイレクトと
 * 統一されたエラーハンドリングを提供します。
 */
export const statsClient = {
  /**
   * TODO統計情報を取得する
   *
   * @returns TODO統計情報のAPIレスポンス
   * @throws APIClientError - API呼び出しが失敗した場合は例外をスローします
   */
  async getTodoStats(): Promise<ApiResponse<TodoStats>> {
    const data = await apiClient.get<TodoStats>('/api/stats/todos')
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },
}
