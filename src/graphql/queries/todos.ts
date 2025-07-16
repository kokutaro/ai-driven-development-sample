/**
 * TODO関連のGraphQLクエリとミューテーション
 *
 * REST APIからGraphQLへの移行のためのクエリ定義
 */
import { gql } from '@apollo/client'

/**
 * TODO一覧取得クエリ
 *
 * REST: GET /api/todos
 * GraphQL: query { todos { ... } }
 */
export const GET_TODOS = gql`
  query GetTodos {
    todos {
      id
      title
      description
      isCompleted
      isImportant
      isOverdue
      completionRate
      priority
      status
      order
      categoryId
      dueDate
      createdAt
      updatedAt
      userId
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

/**
 * TODO作成ミューテーション
 *
 * REST: POST /api/todos
 * GraphQL: mutation { createTodo(title: "...") { ... } }
 */
export const CREATE_TODO = gql`
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
      description
      isCompleted
      isImportant
      isOverdue
      completionRate
      priority
      status
      order
      categoryId
      dueDate
      createdAt
      updatedAt
      userId
    }
  }
`

/**
 * TODO更新ミューテーション
 *
 * REST: PUT /api/todos/:id
 * GraphQL: mutation { updateTodo(id: "...", title: "...") { ... } }
 */
export const UPDATE_TODO = gql`
  mutation UpdateTodo(
    $id: String!
    $title: String
    $description: String
    $isCompleted: Boolean
    $isImportant: Boolean
  ) {
    updateTodo(
      id: $id
      title: $title
      description: $description
      isCompleted: $isCompleted
      isImportant: $isImportant
    ) {
      id
      title
      description
      isCompleted
      isImportant
      isOverdue
      completionRate
      priority
      status
      order
      categoryId
      dueDate
      createdAt
      updatedAt
      userId
    }
  }
`

/**
 * TODO削除ミューテーション
 *
 * REST: DELETE /api/todos/:id
 * GraphQL: mutation { deleteTodo(id: "...") }
 */
export const DELETE_TODO = gql`
  mutation DeleteTodo($id: String!) {
    deleteTodo(id: $id)
  }
`

/**
 * TODO完了状態切り替えミューテーション
 *
 * REST: PATCH /api/todos/:id/toggle
 * GraphQL: mutation { toggleTodoCompletion(id: "...") { ... } }
 */
export const TOGGLE_TODO = gql`
  mutation ToggleTodoCompletion($id: String!) {
    toggleTodoCompletion(id: $id) {
      id
      title
      description
      isCompleted
      isImportant
      isOverdue
      completionRate
      priority
      status
      order
      categoryId
      dueDate
      createdAt
      updatedAt
      userId
    }
  }
`

/**
 * TODO統計取得クエリ
 *
 * REST: GET /api/stats/todos
 * GraphQL: query { todoStats { ... } }
 */
export const GET_TODO_STATS = gql`
  query GetTodoStats {
    todoStats {
      totalCount
      completedCount
      importantCount
      todayCount
      upcomingCount
      assignedCount
      overdueCount
      completionRate
    }
  }
`
