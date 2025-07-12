import { z } from 'zod'

import type { NextRequest } from 'next/server'

import { createApiKey, getUserApiKeys } from '@/lib/api-key'
import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import { getUserIdFromRequest } from '@/lib/auth'
import { apiKeyCreateSchema } from '@/schemas/api-key'

/**
 * GET /api/api-keys - APIキー一覧取得
 */
export async function GET() {
  try {
    const userId = await getUserIdFromRequest()

    const apiKeys = await getUserApiKeys(userId)

    return createSuccessResponse(apiKeys)
  } catch (error) {
    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('APIキー取得エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * POST /api/api-keys - APIキー作成
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest()
    const body = await request.json()
    const validatedData = apiKeyCreateSchema.parse(body)

    const expiresAt = validatedData.expiresAt
      ? new Date(validatedData.expiresAt)
      : undefined

    const result = await createApiKey(userId, validatedData.name, expiresAt)

    return createSuccessResponse(result, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('APIキー作成エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
