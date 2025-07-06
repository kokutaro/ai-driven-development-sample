import { NextResponse } from 'next/server'

import * as todoService from '@/lib/todo-service'
import { createTodoInputSchema } from '@/schemas/todo'

/**
 * TODOの一覧を取得
 */
export async function GET() {
  try {
    const todos = await todoService.getTodos()
    return NextResponse.json(todos)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

/**
 * 新しいTODOを作成
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    const validatedData = createTodoInputSchema.parse(body)
    const todo = await todoService.createTodo(validatedData)
    return NextResponse.json(todo, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 400 }
    )
  }
}
