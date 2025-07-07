import { useEffect } from 'react'

import { useTodoStore } from '@/stores/todo-store'

/**
 * TODOデータを管理するカスタムフック
 *
 * 指定されたフィルタに基づいてTODOを取得し、リアルタイムで更新します。
 *
 * @param filter - フィルタ条件（デフォルト: 'all'）
 * @returns TODOデータ、ローディング状態、エラー状態、再取得関数
 */
export function useTodos(filter = 'all') {
  const { error, fetchTodos, isLoading, todos } = useTodoStore()

  useEffect(() => {
    void fetchTodos(filter)
  }, [filter, fetchTodos])

  return {
    error,
    isLoading,
    refetch: () => void fetchTodos(filter),
    todos,
  }
}
