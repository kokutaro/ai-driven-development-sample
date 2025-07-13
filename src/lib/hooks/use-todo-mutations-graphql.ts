/**
 * GraphQL版Todoミューテーションフック
 *
 * Apollo Clientを使用してTodoのCUD操作を提供します。
 * 既存のTodoStoreと同様のAPIを提供し、キャッシュ更新も処理します。
 */
import { gql, useMutation } from '@apollo/client'

import type {
  CreateTodoInput,
  UpdateTodoInput,
} from '@/graphql/types/todo.types'

/**
 * Todo作成ミューテーション
 */
const CREATE_TODO = gql`
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      success
      message
      todo {
        id
        title
        description
        dueDate
        priority
        status
        isOverdue
        completionRate
        createdAt
        updatedAt
        category {
          id
          name
          color
        }
        subTasks {
          id
          title
          completed
          order
        }
      }
    }
  }
`

/**
 * Todo更新ミューテーション
 */
const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
    updateTodo(id: $id, input: $input) {
      success
      message
      todo {
        id
        title
        description
        dueDate
        priority
        status
        isOverdue
        completionRate
        createdAt
        updatedAt
        category {
          id
          name
          color
        }
        subTasks {
          id
          title
          completed
          order
        }
      }
    }
  }
`

/**
 * Todo削除ミューテーション
 */
const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id) {
      success
      message
    }
  }
`

/**
 * Todo作成用のフック
 *
 * @returns 作成ミューテーション関数と状態
 */
export function useCreateTodoGraphQL() {
  const [createTodoMutation, { data, error, loading }] = useMutation(
    CREATE_TODO,
    {
      errorPolicy: 'all',
      // キャッシュ更新戦略
      update(cache, { data }) {
        if (data?.createTodo?.success && data.createTodo.todo) {
          // 新しいTodoをキャッシュに追加
          cache.modify({
            fields: {
              todos(
                existingTodos = {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  todos: [],
                  total: 0,
                }
              ) {
                const newTodo = data.createTodo.todo
                return {
                  ...existingTodos,
                  todos: [newTodo, ...existingTodos.todos],
                  total: existingTodos.total + 1,
                }
              },
            },
          })
        }
      },
    }
  )

  const createTodo = async (input: CreateTodoInput) => {
    try {
      const result = await createTodoMutation({ variables: { input } })
      return result.data?.createTodo
    } catch (error_) {
      throw new Error(
        error_ instanceof Error ? error_.message : 'Failed to create todo'
      )
    }
  }

  return {
    createTodo,
    data: data?.createTodo,
    error: error?.message || null,
    isLoading: loading,
  }
}

/**
 * Todo削除用のフック
 *
 * @returns 削除ミューテーション関数と状態
 */
export function useDeleteTodoGraphQL() {
  const [deleteTodoMutation, { data, error, loading }] = useMutation(
    DELETE_TODO,
    {
      errorPolicy: 'all',
      // キャッシュから削除
      update(cache, { data }, { variables }) {
        if (data?.deleteTodo?.success && variables?.id) {
          cache.modify({
            fields: {
              todos(
                existingTodos = {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  todos: [],
                  total: 0,
                }
              ) {
                return {
                  ...existingTodos,
                  todos: existingTodos.todos.filter(
                    (todo: any) => todo.id !== variables.id
                  ),
                  total: Math.max(0, existingTodos.total - 1),
                }
              },
            },
          })

          // 特定のTodoをキャッシュから削除
          cache.evict({
            id: cache.identify({ __typename: 'Todo', id: variables.id }),
          })
        }
      },
    }
  )

  const deleteTodo = async (id: string) => {
    try {
      const result = await deleteTodoMutation({ variables: { id } })
      return result.data?.deleteTodo
    } catch (error_) {
      throw new Error(
        error_ instanceof Error ? error_.message : 'Failed to delete todo'
      )
    }
  }

  return {
    data: data?.deleteTodo,
    deleteTodo,
    error: error?.message || null,
    isLoading: loading,
  }
}

/**
 * 全てのTodoミューテーションを統合したフック
 *
 * @returns 全てのミューテーション関数と状態
 */
export function useTodoMutationsGraphQL() {
  const createMutation = useCreateTodoGraphQL()
  const updateMutation = useUpdateTodoGraphQL()
  const deleteMutation = useDeleteTodoGraphQL()

  return {
    createError: createMutation.error,
    // 作成
    createTodo: createMutation.createTodo,
    deleteError: deleteMutation.error,

    // 削除
    deleteTodo: deleteMutation.deleteTodo,
    hasError: !!(
      createMutation.error ||
      updateMutation.error ||
      deleteMutation.error
    ),
    isCreating: createMutation.isLoading,

    isDeleting: deleteMutation.isLoading,
    // 全体の状態
    isLoading:
      createMutation.isLoading ||
      updateMutation.isLoading ||
      deleteMutation.isLoading,
    isUpdating: updateMutation.isLoading,

    updateError: updateMutation.error,
    // 更新
    updateTodo: updateMutation.updateTodo,
  }
}

/**
 * Todo更新用のフック
 *
 * @returns 更新ミューテーション関数と状態
 */
export function useUpdateTodoGraphQL() {
  const [updateTodoMutation, { data, error, loading }] = useMutation(
    UPDATE_TODO,
    {
      errorPolicy: 'all',
    }
  )

  const updateTodo = async (id: string, input: UpdateTodoInput) => {
    try {
      const result = await updateTodoMutation({ variables: { id, input } })
      return result.data?.updateTodo
    } catch (error_) {
      throw new Error(
        error_ instanceof Error ? error_.message : 'Failed to update todo'
      )
    }
  }

  return {
    data: data?.updateTodo,
    error: error?.message || null,
    isLoading: loading,
    updateTodo,
  }
}
