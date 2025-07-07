/**
 * タスクストア
 * @fileoverview Zustandを使用したタスク状態管理
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import type {
  Task,
  TaskFilter,
  TaskSortOrder,
  UpdateTaskInput,
} from '@/types/task'

/**
 * タスクストアの型定義
 */
type TaskStore = TaskStoreActions & TaskStoreComputed & TaskStoreState

/**
 * タスクストアのアクションの型定義
 */
interface TaskStoreActions {
  /**
   * タスクを追加
   * @param task 追加するタスク
   */
  addTask: (task: Task) => void

  /**
   * エラーをクリア
   */
  clearError: () => void

  /**
   * 選択されたタスクをクリア
   */
  clearSelectedTask: () => void

  /**
   * IDでタスクを取得
   * @param taskId タスクID
   * @returns タスク（見つからない場合はundefined）
   */
  getTaskById: (taskId: string) => Task | undefined

  /**
   * タスクを削除
   * @param taskId タスクID
   */
  removeTask: (taskId: string) => void

  /**
   * ストアを初期状態にリセット
   */
  resetStore: () => void

  /**
   * エラーを設定
   * @param error エラーメッセージ
   */
  setError: (error: string) => void

  /**
   * フィルターを設定
   * @param filter フィルター
   */
  setFilter: (filter: TaskFilter) => void

  /**
   * ローディング状態を設定
   * @param loading ローディング状態
   */
  setLoading: (loading: boolean) => void

  /**
   * 選択されたタスクIDを設定
   * @param taskId タスクID
   */
  setSelectedTaskId: (taskId: string) => void

  /**
   * ソート順を設定
   * @param sortOrder ソート順
   */
  setSortOrder: (sortOrder: TaskSortOrder) => void

  /**
   * タスク一覧を設定
   * @param tasks タスク一覧
   */
  setTasks: (tasks: Task[]) => void

  /**
   * タスクの完了状態を切り替え
   * @param taskId タスクID
   */
  toggleTaskCompletion: (taskId: string) => void

  /**
   * タスクの重要度を切り替え
   * @param taskId タスクID
   */
  toggleTaskImportance: (taskId: string) => void

  /**
   * タスクを更新
   * @param taskId タスクID
   * @param updates 更新内容
   */
  updateTask: (taskId: string, updates: UpdateTaskInput) => void
}

/**
 * 計算されたプロパティの型定義
 */
interface TaskStoreComputed {
  /**
   * フィルタリングされたタスクの数（計算プロパティ）
   */
  readonly filteredTaskCount: number

  /**
   * フィルタリングされたタスク一覧（計算プロパティ）
   */
  readonly filteredTasks: Task[]

  /**
   * フィルタリングされたタスクの数を取得
   * @returns フィルタリングされたタスクの数
   */
  getFilteredTaskCount: () => number

  /**
   * フィルタリングされたタスク一覧を取得
   * @returns フィルタリングされたタスク一覧
   */
  getFilteredTasks: () => Task[]

  /**
   * 選択されたタスクを取得
   * @returns 選択されたタスク（選択されていない場合はundefined）
   */
  getSelectedTask: () => Task | undefined

  /**
   * 選択されたタスク（計算プロパティ）
   */
  readonly selectedTask?: Task
}

/**
 * タスクストアの状態の型定義
 */
interface TaskStoreState {
  /**
   * エラーメッセージ
   */
  error?: string

  /**
   * 現在のフィルター
   */
  filter: TaskFilter

  /**
   * ローディング状態
   */
  isLoading: boolean

  /**
   * 選択されたタスクのID
   */
  selectedTaskId?: string

  /**
   * 現在のソート順
   */
  sortOrder: TaskSortOrder

  /**
   * タスク一覧
   */
  tasks: Task[]
}

/**
 * 初期状態
 */
const initialState: TaskStoreState = {
  error: undefined,
  filter: 'all',
  isLoading: false,
  selectedTaskId: undefined,
  sortOrder: 'createdAt',
  tasks: [],
}

/**
 * タスクをフィルタリングする関数
 * @param tasks タスク一覧
 * @param filter フィルター
 * @returns フィルタリングされたタスク一覧
 */
function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'all': {
      return tasks
    }

    case 'assigned-to-me': {
      // 現在のユーザーに割り当てられたタスク
      // 実装時にユーザーIDと比較する
      return tasks
    }

    case 'completed': {
      return tasks.filter((task) => task.completed)
    }

    case 'flagged-email': {
      // メール関連のフラグが設定されたタスク
      // 将来的な機能として実装
      return []
    }

    case 'important': {
      return tasks.filter((task) => task.important)
    }

    case 'planned': {
      return tasks.filter((task) => task.dueDate !== undefined)
    }

    case 'today': {
      const today = new Date()
      const todayString = today.toDateString()
      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return taskDate.toDateString() === todayString
      })
    }

    default: {
      return tasks
    }
  }
}

