import { useState } from 'react'

import {
  Button,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconColumns,
  IconList,
  IconPlus,
  IconSortDescending,
} from '@tabler/icons-react'

import { KanbanBoardGraphQL } from './kanban-board-graphql'
import { TodoAddModal } from './todo-add-modal'
import { TodoListGraphQL } from './todo-list-graphql'

import { useTodosGraphQL } from '@/hooks/use-todos-graphql'
import { useUiStore } from '@/stores/ui-store'
import { type TodoSortBy } from '@/types/todo'

/**
 * サブタイトル（今日の日付）を取得
 */
const getSubtitle = () => {
  const today = new Date()
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
  return formatter.format(today)
}

/**
 * GraphQL TODOメインコンテンツコンポーネント
 *
 * REST APIからGraphQLに移行した中央カラムのメインコンテンツを表示します。
 * - GraphQLクエリによるデータ取得
 * - 動的タイトル表示
 * - ビュー切り替え（リスト/Kanban）
 * - タスク追加機能
 * - 並び替えオプション
 * - フィルタ連携
 */
export function TodoMainContentGraphQL() {
  const { selectedFilter, setViewMode, viewMode } = useUiStore()
  const { error, loading, todos } = useTodosGraphQL()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<TodoSortBy>('createdAt')

  // フィルタに基づいたタイトルを取得
  const getTitle = () => {
    switch (selectedFilter) {
      case 'assigned': {
        return '自分に割り当て'
      }
      case 'completed': {
        return '完了済みタスク'
      }
      case 'flagged': {
        return 'フラグを設定したメール'
      }
      case 'important': {
        return '重要なタスク'
      }
      case 'today': {
        return '今日の予定'
      }
      case 'upcoming': {
        return '今後の予定'
      }
      default: {
        return 'すべてのタスク'
      }
    }
  }

  // タスク数を取得
  const getTaskCount = () => {
    if (!todos || loading) return 0

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (selectedFilter) {
      case 'assigned': {
        return todos.filter((todo) => !todo.isCompleted).length
      }
      case 'completed': {
        return todos.filter((todo) => todo.isCompleted).length
      }
      case 'important': {
        return todos.filter((todo) => todo.isImportant && !todo.isCompleted)
          .length
      }
      case 'today': {
        return todos.filter(
          (todo) =>
            todo.dueDate &&
            new Date(todo.dueDate) >= today &&
            new Date(todo.dueDate) < tomorrow &&
            !todo.isCompleted
        ).length
      }
      case 'upcoming': {
        return todos.filter(
          (todo) =>
            todo.dueDate && new Date(todo.dueDate) >= now && !todo.isCompleted
        ).length
      }
      default: {
        return todos.length
      }
    }
  }

  // 並び替えオプション
  const sortOptions = [
    { label: '作成日時', value: 'createdAt' },
    { label: '期限日', value: 'dueDate' },
    { label: 'タイトル', value: 'title' },
    { label: '重要度', value: 'importance' },
  ]

  // ビュー切り替えオプション
  const _viewOptions = [
    { label: 'リスト', value: 'list' },
    { label: 'Kanban', value: 'kanban' },
  ]

  const taskCount = getTaskCount()

  return (
    <Stack gap="md">
      {/* ヘッダー */}
      <Group align="flex-end" justify="space-between">
        <Stack gap="xs">
          <Group align="center" gap="sm">
            <Title order={2}>{getTitle()}</Title>
            {!loading && (
              <Text c="dimmed" size="sm">
                ({taskCount}件)
              </Text>
            )}
          </Group>
          <Text c="dimmed" size="sm">
            {getSubtitle()}
          </Text>
        </Stack>
        <Group gap="sm">
          <SegmentedControl
            data={[
              {
                label: (
                  <Group gap="xs">
                    <IconList size={16} />
                    <span>リスト</span>
                  </Group>
                ),
                value: 'list',
              },
              {
                label: (
                  <Group gap="xs">
                    <IconColumns size={16} />
                    <span>Kanban</span>
                  </Group>
                ),
                value: 'kanban',
              },
            ]}
            onChange={(value) => setViewMode(value as 'kanban' | 'list')}
            value={viewMode}
          />
          <Select
            data={sortOptions}
            leftSection={<IconSortDescending size={16} />}
            onChange={(value) => setSortBy(value as TodoSortBy)}
            placeholder="並び替え"
            value={sortBy}
            w={150}
          />
        </Group>
      </Group>

      {/* タスク追加ボタン */}
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={() => setIsAddModalOpen(true)}
        size="lg"
        variant="light"
      >
        タスクの追加
      </Button>

      {/* エラー表示 */}
      {error && (
        <Stack align="center" py="xl">
          <Text c="red">データの取得に失敗しました</Text>
          <Text c="dimmed" size="sm">
            {error.message}
          </Text>
        </Stack>
      )}

      {/* メインコンテンツ */}
      {!error && (
        <>
          {viewMode === 'list' ? (
            <TodoListGraphQL filter={selectedFilter} sortBy={sortBy} />
          ) : (
            <KanbanBoardGraphQL filter={selectedFilter} sortBy={sortBy} />
          )}
        </>
      )}

      {/* タスク追加モーダル */}
      <TodoAddModal
        onClose={() => setIsAddModalOpen(false)}
        opened={isAddModalOpen}
      />
    </Stack>
  )
}
