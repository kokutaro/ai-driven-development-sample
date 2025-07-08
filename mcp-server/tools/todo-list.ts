import type { ListTodosInput } from '../schemas/todo-mcp'
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'
import { buildFilterConditions, getFilterDisplayName } from '../lib/todo-filters'

/**
 * TODO一覧取得ツール
 * 
 * データベースから実際のTODOを取得します。
 * フィルタリング、ソート、ページネーション機能を提供し、
 * Webアプリケーションと同じ機能を実現します。
 */
export async function listTodos(params: ListTodosInput) {
  try {
    // 認証チェック
    const userId = await getUserId()

    // フィルタ条件を構築
    const filterConditions = buildFilterConditions(params.filter)
    
    // WHERE句を構築
    const where = {
      userId,
      ...filterConditions,
      ...(params.categoryId && { categoryId: params.categoryId }),
    }

    // ソート条件を構築
    const orderBy = {
      [params.sortBy]: params.sortOrder,
    }

    // データベースからTODOを取得
    const [todos, total] = await Promise.all([
      mcpPrisma.todo.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          subTasks: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      mcpPrisma.todo.count({ where }),
    ])

    // ページネーション情報
    const pagination = {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasNext: params.page * params.limit < total,
      hasPrev: params.page > 1,
    }

    const filterDisplayName = getFilterDisplayName(params.filter)

    // レスポンス作成
    const todoList = todos
      .map((todo) => {
        const statusIcon = todo.isCompleted ? '✅' : '⬜'
        const importantIcon = todo.isImportant ? '⭐' : ''
        const dueDateText = todo.dueDate
          ? `期限: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}`
          : ''
        const categoryText = todo.category ? `[${todo.category.name}]` : ''
        const subTasksText = todo.subTasks.length > 0 
          ? `サブタスク: ${todo.subTasks.filter(st => st.isCompleted).length}/${todo.subTasks.length}完了`
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

${pagination.totalPages > 1 ? `
**ページネーション**:
- 現在: ${pagination.page}/${pagination.totalPages}ページ
- 前のページ: ${pagination.hasPrev ? '有' : '無'}
- 次のページ: ${pagination.hasNext ? '有' : '無'}
` : ''}

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
      if (error.message.includes('認証が必要です')) {
        errorMessage = '認証エラー: ユーザー認証に失敗しました。'
      } else {
        errorMessage = `エラー: ${error.message}`
      }
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