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
export function isThisMonth(date: Date | null | string | undefined): boolean {
  const safeDate = toSafeDate(date)
  if (!safeDate) {
    return false
  }

  const today = new Date()
  return (
    safeDate.getFullYear() === today.getFullYear() &&
    safeDate.getMonth() === today.getMonth()
  )
}

/**
 * 指定された日付が今週かどうかを判定する
 * 週の開始は月曜日とする
 *
 * @param date 判定対象の日付
 * @returns 今週の場合はtrue、そうでなければfalse
 */
export function isThisWeek(date: Date | null | string | undefined): boolean {
  const safeDate = toSafeDate(date)
  if (!safeDate) {
    return false
  }

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

  return safeDate >= startOfWeek && safeDate <= endOfWeek
}

/**
 * 指定された日付が今日かどうかを判定する
 *
 * @param date 判定対象の日付
 * @returns 今日の場合はtrue、そうでなければfalse
 */
export function isToday(date: Date | null | string | undefined): boolean {
  const safeDate = toSafeDate(date)
  if (!safeDate) {
    return false
  }

  const today = new Date()
  return (
    safeDate.getFullYear() === today.getFullYear() &&
    safeDate.getMonth() === today.getMonth() &&
    safeDate.getDate() === today.getDate()
  )
}

/**
 * 日付の入力値を安全にDateオブジェクトに変換する
 *
 * @param date 日付の入力値（Date、string、またはnull/undefined）
 * @returns 有効なDateオブジェクト、または無効な場合はundefined
 */
function toSafeDate(date: Date | null | string | undefined): Date | undefined {
  if (!date) {
    return undefined
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date)

    // Invalid Date の場合は undefined を返す
    if (Number.isNaN(dateObj.getTime())) {
      return undefined
    }

    return dateObj
  } catch {
    return undefined
  }
}
