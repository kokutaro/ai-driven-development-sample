/**
 * タスク作成API
 * @fileoverview Next.js App Router APIルート - タスクCRUD操作
 */
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { ZodError } from 'zod'

import type { CreateTaskInput, Task } from '@/types/task'
import type { NextRequest } from 'next/server'

import { createTaskInputSchema } from '@/schemas/task.schema'

// TODO: 実際のPrismaクライアントに置き換える
// 現在は仮実装として変数に保存
const mockUserId = '12345678-1234-1234-1234-123456789012'

/**
 * タスク作成API - POST /api/tasks
 * @param request NextRequest
 * @returns タスク作成レスポンス
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Content-Type チェック
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // リクエストボディの解析
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // 日付フィールドの前処理
    let preprocessedBody: Record<string, unknown>
    if (typeof body === 'object' && body !== null) {
      preprocessedBody = { ...body } as Record<string, unknown>
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (
      preprocessedBody.dueDate &&
      typeof preprocessedBody.dueDate === 'string'
    ) {
      preprocessedBody.dueDate = new Date(preprocessedBody.dueDate)
    }
    if (
      preprocessedBody.reminderDate &&
      typeof preprocessedBody.reminderDate === 'string'
    ) {
      preprocessedBody.reminderDate = new Date(preprocessedBody.reminderDate)
    }

    // バリデーション
    let validatedData: CreateTaskInput
    try {
      validatedData = createTaskInputSchema.parse(preprocessedBody)
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {}
        for (const issue of error.issues) {
          details[issue.path.join('.')] = issue.message
        }

        return NextResponse.json(
          { details, error: 'Validation failed' },
          { status: 400 }
        )
      }
      throw error
    }

    // タスクの作成（仮実装）
    const now = new Date()
    const newTask: Task = {
      categoryId: validatedData.categoryId,
      completed: false,
      createdAt: now,
      description: validatedData.description,
      dueDate: validatedData.dueDate,
      id: uuidv4(),
      important: validatedData.important ?? false,
      reminderDate: validatedData.reminderDate,
      repeatPattern: validatedData.repeatPattern,
      subtasks: [],
      title: validatedData.title,
      updatedAt: now,
      userId: mockUserId,
    }

    // TODO: Prismaを使用してデータベースに保存
    // const task = await prisma.task.create({
    //   data: {
    //     title: validatedData.title,
    //     description: validatedData.description,
    //     important: validatedData.important ?? false,
    //     dueDate: validatedData.dueDate,
    //     reminderDate: validatedData.reminderDate,
    //     repeatPattern: validatedData.repeatPattern,
    //     categoryId: validatedData.categoryId,
    //     userId: mockUserId,
    //   },
    //   include: {
    //     category: true,
    //     subtasks: {
    //       orderBy: { order: 'asc' },
    //     },
    //   },
    // })

    return NextResponse.json({ task: newTask }, { status: 201 })
  } catch (error) {
    console.error('タスク作成エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
