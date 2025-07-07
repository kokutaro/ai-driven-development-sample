/**
 * フィルタサイドバーコンポーネント
 * @fileoverview タスクフィルタリング用のサイドバー
 */
'use client'

import { NavLink, Stack } from '@mantine/core'
import {
  IconCalendar,
  IconCheck,
  IconInbox,
  IconMail,
  IconStar,
  IconUser,
} from '@tabler/icons-react'

import type { TaskFilter } from '@/types/task'

import { useTaskStore } from '@/stores/task-store'

/**
 * フィルタアイテムの設定
 */
const filterItems: Array<{
  icon: typeof IconInbox
  key: TaskFilter
  label: string
}> = [
  { icon: IconCalendar, key: 'today', label: '今日の予定' },
  { icon: IconStar, key: 'important', label: '重要' },
  { icon: IconCalendar, key: 'planned', label: '今後の予定' },
  { icon: IconUser, key: 'assigned-to-me', label: '自分に割り当て' },
  { icon: IconMail, key: 'flagged-email', label: 'フラグを設定したメール' },
  { icon: IconInbox, key: 'all', label: 'タスク' },
  { icon: IconCheck, key: 'completed', label: '完了済み' },
]

/**
 * フィルタサイドバーコンポーネント
 * @returns フィルタサイドバー
 */
export function FilterSidebar() {
  const { filter, filteredTaskCount, setFilter } = useTaskStore()

  /**
   * フィルタ変更ハンドラ
   * @param selectedFilter 選択されたフィルタ
   */
  function handleFilterChange(selectedFilter: TaskFilter) {
    setFilter(selectedFilter)
  }

  return (
    <Stack gap="xs" p="md">
      {filterItems.map((item) => {
        const Icon = item.icon
        // 現在のフィルタに一致する場合のみタスク数を表示
        const taskCount = filter === item.key ? filteredTaskCount : 0
        const isActive = filter === item.key

        return (
          <NavLink
            active={isActive}
            data-testid={`filter-${item.key}`}
            key={item.key}
            label={item.label}
            leftSection={<Icon size={18} />}
            onClick={() => handleFilterChange(item.key)}
            rightSection={taskCount > 0 ? taskCount : undefined}
          />
        )
      })}
    </Stack>
  )
}
