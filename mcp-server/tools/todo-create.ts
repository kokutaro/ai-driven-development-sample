import type { CreateTodoInput } from '../schemas/todo-mcp'
import { mcpPrisma } from '../lib/db'
import { getUserId } from '../lib/auth'

/**
 * TODO作成ツール
 * 
 * データベースを使用して実際のTODOを作成します。
 * Webアプリケーションと同じデータベースを共有し、一貫性のあるデータ管理を実現します。
 */
export async function createTodo(params: CreateTodoInput) {
  try {
    // 認証チェック
    const userId = await getUserId()

    // TODO作成データの準備
    const createData = {
      title: params.title,
      description: params.description || null,
      dueDate: params.dueDate ? new Date(params.dueDate) : null,
      isImportant: params.isImportant || false,
      isCompleted: false,
      categoryId: params.categoryId || null,
      userId,
      order: 0,
    }

    // データベースにTODOを作成
    const newTodo = await mcpPrisma.todo.create({
      data: createData,
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
    return {
      content: [
        {
          text: `# TODO作成完了

新しいTODOが正常に作成されました:

**タイトル**: ${newTodo.title}
**説明**: ${newTodo.description || 'なし'}
**期限日**: ${newTodo.dueDate ? new Date(newTodo.dueDate).toLocaleDateString('ja-JP') : 'なし'}
**重要度**: ${newTodo.isImportant ? '重要' : '通常'}
**カテゴリ**: ${newTodo.category?.name || 'なし'}
**作成日時**: ${new Date(newTodo.createdAt).toLocaleString('ja-JP')}

ID: ${newTodo.id}

TODOが正常にデータベースに保存されました。Webアプリケーションでも確認できます。`,
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
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'カテゴリIDが無効です。存在するカテゴリを指定してください。'
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