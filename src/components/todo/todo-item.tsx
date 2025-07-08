import {
  ActionIcon,
  Badge,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { openConfirmModal } from '@mantine/modals'
import { IconCalendar, IconStar, IconTrash } from '@tabler/icons-react'

import { formatDate } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { useUiStore } from '@/stores/ui-store'
import { type Todo } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
}

/**
 * TODOアイテムコンポーネント
 *
 * 個々のタスクを表示します。
 * - チェックボックスで完了状態を切り替え
 * - タイトルと説明を表示
 * - 期限日を表示（期限切れの場合は赤色）
 * - 重要フラグを星アイコンで表示
 * - 削除ボタン
 * - クリック時に詳細表示
 * - カテゴリをバッジで表示
 */
export function TodoItem({ todo }: TodoItemProps) {
  const { deleteTodo, toggleTodo } = useTodoStore()
  const { selectedTodo, setSelectedTodo } = useUiStore()

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    await toggleTodo(todo.id)
  }

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation()
    openConfirmModal({
      children: (
        <Text size="sm">
          このタスクを削除しますか？この操作は取り消せません。
        </Text>
      ),
      confirmProps: { color: 'red' },
      onConfirm: () => {
        void deleteTodo(todo.id)
      },
      title: '削除の確認',
    })
  }

  const handleClick = () => {
    setSelectedTodo(todo)
  }

  const isSelected = selectedTodo?.id === todo.id
  const isOverdue =
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.isCompleted

  return (
    <Card
      onClick={handleClick}
      padding="md"
      radius="md"
      style={{
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
        cursor: 'pointer',
      }}
      withBorder
    >
      <Group align="flex-start" justify="space-between">
        <Group align="flex-start" gap="sm">
          <Checkbox
            checked={todo.isCompleted}
            mt={2}
            onChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            size="sm"
          />
          <Stack flex={1} gap="xs">
            <Group gap="xs">
              <Text
                fw={500}
                size="sm"
                style={{
                  color: todo.isCompleted
                    ? 'var(--mantine-color-dimmed)'
                    : undefined,
                  textDecoration: todo.isCompleted ? 'line-through' : 'none',
                }}
              >
                {todo.title}
              </Text>
              {todo.isImportant && (
                <IconStar color="var(--mantine-color-yellow-6)" size={16} />
              )}
            </Group>
            {todo.description && (
              <Text c="dimmed" lineClamp={2} size="xs">
                {todo.description}
              </Text>
            )}
            {todo.dueDate && (
              <Group gap="xs">
                <IconCalendar size={14} />
                <Text c={isOverdue ? 'red' : 'dimmed'} size="xs">
                  {formatDate(todo.dueDate)}
                </Text>
              </Group>
            )}
            {todo.category && (
              <Badge color={todo.category.color} size="sm">
                {todo.category.name}
              </Badge>
            )}
          </Stack>
        </Group>
        <ActionIcon
          color="red"
          onClick={handleDelete}
          size="sm"
          variant="subtle"
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Card>
  )
}
