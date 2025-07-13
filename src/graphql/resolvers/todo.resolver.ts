/**
 * TodoGraphQLリゾルバー (Apollo Server 4.x + DataLoader統合版)
 *
 * DataLoaderを活用してN+1クエリ問題を解決し、
 * 実際のPrismaデータベースアクセスを実装します。
 */
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'

import {
  checkResponseTime,
  getUserId,
  optimizeDataLoaderCache,
  requireAuth,
  withOptimisticLocking,
} from '../context/graphql-context'
import { withPrismaErrorHandling } from '../errors/prisma-error-handler'
import {
  Category,
  SubTask,
  Todo,
  TodoPriority,
  TodoStatus,
} from '../types/todo.types'

import type { GraphQLContext } from '../context/graphql-context'

// レート制限記録用のMapC(本来はRedisなどの外部ストレージを使用)
const rateLimitMap = new Map<string, number[]>()

/**
 * レート制限チェック
 */
async function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<void> {
  const key = `${userId}:${action}`
  const now = Date.now()
  const windowStart = now - windowMs

  // 既存の記録を取得
  let requests = rateLimitMap.get(key) ?? []

  // 期限切れの記録を除去
  requests = requests.filter((timestamp) => timestamp > windowStart)

  // 制限チェック
  if (requests.length >= maxRequests) {
    throw new Error(
      `レート制限に達しました。${Math.ceil(windowMs / 1000)}秒後に再試行してください`
    )
  }

  // 新しいリクエストを記録
  requests.push(now)
  rateLimitMap.set(key, requests)
}

/**
 * 入力文字列のサニタイゼーション
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // XSS攻撃対策
  let sanitized = input
    .replaceAll(/<script[^>]*>.*?<\/script>/gi, '')
    .replaceAll(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replaceAll(/javascript:/gi, '')
    .replaceAll(/on\w+\s*=/gi, '')

  // HTMLエンティティのエスケープ
  sanitized = sanitized
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')

  // 前後の空白を除去
  return sanitized.trim()
}

/**
 * TODOのGraphQLリゾルバー - パフォーマンス最適化版
 */
@Resolver(() => Todo)
export class TodoResolver {
  /**
   * カテゴリフィールドリゾルバー（DataLoader使用）- パフォーマンス最適化版
   * Todo.categoryフィールドが要求された時にのみ実行される
   */
  @FieldResolver(() => Category, { nullable: true })
  async category(
    @Root() todo: Todo,
    @Ctx() context: GraphQLContext
  ): Promise<Category | undefined> {
    const startTime = Date.now()
    if (!todo.categoryId) {
      return
    }

    // DataLoaderを使用してN+1クエリ問題を回避
    const category = await context.dataloaders.categoryLoader.load(
      todo.categoryId
    )

    // パフォーマンスメトリクス
    const responseTime = Date.now() - startTime
    if (responseTime > 100) {
      console.warn(
        `[PERFORMANCE] Category field resolver took ${responseTime}ms`
      )
    }

    if (!category) {
      return
    }

    // PrismaのCategory型からGraphQLのCategory型にマップ
    return {
      color: category.color,
      createdAt: category.createdAt,
      id: category.id,
      name: category.name,
      updatedAt: category.updatedAt,
      userId: category.userId,
    }
  }

  /**
   * 完了率フィールドリゾルバー - パフォーマンス最適化版
   * サブタスクの完了状況から計算
   */
  @FieldResolver(() => Number)
  async completionRate(
    @Root() todo: Todo,
    @Ctx() context: GraphQLContext
  ): Promise<number> {
    // Todoが完了している場合は100%
    if (todo.isCompleted) {
      return 100
    }

    try {
      // DataLoaderでサブタスクを効率的に取得
      const subTasks = await context.dataloaders.subTaskLoader.load(todo.id)

      // undefinedまたはnullチェック
      if (!subTasks || !Array.isArray(subTasks) || subTasks.length === 0) {
        return 0
      }

      // サブタスクの完了率を計算
      const completedCount = subTasks.filter(
        (subTask) => subTask.isCompleted
      ).length
      const completionRate = Math.round(
        (completedCount / subTasks.length) * 100
      )

      // 有効な範囲での値を保証
      return Math.max(0, Math.min(100, completionRate))
    } catch (error) {
      // エラーハンドリング - デフォルト値を返す
      console.error('Error calculating completion rate:', error)
      return 0
    }
  }

