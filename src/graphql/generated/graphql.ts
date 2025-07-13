import { gql } from '@apollo/client'
import * as ApolloReactCommon from '@apollo/client'
import * as ApolloReactHooks from '@apollo/client'
export type Maybe<T> = T | null | undefined
export type InputMaybe<T> = T | null | undefined
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never }
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
    }
const defaultOptions = {} as const
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any }
}

export type Category = {
  __typename?: 'Category'
  color: Scalars['String']['output']
  createdAt: Scalars['DateTimeISO']['output']
  id: Scalars['ID']['output']
  name: Scalars['String']['output']
  updatedAt: Scalars['DateTimeISO']['output']
  userId: Scalars['String']['output']
}

export type CategoryStats = {
  __typename?: 'CategoryStats'
  color: Scalars['String']['output']
  completed: Scalars['Float']['output']
  completionRate: Scalars['Float']['output']
  id: Scalars['String']['output']
  name: Scalars['String']['output']
  pending: Scalars['Float']['output']
  total: Scalars['Float']['output']
}

export type DailyStats = {
  __typename?: 'DailyStats'
  completed: Scalars['Float']['output']
  created: Scalars['Float']['output']
  date: Scalars['String']['output']
  total: Scalars['Float']['output']
}

export type Mutation = {
  __typename?: 'Mutation'
  createTodo: Todo
}

export type MutationCreateTodoArgs = {
  title: Scalars['String']['input']
}

export type Query = {
  __typename?: 'Query'
  categories: Array<Category>
  dashboardStats: TodoStats
  hello: Scalars['String']['output']
  todoStats: TodoStats
  todos: Array<Todo>
}

export type QueryTodoStatsArgs = {
  filter?: InputMaybe<StatsFilter>
}

export type StatsFilter = {
  categoryId?: InputMaybe<Scalars['String']['input']>
  endDate?: InputMaybe<Scalars['DateTimeISO']['input']>
  period?: StatsPeriod
  startDate?: InputMaybe<Scalars['DateTimeISO']['input']>
}

/** 統計期間の指定 */
export type StatsPeriod = 'ALL_TIME' | 'MONTH' | 'TODAY' | 'WEEK' | 'YEAR'

export type SubTask = {
  __typename?: 'SubTask'
  completed: Scalars['Boolean']['output']
  createdAt: Scalars['DateTimeISO']['output']
  id: Scalars['ID']['output']
  order: Scalars['Float']['output']
  title: Scalars['String']['output']
  todoId: Scalars['String']['output']
  updatedAt: Scalars['DateTimeISO']['output']
}

export type Todo = {
  __typename?: 'Todo'
  category: Maybe<Category>
  categoryId: Maybe<Scalars['String']['output']>
  completedAt: Maybe<Scalars['DateTimeISO']['output']>
  completionRate: Scalars['Float']['output']
  createdAt: Scalars['DateTimeISO']['output']
  description: Maybe<Scalars['String']['output']>
  dueDate: Maybe<Scalars['DateTimeISO']['output']>
  id: Scalars['ID']['output']
  isCompleted: Scalars['Boolean']['output']
  isImportant: Scalars['Boolean']['output']
  isOverdue: Scalars['Boolean']['output']
  order: Scalars['Float']['output']
  priority: TodoPriority
  status: TodoStatus
  subTasks: Array<SubTask>
  title: Scalars['String']['output']
  updatedAt: Scalars['DateTimeISO']['output']
  userId: Scalars['String']['output']
}

/** Todoの優先度 */
export type TodoPriority = 'HIGH' | 'LOW' | 'MEDIUM' | 'URGENT'

export type TodoStats = {
  __typename?: 'TodoStats'
  averageCompletionTime: Scalars['Float']['output']
  cancelled: Scalars['Float']['output']
  categories: Array<CategoryStats>
  completed: Scalars['Float']['output']
  completionRate: Scalars['Float']['output']
  dailyStats: Array<DailyStats>
  generatedAt: Scalars['DateTimeISO']['output']
  inProgress: Scalars['Float']['output']
  overdue: Scalars['Float']['output']
  pending: Scalars['Float']['output']
  period: StatsPeriod
  total: Scalars['Float']['output']
}

/** Todoのステータス */
export type TodoStatus = 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'

