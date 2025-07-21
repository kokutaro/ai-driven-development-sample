/**
 * 統計情報のGraphQLリゾルバー - Prisma統合版
 *
 * Todo統計とダッシュボード情報のGraphQL APIを提供します。
 * 実際のPrismaデータベースと連携し、リアルタイムで統計を計算します。
 */
import { Arg, Ctx, Query, Resolver } from 'type-graphql'

import { getUserId, requireAuth } from '../context/graphql-context'
import { withPrismaErrorHandling } from '../errors/prisma-error-handler'
import { StatsFilter, StatsPeriod, TodoStats } from '../types/stats.types'

import type { GraphQLContext } from '../context/graphql-context'

/**
 * Prismaクエリから取得されるCategoryデータの型定義
 */
interface CategoryStatsData {
  color: string
  id: string
  name: string
}

/**
 * 日別統計データの型定義
 */
interface DailyStatsData {
  completed: number
  created: number
  date: string
  total: number
}

/**
 * Prismaクエリの日付フィルター型定義
 */
interface DateFilterCondition {
  createdAt?: {
    gte?: Date
    lt?: Date
  }
}

/**
 * Prismaクエリから取得されるTodoデータの型定義
 */
interface TodoStatsData {
  categoryId: null | string
  createdAt: Date
  dueDate: Date | null
  id: string
  isCompleted: boolean
  isImportant: boolean
}

@Resolver(() => TodoStats)
export class StatsResolver {
  /**
   * ダッシュボード用のサマリー統計を取得します
   *
   * @param context - GraphQLコンテキスト
   * @returns サマリー統計
   */
  @Query(() => TodoStats)
  async dashboardStats(@Ctx() context: GraphQLContext): Promise<TodoStats> {
    // 認証チェック
    requireAuth(context)

    // 今日の統計を取得
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
    @Ctx() context: GraphQLContext,
    @Arg('filter', () => StatsFilter, { nullable: true }) filter?: StatsFilter
  ): Promise<TodoStats> {
    // 認証チェック
    requireAuth(context)
    const userId = getUserId(context)

    const period = filter?.period ?? StatsPeriod.MONTH

    return withPrismaErrorHandling(
      async () => {
        // 期間に基づくフィルター条件を作成
        const dateFilter = this.createDateFilter(period)

        // 基本的なTodo統計を取得
        const [todos, categories] = await Promise.all([
          context.prisma.todo.findMany({
            select: {
              categoryId: true,
              createdAt: true,
              dueDate: true,
              id: true,
              isCompleted: true,
              isImportant: true,
            },
            where: {
              userId,
              ...dateFilter,
            },
          }),
          context.prisma.category.findMany({
            select: {
              color: true,
              id: true,
              name: true,
            },
            where: {
              userId,
            },
          }),
        ])

        // 統計を計算
        const stats = this.calculateStats(todos, categories, period)

        return stats
      },
      'findMany',
      'TodoStats'
    )
  }

  /**
   * 平均完了時間を計算（簡易実装）
   */
  private calculateAverageCompletionTime(todos: TodoStatsData[]): number {
    const completedTodos = todos.filter((t) => t.isCompleted)

    if (completedTodos.length === 0) {
      return 0
    }

    // 簡易的な計算（実際には完了日時フィールドが必要）
    let totalDays = 0
    for (const todo of completedTodos) {
      const createdDate = new Date(todo.createdAt)
      const now = new Date()
      const diffInDays = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      totalDays += Math.max(1, diffInDays)
    }

    return totalDays / completedTodos.length
  }

  /**
   * 日別統計を計算
   */
  private calculateDailyStats(todos: TodoStatsData[]): DailyStatsData[] {
    const dailyMap = new Map<
      string,
      { completed: number; created: number; total: number }
    >()

    for (const todo of todos) {
      const date = new Date(todo.createdAt).toISOString().split('T')[0]
      const existing = dailyMap.get(date) ?? {
        completed: 0,
        created: 0,
        total: 0,
      }

      existing.created += 1
      existing.total += 1
      if (todo.isCompleted) {
        existing.completed += 1
      }

      dailyMap.set(date, existing)
    }

    return [...dailyMap.entries()]
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 統計を計算
   */
  private calculateStats(
    todos: TodoStatsData[],
    categories: CategoryStatsData[],
    period: StatsPeriod
  ): TodoStats {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // 基本統計
    const total = todos.length
    const completed = todos.filter((t) => t.isCompleted).length
    const pending = todos.filter((t) => !t.isCompleted).length
    const overdue = todos.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && !t.isCompleted
    ).length

    // 追加統計（クライアント要求に対応）
    const important = todos.filter((t) => t.isImportant).length
    const todayTodos = todos.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= today &&
        new Date(t.dueDate) < tomorrow &&
        !t.isCompleted
    ).length
    const upcomingTodos = todos.filter(
      (t) => t.dueDate && new Date(t.dueDate) >= now && !t.isCompleted
    ).length
    const assignedTodos = todos.filter((t) => !t.isCompleted).length // 全未完了タスクを割り当てとして扱う

    const completionRate = total > 0 ? completed / total : 0
    const averageCompletionTime = this.calculateAverageCompletionTime(todos)

    // カテゴリ別統計
    const categoryStats = categories.map((category) => {
      const categoryTodos = todos.filter((t) => t.categoryId === category.id)
      const categoryTotal = categoryTodos.length
      const categoryCompleted = categoryTodos.filter(
        (t) => t.isCompleted
      ).length
      const categoryPending = categoryTodos.filter((t) => !t.isCompleted).length

      return {
        color: category.color,
        completed: categoryCompleted,
        completionRate:
          categoryTotal > 0 ? categoryCompleted / categoryTotal : 0,
        id: category.id,
        name: category.name,
        pending: categoryPending,
        total: categoryTotal,
      }
    })

    // 日別統計（簡易実装）
    const dailyStats = this.calculateDailyStats(todos)

    return {
      assignedCount: assignedTodos,
      averageCompletionTime,
      cancelled: 0, // 現在のスキーマにはcancelledステータスがないため0
      categories: categoryStats,
      completed,
      completedCount: completed,
      completionRate,
      dailyStats,
      generatedAt: new Date(),
      importantCount: important,
      inProgress: 0, // 現在のスキーマにはinProgressステータスがないため0
      overdue,
      overdueCount: overdue,
      pending,
      period,
      todayCount: todayTodos,
      total,
      totalCount: total,
      upcomingCount: upcomingTodos,
    }
  }

  /**
   * 期間に基づくフィルター条件を作成
   */
  private createDateFilter(period: StatsPeriod): DateFilterCondition {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (period) {
      case StatsPeriod.MONTH: {
        const monthStart = new Date(today)
        monthStart.setMonth(today.getMonth() - 1)
        return {
          createdAt: {
            gte: monthStart,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }
      }
      case StatsPeriod.TODAY: {
        return {
          createdAt: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }
      }
      case StatsPeriod.WEEK: {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        return {
          createdAt: {
            gte: weekStart,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }
      }
      case StatsPeriod.YEAR: {
        const yearStart = new Date(today)
        yearStart.setFullYear(today.getFullYear() - 1)
        return {
          createdAt: {
            gte: yearStart,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        }
      }
      default: {
        return {}
      }
    }
  }
}
