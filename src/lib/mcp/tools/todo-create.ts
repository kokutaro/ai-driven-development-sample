import { createTodoInputSchema } from '../schemas/todo-mcp'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * TODO作成ツール
 *
 * 新しいTODOを作成します。
 * タイトルは必須で、その他の項目は任意です。
 */
export async function createTodo(params: Record<string, unknown>) {
  try {
    // パラメータのバリデーション
    const validatedParams = createTodoInputSchema.parse(params)

    // 認証チェック
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    // TODOを作成
    const todo = await prisma.todo.create({
      data: {
        categoryId: validatedParams.categoryId,
        description: validatedParams.description,
        dueDate: validatedParams.dueDate
          ? new Date(validatedParams.dueDate)
          : undefined,
        isImportant: validatedParams.isImportant,
        title: validatedParams.title,
        userId: user.id,
      },
      include: {
        category: {
          select: {
            color: true,
            id: true,
            name: true,
          },
        },
      },
    })

    // レスポンス作成
    const statusIcon = todo.isCompleted ? '✅' : '⬜'
    const importantIcon = todo.isImportant ? '⭐' : ''
    const dueDateText = todo.dueDate
      ? `期限: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}`
      : ''
    const categoryText = todo.category ? `[${todo.category.name}]` : ''

    return {
      content: [
        {
          text: `# TODOが作成されました

${statusIcon} **${todo.title}** ${importantIcon} ${categoryText}
${todo.description ? `説明: ${todo.description}` : ''}
${dueDateText ?? ''}
ID: ${todo.id}

新しいTODOがデータベースに保存されました。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO作成エラー:', error)

    // エラーの種類に応じたメッセージ
    let errorMessage = 'TODOの作成に失敗しました。'

    if (error instanceof Error) {
      if (error.message.includes('認証が必要です')) {
        errorMessage = '認証エラー: ユーザー認証に失敗しました。'
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'バリデーションエラー: 入力値が不正です。'
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
