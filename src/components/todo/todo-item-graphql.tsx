import {
  ActionIcon,
  Badge,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { openConfirmModal } from '@mantine/modals'
import { IconCalendar, IconStar, IconTrash } from '@tabler/icons-react'

import { useTodosGraphQL } from '@/hooks/use-todos-graphql'
import { formatDate } from '@/lib/utils'
import { useUiStore } from '@/stores/ui-store'
import { type Todo } from '@/types/todo'

interface TodoItemGraphQLProps {
  todo: Todo
}

/**
 * GraphQL TODOアイテムコンポーネント
 *
 * REST APIからGraphQLに移行した個々のタスクを表示します。
 * - GraphQLミューテーションによる状態変更
 * - Apollo Clientによるキャッシュ自動更新
 * - チェックボックスで完了状態を切り替え
 * - タイトルと説明を表示
 * - 期限日を表示（期限切れの場合は赤色）
 * - 重要フラグを星アイコンで表示
 * - 削除ボタン
 * - クリック時に詳細表示
 * - カテゴリをバッジで表示
 */
export function TodoItemGraphQL({ todo }: TodoItemGraphQLProps) {
  const { deleteTodo, toggleTodo } = useTodosGraphQL()
  const { selectedTodo, setDrawerOpen, setSelectedTodo } = useUiStore()

  // デスクトップサイズの判定 (992px以上をデスクトップとして扱う)
  const isDesktop = useMediaQuery('(min-width: 62em)')

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    try {
      await toggleTodo(todo.id)
    } catch (error: unknown) {
      console.error('Failed to toggle todo:', error)
    }
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
        void (async () => {
          try {
            await deleteTodo(todo.id)
          } catch (error: unknown) {
            console.error('Failed to delete todo:', error)
          }
        })()
      },
      title: '削除の確認',
    })
  }

  const handleClick = () => {
    setSelectedTodo(todo)

    // モバイル/タブレットの場合はドロワーを開く
    if (!isDesktop) {
      setDrawerOpen(true)
    }
  }

  const isSelected = selectedTodo?.id === todo.id
  const isOverdue =
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.isCompleted

  return (
    <Card
      onClick={handleClick}
      padding="md"
      radius="md"
      role="button"
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
