import type { ApiResponse, Todo, TodoListResponse } from '@/types/todo'

export interface GetTodosParams {
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
 */
export const todoClient = {
  /**
   * 新しいTODOを作成する
   */
  async createTodo(data: Partial<Todo>): Promise<ApiResponse<Todo>> {
    const response = await fetch('/api/todos', {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    return response.json() as Promise<ApiResponse<Todo>>
  },

  /**
   * TODOを削除する
   */
  async deleteTodo(
    id: string
  ): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    })
    return response.json() as Promise<
      ApiResponse<{ deleted: boolean; id: string }>
    >
  },

  /**
   * TODOリストを取得する
   */
  async getTodos(
    params: GetTodosParams = {}
  ): Promise<ApiResponse<TodoListResponse>> {
    const searchParams = new URLSearchParams()

    if (params.filter) searchParams.set('filter', params.filter)
    if (params.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const response = await fetch(`/api/todos?${searchParams.toString()}`)
    return response.json() as Promise<ApiResponse<TodoListResponse>>
  },

  /**
   * TODOの完了状態を切り替える
   */
  async toggleTodo(id: string): Promise<ApiResponse<Todo>> {
    const response = await fetch(`/api/todos/${id}/toggle`, {
      method: 'PATCH',
    })
    return response.json() as Promise<ApiResponse<Todo>>
  },

  /**
   * TODOを更新する
   */
  async updateTodo(
    id: string,
    data: Partial<Todo>
  ): Promise<ApiResponse<Todo>> {
    const response = await fetch(`/api/todos/${id}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    })
    return response.json() as Promise<ApiResponse<Todo>>
  },
}
