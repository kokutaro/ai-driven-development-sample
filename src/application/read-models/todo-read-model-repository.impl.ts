import type {
  TodoReadModel,
  TodoReadModelFilter,
  TodoReadModelRepository,
  TodoStatsReadModel,
} from './todo-read-model.interface'
import type { PrismaClient } from '@prisma/client'

// Prisma result types (commented out - unused but kept for future reference)
// interface TodoWithIncludes extends Todo {
//   category: Category | null
//   subTasks: SubTask[]
// }

/**
 * TODO Read Model Repository 実装
 *
 * Prismaを使用したRead Model専用のデータアクセス実装です。
 * クエリ最適化とパフォーマンスに特化した設計になっています。
 */
export class TodoReadModelRepositoryImpl implements TodoReadModelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * TODO Read Modelを削除します
   *
   * @param id - TODO ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.todo.delete({
      where: { id },
    })
  }

  /**
   * TODO Read Modelを取得します
   *
   * @param id - TODO ID
   * @returns TODO Read Model
   */
  async findById(id: string): Promise<TodoReadModel | undefined> {
    const data = await this.prisma.todo.findUnique({
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            isCompleted: true,
          },
        },
      },
      where: { id },
    })

    if (!data) return undefined

    return this.mapToReadModel(data)
  }

  /**
   * ユーザーのTODO Read Model一覧を取得します
   *
   * @param userId - ユーザーID
   * @param options - クエリオプション
   * @returns TODO Read Model一覧
   */
  async findByUserId(
    userId: string,
    options?: {
      filter?: TodoReadModelFilter
      pagination?: {
        limit: number
        page: number
      }
      sort?: {
        direction: 'asc' | 'desc'
        field: keyof TodoReadModel
      }
    }
  ): Promise<TodoReadModel[]> {
    const where = this.buildWhereClause(userId, options?.filter)
    const orderBy = this.buildOrderBy(options?.sort)
    const { skip, take } = this.buildPagination(options?.pagination)

    const data = await this.prisma.todo.findMany({
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            isCompleted: true,
          },
        },
      },
      orderBy,
      skip,
      take,
      where,
    })

    return data.map((item) => this.mapToReadModel(item))
  }

  /**
   * ユーザーのTODO統計を取得します
   *
   * @param userId - ユーザーID
   * @returns TODO統計 Read Model
   */
  async getStats(userId: string): Promise<TodoStatsReadModel> {
    const todos = await this.prisma.todo.findMany({
      select: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        dueDate: true,
        isCompleted: true,
        isImportant: true,
      },
      where: { userId },
    })

    // 現在の日時を取得
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const totalCount = todos.length
    const completedCount = todos.filter((todo) => todo.isCompleted).length
    const pendingCount = totalCount - completedCount
    const importantCount = todos.filter((todo) => todo.isImportant).length

    const dueTodayCount = todos.filter((todo) => {
      if (!todo.dueDate) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= todayStart && dueDate <= today
    }).length

    const overdueCount = todos.filter((todo) => {
      if (!todo.dueDate || todo.isCompleted) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate < todayStart
    }).length

    const upcomingCount = todos.filter((todo) => {
      if (!todo.dueDate || todo.isCompleted) return false
      const dueDate = new Date(todo.dueDate)
      return dueDate >= tomorrow
    }).length

    const completionRate =
      totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    // カテゴリ別統計
    const categoryMap = new Map<
      string,
      { completedCount: number; name: string; totalCount: number }
    >()
    for (const todo of todos) {
      if (todo.category) {
        const existing = categoryMap.get(todo.category.id)
        if (existing) {
          existing.totalCount++
          if (todo.isCompleted) existing.completedCount++
        } else {
          categoryMap.set(todo.category.id, {
            completedCount: todo.isCompleted ? 1 : 0,
            name: todo.category.name,
            totalCount: 1,
          })
        }
      }
    }

    const categoryStats = [...categoryMap.entries()].map(
      ([categoryId, stats]) => ({
        categoryId,
        categoryName: stats.name,
        completedCount: stats.completedCount,
        totalCount: stats.totalCount,
      })
    )

    return {
      categoryStats,
      completedCount,
      completionRate: Math.round(completionRate * 100) / 100,
      dueTodayCount,
      importantCount,
      lastUpdated: new Date(),
      overdueCount,
      pendingCount,
      totalCount,
      upcomingCount,
      userId,
    }
  }

  /**
   * 統計情報を再計算・更新します
   *
   * @param userId - ユーザーID
   */
  async refreshStats(_userId: string): Promise<void> {
    // 統計は getStats メソッドでリアルタイム計算されるため、
    // このメソッドは実際には何もする必要がない
    // 将来的にキャッシュ機能を追加する場合に使用可能
    return
  }

  /**
   * TODO Read Modelを保存します（ドメインイベントからの更新）
   *
   * @param todoReadModel - TODO Read Model
   */
  async save(todoReadModel: TodoReadModel): Promise<void> {
    const data = this.mapFromReadModel(todoReadModel)
    const updateData = this.mapToUpdateData(data)

    await this.prisma.todo.upsert({
      create: data as never,
      update: updateData,
      where: { id: todoReadModel.id },
    })
  }

  /**
   * ORDER BY句を構築します
   */
  private buildOrderBy(sort?: {
    direction: 'asc' | 'desc'
    field: keyof TodoReadModel
  }): Record<string, 'asc' | 'desc'> {
    if (!sort) {
      return { createdAt: 'desc' }
    }

    return { [sort.field]: sort.direction }
  }

  /**
   * ページング条件を構築します
   */
  private buildPagination(pagination?: { limit: number; page: number }): {
    skip?: number
    take?: number
  } {
    if (!pagination) return {}

    return {
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }
  }

  /**
   * WHERE句を構築します
   */
  private buildWhereClause(
    userId: string,
    filter?: TodoReadModelFilter
  ): Record<string, unknown> {
    const where: Record<string, unknown> = { userId }

    if (!filter) return where

    const conditions: Record<string, unknown>[] = []

    if (filter.isCompleted !== undefined) {
      conditions.push({ isCompleted: filter.isCompleted })
    }

    if (filter.isImportant !== undefined) {
      conditions.push({ isImportant: filter.isImportant })
    }

    if (filter.categoryId) {
      conditions.push({ categoryId: filter.categoryId })
    }

    if (filter.status) {
      conditions.push({ status: filter.status })
    }

    if (filter.isOverdue !== undefined) {
      conditions.push({ isOverdue: filter.isOverdue })
    }

    if (filter.dueDateRange) {
      const dateCondition: Record<string, Date> = {}
      if (filter.dueDateRange.start) {
        dateCondition.gte = filter.dueDateRange.start
      }
      if (filter.dueDateRange.end) {
        dateCondition.lte = filter.dueDateRange.end
      }
      conditions.push({ dueDate: dateCondition })
    }

    if (filter.searchTerm) {
      conditions.push({
        OR: [
          { title: { contains: filter.searchTerm, mode: 'insensitive' } },
          { description: { contains: filter.searchTerm, mode: 'insensitive' } },
        ],
      })
    }

    if (conditions.length > 0) {
      where.AND = conditions
    }

    return where
  }

  /**
   * Read Modelをデータベースレコードにマッピングします
   */
  private mapFromReadModel(readModel: TodoReadModel): Record<string, unknown> {
    return {
      categoryId: readModel.category?.id ?? undefined,
      createdAt: readModel.createdAt,
      description: readModel.description ?? undefined,
      dueDate: readModel.dueDate ?? undefined,
      id: readModel.id,
      isCompleted: readModel.isCompleted,
      isImportant: readModel.isImportant,
      priority: readModel.priority,
      status: readModel.status,
      title: readModel.title,
      updatedAt: readModel.updatedAt,
      userId: readModel.userId,
    }
  }

  /**
   * データベースレコードをRead Modelにマッピングします
   */
  private mapToReadModel(data: Record<string, unknown>): TodoReadModel {
    const subTasks = (data.subTasks as Array<{ isCompleted: boolean }>) ?? []
    const subTaskCount = subTasks.length
    const completedSubTaskCount = subTasks.filter((st) => st.isCompleted).length

    // 期限切れ判定
    const isOverdue =
      data.dueDate && !data.isCompleted
        ? new Date(data.dueDate as Date | string) < new Date()
        : false

    return {
      category: data.category
        ? {
            color: (data.category as { color: string }).color,
            id: (data.category as { id: string }).id,
            name: (data.category as { name: string }).name,
          }
        : undefined,
      completedSubTaskCount,
      createdAt: data.createdAt as Date,
      description: (data.description as string | undefined) ?? undefined,
      dueDate: (data.dueDate as Date | undefined) ?? undefined,
      id: data.id as string,
      isCompleted: data.isCompleted as boolean,
      isImportant: data.isImportant as boolean,
      isOverdue,
      priority: (data.priority as string) ?? 'NORMAL',
      status: (data.status as string) ?? 'PENDING',
      subTaskCount,
      title: data.title as string,
      updatedAt: data.updatedAt as Date,
      userId: data.userId as string,
    }
  }

  /**
   * Update データにマッピングします（不変フィールドを除外）
   */
  private mapToUpdateData(
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const {
      createdAt: _createdAt,
      id: _id,
      userId: _userId,
      ...updateFields
    } = data
    return {
      ...updateFields,
      updatedAt: new Date(),
    }
  }
}
