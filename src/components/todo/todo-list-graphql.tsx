import { memo, useCallback, useMemo } from 'react'

import { Alert, Button, Group, Skeleton, Stack, Text } from '@mantine/core'
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'

import { TodoItemGraphQL } from './todo-item-graphql'

import { useTodosGraphQL } from '@/hooks/use-todos-graphql'
import { type Todo } from '@/types/todo'

interface TodoListGraphQLProps {
  filter?: string
  sortBy: string
}

/**
 * GraphQL TODOリストコンポーネント
 *
 * REST APIからGraphQLに移行したタスクの一覧を表示します。
 * - GraphQLクエリを使用したデータ取得
 * - Apollo Clientによるキャッシュ管理
 * - ソート機能（作成日時、期限日、タイトル、重要度）
 * - ローディング状態の表示
 * - 空状態の表示
 * - エラーハンドリング
 * - パフォーマンス最適化（React.memo）
 * - 再取得機能
 */
export const TodoListGraphQL = memo(
  ({ filter = 'all', sortBy }: TodoListGraphQLProps) => {
    const { error, loading, refetch, todos } = useTodosGraphQL()

    /**
     * 再取得処理
     */
    const handleRefetch = useCallback(async () => {
      try {
        await refetch()
      } catch (error) {
        console.error('再取得エラー:', error)
      }
    }, [refetch])

    // フィルタリング処理
    const filteredTodos = useMemo(() => {
      if (!todos || !Array.isArray(todos)) return []

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // 無効なtodoオブジェクトをフィルタリング
      const validTodos = todos.filter((todo) => isValidTodo(todo))

      // フィルタ条件に基づいて絞り込み
      return validTodos.filter((todo) => {
        switch (filter) {
          case 'assigned': {
            return !todo.isCompleted
          } // 全てのタスクが自分に割り当てられているとする
          case 'completed': {
            return todo.isCompleted
          }
          case 'important': {
            return todo.isImportant && !todo.isCompleted
          }
          case 'today': {
            return (
              todo.dueDate &&
              new Date(todo.dueDate) >= today &&
              new Date(todo.dueDate) < tomorrow &&
              !todo.isCompleted
            )
          }
          case 'upcoming': {
            return (
              todo.dueDate && new Date(todo.dueDate) >= now && !todo.isCompleted
            )
          }
          default: {
            return true
          }
        }
      })
    }, [todos, filter])

    // ソート処理
    const sortedTodos = useMemo(() => {
      if (!filteredTodos || !Array.isArray(filteredTodos)) return []

      return [...filteredTodos].sort((a, b) => {
        try {
          switch (sortBy) {
            case 'dueDate': {
              // 期限日でソート（期限なしは最後）
              if (!a.dueDate && !b.dueDate) return 0
              if (!a.dueDate) return 1
              if (!b.dueDate) return -1

              const dateA = new Date(a.dueDate)
              const dateB = new Date(b.dueDate)

              // 無効な日付の場合は0を返す
              if (
                Number.isNaN(dateA.getTime()) ||
                Number.isNaN(dateB.getTime())
              )
                return 0

              return dateA.getTime() - dateB.getTime()
            }

            case 'importance': {
              // 重要度でソート（重要なタスクが先頭）
              const aImportant = Boolean(a.isImportant)
              const bImportant = Boolean(b.isImportant)

              if (aImportant && !bImportant) return -1
              if (!aImportant && bImportant) return 1
              return 0
            }

            case 'title': {
              // タイトルでアルファベット順ソート
              const titleA = String(a.title || '')
              const titleB = String(b.title || '')
              return titleA.localeCompare(titleB)
            }

            default: {
              // 作成日時でソート（新しい順）
              const dateA = new Date(a.createdAt || 0)
              const dateB = new Date(b.createdAt || 0)

              // 無効な日付の場合は0を返す
              if (
                Number.isNaN(dateA.getTime()) ||
                Number.isNaN(dateB.getTime())
              )
                return 0

              return dateB.getTime() - dateA.getTime()
            }
          }
        } catch (error) {
          // ソート中にエラーが発生した場合は順序を変更しない
          console.warn('ソート中にエラーが発生しました:', error)
          return 0
        }
      })
    }, [filteredTodos, sortBy])

    // ローディング状態
    if (loading) {
      return (
        <Stack gap="xs">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton height={80} key={index} />
          ))}
        </Stack>
      )
    }

    // エラー状態
    if (error) {
      return (
        <Stack align="center" py="xl">
          <Alert
            color="red"
            icon={<IconInfoCircle size="1rem" />}
            style={{ maxWidth: 400 }}
            title="データの取得に失敗しました"
            variant="light"
          >
            <Stack gap="sm">
              <Text size="sm">
                {error.message || '不明なエラーが発生しました'}
              </Text>
              <Group justify="center">
                <Button
                  leftSection={<IconRefresh size="1rem" />}
                  onClick={handleRefetch}
                  size="sm"
                  variant="light"
                >
                  再試行
                </Button>
              </Group>
            </Stack>
          </Alert>
        </Stack>
      )
    }

    // 空状態
    if (sortedTodos.length === 0) {
      const getEmptyMessage = () => {
        switch (filter) {
          case 'completed': {
            return '完了済みのタスクはありません'
          }
          case 'important': {
            return '重要なタスクはありません'
          }
          case 'today': {
            return '今日の予定はありません'
          }
          case 'upcoming': {
            return '今後の予定はありません'
          }
          default: {
            return 'タスクが見つかりません'
          }
        }
      }

      return (
        <Stack align="center" py="xl">
          <Text c="dimmed" size="lg">
            {getEmptyMessage()}
          </Text>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={handleRefetch}
            size="sm"
            variant="subtle"
          >
            更新
          </Button>
        </Stack>
      )
    }

    // タスク一覧表示
    return (
      <Stack gap="xs">
        {sortedTodos.map((todo) => {
          // 最終的な防御チェック：無効なtodoオブジェクトをスキップ
          if (!isValidTodo(todo)) {
            console.warn('無効なtodoオブジェクトが検出されました:', todo)
            return undefined
          }

          return <TodoItemGraphQL key={todo.id} todo={todo} />
        })}
      </Stack>
    )
  }
)

TodoListGraphQL.displayName = 'TodoListGraphQL'

/**
 * TODOオブジェクトの妥当性を検証する
 */
function isValidTodo(todo: unknown): todo is Todo {
  return (
    todo !== null &&
    typeof todo === 'object' &&
    'id' in todo &&
    'title' in todo &&
    typeof (todo as Record<string, unknown>).id === 'string' &&
    typeof (todo as Record<string, unknown>).title === 'string' &&
    ((todo as Record<string, unknown>).title as string).length > 0
  )
}
