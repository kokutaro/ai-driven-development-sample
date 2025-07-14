/**
 * CategoryのGraphQLリゾルバー - Prisma統合版
 *
 * カテゴリ管理のGraphQL APIを提供します。
 * 実際のPrismaデータベースと連携します。
 */
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'

import {
  getUserId,
  requireAuth,
  requireResourceOwnership,
} from '../context/graphql-context'
import { requirePermissionInContext } from '../context/rbac-context'
import { withPrismaErrorHandling } from '../errors/prisma-error-handler'
import { Category } from '../types/todo.types'

import type { GraphQLContext } from '../context/graphql-context'

import { SYSTEM_PERMISSIONS } from '@/lib/rbac'

/**
 * カテゴリ作成用の入力型
 */
interface CreateCategoryInput {
  color: string
  name: string
}

/**
 * カテゴリ更新用の入力型
 */
interface UpdateCategoryInput {
  color?: string
  name?: string
}

@Resolver(() => Category)
export class CategoryResolver {
  /**
   * ユーザーのカテゴリ一覧を取得します
   *
   * @param context - GraphQLコンテキスト
   * @returns カテゴリリスト
   */
  @Query(() => [Category])
  async categories(@Ctx() context: GraphQLContext): Promise<Category[]> {
    // 認証チェック
    requireAuth(context)
    const userId = getUserId(context)

    // RBAC権限チェック: カテゴリ読み取り権限が必要
    await requirePermissionInContext(context, SYSTEM_PERMISSIONS.READ_CATEGORY)

    return withPrismaErrorHandling(
      async () => {
        // Prismaでカテゴリ一覧を取得
        const categories = await context.prisma.category.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          where: {
            userId: userId,
          },
        })

        // GraphQL型にマップ
        return categories.map((category) => ({
          color: category.color,
          createdAt: category.createdAt,
          id: category.id,
          name: category.name,
          updatedAt: category.updatedAt,
          userId: category.userId,
        }))
      },
      'findMany',
      'Category'
    )
  }

  /**
   * カテゴリを作成します
   *
   * @param input - カテゴリ作成データ
   * @param context - GraphQLコンテキスト
   * @returns 作成されたカテゴリ
   */
  @Mutation(() => Category)
  async createCategory(
    @Arg('input', () => Object) input: CreateCategoryInput,
    @Ctx() context: GraphQLContext
  ): Promise<Category> {
    // 認証チェック
    requireAuth(context)
    const userId = getUserId(context)

    // RBAC権限チェック: カテゴリ書き込み権限が必要
    await requirePermissionInContext(context, SYSTEM_PERMISSIONS.WRITE_CATEGORY)

    // 入力バリデーション
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('カテゴリ名は必須です')
    }

    if (!input.color || !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new Error('有効なHEXカラーコードを入力してください')
    }

    return withPrismaErrorHandling(
      async () => {
        // Prismaでカテゴリを作成
        const category = await context.prisma.category.create({
          data: {
            color: input.color,
            name: input.name.trim(),
            userId: userId,
          },
        })

        // GraphQL型にマップ
        return {
          color: category.color,
          createdAt: category.createdAt,
          id: category.id,
          name: category.name,
          updatedAt: category.updatedAt,
          userId: category.userId,
        }
      },
      'create',
      'Category'
    )
  }

  /**
   * カテゴリを削除します
   *
   * @param id - カテゴリID
   * @param context - GraphQLコンテキスト
   * @returns 削除成功の真偽値
   */
  @Mutation(() => Boolean)
  async deleteCategory(
    @Arg('id', () => String) id: string,
    @Ctx() context: GraphQLContext
  ): Promise<boolean> {
    // 認証チェック
    requireAuth(context)
    getUserId(context)

    // RBAC権限チェック: カテゴリ削除権限が必要
    await requirePermissionInContext(
      context,
      SYSTEM_PERMISSIONS.DELETE_CATEGORY
    )

    return withPrismaErrorHandling(
      async () => {
        // 既存のカテゴリを確認
        const existingCategory = await context.prisma.category.findUnique({
          select: { userId: true },
          where: { id },
        })

        if (!existingCategory) {
          throw new Error('カテゴリが見つかりません')
        }

        // リソース所有権チェック
        requireResourceOwnership(context, existingCategory.userId)

        // Prismaでカテゴリを削除
        await context.prisma.category.delete({
          where: { id },
        })

        return true
      },
      'delete',
      'Category',
      id
    )
  }

  /**
   * カテゴリを更新します
   *
   * @param id - カテゴリID
   * @param input - カテゴリ更新データ
   * @param context - GraphQLコンテキスト
   * @returns 更新されたカテゴリ
   */
  @Mutation(() => Category)
  async updateCategory(
    @Arg('id', () => String) id: string,
    @Arg('input', () => Object) input: UpdateCategoryInput,
    @Ctx() context: GraphQLContext
  ): Promise<Category> {
    // 認証チェック
    requireAuth(context)
    getUserId(context)

    // RBAC権限チェック: カテゴリ書き込み権限が必要
    await requirePermissionInContext(context, SYSTEM_PERMISSIONS.WRITE_CATEGORY)

    // 入力バリデーション
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('カテゴリ名は必須です')
    }

    if (input.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new Error('有効なHEXカラーコードを入力してください')
    }

    return withPrismaErrorHandling(
      async () => {
        // 既存のカテゴリを確認
        const existingCategory = await context.prisma.category.findUnique({
          select: { userId: true },
          where: { id },
        })

        if (!existingCategory) {
          throw new Error('カテゴリが見つかりません')
        }

        // リソース所有権チェック
        requireResourceOwnership(context, existingCategory.userId)

        // Prismaでカテゴリを更新
        const category = await context.prisma.category.update({
          data: {
            ...(input.name !== undefined && { name: input.name.trim() }),
            ...(input.color !== undefined && { color: input.color }),
          },
          where: { id },
        })

        // GraphQL型にマップ
        return {
          color: category.color,
          createdAt: category.createdAt,
          id: category.id,
          name: category.name,
          updatedAt: category.updatedAt,
          userId: category.userId,
        }
      },
      'update',
      'Category',
      id
    )
  }
}
