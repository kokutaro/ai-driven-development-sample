import { NextResponse } from 'next/server'

import * as todoService from '@/lib/todo-service'

/**
 * TODOの完了状態を切り替え
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await todoService.toggleTodo(id)
    return NextResponse.json(todo)
  } catch {
    return NextResponse.json(
      { error: 'Failed to toggle todo' },
      { status: 404 }
    )
  }
}
