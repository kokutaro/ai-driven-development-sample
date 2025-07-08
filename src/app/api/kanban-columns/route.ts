import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'

const createKanbanColumnSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '色はHEX形式で入力してください'),
  name: z
    .string()
    .min(1, 'カラム名は必須です')
    .max(50, 'カラム名は50文字以内で入力してください'),
  order: z.number().int().min(1).optional(),
})

/**
 * Kanbanカラム一覧取得API
 *
 * @returns Kanbanカラムの一覧
 */
export async function GET() {
  try {
    // TODO: 認証機能実装後にユーザーIDを取得
    const userId = 'user-1' // 仮のユーザーID

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
      data: kanbanColumns,
      success: true,
    })
  } catch (error) {
    console.error('Kanbanカラム取得エラー:', error)
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

/**
 * Kanbanカラム作成API
 *
 * @param request - リクエストオブジェクト
 * @returns 作成されたKanbanカラム
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: 認証機能実装後にユーザーIDを取得
    const userId = 'user-1' // 仮のユーザーID

    const body = await request.json()
    const validatedData = createKanbanColumnSchema.parse(body)

    // orderが指定されていない場合は最後に追加
    let order = validatedData.order
    if (!order) {
      const lastColumn = await prisma.kanbanColumn.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
        where: { userId },
      })
      order = (lastColumn?.order ?? 0) + 1
    }

    const kanbanColumn = await prisma.kanbanColumn.create({
      data: {
        ...validatedData,
        order,
        userId,
      },
    })

    return NextResponse.json({
      data: kanbanColumn,
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

    console.error('Kanbanカラム作成エラー:', error)
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