export type TodoFieldsFragment = {
  __typename?: 'Todo'
  id: string
  title: string
  description: string | null | undefined
  status: TodoStatus
  priority: TodoPriority
  isCompleted: boolean
  isImportant: boolean
  dueDate: any | null | undefined
  categoryId: string | null | undefined
  userId: string
  order: number
  completionRate: number
  isOverdue: boolean
  createdAt: any
  updatedAt: any
  subTasks: Array<{
    __typename?: 'SubTask'
    id: string
    title: string
    completed: boolean
    order: number
    todoId: string
    createdAt: any
    updatedAt: any
  }>
}

export type CreateTodoMutationVariables = Exact<{
  title: Scalars['String']['input']
}>

export type CreateTodoMutation = {
  __typename?: 'Mutation'
  createTodo: {
    __typename?: 'Todo'
    id: string
    title: string
    description: string | null | undefined
    status: TodoStatus
    priority: TodoPriority
    isCompleted: boolean
    isImportant: boolean
    dueDate: any | null | undefined
    categoryId: string | null | undefined
    userId: string
    order: number
    completionRate: number
    isOverdue: boolean
    createdAt: any
    updatedAt: any
    subTasks: Array<{
      __typename?: 'SubTask'
      id: string
      title: string
      completed: boolean
      order: number
      todoId: string
      createdAt: any
      updatedAt: any
    }>
  }
}

export type CategoriesQueryVariables = Exact<{ [key: string]: never }>

export type CategoriesQuery = {
  __typename?: 'Query'
  categories: Array<{
    __typename?: 'Category'
    id: string
    name: string
    color: string
    userId: string
    createdAt: any
    updatedAt: any
  }>
}

export type TodosQueryVariables = Exact<{ [key: string]: never }>

export type TodosQuery = {
  __typename?: 'Query'
  todos: Array<{
    __typename?: 'Todo'
    id: string
    title: string
    description: string | null | undefined
    status: TodoStatus
    priority: TodoPriority
    isCompleted: boolean
    isImportant: boolean
    dueDate: any | null | undefined
    categoryId: string | null | undefined
    userId: string
    order: number
    completionRate: number
    isOverdue: boolean
    createdAt: any
    updatedAt: any
    subTasks: Array<{
      __typename?: 'SubTask'
      id: string
      title: string
      completed: boolean
      order: number
      todoId: string
      createdAt: any
      updatedAt: any
    }>
  }>
}

export type HelloQueryVariables = Exact<{ [key: string]: never }>

export type HelloQuery = { __typename?: 'Query'; hello: string }

export const TodoFieldsFragmentDoc = gql`
  fragment TodoFields on Todo {
    id
    title
    description
    status
    priority
    isCompleted
    isImportant
    dueDate
    categoryId
    userId
    order
    completionRate
    isOverdue
    createdAt
    updatedAt
    subTasks {
      id
      title
      completed
      order
      todoId
      createdAt
      updatedAt
    }
  }
`
export const CreateTodoDocument = gql`
  mutation CreateTodo($title: String!) {
    createTodo(title: $title) {
      id
      title
      description
      status
      priority
      isCompleted
      isImportant
      dueDate
      categoryId
      userId
      order
      completionRate
      isOverdue
      createdAt
      updatedAt
      subTasks {
        id
        title
        completed
        order
        todoId
        createdAt
        updatedAt
      }
    }
  }
`
export type CreateTodoMutationFn = ApolloReactCommon.MutationFunction<
  CreateTodoMutation,
  CreateTodoMutationVariables
>

/**
 * __useCreateTodoMutation__
 *
 * To run a mutation, you first call `useCreateTodoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTodoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTodoMutation, { data, loading, error }] = useCreateTodoMutation({
 *   variables: {
 *      title: // value for 'title'
 *   },
 * });
 */
export function useCreateTodoMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateTodoMutation,
    CreateTodoMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useMutation<
    CreateTodoMutation,
    CreateTodoMutationVariables
  >(CreateTodoDocument, options)
}
export type CreateTodoMutationHookResult = ReturnType<
  typeof useCreateTodoMutation
>
export type CreateTodoMutationResult =
  ApolloReactCommon.MutationResult<CreateTodoMutation>
export type CreateTodoMutationOptions = ApolloReactCommon.BaseMutationOptions<
  CreateTodoMutation,
  CreateTodoMutationVariables
