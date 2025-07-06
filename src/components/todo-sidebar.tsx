'use client'

import { Button, Stack, Title } from '@mantine/core'
import {
  IconCalendar,
  IconCalendarMonth,
  IconCalendarWeek,
  IconCheck,
  IconList,
} from '@tabler/icons-react'

import { useTodoUIStore } from '@/stores/todo-ui-store'
import { FILTER_OPTIONS } from '@/types/filter'

/**
 * フィルタに対応するアイコンのマッピング
 */
const FILTER_ICONS = {
  all: IconList,
  completed: IconCheck,
  thisMonth: IconCalendarMonth,
  thisWeek: IconCalendarWeek,
  today: IconCalendar,
} as const

/**
 * TODO一覧をフィルタリングするサイドバーコンポーネント
 *
 * @description
 * 左側に表示されるサイドバーで、TODOをフィルタリングするためのメニューを提供します。
 * 今日、今週、今月、全て、完了済みのフィルタを選択できます。
 *
 * @example
 * ```tsx
 * <TodoSidebar />
 * ```
 */
export function TodoSidebar() {
  const { currentFilter, setFilter } = useTodoUIStore()

  return (
    <Stack gap="md" p="md">
      <Title order={3} size="h4">
        TODO フィルター
      </Title>

      <Stack gap="xs">
        {FILTER_OPTIONS.map((option) => {
          const Icon = FILTER_ICONS[option.value]
          const isActive = currentFilter === option.value

          return (
            <Button
              data-active={isActive}
              fullWidth
              justify="flex-start"
              key={option.value}
              leftSection={<Icon size={16} />}
              onClick={() => setFilter(option.value)}
              variant={isActive ? 'filled' : 'subtle'}
            >
              {option.label}
            </Button>
          )
        })}
      </Stack>
    </Stack>
  )
}
