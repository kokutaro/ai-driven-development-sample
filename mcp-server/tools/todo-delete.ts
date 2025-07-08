import type { DeleteTodoInput } from '../schemas/todo-mcp'
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

/**
 * TODO削除ツール
 * 
 * データベースを使用してTODOを削除します。
 * 削除処理では、関連するサブタスクやリマインダーも自動的に削除されます（CASCADE DELETE）。
 * Webアプリケーションと同じデータベースを共有し、一貫性のあるデータ管理を実現します。
 */
export async function deleteTodo(params: DeleteTodoInput) {
  try {
    // 認証チェック
    const userId = await getUserId()

    // TODOの存在確認と権限チェック
    const existingTodo = await mcpPrisma.todo.findUnique({
      where: {
        id: params.id,
        userId: userId, // ユーザー自身のTODOのみ操作可能
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

    // データベースからTODOを削除
    // Prismaのスキーマで関連データ（サブタスク、リマインダー）は自動的にCASCADE削除される
    await mcpPrisma.todo.delete({
      where: {
        id: params.id,
      },
    })

    // 成功レスポンス
    const subTasksInfo = existingTodo.subTasks.length > 0
      ? `\n**サブタスク**: ${existingTodo.subTasks.length}個のサブタスクも削除されました`
      : ''
    
    return {
      content: [
        {
          text: `# TODO削除完了

TODOが正常に削除されました:

🗑️ **タイトル**: ${existingTodo.title}
**説明**: ${existingTodo.description || 'なし'}
**期限日**: ${existingTodo.dueDate ? new Date(existingTodo.dueDate).toLocaleDateString('ja-JP') : 'なし'}
**重要度**: ${existingTodo.isImportant ? '重要' : '通常'}
**カテゴリ**: ${existingTodo.category?.name || 'なし'}
**ステータス**: ${existingTodo.isCompleted ? '完了済み' : '未完了'}${subTasksInfo}

ID: ${existingTodo.id}

TODOが正常にデータベースから削除されました。Webアプリケーションでも反映されています。`,
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
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'データベースエラー: 関連するデータの制約により削除できませんでした。'
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