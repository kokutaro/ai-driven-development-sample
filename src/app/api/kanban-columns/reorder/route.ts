import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { NextRequest } from 'next/server'

import { getUserIdFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

const reorderKanbanColumnsSchema = z.object({
  columnIds: z
    .array(z.string().min(1, 'カラムIDは必須です'))
    .min(1, 'カラムIDの配列は空にできません'),
})

/**
 * Kanbanカラム並び替えAPI
 *
 * @param request - リクエストオブジェクト
 * @returns 並び替え後のKanbanカラム一覧
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest()

    const body = await request.json()
    const { columnIds } = reorderKanbanColumnsSchema.parse(body)

    // 該当するカラムが全て存在し、ユーザーのものかを確認
    const existingColumns = await prisma.kanbanColumn.findMany({
      where: {
        id: {
          in: columnIds,
        },
        userId,
      },
    })

    if (existingColumns.length !== columnIds.length) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '指定されたKanbanカラムの一部が見つかりません',
          },
          success: false,
        },
        { status: 404 }
      )
    }

    // トランザクションで並び替えを実行
    const updatedColumns = await prisma.$transaction(
      columnIds.map((id, index) =>
        prisma.kanbanColumn.update({
          data: {
            order: index + 1,
          },
          where: {
            id,
          },
        })
      )
    )

    // 並び替え後のカラム一覧を取得
    const kanbanColumns = await prisma.kanbanColumn.findMany({
      include: {
        todos: {
          include: {
            category: {
              select: {
                color: true,
                id: true,
                name: true,
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
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
      where: {
        userId,
      },
    })

    return NextResponse.json({
      data: {
        kanbanColumns,
        updated: updatedColumns.length,
      },
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

    console.error('Kanbanカラム並び替えエラー:', error)

    // 認証エラーの場合
    if (error instanceof Error && error.message === '認証が必要です') {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
          success: false,
        },
        { status: 401 }
      )
    }

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
