import { NextResponse } from 'next/server'
import { z } from 'zod'

import type { NextRequest } from 'next/server'

import { getUserIdFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

const updateKanbanColumnSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '色はHEX形式で入力してください')
    .optional(),
  name: z
    .string()
    .min(1, 'カラム名は必須です')
    .max(50, 'カラム名は50文字以内で入力してください')
    .optional(),
  order: z.number().int().min(1).optional(),
})

/**
 * Kanbanカラム削除API
 *
 * @param request - リクエストオブジェクト
 * @param params - パスパラメータ
 * @returns 削除結果
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest()
    const { id } = params

    // カラムの存在確認
    const existingColumn = await prisma.kanbanColumn.findFirst({
      where: {
        id,
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

    // カラムに紐づくタスクのkanbanColumnIdをnullに設定
    await prisma.todo.updateMany({
      data: {
        kanbanColumnId: undefined,
      },
      where: {
        kanbanColumnId: id,
      },
    })

    // カラムを削除
    await prisma.kanbanColumn.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      data: {
        deleted: true,
        id,
      },
      success: true,
    })
  } catch (error) {
    console.error('Kanbanカラム削除エラー:', error)

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

/**
 * Kanbanカラム個別取得API
 *
 * @param request - リクエストオブジェクト
 * @param params - パスパラメータ
 * @returns 指定されたKanbanカラム
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest()
    const { id } = params

    const kanbanColumn = await prisma.kanbanColumn.findFirst({
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
      where: {
        id,
        userId,
      },
    })

    if (!kanbanColumn) {
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

    return NextResponse.json({
      data: kanbanColumn,
      success: true,
    })
  } catch (error) {
    console.error('Kanbanカラム取得エラー:', error)

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

/**
 * Kanbanカラム更新API
 *
 * @param request - リクエストオブジェクト
 * @param params - パスパラメータ
 * @returns 更新されたKanbanカラム
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest()
    const { id } = params

    const body = await request.json()
    const validatedData = updateKanbanColumnSchema.parse(body)

    // カラムの存在確認
    const existingColumn = await prisma.kanbanColumn.findFirst({
      where: {
        id,
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

    const kanbanColumn = await prisma.kanbanColumn.update({
      data: validatedData,
      where: {
        id,
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

    console.error('Kanbanカラム更新エラー:', error)

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
