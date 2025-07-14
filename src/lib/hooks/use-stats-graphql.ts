/**
 * GraphQL版統計情報フック
 *
 * Apollo Clientを使用してTodo統計を管理します。
 * ダッシュボード表示とレポート機能を提供します。
 */
import { gql, useQuery } from '@apollo/client'

import type { StatsFilter } from '@/graphql/types/stats.types'

/**
 * Todo統計のGraphQLクエリ
 */
const GET_TODO_STATS = gql`
  query GetTodoStats($filter: StatsFilter) {
    todoStats(filter: $filter) {
      total
      completed
      pending
      inProgress
      cancelled
      overdue
      completionRate
      averageCompletionTime
      period
      generatedAt
      categories {
        id
        name
        color
        total
        completed
        pending
        completionRate
      }
      dailyStats {
        date
        total
        completed
        created
      }
    }
  }
`

/**
 * ダッシュボード統計のGraphQLクエリ
 */
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      total
      completed
      pending
      inProgress
      cancelled
      overdue
      completionRate
      averageCompletionTime
      period
      generatedAt
      categories {
        id
        name
        color
        total
        completed
        pending
        completionRate
      }
      dailyStats {
        date
        total
        completed
        created
      }
    }
  }
`

interface UseStatsGraphQLOptions {
  filter?: StatsFilter
}

/**
 * GraphQLを使用してダッシュボード統計を取得するフック
 *
 * @returns ダッシュボード統計データと関連する状態
 */
export function useDashboardStatsGraphQL() {
  const { data, error, loading, refetch } = useQuery(GET_DASHBOARD_STATS, {
    errorPolicy: 'all',
    // ダッシュボードは頻繁に更新されるため短めのキャッシュ
    fetchPolicy: 'cache-and-network',
    // 30秒ごとにポーリング（オプション）
    pollInterval: 30_000,
  })

  return {
    error: error?.message,
    isLoading: loading,
    refetch,
    stats: data?.dashboardStats,
  }
}

/**
 * 統計情報の自動更新フック
 *
 * Todo操作後に統計情報を自動的に更新します。
 */
export function useStatsAutoRefresh() {
  const dashboardStats = useDashboardStatsGraphQL()
  const todoStats = useStatsGraphQL()

  const refreshAll = async () => {
    await Promise.all([dashboardStats.refetch(), todoStats.refetch()])
  }

  return {
    hasError: !!(dashboardStats.error ?? todoStats.error),
    isRefreshing: dashboardStats.isLoading || todoStats.isLoading,
    refreshAll,
  }
}

/**
 * GraphQLを使用してTodo統計を取得するフック
 *
 * @param options - フィルターオプション
 * @returns 統計データと関連する状態
 */
export function useStatsGraphQL(options: UseStatsGraphQLOptions = {}) {
  const { filter } = options

  const { data, error, loading, refetch } = useQuery(GET_TODO_STATS, {
    errorPolicy: 'all',
    // 5分間キャッシュ
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    variables: { filter },
  })

  return {
    error: error?.message,
    isLoading: loading,
    refetch,
    stats: data?.todoStats,
  }
}
