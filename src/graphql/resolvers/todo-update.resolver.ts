/**
 * Todo更新リゾルバー - 楽観的ロッキング実装
 *
 * 並行処理安全性を向上させるための楽観的ロッキング機能を提供します。
 */
import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

import {
  getUserId,
  optimizeDataLoaderCache,
  requireAuth,
  requireResourceOwnership,
  withOptimisticLocking,
} from '../context/graphql-context'
import { withPrismaErrorHandling } from '../errors/prisma-error-handler'
import { Todo, TodoPriority, TodoStatus } from '../types/todo.types'

import type { GraphQLContext } from '../context/graphql-context'

/**
 * Todo更新用の入力型
 */
interface TodoUpdateInput {
  description?: string
  isCompleted?: boolean
  isImportant?: boolean
  title?: string
  version: number // 楽観的ロッキング用バージョン
}

/**
 * Todo更新リゾルバー - 並行処理安全性強化版
 */
@Resolver(() => Todo)
export class TodoUpdateResolver {
  /**
   * TODOを削除します - 楽観的ロッキング対応
   */
  @Mutation(() => Boolean)
  async deleteTodo(
    @Arg('id', () => String) id: string,
    @Arg('version', () => Number) version: number,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    const startTime = Date.now()

    // 1. 認証チェック
    const _session = requireAuth(context)
    const _userId = getUserId(context)

    // 2. 入力バリデーション
    if (!id || typeof id !== 'string') {
      throw new Error('無効なTodo IDです')
    }

    // 3. リソース所有権チェック
    const existingTodo = await context.prisma.todo.findUnique({
      select: { userId: true },
      where: { id },
    })

    if (!existingTodo) {
      throw new Error('指定されたTodoが見つかりません')
    }

    requireResourceOwnership(context, existingTodo.userId)

    // 4. 楽観的ロッキングによる削除
    return withPrismaErrorHandling(
      async () => {
        await withOptimisticLocking(
          async () => {
            // バージョンチェック付きで削除
            await context.prisma.todo.delete({
              where: {
                id,
                updatedAt: new Date(version), // 楽観的ロッキング
              },
            })
          },
          `delete_todo_${id}`,
          3
        )

        // パフォーマンス監視
        const responseTime = Date.now() - startTime
        if (responseTime > 500) {
          console.warn(`[PERFORMANCE] Todo deletion took ${responseTime}ms`)
        }

        // DataLoaderキャッシュ最適化
        optimizeDataLoaderCache(context)

        // 関連キャッシュのクリア
        context.dataloaders.subTaskLoader.clear(id)

        return true
      },
      'delete',
      'Todo'
    )
  }

  /**
   * TODO完了状態切り替え - 楽観的ロッキング対応
   */
  @Mutation(() => Todo)
  async toggleTodoCompletion(
    @Arg('id', () => String) id: string,
    @Arg('version', () => Number) version: number,
    @Ctx() context: GraphQLContext
  ): Promise<Todo> {
    const startTime = Date.now()

    // 1. 認証チェック
    const _session = requireAuth(context)
    const _userId = getUserId(context)

    // 2. 現在のTodo状態を取得
    const currentTodo = await context.prisma.todo.findUnique({
      select: {
        isCompleted: true,
        updatedAt: true,
        userId: true,
      },
      where: { id },
    })

    if (!currentTodo) {
      throw new Error('指定されたTodoが見つかりません')
    }

    requireResourceOwnership(context, currentTodo.userId)

    // 3. 楽観的ロッキングによる完了状態切り替え
    return withPrismaErrorHandling(
      async () => {
        const updatedTodo = await withOptimisticLocking(
          async () => {
            // 完了状態を切り替え
            return await context.prisma.todo.update({
              data: {
                isCompleted: !currentTodo.isCompleted,
                updatedAt: new Date(),
              },
              where: {
                id,
                updatedAt: new Date(version), // 楽観的ロッキング
              },
            })
          },
          `toggle_todo_${id}`,
          3
        )

        // パフォーマンス監視
        const responseTime = Date.now() - startTime
        if (responseTime > 500) {
          console.warn(`[PERFORMANCE] Todo toggle took ${responseTime}ms`)
        }

        // DataLoaderキャッシュ最適化
        optimizeDataLoaderCache(context)

        // GraphQL型への変換
        return {
          categoryId: updatedTodo.categoryId ?? undefined,
          completionRate: updatedTodo.isCompleted ? 100 : 0,
          createdAt: updatedTodo.createdAt,
          description: updatedTodo.description ?? undefined,
          dueDate: updatedTodo.dueDate ?? undefined,
          id: updatedTodo.id,
          isCompleted: updatedTodo.isCompleted,
          isImportant: updatedTodo.isImportant,
          isOverdue: updatedTodo.dueDate
            ? new Date() > updatedTodo.dueDate && !updatedTodo.isCompleted
            : false,
          order: updatedTodo.order,
          priority: TodoPriority.MEDIUM,
          status: TodoStatus.PENDING,
          subTasks: [],
          title: updatedTodo.title,
          updatedAt: updatedTodo.updatedAt,
          userId: updatedTodo.userId,
        }
      },
      'toggle',
      'Todo'
    )
  }