/**
 * タスクをソートする関数
 * @param tasks タスク一覧
 * @param sortOrder ソート順
 * @returns ソートされたタスク一覧
 */
function sortTasks(tasks: Task[], sortOrder: TaskSortOrder): Task[] {
  const tasksCopy = [...tasks]

  switch (sortOrder) {
    case 'alphabetical': {
      return tasksCopy.sort((a, b) => a.title.localeCompare(b.title))
    }

    case 'createdAt': {
      return tasksCopy.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )
    }

    case 'dueDate': {
      return tasksCopy.sort((a, b) => {
        // 期限のないタスクは最後に配置
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.getTime() - b.dueDate.getTime()
      })
    }

    case 'importance': {
      return tasksCopy.sort((a, b) => {
        // 重要なタスクを最初に配置
        if (a.important && !b.important) return -1
        if (!a.important && b.important) return 1
        return 0
      })
    }

    default: {
      return tasksCopy
    }
  }
}

/**
 * タスクストア
 */
export const useTaskStore = create<TaskStore>()(
  devtools(
    (set, get) => ({
      // 初期状態
      ...initialState,

      addTask: (task) =>
        set(
          (state) => ({ tasks: [...state.tasks, task] }),
          false,
          'taskStore/addTask'
        ),

      clearError: () =>
        set({ error: undefined }, false, 'taskStore/clearError'),

      clearSelectedTask: () =>
        set(
          { selectedTaskId: undefined },
          false,
          'taskStore/clearSelectedTask'
        ),

      get filteredTaskCount() {
        const { filter, tasks } = get()
        return filterTasks(tasks, filter).length
      },

      get filteredTasks() {
        const { filter, sortOrder, tasks } = get()
        const filtered = filterTasks(tasks, filter)
        return sortTasks(filtered, sortOrder)
      },

      getFilteredTaskCount: () => {
        const state = get()
        return filterTasks(state.tasks, state.filter).length
      },

      getFilteredTasks: () => {
        const state = get()
        const filtered = filterTasks(state.tasks, state.filter)
        return sortTasks(filtered, state.sortOrder)
      },

      // 計算されたプロパティ（関数版）
      getSelectedTask: () => {
        const state = get()
        if (!state.selectedTaskId) return
        return state.tasks.find((task) => task.id === state.selectedTaskId)
      },

      getTaskById: (taskId) => {
        const state = get()
        return state.tasks.find((task) => task.id === taskId)
      },

      removeTask: (taskId) =>
        set(
          (state) => ({
            selectedTaskId:
              state.selectedTaskId === taskId
                ? undefined
                : state.selectedTaskId,
            tasks: state.tasks.filter((task) => task.id !== taskId),
          }),
          false,
          'taskStore/removeTask'
        ),

      resetStore: () => set(initialState, false, 'taskStore/resetStore'),

      // 計算されたプロパティ（プロパティアクセス用）
      get selectedTask() {
        const { selectedTaskId, tasks } = get()
        if (!selectedTaskId) return
        return tasks.find((task) => task.id === selectedTaskId)
      },

      setError: (error) => set({ error }, false, 'taskStore/setError'),

      setFilter: (filter) => set({ filter }, false, 'taskStore/setFilter'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'taskStore/setLoading'),

      setSelectedTaskId: (taskId) =>
        set({ selectedTaskId: taskId }, false, 'taskStore/setSelectedTaskId'),

      setSortOrder: (sortOrder) =>
        set({ sortOrder }, false, 'taskStore/setSortOrder'),

      // アクション
      setTasks: (tasks) => set({ tasks }, false, 'taskStore/setTasks'),

      toggleTaskCompletion: (taskId) =>
        set(
          (state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    completed: !task.completed,
                    updatedAt: new Date(),
                  }
                : task
            ),
          }),
          false,
          'taskStore/toggleTaskCompletion'
        ),

      toggleTaskImportance: (taskId) =>
        set(
          (state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    important: !task.important,
                    updatedAt: new Date(),
                  }
                : task
            ),
          }),
          false,
          'taskStore/toggleTaskImportance'
        ),

      updateTask: (taskId, updates) =>
        set(
          (state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    ...updates,
                    updatedAt: new Date(),
                  }
                : task
            ),
          }),
          false,
          'taskStore/updateTask'
        ),
    }),
    {
      name: 'task-store',
    }
  )
)
