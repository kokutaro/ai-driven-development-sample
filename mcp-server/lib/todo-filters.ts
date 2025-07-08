/**
 * MCP サーバー用 TODO フィルタ条件を構築する
 * 
 * メインアプリケーションのフィルタ機能と同じロジックを使用し、
 * 一貫性のあるフィルタリングを提供します。
 */
export function buildFilterConditions(filter: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  switch (filter) {
    case 'assigned': {
      return {
        isCompleted: false,
      }
    }
    case 'completed': {
      return {
        isCompleted: true,
      }
    }
    case 'flagged': {
      // 将来の実装用：メール連携機能
      return {
        isCompleted: false,
      }
    }
    case 'important': {
      return {
        isCompleted: false,
        isImportant: true,
      }
    }
    case 'today': {
      return {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        isCompleted: false,
      }
    }
    case 'upcoming': {
      return {
        dueDate: {
          gte: now,
        },
        isCompleted: false,
      }
    }
    default: {
      return {}
    }
  }
}

/**
 * フィルタ名の表示用ラベルを取得
 */
export function getFilterDisplayName(filter: string): string {
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