  /**
   * TODOを更新します - 楽観的ロッキング対応
   */
  @Mutation(() => Todo)
  async updateTodo(
    @Arg('id', () => String) id: string,
    @Arg('input', () => Object) input: TodoUpdateInput,
    @Ctx() context: GraphQLContext
  ): Promise<Todo> {
    const startTime = Date.now()

    // 1. 認証チェック
    const _session = requireAuth(context)
    const _userId = getUserId(context)

    // 2. 入力バリデーション
    if (!id || typeof id !== 'string') {
      throw new Error('無効なTodo IDです')
    }

    if (!input.version || typeof input.version !== 'number') {
      throw new Error('バージョン情報が必要です')
    }

    // 3. リソース所有権チェック（既存Todoの取得）
    const existingTodo = await context.prisma.todo.findUnique({
      select: { updatedAt: true, userId: true },
      where: { id },
    })

    if (!existingTodo) {
      throw new Error('指定されたTodoが見つかりません')
    }

    requireResourceOwnership(context, existingTodo.userId)

    // 4. 楽観的ロッキングによる更新
    return withPrismaErrorHandling(
      async () => {
        const updatedTodo = await withOptimisticLocking(
          async () => {
            // バージョンチェック付きで更新
            const result = await context.prisma.todo.update({
              data: {
                ...(input.title && { title: input.title }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.isCompleted !== undefined && {
                  isCompleted: input.isCompleted,
                }),
                ...(input.isImportant !== undefined && {
                  isImportant: input.isImportant,
                }),
                updatedAt: new Date(), // 新しいタイムスタンプ
              },
              where: {
                id,
                // 楽観的ロッキング: 期待するバージョンと異なる場合は更新失敗
                updatedAt: new Date(input.version),
              },
            })

            return result
          },
          `update_todo_${id}`,
          3
        )

        // パフォーマンス監視
        const responseTime = Date.now() - startTime
        if (responseTime > 1000) {
          console.warn(`[PERFORMANCE] Todo update took ${responseTime}ms`)
        }

        // DataLoaderキャッシュ最適化
        optimizeDataLoaderCache(context)

        // 関連キャッシュのクリア
        context.dataloaders.subTaskLoader.clear(id)

        // GraphQL型への変換
        return {
          categoryId: updatedTodo.categoryId ?? undefined,
          completionRate: 0,
          createdAt: updatedTodo.createdAt,
          description: updatedTodo.description ?? undefined,
          dueDate: updatedTodo.dueDate ?? undefined,
          id: updatedTodo.id,
          isCompleted: updatedTodo.isCompleted,
          isImportant: updatedTodo.isImportant,
          isOverdue: updatedTodo.dueDate
            ? new Date() > updatedTodo.dueDate && !updatedTodo.isCompleted
            : false,
          order: updatedTodo.order,
          priority: TodoPriority.MEDIUM,
          status: TodoStatus.PENDING,
          subTasks: [],
          title: updatedTodo.title,
          updatedAt: updatedTodo.updatedAt,
          userId: updatedTodo.userId,
        }
      },
      'update',
      'Todo'
    )
  }
}
