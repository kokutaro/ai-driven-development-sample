import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * TODO統計情報取得API
 *
 * 全フィルタ条件の統計情報を一度に取得します。
 * 各フィルタに合致するタスク数をPrismaで効率的に計算します。
 *
 * @param request - リクエストオブジェクト
 * @returns 統計情報のレスポンス
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        {
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
          success: false,
        },
        { status: 401 }
      )
    }

    // 今日の日付範囲を計算
    const today = new Date()
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // 各フィルタ条件の統計情報を並列で取得
    const [
      totalCount,
      completedCount,
      importantCount,
      todayCount,
      upcomingCount,
      assignedCount,
    ] = await Promise.all([
      // 全タスク数
      prisma.todo.count({
        where: { userId: user.id },
      }),
      // 完了済みタスク数
      prisma.todo.count({
        where: { isCompleted: true, userId: user.id },
      }),
      // 重要タスク数（未完了のみ）
      prisma.todo.count({
        where: { isCompleted: false, isImportant: true, userId: user.id },
      }),
      // 今日のタスク数（未完了のみ）
      prisma.todo.count({
        where: {
          dueDate: { gte: startOfDay, lt: endOfDay },
          isCompleted: false,
          userId: user.id,
        },
      }),
      // 今後の予定タスク数（未完了のみ）
      prisma.todo.count({
        where: {
          dueDate: { gte: today },
          isCompleted: false,
          userId: user.id,
        },
      }),
      // 自分に割り当てられたタスク数（未完了のみ）
      prisma.todo.count({
        where: { isCompleted: false, userId: user.id },
      }),
    ])

    return NextResponse.json({
      data: {
        assignedCount,
        completedCount,
        importantCount,
        todayCount,
        totalCount,
        upcomingCount,
      },
      success: true,
    })
  } catch (error) {
    console.error('統計情報取得エラー:', error)
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