>
export const CategoriesDocument = gql`
  query Categories {
    categories {
      id
      name
      color
      userId
      createdAt
      updatedAt
    }
  }
`

/**
 * __useCategoriesQuery__
 *
 * To run a query within a React component, call `useCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useCategoriesQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    CategoriesQuery,
    CategoriesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useQuery<CategoriesQuery, CategoriesQueryVariables>(
    CategoriesDocument,
    options
  )
}
export function useCategoriesLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    CategoriesQuery,
    CategoriesQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useLazyQuery<
    CategoriesQuery,
    CategoriesQueryVariables
  >(CategoriesDocument, options)
}
export function useCategoriesSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<
        CategoriesQuery,
        CategoriesQueryVariables
      >
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useSuspenseQuery<
    CategoriesQuery,
    CategoriesQueryVariables
  >(CategoriesDocument, options)
}
export type CategoriesQueryHookResult = ReturnType<typeof useCategoriesQuery>
export type CategoriesLazyQueryHookResult = ReturnType<
  typeof useCategoriesLazyQuery
>
export type CategoriesSuspenseQueryHookResult = ReturnType<
  typeof useCategoriesSuspenseQuery
>
export type CategoriesQueryResult = ApolloReactCommon.QueryResult<
  CategoriesQuery,
  CategoriesQueryVariables
>
export const TodosDocument = gql`
  query Todos {
    todos {
      id
      title
      description
      status
      priority
      isCompleted
      isImportant
      dueDate
      categoryId
      userId
      order
      completionRate
      isOverdue
      createdAt
      updatedAt
      subTasks {
        id
        title
        completed
        order
        todoId
        createdAt
        updatedAt
      }
    }
  }
`

/**
 * __useTodosQuery__
 *
 * To run a query within a React component, call `useTodosQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodosQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodosQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodosQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    TodosQuery,
    TodosQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useQuery<TodosQuery, TodosQueryVariables>(
    TodosDocument,
    options
  )
}
export function useTodosLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    TodosQuery,
    TodosQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useLazyQuery<TodosQuery, TodosQueryVariables>(
    TodosDocument,
    options
  )
}
export function useTodosSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<TodosQuery, TodosQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useSuspenseQuery<TodosQuery, TodosQueryVariables>(
    TodosDocument,
    options
  )
}
export type TodosQueryHookResult = ReturnType<typeof useTodosQuery>
export type TodosLazyQueryHookResult = ReturnType<typeof useTodosLazyQuery>
export type TodosSuspenseQueryHookResult = ReturnType<
  typeof useTodosSuspenseQuery
>
export type TodosQueryResult = ApolloReactCommon.QueryResult<
  TodosQuery,
  TodosQueryVariables
>
export const HelloDocument = gql`
  query Hello {
    hello
  }
`

/**
 * __useHelloQuery__
 *
 * To run a query within a React component, call `useHelloQuery` and pass it any options that fit your needs.
 * When your component renders, `useHelloQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHelloQuery({
 *   variables: {
 *   },
 * });
 */
export function useHelloQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    HelloQuery,
    HelloQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useQuery<HelloQuery, HelloQueryVariables>(
    HelloDocument,
    options
  )
}
export function useHelloLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    HelloQuery,
    HelloQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useLazyQuery<HelloQuery, HelloQueryVariables>(
    HelloDocument,
    options
  )
}
export function useHelloSuspenseQuery(
  baseOptions?:
    | ApolloReactHooks.SkipToken
    | ApolloReactHooks.SuspenseQueryHookOptions<HelloQuery, HelloQueryVariables>
) {
  const options =
    baseOptions === ApolloReactHooks.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions }
  return ApolloReactHooks.useSuspenseQuery<HelloQuery, HelloQueryVariables>(
    HelloDocument,
    options
  )
}
export type HelloQueryHookResult = ReturnType<typeof useHelloQuery>
export type HelloLazyQueryHookResult = ReturnType<typeof useHelloLazyQuery>
export type HelloSuspenseQueryHookResult = ReturnType<
  typeof useHelloSuspenseQuery
>
export type HelloQueryResult = ApolloReactCommon.QueryResult<
  HelloQuery,
  HelloQueryVariables
>
