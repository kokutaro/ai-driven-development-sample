import type { ApiResponse, TodoStats } from '@/types/api'

/**
 * 統計情報 API クライアント
 *
 * 統計情報に関するAPI通信を行うクライアントです。
 */
export const statsClient = {
  /**
   * TODO統計情報を取得する
   *
   * @returns TODO統計情報のAPIレスポンス
   * @throws エラーが発生した場合は例外をスローします
   */
  async getTodoStats(): Promise<ApiResponse<TodoStats>> {
    const response = await fetch('/api/stats/todos')
    return response.json() as Promise<ApiResponse<TodoStats>>
  },
}
