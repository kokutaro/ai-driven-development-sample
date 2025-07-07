import { type ApiResponse, type SubTask } from '@/types/todo'

/**
 * サブタスクAPI クライアント
 *
 * サブタスクのCRUD操作を提供します。
 */
export const subTaskClient = {
  /**
   * 新しいサブタスクを作成
   *
   * @param todoId - TODO ID
   * @param data - サブタスクデータ
   * @returns 作成されたサブタスク
   */
  async createSubTask(
    todoId: string,
    data: { title: string }
  ): Promise<ApiResponse<SubTask>> {
    const response = await fetch(`/api/todos/${todoId}/subtasks`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`サブタスクの作成に失敗しました: ${response.status}`)
    }

    return response.json() as Promise<ApiResponse<SubTask>>
  },

  /**
   * サブタスクを削除
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @returns 削除結果
   */
  async deleteSubTask(
    todoId: string,
    subTaskId: string
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    const response = await fetch(`/api/todos/${todoId}/subtasks/${subTaskId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`サブタスクの削除に失敗しました: ${response.status}`)
    }

    return response.json() as Promise<
      ApiResponse<{ deleted: boolean; id: string }>
    >
  },

  /**
   * 指定されたTODOのサブタスク一覧を取得
   *
   * @param todoId - TODO ID
   * @returns サブタスク一覧
   */
  async getSubTasks(todoId: string): Promise<ApiResponse<SubTask[]>> {
    const response = await fetch(`/api/todos/${todoId}/subtasks`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`サブタスクの取得に失敗しました: ${response.status}`)
    }

    return response.json() as Promise<ApiResponse<SubTask[]>>
  },

  /**
   * サブタスクの完了状態を切り替え
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @returns 更新されたサブタスク
   */
  async toggleSubTask(
    todoId: string,
    subTaskId: string
  ): Promise<ApiResponse<SubTask>> {
    const response = await fetch(`/api/todos/${todoId}/subtasks/${subTaskId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    if (!response.ok) {
      throw new Error(`サブタスクの切り替えに失敗しました: ${response.status}`)
    }

    return response.json() as Promise<ApiResponse<SubTask>>
  },

  /**
   * サブタスクを更新
   *
   * @param todoId - TODO ID
   * @param subTaskId - サブタスク ID
   * @param data - 更新データ
   * @returns 更新されたサブタスク
   */
  async updateSubTask(
    todoId: string,
    subTaskId: string,
    data: Partial<SubTask>
  ): Promise<ApiResponse<SubTask>> {
    const response = await fetch(`/api/todos/${todoId}/subtasks/${subTaskId}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    })

    if (!response.ok) {
      throw new Error(`サブタスクの更新に失敗しました: ${response.status}`)
    }

    return response.json() as Promise<ApiResponse<SubTask>>
  },
}
