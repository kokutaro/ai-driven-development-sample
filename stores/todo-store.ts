import { create } from 'zustand'

import { Todo, TodoStatus } from '../schemas/todo'

interface TodoStore {
  todos: Todo[]
  addTodo: (title: string, description?: string) => void
  updateTodo: (
    id: string,
    updates: Partial<Pick<Todo, 'title' | 'description' | 'status'>>
  ) => void
  deleteTodo: (id: string) => void
  toggleTodoStatus: (id: string) => void
  getTodoById: (id: string) => Todo | undefined
  getFilteredTodos: (status?: TodoStatus) => Todo[]
}

/**
 * TODOアプリケーションの状態管理ストア
 *
 * @returns TodoStore インスタンス
 */
export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],

  /**
   * 新しいTODO項目を追加
   *
   * @param title - TODO項目のタイトル
   * @param description - TODO項目の説明（オプション）
   */
  addTodo: (title: string, description?: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      todos: [...state.todos, newTodo],
    }))
  },

  /**
   * TODO項目を更新
   *
   * @param id - 更新するTODO項目のID
   * @param updates - 更新内容
   */
  updateTodo: (
    id: string,
    updates: Partial<Pick<Todo, 'title' | 'description' | 'status'>>
  ) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
      ),
    }))
  },

  /**
   * TODO項目を削除
   *
   * @param id - 削除するTODO項目のID
   */
  deleteTodo: (id: string) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }))
  },

  /**
   * TODO項目のステータスを切り替え
   *
   * @param id - 切り替えるTODO項目のID
   */
  toggleTodoStatus: (id: string) => {
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: todo.status === 'pending' ? 'completed' : 'pending',
              updatedAt: new Date(),
            }
          : todo
      ),
    }))
  },

  /**
   * IDでTODO項目を取得
   *
   * @param id - 取得するTODO項目のID
   * @returns 該当するTODO項目、または undefined
   */
  getTodoById: (id: string) => {
    return get().todos.find((todo) => todo.id === id)
  },

  /**
   * ステータスでフィルタリングしたTODO項目を取得
   *
   * @param status - フィルタリングするステータス（オプション）
   * @returns フィルタリングされたTODO項目のリスト
   */
  getFilteredTodos: (status?: TodoStatus) => {
    const todos = get().todos
    if (!status) return todos
    return todos.filter((todo) => todo.status === status)
  },
}))
