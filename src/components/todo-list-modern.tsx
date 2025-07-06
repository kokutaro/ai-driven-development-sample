'use client'

import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconPlus, IconStar } from '@tabler/icons-react'

import type { Todo } from '@/types/todo'

import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * TODO項目のProps
 */
interface TodoItemModernProps {
  /** クリック時のハンドラ */
  onItemClick: (id: string) => void
  /** 状態変更のハンドラ */
  onToggle: (id: string) => Promise<void>
  /** TODO項目のデータ */
  todo: Todo
}

/**
 * サンプルTODO項目のProps
 */
interface TodoItemSampleProps {
  /** 完了状態 */
  completed: boolean
  /** ID */
  id: string
  /** クリック時のハンドラ */
  onItemClick: (id: string) => void
  /** 状態変更のハンドラ */
  onToggle: () => void
  /** サブタイトル */
  subtitle?: string
  /** タイトル */
  title: string
}

/**
 * TodoListModernコンポーネントのProps
 */
interface TodoListModernProps {
  /** 空の状態を表示するかどうか（テスト用） */
  showEmpty?: boolean
}

/**
 * Microsoft To-Do風のモダンなTODO一覧コンポーネント
 *
 * @description
 * 画像で示されたようなスタイルのTODO一覧を表示します：
 * - 上部にタイトルと日付表示
 * - タスクの追加ボタン
 * - チェックボックス付きのTODOアイテム一覧
 *
 * @example
 * ```tsx
 * <TodoListModern />
 * ```
 */
export function TodoListModern({ showEmpty = false }: TodoListModernProps) {
  const { todos, toggleTodoStatus } = useTodoStore()
  const { setSelectedTodoId } = useTodoUIStore()

  // 現在の日付をフォーマット
  const today = new Date()
  const formattedDate = today.toLocaleDateString('ja-JP', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })

  /**
   * TODO項目がクリックされた時の処理
   *
   * @param todoId クリックされたTODO項目のID
   */
  function handleItemClick(todoId: string) {
    setSelectedTodoId(todoId)
  }

  /**
   * TODO項目のチェック状態変更処理
   *
   * @param todoId 変更するTODO項目のID
   */
  async function handleToggle(todoId: string) {
    try {
      await toggleTodoStatus(todoId)
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  // テスト用の空表示
  if (showEmpty) {
    return (
      <Box className="todo-list-modern" data-testid="todo-list-modern">
        <Stack gap="lg">
          <Box>
            <Title order={2} size="h4">
              今日の予定
            </Title>
            <Text c="dimmed" size="sm">
              {formattedDate}
            </Text>
          </Box>

          <Button
            justify="flex-start"
            leftSection={<IconPlus size={16} />}
            onClick={handleAddTask}
            style={{ textAlign: 'left' }}
            variant="subtle"
          >
            タスクの追加
          </Button>

          <Text c="dimmed" py="xl" ta="center">
            タスクがありません
          </Text>
        </Stack>
      </Box>
    )
  }

  return (
    <Box className="todo-list-modern" data-testid="todo-list-modern">
      <Stack gap="lg">
        {/* ヘッダー部分 */}
        <Box>
          <Title order={2} size="h4">
            今日の予定
          </Title>
          <Text c="dimmed" size="sm">
            {formattedDate}
          </Text>
        </Box>

        {/* タスク追加ボタン */}
        <Button
          justify="flex-start"
          leftSection={<IconPlus size={16} />}
          onClick={handleAddTask}
          style={{ textAlign: 'left' }}
          variant="subtle"
        >
          タスクの追加
        </Button>

        {/* TODO一覧 */}
        <Stack gap="xs">
          {todos.length === 0 ? (
            <Text c="dimmed" py="xl" ta="center">
              タスクがありません
            </Text>
          ) : (
            todos.map((todo) => (
              <TodoItemModern
                key={todo.id}
                onItemClick={handleItemClick}
                onToggle={handleToggle}
                todo={todo}
              />
            ))
          )}
          {/* サンプルデータ（開発用） */}
          {todos.length === 0 && !showEmpty && (
            <>
              <TodoItemSample
                completed={false}
                id="sample-1"
                onItemClick={handleItemClick}
                onToggle={handleSampleToggle}
                subtitle="タスク"
                title="サンプル会議"
              />
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

/**
 * タスク追加ボタンクリック処理（ダミー）
 */
function handleAddTask() {
  // TODO: 後でモーダルでタスク追加ダイアログを表示する
  console.log('タスク追加ボタンがクリックされました')
}

/**
 * サンプル用の空のonToggle処理
 */
function handleSampleToggle() {
  // サンプル用のダミー関数
}

/**
 * モダンなスタイルの単一TODO項目コンポーネント
 */
function TodoItemModern({ onItemClick, onToggle, todo }: TodoItemModernProps) {
  async function handleToggle() {
    await onToggle(todo.id)
  }

  function handleClick() {
    onItemClick(todo.id)
  }

  return (
    <Group
      gap="sm"
      onClick={handleClick}
      style={{
        '&:hover': {
          backgroundColor: 'var(--mantine-color-gray-0)',
        },
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '8px 12px',
      }}
    >
      <Checkbox
        checked={todo.status === 'completed'}
        onChange={handleToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <Box style={{ flex: 1 }}>
        <Text
          size="sm"
          style={{
            color:
              todo.status === 'completed'
                ? 'var(--mantine-color-dimmed)'
                : undefined,
            textDecoration:
              todo.status === 'completed' ? 'line-through' : 'none',
          }}
        >
          {todo.title}
        </Text>
        {todo.description && (
          <Text c="dimmed" size="xs">
            {todo.description}
          </Text>
        )}
      </Box>
      <ActionIcon size="sm" variant="subtle">
        <IconStar size={14} />
      </ActionIcon>
    </Group>
  )
}

/**
 * サンプル用のTODO項目コンポーネント
 */
function TodoItemSample({
  completed,
  id,
  onItemClick,
  onToggle,
  subtitle,
  title,
}: TodoItemSampleProps) {
  function handleClick() {
    onItemClick(id)
  }

  return (
    <Group
      gap="sm"
      onClick={handleClick}
      style={{
        '&:hover': {
          backgroundColor: 'var(--mantine-color-gray-0)',
        },
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '8px 12px',
      }}
    >
      <Checkbox
        checked={completed}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <Box style={{ flex: 1 }}>
        <Text
          size="sm"
          style={{
            color: completed ? 'var(--mantine-color-dimmed)' : undefined,
            textDecoration: completed ? 'line-through' : 'none',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text c="dimmed" size="xs">
            {subtitle}
          </Text>
        )}
      </Box>
      <ActionIcon size="sm" variant="subtle">
        <IconStar size={14} />
      </ActionIcon>
    </Group>
  )
}
