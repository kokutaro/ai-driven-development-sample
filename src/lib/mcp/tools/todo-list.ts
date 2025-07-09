import { listTodosInputSchema } from '../schemas/todo-mcp'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildFilterConditions } from '@/lib/todo-filters'

/**
 * TODO一覧取得ツール
 *
 * データベースから実際のTODOを取得します。
 * フィルタリング、ソート、ページネーション機能を提供し、
 * Webアプリケーションと同じ機能を実現します。
 */
export async function listTodos(params: Record<string, unknown>) {
  try {
    // パラメータのバリデーション
    const validatedParams = listTodosInputSchema.parse(params)

    // 認証チェック
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    // フィルタ条件を構築
    const filterConditions = buildFilterConditions(validatedParams.filter)

    // WHERE句を構築
    const where = {
      userId: user.id,
      ...filterConditions,
      ...(validatedParams.categoryId && {
        categoryId: validatedParams.categoryId,
      }),
    }

    // ソート条件を構築
    const orderBy = {
      [validatedParams.sortBy]: validatedParams.sortOrder,
    }

    // データベースからTODOを取得
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
        orderBy,
        skip: (validatedParams.page - 1) * validatedParams.limit,
        take: validatedParams.limit,
        where,
      }),
      prisma.todo.count({ where }),
    ])

    // ページネーション情報
    const pagination = {
      hasNext: validatedParams.page * validatedParams.limit < total,
      hasPrev: validatedParams.page > 1,
      limit: validatedParams.limit,
      page: validatedParams.page,
      total,
      totalPages: Math.ceil(total / validatedParams.limit),
    }

    const filterDisplayName = getFilterDisplayName(validatedParams.filter)

    // レスポンス作成
    const todoList = todos
      .map((todo) => {
        const statusIcon = todo.isCompleted ? '✅' : '⬜'
        const importantIcon = todo.isImportant ? '⭐' : ''
        const dueDateText = todo.dueDate
          ? `期限: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}`
          : ''
        const categoryText = todo.category ? `[${todo.category.name}]` : ''
        const subTasksText =
          todo.subTasks.length > 0
            ? `サブタスク: ${todo.subTasks.filter((st) => st.isCompleted).length}/${todo.subTasks.length}完了`
            : ''

        return `${statusIcon} **${todo.title}** ${importantIcon} ${categoryText}
${todo.description ? `   ${todo.description}` : ''}
${dueDateText ? `   ${dueDateText}` : ''}
${subTasksText ? `   ${subTasksText}` : ''}
   ID: ${todo.id}
---`
      })
      .join('\n')

    return {
      content: [
        {
          text: `# TODO一覧 (フィルター: ${filterDisplayName})

**合計: ${total}件** | **ページ: ${pagination.page}/${pagination.totalPages}**

${todoList || 'TODOが見つかりませんでした。'}

${
  pagination.totalPages > 1
    ? `
**ページネーション**:
- 現在: ${pagination.page}/${pagination.totalPages}ページ
- 前のページ: ${pagination.hasPrev ? '有' : '無'}
- 次のページ: ${pagination.hasNext ? '有' : '無'}
`
    : ''
}

データベースから取得した実際のTODOデータです。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO一覧取得エラー:', error)

    // エラーの種類に応じたメッセージ
    let errorMessage = 'TODO一覧の取得に失敗しました。'

    if (error instanceof Error) {
      errorMessage = error.message.includes('認証が必要です')
        ? '認証エラー: ユーザー認証に失敗しました。'
        : `エラー: ${error.message}`
    }

    return {
      content: [
        {
          text: errorMessage,
          type: 'text' as const,
        },
      ],
      isError: true,
    }
  }
}

/**
 * フィルタ名の表示用ラベルを取得
 */
function getFilterDisplayName(filter: string): string {
  const displayNames: Record<string, string> = {
    all: 'すべて',
    assigned: '自分に割り当て',
    completed: '完了済み',
    flagged: 'フラグ付き',
    important: '重要',
    today: '今日',
    upcoming: '今後の予定',
  }

  return displayNames[filter] || filter
}
