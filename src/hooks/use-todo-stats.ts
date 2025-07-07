import { useCallback, useEffect, useState } from 'react'

import type { TodoStats } from '@/types/api'

import { useClientOnly } from '@/hooks/use-client-only'
import { statsClient } from '@/lib/api/stats-client'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO統計情報を取得するカスタムフック
 *
 * 統計情報APIを使用して、現在選択されているフィルタに関係なく、
 * 全フィルタ条件の正しい統計情報を取得します。
 * TODO操作が行われた際に自動的に統計情報を再取得します。
 *
 * @returns 統計情報、ローディング状態、エラー、再取得関数
 */
export function useTodoStats() {
  const [stats, setStats] = useState<TodoStats>({
    assignedCount: 0,
    completedCount: 0,
    importantCount: 0,
    todayCount: 0,
    totalCount: 0,
    upcomingCount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const isClient = useClientOnly()

  // TODOストアの状態を監視
  const { isLoading: todoLoading, todos } = useTodoStore()

  /**
   * 統計情報を取得する関数
   */
  const fetchStats = useCallback(async () => {
    if (!isClient) return

    setIsLoading(true)
    setError(undefined)

    try {
      const response = await statsClient.getTodoStats()

      if (response.success) {
        setStats(response.data)
      } else {
        setError(response.error?.message ?? '統計情報の取得に失敗しました')
      }
    } catch (error_) {
      console.error('統計情報取得エラー:', error_)
      setError('統計情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [isClient])

  /**
   * 統計情報を再取得する関数
   */
  const refetch = useCallback(() => {
    void fetchStats()
  }, [fetchStats])

  // 初回読み込み時に統計情報を取得
  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  // TODO操作完了時に統計情報を自動再取得
  useEffect(() => {
    // TODOの読み込み中でない場合のみ統計情報を更新
    if (!todoLoading && isClient) {
      void fetchStats()
    }
  }, [todos, todoLoading, isClient, fetchStats])

  return {
    error,
    isLoading,
    refetch,
    stats,
  }
}
