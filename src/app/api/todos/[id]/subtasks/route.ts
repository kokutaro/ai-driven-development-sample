import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * サブタスクのバリデーションスキーマ
 */
const subTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
})

/**
 * GET /api/todos/[id]/subtasks - サブタスク一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { id: todoId } = await params

    // TODOの存在確認と権限チェック
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    })

    if (!todo) {
      return createErrorResponse('NOT_FOUND', 'TODOが見つかりません', 404)
    }

    if (todo.userId !== user.id) {
      return createErrorResponse(
        'FORBIDDEN',
        'このTODOにアクセスする権限がありません',
        403
      )
    }

    // サブタスク一覧を取得
    const subTasks = await prisma.subTask.findMany({
      orderBy: {
        order: 'asc',
      },
      where: {
        todoId,
      },
    })

    return createSuccessResponse(subTasks)
  } catch (error) {
    console.error('サブタスク取得エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * POST /api/todos/[id]/subtasks - サブタスク作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { id: todoId } = await params
    const body = await request.json()

    // バリデーション
    const validatedData = subTaskSchema.parse(body)

    // TODOの存在確認と権限チェック
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    })

    if (!todo) {
      return createErrorResponse('NOT_FOUND', 'TODOが見つかりません', 404)
    }

    if (todo.userId !== user.id) {
      return createErrorResponse(
        'FORBIDDEN',
        'このTODOにアクセスする権限がありません',
        403
      )
    }

    // サブタスクを作成
    const subTask = await prisma.subTask.create({
      data: {
        isCompleted: false,
        title: validatedData.title,
        todoId,
      },
    })

    return createSuccessResponse(subTask, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    console.error('サブタスク作成エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
