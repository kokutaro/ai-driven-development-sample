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
 */
export function TodoList({ isLoading, sortBy, todos }: TodoListProps) {
  const sortedTodos = useMemo(() => {
    if (!todos || !Array.isArray(todos)) return []

    return [...todos].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate': {
          // 期限日でソート（期限なしは最後）
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }

        case 'importance': {
          // 重要度でソート（重要なタスクが先頭）
          if (a.isImportant && !b.isImportant) return -1
          if (!a.isImportant && b.isImportant) return 1
          return 0
        }

        case 'title': {
          // タイトルでアルファベット順ソート
          return a.title.localeCompare(b.title)
        }

        default: {
          // 作成日時でソート（新しい順）
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        }
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
      {sortedTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </Stack>
  )
}
