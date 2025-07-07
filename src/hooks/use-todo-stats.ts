import { useMemo } from 'react'

import { useClientOnly } from '@/hooks/use-client-only'
import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO統計情報を計算するカスタムフック
 *
 * 各フィルタで使用されるタスク数を計算し、リアルタイムで更新します。
 * - todayCount: 今日が期限の未完了タスク数
 * - importantCount: 重要な未完了タスク数
 * - upcomingCount: 期限が今日以降の未完了タスク数
 * - assignedCount: 自分に割り当てられた未完了タスク数（全未完了タスク）
 * - totalCount: 全タスク数
 * - completedCount: 完了済みタスク数
 */
export function useTodoStats() {
  const { todos } = useTodoStore()
  const isClient = useClientOnly()

  const stats = useMemo(() => {
    if (!isClient || !todos || todos.length === 0) {
      return {
        assignedCount: 0,
        completedCount: 0,
        importantCount: 0,
        todayCount: 0,
        totalCount: 0,
        upcomingCount: 0,
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      // 自分に割り当てられた未完了タスク（全未完了タスク）
      assignedCount: todos.filter((todo) => !todo.isCompleted).length,

      // 完了済みタスク数
      completedCount: todos.filter((todo) => todo.isCompleted).length,

      // 重要な未完了タスク
      importantCount: todos.filter(
        (todo) => todo.isImportant && !todo.isCompleted
      ).length,

      // 今日が期限の未完了タスク
      todayCount: todos.filter((todo) => {
        if (!todo.dueDate || todo.isCompleted) return false
        const dueDate = new Date(todo.dueDate)
        const dueDay = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        )
        return dueDay.getTime() === today.getTime()
      }).length,

      // 全タスク数
      totalCount: todos.length,

      // 期限が今日以降の未完了タスク
      upcomingCount: todos.filter((todo) => {
        if (!todo.dueDate || todo.isCompleted) return false
        const dueDate = new Date(todo.dueDate)
        return dueDate >= today
      }).length,
    }
  }, [todos, isClient])

  return { stats }
}
