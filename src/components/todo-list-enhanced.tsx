'use client'

import {
  ActionIcon,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconTrash } from '@tabler/icons-react'

import type { Todo } from '@/types/todo'

import { getFilteredTodos } from '@/lib/date-filters'
import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * TODO項目を表示するコンポーネント
 */
interface TodoItemProps {
  /** 選択されているかどうか */
  isSelected: boolean
  /** 削除のハンドラ */
  onDelete: (id: string) => Promise<void>
  /** クリック時のハンドラ */
  onItemClick: (id: string) => void
  /** 状態変更のハンドラ */
  onToggle: (id: string) => Promise<void>
  /** TODO項目のデータ */
  todo: Todo
}

/**
 * フィルタリング機能と選択機能付きのTODO項目リストを表示するコンポーネント
 *
 * @description
 * 既存のTodoListコンポーネントを拡張し、以下の機能を追加します：
 * - フィルタリング機能（日付・状態ベース）
 * - TODO項目の選択機能
 * - 選択項目のハイライト表示
 *
 * @example
 * ```tsx
 * <TodoListEnhanced />
 * ```
 */
export function TodoListEnhanced() {
  const { deleteTodo, isLoading, todos, toggleTodoStatus } = useTodoStore()
  const { currentFilter, selectedTodoId, setSelectedTodoId } = useTodoUIStore()

  // フィルタリングされたTODOリストを取得
  const filteredTodos = getFilteredTodos(todos, currentFilter)

  /**
   * TODO項目がクリックされた時の処理
   *
   * @param todoId クリックされたTODO項目のID
   */
  function handleItemClick(todoId: string) {
    setSelectedTodoId(todoId)
  }

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

  if (filteredTodos.length === 0) {
    return (
      <Container>
        <Text c="dimmed" size="lg" ta="center">
          該当するTODO項目がありません
        </Text>
      </Container>
    )
  }

  return (
    <Container>
      <Stack gap="md">
        <Title order={2} size="h3">
          TODO一覧
        </Title>
        {filteredTodos.map((todo) => (
          <TodoItem
            isSelected={selectedTodoId === todo.id}
            key={todo.id}
            onDelete={deleteTodo}
            onItemClick={handleItemClick}
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
function TodoItem({
  isSelected,
  onDelete,
  onItemClick,
  onToggle,
  todo,
}: TodoItemProps) {
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

  /**
   * カード全体のクリック処理
   * チェックボックスや削除ボタン以外の場所をクリックした時に選択状態を変更
   */
  function handleCardClick(event: React.MouseEvent) {
    // チェックボックスや削除ボタンのクリックの場合は選択処理をスキップ
    const target = event.target as HTMLElement
    if (
      target.closest('[role="checkbox"]') ||
      target.closest('button[aria-label="削除"]')
    ) {
      return
    }

    onItemClick(todo.id)
  }

  return (
    <Card
      data-selected={isSelected}
      onClick={handleCardClick}
      p="md"
      style={{
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-blue-3)' : undefined,
        cursor: 'pointer',
      }}
      withBorder
    >
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
    </Card>
  )
}
