import type { CompleteTodoInput } from '../schemas/todo-mcp'
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

/**
 * TODO完了切り替えツール
 * 
 * データベースを使用してTODOの完了状態をトグルします。
 * 未完了のTODOは完了に、完了済みのTODOは未完了に切り替えます。
 * Webアプリケーションと同じデータベースを共有し、一貫性のあるデータ管理を実現します。
 */
export async function completeTodo(params: CompleteTodoInput) {
  try {
    // 認証チェック
    const userId = await getUserId()

    // TODOの存在確認と権限チェック
    const existingTodo = await mcpPrisma.todo.findUnique({
      where: {
        id: params.id,
        userId: userId, // ユーザー自身のTODOのみ操作可能
      },
      select: {
        id: true,
        isCompleted: true,
      },
    })

    if (!existingTodo) {
      return {
        content: [
          {
            text: 'TODOが見つかりません。指定されたIDのTODOが存在しないか、アクセス権限がありません。',
            type: 'text' as const,
          },
        ],
        isError: true,
      }
    }

    // 完了状態をトグル（現在の状態の反転）
    const newCompletedState = !existingTodo.isCompleted

    // データベースでTODOの完了状態を更新
    const updatedTodo = await mcpPrisma.todo.update({
      where: {
        id: params.id,
      },
      data: {
        isCompleted: newCompletedState,
      },
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
    })

    // 成功レスポンス
    const statusText = updatedTodo.isCompleted ? '完了' : '未完了'
    const statusIcon = updatedTodo.isCompleted ? '✅' : '⬜'
    
    return {
      content: [
        {
          text: `# TODO完了状態更新完了

TODOの完了状態が正常に更新されました:

${statusIcon} **タイトル**: ${updatedTodo.title}
**ステータス**: ${statusText}
**説明**: ${updatedTodo.description || 'なし'}
**期限日**: ${updatedTodo.dueDate ? new Date(updatedTodo.dueDate).toLocaleDateString('ja-JP') : 'なし'}
**重要度**: ${updatedTodo.isImportant ? '重要' : '通常'}
**カテゴリ**: ${updatedTodo.category?.name || 'なし'}
**更新日時**: ${new Date(updatedTodo.updatedAt).toLocaleString('ja-JP')}

ID: ${updatedTodo.id}

TODOの完了状態が正常にデータベースに保存されました。Webアプリケーションでも確認できます。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO完了状態更新エラー:', error)
    
    // エラーの種類に応じたメッセージ
    let errorMessage = 'TODOの完了状態更新に失敗しました。'
    
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