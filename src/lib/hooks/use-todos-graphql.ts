/**
 * GraphQL版Todosフック
 *
 * Apollo Clientを使用してTodoリストを管理します。
 * 既存のRESTベースのuseTodosと同様のAPIを提供します。
 */
import { gql, useQuery } from '@apollo/client'

import type {
  PaginationInput,
  TodoFilter,
  TodoSort,
} from '@/graphql/types/todo.types'

/**
 * TodoリストのGraphQLクエリ
 */
const GET_TODOS = gql`
  query GetTodos(
    $filter: TodoFilter
    $pagination: PaginationInput
    $sort: TodoSort
  ) {
    todos(filter: $filter, pagination: $pagination, sort: $sort) {
      todos {
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
      total
      hasNextPage
      hasPreviousPage
    }
  }
`

/**
 * 単一TodoのGraphQLクエリ
 */
const GET_TODO = gql`
  query GetTodo($id: ID!) {
    todo(id: $id) {
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
`

interface UseTodosGraphQLOptions {
  filter?: TodoFilter
  pagination?: PaginationInput
  sort?: TodoSort
}

/**
 * GraphQLを使用して単一のTodoを取得するフック
 *
 * @param id - TodoのID
 * @returns Todoデータと関連する状態
 */
export function useTodoGraphQL(id: string) {
  const { data, error, loading, refetch } = useQuery(GET_TODO, {
    errorPolicy: 'all',
    skip: !id, // IDが空の場合はスキップ
    variables: { id },
  })

  return {
    error: error?.message,
    isLoading: loading,
    refetch,
    todo: data?.todo,
  }
}

/**
 * GraphQLを使用してTodoリストを取得するフック
 *
 * @param options - クエリオプション
 * @returns Todoリストと関連する状態
 */
export function useTodosGraphQL(options: UseTodosGraphQLOptions = {}) {
  const { filter, pagination, sort } = options

  const { data, error, fetchMore, loading, refetch } = useQuery(GET_TODOS, {
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    variables: {
      filter,
      pagination: pagination ?? { limit: 50, offset: 0 },
      sort: sort ?? { direction: 'DESC', field: 'createdAt' },
    },
  })

  return {
    error: error?.message,
    fetchMore,
    hasNextPage: data?.todos?.hasNextPage ?? false,
    hasPreviousPage: data?.todos?.hasPreviousPage ?? false,
    isLoading: loading,
    refetch,
    todos: data?.todos?.todos ?? [],
    total: data?.todos?.total ?? 0,
  }
}

/**
 * GraphQLとRESTの両方をサポートする統合フック
 *
 * @param strategy - 使用する戦略（'graphql' | 'rest'）
 * @param options - クエリオプション
 */
export function useTodosUnified(
  strategy: 'graphql' | 'rest' = 'rest',
  options: UseTodosGraphQLOptions = {}
) {
  // GraphQL戦略の場合
  if (strategy === 'graphql') {
    return useTodosGraphQL(options)
  }

  // REST戦略の場合（将来の統合用）
  // 既存のuseTodosフックにフォールバック
  throw new Error(
    'REST strategy not implemented in this hook. Use existing useTodos.'
  )
}
