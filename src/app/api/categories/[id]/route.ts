import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { categorySchema } from '@/schemas/category'

/**
 * DELETE /api/categories/[id] - カテゴリ削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { id: categoryId } = await params

    // カテゴリの存在確認と権限チェック
    const { category: _category, error } = await findCategoryWithPermission(
      categoryId,
      user.id
    )
    if (error) return error

    // カテゴリを削除
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return createSuccessResponse({
      deleted: true,
      id: categoryId,
    })
  } catch (error) {
    console.error('カテゴリ削除エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * PUT /api/categories/[id] - カテゴリ更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { id: categoryId } = await params
    const body = (await request.json()) as { color?: string; name?: string }

    // バリデーション
    const validatedData = categorySchema.parse(body)

    // カテゴリの存在確認と権限チェック
    const { category: _category, error } = await findCategoryWithPermission(
      categoryId,
      user.id
    )
    if (error) return error

    // カテゴリを更新
    const updatedCategory = await prisma.category.update({
      data: validatedData,
      where: { id: categoryId },
    })

    return createSuccessResponse(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    console.error('カテゴリ更新エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * カテゴリの存在確認と権限チェック
 */
async function findCategoryWithPermission(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    return {
      error: createErrorResponse('NOT_FOUND', 'カテゴリが見つかりません', 404),
    }
  }

  if (category.userId !== userId) {
    return {
      error: createErrorResponse(
        'FORBIDDEN',
        'このカテゴリにアクセスする権限がありません',
        403
      ),
    }
  }

  return { category }
}
