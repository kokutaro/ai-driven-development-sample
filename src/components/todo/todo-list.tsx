import { useMemo } from 'react'

import { Skeleton, Stack, Text } from '@mantine/core'

import { TodoItem } from './todo-item'

import { type Todo } from '@/types/todo'

interface TodoListProps {
  isLoading: boolean
  sortBy: string
  todos?: Todo[] | undefined
}

/**
 * TODOリストコンポーネント
 *
 * タスクの一覧を表示します。
 * - ソート機能（作成日時、期限日、タイトル、重要度）
 * - ローディング状態の表示
 * - 空状態の表示
 * - 各タスクアイテムの表示
 * - 無効なtodoオブジェクトの防御的フィルタリング
 */
export function TodoList({ isLoading, sortBy, todos }: TodoListProps) {
  const sortedTodos = useMemo(() => {
    if (!todos || !Array.isArray(todos)) return []

    // 無効なtodoオブジェクトをフィルタリング
    const validTodos = todos.filter((todo) => isValidTodo(todo))

    return validTodos.sort((a, b) => {
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
            if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime()))
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
            if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime()))
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
  }, [todos, sortBy])

  // ローディング状態
  if (isLoading) {
    return (
      <Stack gap="xs">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton height={80} key={index} />
        ))}
      </Stack>
    )
  }

  // 空状態
  if (sortedTodos.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">タスクが見つかりません</Text>
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
          return
        }

        return <TodoItem key={todo.id} todo={todo} />
      })}
    </Stack>
  )
}

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
