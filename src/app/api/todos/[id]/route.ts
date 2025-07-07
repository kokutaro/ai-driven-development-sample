import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import { getCurrentUser, getUserIdFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { todoUpdateSchema } from '@/schemas/todo'

/**
 * DELETE /api/todos/[id] - タスク削除
 */
export async function DELETE(
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

    await prisma.todo.delete({
      where: { id },
    })

    return createSuccessResponse({
      deleted: true,
      id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('TODO削除エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * GET /api/todos/[id] - タスク詳細取得
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

    const { id } = await params
    const todo = await prisma.todo.findUnique({
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
        reminders: {
          select: {
            id: true,
            isTriggered: true,
            reminderAt: true,
          },
        },
        subTasks: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            isCompleted: true,
            title: true,
          },
        },
      },
      where: { id },
    })

    if (!todo) {
      return createErrorResponse('NOT_FOUND', 'タスクが見つかりません', 404)
    }

    if (todo.userId !== user.id) {
      return createErrorResponse('FORBIDDEN', 'アクセス権限がありません', 403)
    }

    return createSuccessResponse(todo)
  } catch (error) {
    console.error('TODO詳細取得エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

/**
 * PUT /api/todos/[id] - タスク更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest()
    const { id } = await params
    const body = await request.json()
    const validatedData = todoUpdateSchema.parse(body)

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

    const todo = await prisma.todo.update({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
      },
      where: { id },
    })

    return createSuccessResponse(todo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('TODO更新エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
