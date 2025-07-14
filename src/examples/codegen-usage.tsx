/**
 * GraphQL Code Generator 使用例
 *
 * 生成されたタイプセーフなReact Apolloフックの使用方法を示します。
 */

import type { TodoPriority, TodoStatus } from '@/graphql/generated/graphql'

import {
  useCreateTodoMutation,
  useHelloQuery,
  useTodosQuery,
} from '@/graphql/generated/graphql'

/**
 * GraphQL Code Generatorによって生成されたフックを使用するコンポーネント例
 */
export function CodeGenUsageExample() {
  // 型安全なクエリフック
  const {
    data: todosData,
    error: todosError,
    loading: todosLoading,
  } = useTodosQuery()
  const { data: helloData } = useHelloQuery()

  // 型安全なミューテーションフック
  const [createTodo, { loading: createLoading }] = useCreateTodoMutation()

  const handleCreateTodo = async () => {
    try {
      const result = await createTodo({
        variables: {
          title: 'Code Generatorで作成されたタスク',
        },
      })

      console.log('作成されたTODO:', result.data?.createTodo)
    } catch (error) {
      console.error('TODO作成エラー:', error)
    }
  }

  if (todosLoading) return <div>Loading todos...</div>
  if (todosError) return <div>Error: {todosError.message}</div>

  return (
    <div>
      <h2>GraphQL Code Generator 使用例</h2>

      {/* Hello クエリの結果 */}
      <div>
        <h3>Hello Query Result:</h3>
        <p>{helloData?.hello}</p>
      </div>

      {/* TODOの作成 */}
      <div>
        <h3>TODO作成:</h3>
        <button disabled={createLoading} onClick={handleCreateTodo}>
          {createLoading ? '作成中...' : 'TODO作成'}
        </button>
      </div>

      {/* TODO一覧表示 */}
      <div>
        <h3>TODO一覧 ({todosData?.todos.length}件):</h3>
        <ul>
          {todosData?.todos.map((todo) => (
            <li key={todo.id}>
              <strong>{todo.title}</strong>
              <br />
              {todo.description && <em>{todo.description}</em>}
              <br />
              <small>
                ステータス: {todo.status} | 優先度: {todo.priority} | 完了率:{' '}
                {todo.completionRate}% |{todo.isCompleted ? '完了' : '未完了'}
                {todo.isImportant && ' (重要)'}
              </small>

              {/* サブタスク表示 */}
              {todo.subTasks.length > 0 && (
                <ul style={{ marginTop: '8px' }}>
                  {todo.subTasks.map((subTask) => (
                    <li key={subTask.id}>
                      {subTask.completed ? '✅' : '⬜'} {subTask.title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 型安全性のデモ */}
      <div>
        <h3>型安全性デモ:</h3>
        <p>
          TodoStatus:{' '}
          {Object.values({
            CANCELLED: 'CANCELLED',
            COMPLETED: 'COMPLETED',
            IN_PROGRESS: 'IN_PROGRESS',
            PENDING: 'PENDING',
          } satisfies Record<TodoStatus, string>).join(', ')}
        </p>

        <p>
          TodoPriority:{' '}
          {Object.values({
            HIGH: 'HIGH',
            LOW: 'LOW',
            MEDIUM: 'MEDIUM',
            URGENT: 'URGENT',
          } satisfies Record<TodoPriority, string>).join(', ')}
        </p>
      </div>
    </div>
  )
}
