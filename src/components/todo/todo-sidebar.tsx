import { Badge, NavLink, Stack } from '@mantine/core'
import {
  IconCalendarEvent,
  IconCheck,
  IconListCheck,
  IconMail,
  IconStar,
  IconSun,
  IconUser,
} from '@tabler/icons-react'

import { useClientOnly } from '@/hooks/use-client-only'
import { useTodoStats } from '@/hooks/use-todo-stats'
import { useUiStore } from '@/stores/ui-store'

/**
 * TODOサイドバーコンポーネント
 *
 * フィルタ機能を提供するサイドバーです。
 * - 各フィルタ項目の表示
 * - 選択状態の管理
 * - タスク数の表示
 * - UIStoreとの連携
 */
export function TodoSidebar() {
  const { selectedFilter, setSelectedFilter } = useUiStore()
  const { stats } = useTodoStats()
  const isClient = useClientOnly()

  const filters = [
    {
      color: 'yellow',
      count: stats.todayCount,
      icon: IconSun,
      key: 'today',
      label: '今日の予定',
    },
    {
      color: 'red',
      count: stats.importantCount,
      icon: IconStar,
      key: 'important',
      label: '重要',
    },
    {
      color: 'blue',
      count: stats.upcomingCount,
      icon: IconCalendarEvent,
      key: 'upcoming',
      label: '今後の予定',
    },
    {
      color: 'grape',
      count: stats.assignedCount,
      icon: IconUser,
      key: 'assigned',
      label: '自分に割り当て',
    },
    {
      color: 'orange',
      count: 0,
      icon: IconMail,
      key: 'flagged',
      label: 'フラグを設定したメール',
    },
    {
      color: 'gray',
      count: stats.totalCount,
      icon: IconListCheck,
      key: 'all',
      label: 'タスク',
    },
    {
      color: 'green',
      count: stats.completedCount,
      icon: IconCheck,
      key: 'completed',
      label: '完了済み',
    },
  ] as const

  return (
    <Stack gap="xs">
      {filters.map((filter) => (
        <NavLink
          active={selectedFilter === filter.key}
          data-active={selectedFilter === filter.key}
          key={filter.key}
          label={filter.label}
          leftSection={<filter.icon size={16} />}
          onClick={() => setSelectedFilter(filter.key)}
          rightSection={
            isClient && filter.count > 0 ? (
              <Badge color={filter.color} data-badge size="sm">
                {filter.count}
              </Badge>
            ) : undefined
          }
        />
      ))}
    </Stack>
  )
}
