import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'

const moveToColumnSchema = z.object({
  kanbanColumnId: z.string().nullable(),
  order: z.number().int().min(0).optional(),
})

/**
 * タスクをKanbanカラムに移動するAPI
 *
 * @param request - リクエストオブジェクト
 * @param params - パスパラメータ
 * @returns 更新されたタスク
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 認証機能実装後にユーザーIDを取得
    const userId = 'user-1' // 仮のユーザーID
    const { id } = params

    const body = await request.json()
    const { kanbanColumnId, order } = moveToColumnSchema.parse(body)

    // タスクの存在確認
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingTodo) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'タスクが見つかりません',
          },
          success: false,
        },
        { status: 404 }
      )
    }

    // カラムIDが指定されている場合は、カラムの存在確認
    if (kanbanColumnId) {
      const existingColumn = await prisma.kanbanColumn.findFirst({
        where: {
          id: kanbanColumnId,
          userId,
        },
      })

      if (!existingColumn) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Kanbanカラムが見つかりません',
            },
            success: false,
          },
          { status: 404 }
        )
      }
    }

    // orderが指定されていない場合は最後に追加
    let finalOrder = order
    if (finalOrder === undefined && kanbanColumnId) {
      const lastTodo = await prisma.todo.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
        where: { kanbanColumnId },
      })
      finalOrder = (lastTodo?.order ?? 0) + 1
    }

    const updatedTodo = await prisma.todo.update({
      data: {
        kanbanColumnId,
        ...(finalOrder !== undefined && { order: finalOrder }),
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
        kanbanColumn: {
          select: {
            color: true,
            id: true,
            name: true,
            order: true,
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
      where: {
        id,
      },
    })

    return NextResponse.json({
      data: updatedTodo,
      success: true,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            details: error.errors,
            message: 'バリデーションエラー',
          },
          success: false,
        },
        { status: 400 }
      )
    }

    console.error('タスク移動エラー:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラーが発生しました',
        },
        success: false,
      },
      { status: 500 }
    )
  }
}
