/**
 * GraphQL TODOフック
 *
 * REST APIからGraphQLへの移行のためのフック
 * 既存のuseTodosフックを置き換えます
 */
import { useCallback } from 'react'

import { useMutation, useQuery } from '@apollo/client'

import type { Todo } from '@/types/todo'

import {
  CREATE_TODO,
  DELETE_TODO,
  GET_TODOS,
  TOGGLE_TODO,
  UPDATE_TODO,
} from '@/graphql/queries/todos'

/**
 * GraphQL TODOフックの戻り値型
 */
interface UseTodosGraphQLResult {
  // 操作関数
  createTodo: (title: string) => Promise<Todo | undefined>
  deleteTodo: (id: string) => Promise<boolean>
  error: Error | undefined

  loading: boolean
  // ユーティリティ
  refetch: () => Promise<void>
  // データ
  todos: Todo[]
  toggleTodo: (id: string) => Promise<Todo | undefined>

  updateTodo: (id: string, data: Partial<Todo>) => Promise<Todo | undefined>
}

/**
 * GraphQL TODOフック
 *
 * REST APIを使用していた部分をGraphQLに置き換えます
 * 既存のuseTodosフックと同じAPIを提供します
 */
export function useTodosGraphQL(): UseTodosGraphQLResult {
  // TODO一覧取得
  const {
    data,
    error,
    loading,
    refetch: refetchQuery,
  } = useQuery(GET_TODOS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })

  // TODO作成ミューテーション
  const [createTodoMutation] = useMutation(CREATE_TODO, {
    update: (cache, { data: mutationData }) => {
      if (mutationData?.createTodo) {
        const existingTodos = cache.readQuery<{ todos: Todo[] }>({
          query: GET_TODOS,
        })

        if (existingTodos) {
          cache.writeQuery({
            data: {
              todos: [mutationData.createTodo, ...existingTodos.todos],
            },
            query: GET_TODOS,
          })
        }
      }
    },
  })

  // TODO更新ミューテーション
  const [updateTodoMutation] = useMutation(UPDATE_TODO)

  // TODO削除ミューテーション
  const [deleteTodoMutation] = useMutation(DELETE_TODO, {
    update: (cache, { data: mutationData }, { variables }) => {
      if (mutationData?.deleteTodo && variables?.id) {
        const existingTodos = cache.readQuery<{ todos: Todo[] }>({
          query: GET_TODOS,
        })

        if (existingTodos) {
          cache.writeQuery({
            data: {
              todos: existingTodos.todos.filter(
                (todo) => todo.id !== variables.id
              ),
            },
            query: GET_TODOS,
          })
        }
      }
    },
  })

  // TODO完了状態切り替えミューテーション
  const [toggleTodoMutation] = useMutation(TOGGLE_TODO)

  // TODO作成関数
  const createTodo = useCallback(
    async (title: string): Promise<Todo | undefined> => {
      try {
        const result = await createTodoMutation({
          variables: { title },
        })
        return (result.data?.createTodo as Todo) ?? undefined
      } catch (error) {
        console.error('Failed to create todo:', error)
        return undefined
      }
    },
    [createTodoMutation]
  )

  // TODO更新関数
  const updateTodo = useCallback(
    async (id: string, data: Partial<Todo>): Promise<Todo | undefined> => {
      try {
        const result = await updateTodoMutation({
          variables: {
            description: data.description,
            id,
            isCompleted: data.isCompleted,
            isImportant: data.isImportant,
            title: data.title,
          },
        })
        return (result.data?.updateTodo as Todo) ?? undefined
      } catch (error) {
        console.error('Failed to update todo:', error)
        return undefined
      }
    },
    [updateTodoMutation]
  )

  // TODO削除関数
  const deleteTodo = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await deleteTodoMutation({
          variables: { id },
        })
        return result.data?.deleteTodo === true
      } catch (error) {
        console.error('Failed to delete todo:', error)
        return false
      }
    },
    [deleteTodoMutation]
  )

  // TODO完了状態切り替え関数
  const toggleTodo = useCallback(
    async (id: string): Promise<Todo | undefined> => {
      try {
        const result = await toggleTodoMutation({
          variables: { id },
        })
        return (result.data?.toggleTodoCompletion as Todo) ?? undefined
      } catch (error) {
        console.error('Failed to toggle todo:', error)
        return undefined
      }
    },
    [toggleTodoMutation]
  )

  // リフェッチ関数
  const refetch = useCallback(async () => {
    try {
      await refetchQuery()
    } catch (error) {
      console.error('Failed to refetch todos:', error)
    }
  }, [refetchQuery])

  return {
    createTodo,
    deleteTodo,
    error,
    loading,
    refetch,
    todos: data?.todos ?? [],
    toggleTodo,
    updateTodo,
  }
}
