import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { updateTodoSchema } from '@/schemas/todo'

/**
 * 指定されたIDのTodoアイテムを取得
 *
 * @description IDを指定してTodoアイテムを取得する
 *
 * @param {NextRequest} request - リクエストオブジェクト
 * @param {object} params - パラメータオブジェクト
 * @param {string} params.id - TodoアイテムのID
 * @returns {Promise<NextResponse>} 指定されたTodoアイテム
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await prisma.todo.findUnique({
      where: {
        id,
      },
    })

    if (!todo) {
      return NextResponse.json(
        { error: 'Todoが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Todoの取得に失敗しました:', error)
    return NextResponse.json(
      { error: 'Todoの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 指定されたIDのTodoアイテムを更新
 *
 * @description IDを指定してTodoアイテムを更新する
 * リクエストボディのデータを検証し、既存のTodoアイテムを更新する
 *
 * @param {NextRequest} request - リクエストオブジェクト
 * @param {object} params - パラメータオブジェクト
 * @param {string} params.id - TodoアイテムのID
 * @returns {Promise<NextResponse>} 更新されたTodoアイテム
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // リクエストデータの検証
    const validatedData = updateTodoSchema.parse(body)

    // Todoアイテムの存在確認
    const existingTodo = await prisma.todo.findUnique({
      where: {
        id,
      },
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todoが見つかりません' },
        { status: 404 }
      )
    }

    // データベースのTodoアイテムを更新
    const todo = await prisma.todo.update({
      where: {
        id,
      },
      data: validatedData,
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Todoの更新に失敗しました:', error)

    // バリデーションエラーの場合
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Todoの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 指定されたIDのTodoアイテムを削除
 *
 * @description IDを指定してTodoアイテムを削除する
 *
 * @param {NextRequest} request - リクエストオブジェクト
 * @param {object} params - パラメータオブジェクト
 * @param {string} params.id - TodoアイテムのID
 * @returns {Promise<NextResponse>} 削除成功メッセージ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Todoアイテムの存在確認
    const existingTodo = await prisma.todo.findUnique({
      where: {
        id,
      },
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todoが見つかりません' },
        { status: 404 }
      )
    }

    // データベースからTodoアイテムを削除
    await prisma.todo.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Todoが削除されました' })
  } catch (error) {
    console.error('Todoの削除に失敗しました:', error)
    return NextResponse.json(
      { error: 'Todoの削除に失敗しました' },
      { status: 500 }
    )
  }
}
