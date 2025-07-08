import { apiClient } from './api-client'

import type { ApiResponse, SubTask } from '@/types/todo'

/**
 * サブタスクAPI クライアント
 *
 * サブタスクのCRUD操作を提供します。
 * 401エラー時の自動サインインページリダイレクトと
 * 統一されたエラーハンドリングを提供します。
 */
export const subTaskClient = {
  /**
   * 新しいサブタスクを作成
   *
   * @param todoId - TODO ID
   * @param data - サブタスクデータ
   * @returns 作成されたサブタスクのAPIレスポンス
   */
  async createSubTask(
    todoId: string,
    data: { title: string }
  ): Promise<ApiResponse<SubTask>> {
    const result = await apiClient.post<SubTask>(
      `/api/todos/${todoId}/subtasks`,
      data
    )
    return {
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * サブタスクを削除
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @returns 削除結果のAPIレスポンス
   */
  async deleteSubTask(
    todoId: string,
    subTaskId: string
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    const result = await apiClient.delete<{ deleted: boolean; id: string }>(
      `/api/todos/${todoId}/subtasks/${subTaskId}`
    )
    return {
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * 指定されたTODOのサブタスク一覧を取得
   *
   * @param todoId - TODO ID
   * @returns サブタスク一覧のAPIレスポンス
   */
  async getSubTasks(todoId: string): Promise<ApiResponse<SubTask[]>> {
    const result = await apiClient.get<SubTask[]>(
      `/api/todos/${todoId}/subtasks`
    )
    return {
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * サブタスクの完了状態を切り替え
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @returns 更新されたサブタスクのAPIレスポンス
   */
  async toggleSubTask(
    todoId: string,
    subTaskId: string
  ): Promise<ApiResponse<SubTask>> {
    const result = await apiClient.patch<SubTask>(
      `/api/todos/${todoId}/subtasks/${subTaskId}`
    )
    return {
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  /**
   * サブタスクを更新
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @param data - 更新データ
   * @returns 更新されたサブタスクのAPIレスポンス
   */
  async updateSubTask(
    todoId: string,
    subTaskId: string,
    data: Partial<SubTask>
  ): Promise<ApiResponse<SubTask>> {
    const result = await apiClient.put<SubTask>(
      `/api/todos/${todoId}/subtasks/${subTaskId}`,
      data
    )
    return {
      data: result,
      success: true,
      timestamp: new Date().toISOString(),
    }
  },
}
