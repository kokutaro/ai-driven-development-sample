'use client'

import { Checkbox, Container, Loader, Paper, Stack, Text } from '@mantine/core'

import type { Todo } from '@/types/todo'

import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO項目を表示するコンポーネント
 */
interface TodoItemProps {
  /** 状態変更のハンドラ */
  onToggle: (id: string) => void
  /** TODO項目のデータ */
  todo: Todo
}

/**
 * TODO項目のリストを表示するコンポーネント
 */
export function TodoList() {
  const { isLoading, todos, toggleTodoStatus } = useTodoStore()

  if (isLoading) {
    return (
      <Container>
        <Stack align="center" gap="md">
          <Loader />
          <Text>読み込み中...</Text>
        </Stack>
      </Container>
    )
  }

  if (todos.length === 0) {
    return (
      <Container>
        <Text c="dimmed" size="lg" ta="center">
          TODO項目がありません
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <Stack gap="md">
        {todos.map((todo) => (
          <TodoItem key={todo.id} onToggle={toggleTodoStatus} todo={todo} />
        ))}
      </Stack>
    </Container>
  )
}

/**
 * 単一のTODO項目を表示するコンポーネント
 */
function TodoItem({ onToggle, todo }: TodoItemProps) {
  return (
    <Paper p="md" withBorder>
      <Stack gap="xs">
        <Checkbox
          checked={todo.status === 'completed'}
          label={todo.title}
          onChange={() => onToggle(todo.id)}
        />
        {todo.description && (
          <Text c="dimmed" pl="xl" size="sm">
            {todo.description}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