  /**
   * TODOを作成します - セキュリティ強化版 + パフォーマンス最適化
   */
  @Mutation(() => Todo)
  async createTodo(
    @Arg('title', () => String) title: string,
    @Ctx() context: GraphQLContext
  ): Promise<Todo> {
    // 1. 認証チェック
    const _session = requireAuth(context)
    const userId = getUserId(context)

    // 2. 入力バリデーション
    if (!title || typeof title !== 'string') {
      throw new Error('タイトルは必須です')
    }

    // 3. タイトルのサニタイゼーション
    const sanitizedTitle = sanitizeInput(title)

    // 4. 長さ制限チェック
    if (sanitizedTitle.length === 0) {
      throw new Error('タイトルは必須です')
    }

    if (sanitizedTitle.length > 200) {
      throw new Error('タイトルは200文字以内で入力してください')
    }

    // 5. レート制限チェック（例：1分間に10件まで）
    await checkRateLimit(userId, 'createTodo', 10, 60_000)

    // 6. Prismaでの実際のTodo作成 + 楽観的ロッキング
    return withPrismaErrorHandling(
      async () => {
        const todo = await withOptimisticLocking(
          async () => {
            return await context.prisma.todo.create({
              data: {
                description: 'Created via GraphQL',
                isCompleted: false,
                isImportant: false,
                order: 0,
                title: sanitizedTitle,
                userId: userId,
              },
            })
          },
          `create_todo_${userId}`,
          3
        )

        // レスポンス時間チェック
        checkResponseTime(context)

        // DataLoaderキャッシュ最適化
        optimizeDataLoaderCache(context)

        // GraphQL型への変換
        return {
          categoryId: todo.categoryId ?? undefined,
          completionRate: 0,
          createdAt: todo.createdAt,
          description: todo.description ?? undefined,
          dueDate: todo.dueDate ?? undefined,
          id: todo.id,
          isCompleted: todo.isCompleted,
          isImportant: todo.isImportant,
          isOverdue: todo.dueDate
            ? new Date() > todo.dueDate && !todo.isCompleted
            : false,
          order: todo.order,
          priority: TodoPriority.MEDIUM,
          status: TodoStatus.PENDING,
          subTasks: [],
          title: todo.title,
          updatedAt: todo.updatedAt,
          userId: todo.userId,
        }
      },
      'create',
      'Todo'
    )
  }

  /**
   * Hello World クエリ（動作確認用）
   */
  @Query(() => String)
  hello(): string {
    return 'Hello from Apollo Server 4.x!'
  }

  /**
   * サブタスクフィールドリゾルバー（DataLoader使用）
   * Todo.subTasksフィールドが要求された時にのみ実行される
   */
  @FieldResolver(() => [SubTask])
  async subTasks(
    @Root() todo: Todo,
    @Ctx() context: GraphQLContext
  ): Promise<SubTask[]> {
    // DataLoaderを使用してN+1クエリ問題を回避
    const subTasks = await context.dataloaders.subTaskLoader.load(todo.id)

    // PrismaのSubTask型からGraphQLのSubTask型にマップ
    return subTasks.map((subTask) => ({
      completed: subTask.isCompleted,
      createdAt: subTask.createdAt,
      id: subTask.id,
      order: subTask.order,
      title: subTask.title,
      todoId: subTask.todoId,
      updatedAt: subTask.updatedAt,
    }))
  }

  /**
   * TODO一覧を取得します（実際のPrismaデータベースアクセス）
   * パフォーマンス最適化版
   */
  @Query(() => [Todo])
  async todos(@Ctx() context: GraphQLContext): Promise<Todo[]> {
    const startTime = Date.now()

    // 認証チェック
    const _session = requireAuth(context)

    return withPrismaErrorHandling(
      async () => {
        // PrismaでTODO一覧を取得（基本フィールドのみ）
        const todos = await context.prisma.todo.findMany({
          orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
          where: {
            userId: _session.user?.id, // ユーザー固有のTODOのみ取得
          },
          // リレーションは含めない（フィールドリゾルバーでDataLoader使用）
        })

        // レスポンス時間チェック
        const responseTime = Date.now() - startTime
        if (responseTime > 2000) {
          console.warn(`[PERFORMANCE] Todos query took ${responseTime}ms`)
        }

        // DataLoaderキャッシュ最適化
        optimizeDataLoaderCache(context)

        // PrismaのTodo型からGraphQLのTodo型にマップ
        return todos.map((todo) => ({
          categoryId: todo.categoryId ?? undefined,
          completionRate: 0, // 後でサブタスクから計算
          createdAt: todo.createdAt,
          description: todo.description ?? undefined,
          dueDate: todo.dueDate ?? undefined,
          id: todo.id,
          isCompleted: todo.isCompleted,
          isImportant: todo.isImportant,
          isOverdue: todo.dueDate
            ? new Date() > todo.dueDate && !todo.isCompleted
            : false,
          order: todo.order,
          // 計算フィールド
          priority: TodoPriority.MEDIUM,
          status: TodoStatus.PENDING,
          // リレーションフィールドは空で返し、フィールドリゾルバーで解決
          subTasks: [], // SubTaskLoaderで解決
          title: todo.title,
          updatedAt: todo.updatedAt,
          userId: todo.userId,
        }))
      },
      'findMany',
      'Todo'
    )
  }
}
