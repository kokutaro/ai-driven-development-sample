/**
 * GraphQL TODO統計フック
 *
 * REST APIからGraphQLへの移行のためのフック
 * 既存のuseTodoStatsフックを置き換えます
 */
import { useCallback } from 'react'

import { useQuery } from '@apollo/client'

import { GET_TODO_STATS } from '@/graphql/queries/todos'
import { type TodoStats } from '@/types/todo'

/**
 * GraphQL TODO統計フックの戻り値型
 */
interface UseTodoStatsGraphQLResult {
  error: Error | undefined
  loading: boolean
  // ユーティリティ
  refetch: () => Promise<void>

  // データ
  stats: TodoStats
}

/**
 * GraphQL TODO統計フック
 *
 * REST APIを使用していた部分をGraphQLに置き換えます
 * サイドバーのフィルタバッジに表示する統計情報を取得します
 */
export function useTodoStatsGraphQL(): UseTodoStatsGraphQLResult {
  // TODO統計取得
  const {
    data,
    error,
    loading,
    refetch: refetchQuery,
  } = useQuery(GET_TODO_STATS, {
    errorPolicy: 'all',
    // 5分間キャッシュ
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  })

  // リフェッチ関数
  const refetch = useCallback(async () => {
    try {
      await refetchQuery()
    } catch (error) {
      console.error('Failed to refetch todo stats:', error)
    }
  }, [refetchQuery])

  // デフォルト統計値
  const defaultStats: TodoStats = {
    assignedCount: 0,
    completedCount: 0,
    completionRate: 0,
    importantCount: 0,
    overdueCount: 0,
    todayCount: 0,
    totalCount: 0,
    upcomingCount: 0,
  }

  return {
    error,
    loading,
    refetch,
    stats: data?.todoStats ?? defaultStats,
  }
}
