/**
 * 統計情報のGraphQLリゾルバー
 *
 * Todo統計とダッシュボード情報のGraphQL APIを提供します。
 */
import { Arg, Ctx, Query, Resolver } from 'type-graphql'

import { StatsFilter, StatsPeriod, TodoStats } from '../types/stats.types'

import type { GraphQLContext } from '../context/graphql-context'

@Resolver(() => TodoStats)
export class StatsResolver {
  /**
   * ダッシュボード用のサマリー統計を取得します
   *
   * @param context - GraphQLコンテキスト
   * @returns サマリー統計
   */
  @Query(() => TodoStats)
  async dashboardStats(@Ctx() context?: GraphQLContext): Promise<TodoStats> {
    // 暫定的な実装 - 認証チェックを簡略化
    return this.todoStats(
      {
        period: StatsPeriod.TODAY,
      },
      context
    )
  }

  /**
   * Todo統計情報を取得します
   *
   * @param filter - フィルター条件
   * @param context - GraphQLコンテキスト
   * @returns Todo統計情報
   */
  @Query(() => TodoStats)
  async todoStats(
    @Arg('filter', () => StatsFilter, { nullable: true }) filter?: StatsFilter,
    @Ctx() context?: GraphQLContext
  ): Promise<TodoStats> {
    // 暫定的な実装 - 認証チェックを簡略化
    // 現在はモックデータを返す（将来的には既存の統計サービスと統合）
    const currentPeriod = filter?.period ?? StatsPeriod.MONTH
    const mockStats: TodoStats = {
      averageCompletionTime: 3.5,
      cancelled: 2,
      categories: [
        {
          color: '#FF6B6B',
          completed: 15,
          completionRate: 0.75,
          id: 'work',
          name: 'Work',
          pending: 5,
          total: 20,
        },
        {
          color: '#4ECDC4',
          completed: 8,
          completionRate: 0.8,
          id: 'personal',
          name: 'Personal',
          pending: 2,
          total: 10,
        },
      ],
      completed: 23,
      completionRate: 0.77,
      dailyStats: [
        {
          completed: 3,
          created: 2,
          date: '2024-01-01',
          total: 5,
        },
        {
          completed: 2,
          created: 4,
          date: '2024-01-02',
          total: 6,
        },
      ],
      generatedAt: new Date(),
      inProgress: 5,
      overdue: 3,
      pending: 7,
      period: currentPeriod,
      total: 30,
    }

    return mockStats
  }
}
