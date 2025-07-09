import { deleteTodoInputSchema } from '../schemas/todo-mcp'

import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * TODO削除ツール
 *
 * TODOを削除します。
 * 削除されたTODOは復元できません。
 * 関連するサブタスクやリマインダーも同時に削除されます。
 */
export async function deleteTodo(params: Record<string, unknown>) {
  try {
    // パラメータのバリデーション
    const validatedParams = deleteTodoInputSchema.parse(params)

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
        subTasks: true,
      },
      where: {
        id: validatedParams.id,
        userId: user.id,
      },
    })

    if (!todo) {
      throw new Error('指定されたTODOが見つかりません。')
    }

    // TODOを削除（関連データも自動的に削除される）
    await prisma.todo.delete({
      where: {
        id: validatedParams.id,
      },
    })

    // レスポンス作成
    const categoryText = todo.category ? `[${todo.category.name}]` : ''
    const subTasksText =
      todo.subTasks.length > 0
        ? `（サブタスク ${todo.subTasks.length} 件も削除されました）`
        : ''

    return {
      content: [
        {
          text: `# TODOが削除されました

**${todo.title}** ${categoryText} が削除されました。
${subTasksText}

ID: ${todo.id}

この操作は取り消すことができません。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO削除エラー:', error)

    // エラーの種類に応じたメッセージ
    let errorMessage = 'TODOの削除に失敗しました。'

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
