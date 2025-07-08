import { apiClient } from './api-client'

import type { Todo, TodoListResponse, UpdateTodoApiData } from '@/types/todo'

export interface GetTodosParams {
  [key: string]: boolean | number | string | undefined
  categoryId?: string
  filter?: string
  limit?: number
  page?: number
  sortBy?: string
  sortOrder?: string
}

/**
 * TODO API クライアント
 *
 * TODOに関するAPI通信を行うクライアントです。
 * 401エラー時の自動サインインページリダイレクトと
 * 統一されたエラーハンドリングを提供します。
 */
export const todoClient = {
  /**
   * 新しいTODOを作成する
   *
   * @param data - TODO作成データ
   * @returns 作成されたTODO
   */
  async createTodo(data: Partial<Todo>): Promise<Todo> {
    return apiClient.post<Todo>('/api/todos', data)
  },

  /**
   * TODOを削除する
   *
   * @param id - TODO ID
   * @returns 削除結果
   */
  async deleteTodo(id: string): Promise<{ deleted: boolean; id: string }> {
    return apiClient.delete<{ deleted: boolean; id: string }>(
      `/api/todos/${id}`
    )
  },

  /**
   * TODOリストを取得する
   *
   * @param params - 検索・フィルタパラメータ
   * @returns TODOリストレスポンス
   */
  async getTodos(params: GetTodosParams = {}): Promise<TodoListResponse> {
    return apiClient.get<TodoListResponse>('/api/todos', params)
  },

  /**
   * TODOの完了状態を切り替える
   *
   * @param id - TODO ID
   * @returns 更新されたTODO
   */
  async toggleTodo(id: string): Promise<Todo> {
    return apiClient.patch<Todo>(`/api/todos/${id}/toggle`)
  },

  /**
   * TODOを更新する
   *
   * @param id - TODO ID
   * @param data - 更新データ
   * @returns 更新されたTODO
   */
  async updateTodo(id: string, data: UpdateTodoApiData): Promise<Todo> {
    return apiClient.put<Todo>(`/api/todos/${id}`, data)
  },
}
