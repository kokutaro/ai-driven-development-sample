import type {
  ApiResponse,
  Todo,
  TodoListResponse,
  UpdateTodoApiData,
} from '@/types/todo'

export interface GetTodosParams {
  categoryId?: string
  filter?: string
  limit?: number
  page?: number
  sortBy?: string
  sortOrder?: string
}

/**
 * APIレスポンスを処理し、エラーレスポンスの場合は例外を投げる
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>

  if (!response.ok || !result.success) {
    const errorMessage =
      result.error?.message ?? `HTTP Error: ${response.status}`
    const error = new Error(errorMessage)
    // エラーオブジェクトにAPIレスポンスの詳細を追加
    ;(error as Error & { response: ApiResponse<T>; status: number }).response =
      result
    ;(error as Error & { response: ApiResponse<T>; status: number }).status =
      response.status
    throw error
  }

  return result.data
}

/**
 * TODO API クライアント
 *
 * TODOに関するAPI通信を行うクライアントです。
 * HTTPエラーレスポンスを適切に処理し、エラー時は例外を投げます。
 */
export const todoClient = {
  /**
   * 新しいTODOを作成する
   */
  async createTodo(data: Partial<Todo>): Promise<Todo> {
    const response = await fetch('/api/todos', {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    return handleApiResponse<Todo>(response)
  },

  /**
   * TODOを削除する
   */
  async deleteTodo(id: string): Promise<{ deleted: boolean; id: string }> {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    })
    return handleApiResponse<{ deleted: boolean; id: string }>(response)
  },

  /**
   * TODOリストを取得する
   */
  async getTodos(params: GetTodosParams = {}): Promise<TodoListResponse> {
    const searchParams = new URLSearchParams()

    if (params.filter) searchParams.set('filter', params.filter)
    if (params.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

    const response = await fetch(`/api/todos?${searchParams.toString()}`)
    return handleApiResponse<TodoListResponse>(response)
  },

  /**
   * TODOの完了状態を切り替える
   */
  async toggleTodo(id: string): Promise<Todo> {
    const response = await fetch(`/api/todos/${id}/toggle`, {
      method: 'PATCH',
    })
    return handleApiResponse<Todo>(response)
  },

  /**
   * TODOを更新する
   */
  async updateTodo(id: string, data: UpdateTodoApiData): Promise<Todo> {
    const response = await fetch(`/api/todos/${id}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    })
    return handleApiResponse<Todo>(response)
  },
}
