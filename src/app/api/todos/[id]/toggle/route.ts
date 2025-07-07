import type { NextRequest } from 'next/server'

import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { getUserIdFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * PATCH /api/todos/[id]/toggle - タスクの完了状態切り替え
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest()
    const { id } = await params

    // タスクの存在確認と所有者確認
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    })

    if (!existingTodo) {
      return createErrorResponse('NOT_FOUND', 'タスクが見つかりません', 404)
    }

    if (existingTodo.userId !== userId) {
      return createErrorResponse('FORBIDDEN', 'アクセス権限がありません', 403)
    }

    // 完了状態を切り替え
    const updatedTodo = await prisma.todo.update({
      data: {
        isCompleted: !existingTodo.isCompleted,
      },
      where: { id },
    })

    return createSuccessResponse(updatedTodo)
  } catch (error) {
    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('TODO完了状態切り替えエラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
