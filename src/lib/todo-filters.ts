/**
 * TODOフィルタ条件を構築する
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
