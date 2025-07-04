import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { createTodoSchema } from '@/schemas/todo'

/**
 * Todoアイテムの一覧を取得
 *
 * @description データベースからすべてのTodoアイテムを取得し、
 * 作成日時の降順で並べ替えてレスポンスする
 *
 * @returns {Promise<NextResponse>} Todoアイテムの配列
 */
export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(todos)
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error)
    return NextResponse.json(
      { error: 'Todoの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 新しいTodoアイテムを作成
 *
 * @description リクエストボディのデータを検証し、
 * 新しいTodoアイテムをデータベースに作成する
 *
 * @param {NextRequest} request - リクエストオブジェクト
 * @returns {Promise<NextResponse>} 作成されたTodoアイテム
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // リクエストデータの検証
    const validatedData = createTodoSchema.parse(body)

    // データベースに新しいTodoアイテムを作成
    const todo = await prisma.todo.create({
      data: validatedData,
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('Todoの作成に失敗しました:', error)

    // バリデーションエラーの場合
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Todoの作成に失敗しました' },
      { status: 500 }
    )
  }
}
