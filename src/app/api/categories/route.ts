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
 * GET /api/categories - カテゴリ一覧取得
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        userId: user.id,
      },
    })

    return createSuccessResponse(categories)
  } catch (error) {
    console.error('カテゴリ取得エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * POST /api/categories - カテゴリ作成
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const body = (await request.json()) as { color: string; name: string }

    // バリデーション
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    })

    return createSuccessResponse(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    console.error('カテゴリ作成エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
