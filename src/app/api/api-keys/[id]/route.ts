import type { NextRequest } from 'next/server'

import { deleteApiKey } from '@/lib/api-key'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { getUserIdFromRequestWithApiKey } from '@/lib/auth'

/**
 * DELETE /api/api-keys/[id] - APIキー削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequestWithApiKey(request)
    const apiKeyId = params.id

    await deleteApiKey(userId, apiKeyId)

    return createSuccessResponse({ deleted: true, id: apiKeyId })
  } catch (error) {
    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    // Prisma P2025 エラー（レコードが見つからない）
    if (error instanceof Error && error.message.includes('P2025')) {
      return createErrorResponse('NOT_FOUND', 'APIキーが見つかりません', 404)
    }

    console.error('APIキー削除エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
