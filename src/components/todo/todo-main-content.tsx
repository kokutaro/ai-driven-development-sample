import { useEffect, useState } from 'react'

import { Button, Group, Select, Stack, Text, Title } from '@mantine/core'
import { IconPlus, IconSortDescending } from '@tabler/icons-react'

import { TodoAddModal } from './todo-add-modal'
import { TodoList } from './todo-list'

import { useTodos } from '@/hooks/use-todos'
import { useUiStore } from '@/stores/ui-store'

/**
 * TODOメインコンテンツコンポーネント
 *
 * 中央カラムのメインコンテンツを表示します。
 * - 動的タイトル（選択されたフィルタに応じて変更）
 * - タスク追加ボタン
 * - 並び替えオプション
 * - タスク一覧の表示
 * - 新規タスク追加モーダルの管理
 */
export function TodoMainContent() {
  const { selectedFilter } = useUiStore()
  const { isLoading, todos } = useTodos(selectedFilter)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [dateString, setDateString] = useState<string>('')

  /**
   * 選択されたフィルタに基づいてタイトルを取得
   */
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

  // クライアントサイドでのみ日付を設定（ハイドレーションエラー対策）
  useEffect(() => {
    const today = new Date()
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    })
    setDateString(formatter.format(today))
  }, [])

  return (
    <Stack gap="md">
      {/* ヘッダー部分 */}
      <Group align="flex-end" justify="space-between">
        <Stack gap="xs">
          <Title order={2}>{getTitle()}</Title>
          {dateString && (
            <Text c="dimmed" size="sm">
              {dateString}
            </Text>
          )}
        </Stack>
        <Group>
          <Select
            data={[
              { label: '作成日時', value: 'createdAt' },
              { label: '期限日', value: 'dueDate' },
              { label: 'タイトル', value: 'title' },
              { label: '重要度', value: 'importance' },
            ]}
            leftSection={<IconSortDescending size={16} />}
            onChange={(value) => setSortBy(value ?? 'createdAt')}
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

      {/* タスク一覧 */}
      <TodoList isLoading={isLoading} sortBy={sortBy} todos={todos} />

      {/* タスク追加モーダル */}
      <TodoAddModal
        onClose={() => setIsAddModalOpen(false)}
        opened={isAddModalOpen}
      />
    </Stack>
  )
}
