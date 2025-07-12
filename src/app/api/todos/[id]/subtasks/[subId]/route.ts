import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * サブタスク更新のバリデーションスキーマ
 */
const updateSubTaskSchema = z.object({
  isCompleted: z.boolean().optional(),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional(),
})

/**
 * DELETE /api/todos/[id]/subtasks/[subId] - サブタスク削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { subId } = await params
    const subTaskId = subId

    // サブタスクの存在確認と権限チェック
    const { error, subTask: _subTask } = await findSubTaskWithPermission(
      subTaskId,
      user.id
    )
    if (error) return error

    // サブタスクを削除
    await prisma.subTask.delete({
      where: { id: subTaskId },
    })

    return createSuccessResponse({
      deleted: true,
      id: subTaskId,
    })
  } catch (error) {
    console.error('サブタスク削除エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * PATCH /api/todos/[id]/subtasks/[subId] - サブタスク完了状態切り替え
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { subId } = await params
    const subTaskId = subId

    // サブタスクの存在確認と権限チェック
    const { error, subTask: _subTask } = await findSubTaskWithPermission(
      subTaskId,
      user.id
    )
    if (error) return error

    // 完了状態を切り替え
    const updatedSubTask = await prisma.subTask.update({
      data: {
        isCompleted: !_subTask.isCompleted,
      },
      where: { id: subTaskId },
    })

    return createSuccessResponse(updatedSubTask)
  } catch (error) {
    console.error('サブタスク完了状態切り替えエラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * PUT /api/todos/[id]/subtasks/[subId] - サブタスク更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { subId } = await params
    const subTaskId = subId
    const body = await request.json()

    // バリデーション
    const validatedData = updateSubTaskSchema.parse(body)

    // サブタスクの存在確認と権限チェック
    const { error, subTask: _subTask } = await findSubTaskWithPermission(
      subTaskId,
      user.id
    )
    if (error) return error

    // サブタスクを更新
    const updatedSubTask = await prisma.subTask.update({
      data: validatedData,
      where: { id: subTaskId },
    })

    return createSuccessResponse(updatedSubTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    console.error('サブタスク更新エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * サブタスクの存在確認と権限チェック
 */
async function findSubTaskWithPermission(subTaskId: string, userId: string) {
  const subTask = await prisma.subTask.findUnique({
    include: {
      todo: true,
    },
    where: { id: subTaskId },
  })

  if (!subTask) {
    return {
      error: createErrorResponse(
        'NOT_FOUND',
        'サブタスクが見つかりません',
        404
      ),
    }
  }

  if (subTask.todo.userId !== userId) {
    return {
      error: createErrorResponse(
        'FORBIDDEN',
        'このサブタスクにアクセスする権限がありません',
        403
      ),
    }
  }

  return { subTask }
}
