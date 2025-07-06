import type { TodoFilter } from '@/types/filter'
import type { Todo } from '@/types/todo'

/**
 * 指定されたフィルタに基づいてTODOリストをフィルタリングする
 *
 * @param todos フィルタリング対象のTODOリスト
 * @param filter 適用するフィルタ
 * @returns フィルタリング後のTODOリスト
 */
export function getFilteredTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  switch (filter) {
    case 'all': {
      return todos
    }
    case 'completed': {
      return todos.filter((todo) => todo.status === 'completed')
    }
    case 'thisMonth': {
      return todos.filter((todo) => isThisMonth(todo.createdAt))
    }
    case 'thisWeek': {
      return todos.filter((todo) => isThisWeek(todo.createdAt))
    }
    case 'today': {
      return todos.filter((todo) => isToday(todo.createdAt))
    }
    default: {
      return todos
    }
  }
}

/**
 * 指定された日付が今月かどうかを判定する
 *
 * @param date 判定対象の日付
 * @returns 今月の場合はtrue、そうでなければfalse
 */
export function isThisMonth(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  )
}

/**
 * 指定された日付が今週かどうかを判定する
 * 週の開始は月曜日とする
 *
 * @param date 判定対象の日付
 * @returns 今週の場合はtrue、そうでなければfalse
 */
export function isThisWeek(date: Date): boolean {
  const today = new Date()
  const startOfWeek = new Date(today)

  // 月曜日を週の開始とする（0=日曜日、1=月曜日）
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startOfWeek.setDate(today.getDate() - daysToMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return date >= startOfWeek && date <= endOfWeek
}

/**
 * 指定された日付が今日かどうかを判定する
 *
 * @param date 判定対象の日付
 * @returns 今日の場合はtrue、そうでなければfalse
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}
