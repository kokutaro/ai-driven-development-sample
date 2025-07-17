import { z } from 'zod'

import type { NextRequest } from 'next/server'

import {
  createErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse,
} from '@/lib/api-utils'
import {
  getCurrentUserFromRequest,
  getUserIdFromRequestWithApiKey,
} from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildFilterConditions } from '@/lib/todo-filters'
import { todoQuerySchema, todoSchema } from '@/schemas/todo'

/**
 * GET /api/todos - タスク一覧取得
 * @deprecated GraphQL APIの使用を推奨します。GraphQLエンドポイント: /api/graphql
 */
export async function GET(request: NextRequest) {
  // Deprecation warning header
  const response = await handleGetTodos(request)
  response.headers.set('X-API-Deprecated', 'true')
  response.headers.set(
    'X-API-Migration',
    'Use GraphQL endpoint at /api/graphql'
  )
  return response
}

/**
 * POST /api/todos - タスク作成
 * @deprecated GraphQL APIの使用を推奨します。GraphQLエンドポイント: /api/graphql
 */
export async function POST(request: NextRequest) {
  // Deprecation warning header
  const response = await handleCreateTodo(request)
  response.headers.set('X-API-Deprecated', 'true')
  response.headers.set(
    'X-API-Migration',
    'Use GraphQL endpoint at /api/graphql'
  )
  return response
}

async function handleCreateTodo(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequestWithApiKey(request)
    const body = await request.json()
    const validatedData = todoSchema.parse(body)

    const todo = await prisma.todo.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ?? undefined,
        userId,
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
        kanbanColumn: {
          select: {
            color: true,
            id: true,
            name: true,
            order: true,
          },
        },
      },
    })

    return createSuccessResponse(todo, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    if (error instanceof TypeError && error.message.includes('Invalid date')) {
      return createValidationErrorResponse([
        {
          code: 'invalid_date',
          message: 'Invalid date format',
          path: ['dueDate'],
        },
      ])
    }

    if (error instanceof Error && error.message === '認証が必要です') {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    console.error('TODO作成エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}

async function handleGetTodos(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401)
    }

    const { searchParams } = new URL(request.url)
    const query = todoQuerySchema.parse(Object.fromEntries(searchParams))

    const where = {
      userId: user.id,
      ...buildFilterConditions(query.filter),
      ...(query.categoryId && { categoryId: query.categoryId }),
    }

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        include: {
          category: {
            select: {
              color: true,
              id: true,
              name: true,
            },
          },
          kanbanColumn: {
            select: {
              color: true,
              id: true,
              name: true,
              order: true,
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
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        where,
      }),
      prisma.todo.count({ where }),
    ])

    const pagination = {
      hasNext: query.page * query.limit < total,
      hasPrev: query.page > 1,
      limit: query.limit,
      page: query.page,
      total,
      totalPages: Math.ceil(total / query.limit),
    }

    return createSuccessResponse({
      pagination,
      todos,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(error.errors)
    }

    console.error('TODO取得エラー:', error)
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバーエラーが発生しました',
      500
    )
  }
}
