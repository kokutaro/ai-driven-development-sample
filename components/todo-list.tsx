'use client'

import {
  ActionIcon,
  Checkbox,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconTrash } from '@tabler/icons-react'

import type { Todo } from '@/types/todo'

import { useTodoStore } from '@/stores/todo-store'

/**
 * TODO項目を表示するコンポーネント
 */
interface TodoItemProps {
  /** 削除のハンドラ */
  onDelete: (id: string) => Promise<void>
  /** 状態変更のハンドラ */
  onToggle: (id: string) => Promise<void>
  /** TODO項目のデータ */
  todo: Todo
}

/**
 * TODO項目のリストを表示するコンポーネント
 */
export function TodoList() {
  const { deleteTodo, isLoading, todos, toggleTodoStatus } = useTodoStore()

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
          <TodoItem
            key={todo.id}
            onDelete={deleteTodo}
            onToggle={toggleTodoStatus}
            todo={todo}
          />
        ))}
      </Stack>
    </Container>
  )
}

/**
 * 単一のTODO項目を表示するコンポーネント
 */
function TodoItem({ onDelete, onToggle, todo }: TodoItemProps) {
  async function handleToggle() {
    try {
      await onToggle(todo.id)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  /**
   * 削除確認モーダルを表示し、確認後に削除を実行する
   */
  function handleDelete() {
    modals.openConfirmModal({
      cancelProps: { color: 'gray' },
      children: (
        <Text size="sm">
          「{todo.title}」を削除しますか？
          <br />
          この操作は取り消せません。
        </Text>
      ),
      confirmProps: { color: 'red' },
      labels: { cancel: 'キャンセル', confirm: '削除' },
      onConfirm: () => {
        void (async () => {
          try {
            await onDelete(todo.id)
          } catch (error) {
            console.error('Failed to delete todo:', error)
          }
        })()
      },
      title: 'TODO項目を削除しますか？',
    })
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Checkbox
            checked={todo.status === 'completed'}
            label={todo.title}
            onChange={handleToggle}
            style={{ flex: 1 }}
          />
          <ActionIcon
            aria-label="削除"
            color="red"
            onClick={handleDelete}
            variant="subtle"
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
        {todo.description && (
          <Text c="dimmed" pl="xl" size="sm">
            {todo.description}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
