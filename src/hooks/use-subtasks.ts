import { useCallback, useEffect, useState } from 'react'

import { subTaskClient } from '@/lib/api/subtask-client'
import { type SubTask } from '@/types/todo'

interface UseSubTasksReturn {
  clearError: () => void
  // Actions
  createSubTask: (todoId: string, data: { title: string }) => Promise<void>
  deleteSubTask: (subTaskId: string) => Promise<void>

  error: string | undefined
  isLoading: boolean
  subTasks: SubTask[]
  toggleSubTask: (subTaskId: string) => Promise<void>
  updateSubTask: (subTaskId: string, data: Partial<SubTask>) => Promise<void>
}

/**
 * サブタスクを管理するカスタムフック
 *
 * 指定されたTODOのサブタスクの取得・作成・更新・削除・完了状態の切り替えを提供します。
 *
 * @param todoId - サブタスクを取得するTODOのID
 * @returns サブタスクデータとCRUD操作関数
 */
export function useSubTasks(todoId: string): UseSubTasksReturn {
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  // サブタスク一覧を取得
  const fetchSubTasks = useCallback(async () => {
    if (!todoId) return

    setIsLoading(true)
    setError(undefined)

    try {
      const response = await subTaskClient.getSubTasks(todoId)
      setSubTasks(response.data)
    } catch {
      setError('サブタスクの取得に失敗しました')
      setSubTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [todoId])

  // 新しいサブタスクを作成
  const createSubTask = useCallback(
    async (todoId: string, data: { title: string }) => {
      setError(undefined)

      try {
        const response = await subTaskClient.createSubTask(todoId, data)
        setSubTasks((prev) => [...prev, response.data])
      } catch {
        setError('サブタスクの作成に失敗しました')
      }
    },
    []
  )

  // サブタスクを更新
  const updateSubTask = useCallback(
    async (subTaskId: string, data: Partial<SubTask>) => {
      setError(undefined)

      try {
        const response = await subTaskClient.updateSubTask(
          todoId,
          subTaskId,
          data
        )
        setSubTasks((prev) =>
          prev.map((subTask) =>
            subTask.id === subTaskId
              ? { ...subTask, ...response.data }
              : subTask
          )
        )
      } catch {
        setError('サブタスクの更新に失敗しました')
      }
    },
    [todoId]
  )

  // サブタスクを削除
  const deleteSubTask = useCallback(
    async (subTaskId: string) => {
      setError(undefined)

      try {
        await subTaskClient.deleteSubTask(todoId, subTaskId)
        setSubTasks((prev) =>
          prev.filter((subTask) => subTask.id !== subTaskId)
        )
      } catch {
        setError('サブタスクの削除に失敗しました')
      }
    },
    [todoId]
  )

  // サブタスクの完了状態を切り替え
  const toggleSubTask = useCallback(
    async (subTaskId: string) => {
      setError(undefined)

      try {
        const response = await subTaskClient.toggleSubTask(todoId, subTaskId)
        setSubTasks((prev) =>
          prev.map((subTask) =>
            subTask.id === subTaskId
              ? { ...subTask, ...response.data }
              : subTask
          )
        )
      } catch {
        setError('サブタスクの切り替えに失敗しました')
      }
    },
    [todoId]
  )

  // エラーをクリア
  const clearError = useCallback(() => {
    setError(undefined)
  }, [])

  // 初期データの取得
  useEffect(() => {
    void fetchSubTasks()
  }, [fetchSubTasks])

  return {
    clearError,
    createSubTask,
    deleteSubTask,
    error,
    isLoading,
    subTasks,
    toggleSubTask,
    updateSubTask,
  }
}
