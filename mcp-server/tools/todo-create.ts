import type { CreateTodoInput } from '../schemas/todo-mcp'

/**
 * TODO作成ツール（簡略版）
 * 
 * 実際の本番環境では、データベース接続と認証を実装する必要があります。
 * このバージョンはパフォーマンス問題の解決のためのMock実装です。
 */
export async function createTodo(params: CreateTodoInput) {
  try {
    // Mock TODO作成
    const mockTodo = {
      id: `todo_${Date.now()}`,
      title: params.title,
      description: params.description || undefined,
      dueDate: params.dueDate || undefined,
      isImportant: params.isImportant || false,
      isCompleted: false,
      categoryId: params.categoryId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return {
      content: [
        {
          text: `# TODO作成完了

新しいTODOが作成されました（Mock）:

**タイトル**: ${mockTodo.title}
**説明**: ${mockTodo.description || 'なし'}
**期限日**: ${mockTodo.dueDate ? new Date(mockTodo.dueDate).toLocaleDateString('ja-JP') : 'なし'}
**重要度**: ${mockTodo.isImportant ? '重要' : '通常'}
**作成日時**: ${new Date(mockTodo.createdAt).toLocaleString('ja-JP')}

ID: ${mockTodo.id}

**注意**: これはMock実装です。実際のデータベース統合が必要です。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO作成エラー:', error)
    return {
      content: [
        {
          text: `エラー: TODOの作成に失敗しました。${error instanceof Error ? error.message : '不明なエラー'}`,
          type: 'text' as const,
        },
      ],
      isError: true,
    }
  }
}