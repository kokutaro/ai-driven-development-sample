import { completeTodoInputSchema } from '../schemas/todo-mcp'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * TODO完了切り替えツール
 *
 * TODOの完了状態を切り替えます。
 * 未完了のTODOは完了に、完了済みのTODOは未完了に変更されます。
 */
export async function completeTodo(params: Record<string, unknown>) {
  try {
    // パラメータのバリデーション
    const validatedParams = completeTodoInputSchema.parse(params)

    // 認証チェック
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('認証が必要です')
    }

    // 対象のTODOを取得
    const todo = await prisma.todo.findFirst({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      where: {
        id: validatedParams.id,
        userId: user.id,
      },
    })

    if (!todo) {
      throw new Error('指定されたTODOが見つかりません。')
    }

    // 完了状態を切り替え
    const updatedTodo = await prisma.todo.update({
      data: {
        isCompleted: !todo.isCompleted,
      },
      where: {
        id: validatedParams.id,
      },
    })

    // レスポンス作成
    const newStatus = updatedTodo.isCompleted ? '完了' : '未完了'
    const statusIcon = updatedTodo.isCompleted ? '✅' : '⬜'
    const categoryText = todo.category ? `[${todo.category.name}]` : ''

    return {
      content: [
        {
          text: `# TODOのステータスが更新されました

${statusIcon} **${todo.title}** ${categoryText}
状態: **${newStatus}**に変更されました
ID: ${todo.id}

データベースが更新されました。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO完了切り替えエラー:', error)

    // エラーの種類に応じたメッセージ
    let errorMessage = 'TODOの状態更新に失敗しました。'

    if (error instanceof Error) {
      if (error.message.includes('認証が必要です')) {
        errorMessage = '認証エラー: ユーザー認証に失敗しました。'
      } else if (error.message.includes('見つかりません')) {
        errorMessage = error.message
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
