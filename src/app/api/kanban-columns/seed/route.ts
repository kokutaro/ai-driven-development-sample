import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { getUserIdFromRequestWithApiKey } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * デフォルトのKanbanカラムを作成するAPI
 *
 * 新規ユーザー向けにデフォルトのカラム（To Do、In Progress、Done）を作成します。
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequestWithApiKey(request)

    // 既存のカラムがあるかチェック
    const existingColumns = await prisma.kanbanColumn.findFirst({
      where: { userId },
    })

    if (existingColumns) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'カラムは既に存在します',
          },
          success: false,
        },
        { status: 409 }
      )
    }

    // デフォルトカラムを作成
    const defaultColumns = [
      {
        color: '#339AF0',
        name: 'To Do',
        order: 1,
        userId,
      },
      {
        color: '#FFD43B',
        name: 'In Progress',
        order: 2,
        userId,
      },
      {
        color: '#51CF66',
        name: 'Done',
        order: 3,
        userId,
      },
    ]

    const createdColumns = await Promise.all(
      defaultColumns.map((column) =>
        prisma.kanbanColumn.create({
          data: column,
        })
      )
    )

    return NextResponse.json({
      data: createdColumns,
      success: true,
    })
  } catch (error) {
    console.error('デフォルトKanbanカラム作成エラー:', error)

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
