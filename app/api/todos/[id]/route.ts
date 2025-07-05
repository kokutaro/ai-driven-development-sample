import { NextResponse } from 'next/server'

import * as todoService from '@/lib/todo-service'
import { updateTodoInputSchema } from '@/schemas/todo'

interface Params {
  params: {
    id: string
  }
}

/**
 * TODOを削除
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await todoService.deleteTodo(params.id)
    return new NextResponse(undefined, { status: 204 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 400 }
    )
  }
}

/**
 * TODOの完了状態を切り替え
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const todo = await todoService.toggleTodo(params.id)
    return NextResponse.json(todo)
  } catch {
    return NextResponse.json(
      { error: 'Failed to toggle todo' },
      { status: 400 }
    )
  }
}

/**
 * TODOを更新
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const body = (await request.json()) as unknown
    const validatedData = updateTodoInputSchema.parse(body)
    const todo = await todoService.updateTodo(params.id, validatedData)
    return NextResponse.json(todo)
  } catch {
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 400 }
    )
  }
}
