import type { ListTodosInput } from '../schemas/todo-mcp'

/**
 * TODO一覧取得ツール（簡略版）
 * 
 * 実際の本番環境では、データベース接続と認証を実装する必要があります。
 * このバージョンはパフォーマンス問題の解決のためのMock実装です。
 */
export async function listTodos(params: ListTodosInput) {
  try {
    // Mock データを返す
    const mockTodos = [
      {
        id: 'todo_1',
        title: 'サンプルタスク1',
        description: 'これはサンプルタスクです',
        isCompleted: false,
        isImportant: true,
        category: 'work',
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'todo_2', 
        title: 'サンプルタスク2',
        description: '別のサンプルタスクです',
        isCompleted: true,
        isImportant: false,
        category: 'personal',
        dueDate: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // フィルター適用
    let filteredTodos = mockTodos
    if (params.filter === 'completed') {
      filteredTodos = mockTodos.filter(todo => todo.isCompleted)
    } else if (params.filter === 'important') {
      filteredTodos = mockTodos.filter(todo => todo.isImportant && !todo.isCompleted)
    } else if (params.filter === 'today') {
      filteredTodos = mockTodos.filter(todo => todo.dueDate && !todo.isCompleted)
    }

    const filterDisplayNames = {
      all: 'すべて',
      assigned: '自分に割り当て',
      completed: '完了済み',
      flagged: 'フラグ付き',
      important: '重要',
      today: '今日',
      upcoming: '今後の予定',
    }

    const filter = filterDisplayNames[params.filter] || params.filter
    const total = filteredTodos.length

    return {
      content: [
        {
          text: `# TODO一覧 (フィルター: ${filter})

**合計: ${total}件** (Mock データ)

${filteredTodos
  .map((todo) => {
    const statusIcon = todo.isCompleted ? '✅' : '⬜'
    const importantIcon = todo.isImportant ? '⭐' : ''
    const dueDateText = todo.dueDate
      ? `期限: ${new Date(todo.dueDate).toLocaleDateString('ja-JP')}`
      : ''
    const categoryText = `[${todo.category}]`

    return `${statusIcon} **${todo.title}** ${importantIcon} ${categoryText}
${todo.description ? `   ${todo.description}` : ''}
${dueDateText ? `   ${dueDateText}` : ''}
---`
  })
  .join('\n')}

**注意**: これはMock実装です。実際のデータベース統合が必要です。`,
          type: 'text' as const,
        },
      ],
    }
  } catch (error) {
    console.error('TODO一覧取得エラー:', error)
    return {
      content: [
        {
          text: `エラー: TODO一覧の取得に失敗しました。${error instanceof Error ? error.message : '不明なエラー'}`,
          type: 'text' as const,
        },
      ],
      isError: true,
    }
  }
}