import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'

/**
 * TODOのAPIクライアント
 * ブラウザ環境で実行され、APIエンドポイントと通信する
 */

/**
 * 新しいTODOを作成する
 * @param input - TODO作成のための入力データ
 * @returns 作成されたTODO
 * @throws APIエラーの場合
 */
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch('/api/todos', {
    body: JSON.stringify(input),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Failed to create todo')
  }
  return response.json() as Promise<Todo>
}

/**
 * TODOを削除する
 * @param id - TODOのID
 * @throws APIエラーの場合
 */
export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete todo')
  }
}

/**
 * すべてのTODOを取得する
 * @returns TODOの配列
 * @throws APIエラーの場合
 */
export async function getTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos')
  if (!response.ok) {
    throw new Error('Failed to fetch todos')
  }
  return response.json() as Promise<Todo[]>
}

/**
 * TODOの完了状態を切り替える
 * @param id - TODOのID
 * @returns 更新されたTODO
 * @throws APIエラーの場合
 */
export async function toggleTodo(id: string): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}/toggle`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Failed to toggle todo')
  }
  return response.json() as Promise<Todo>
}

/**
 * TODOを更新する
 * @param id - TODOのID
 * @param input - 更新データ
 * @returns 更新されたTODO
 * @throws APIエラーの場合
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`, {
    body: JSON.stringify(input),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  })
  if (!response.ok) {
    throw new Error('Failed to update todo')
  }
  return response.json() as Promise<Todo>
}
