'use client'

import { Stack } from '@mantine/core'

// import { TodoStatsDashboard } from '@/components/dashboard/todo-stats-dashboard'
// import { TodoAddForm } from '@/components/todo-add-form'
// import { TodoListEnhanced } from '@/components/todo-list-enhanced'
import { TodoListModern } from '@/components/todo-list-modern'

/**
 * メインコンテンツエリアのコンポーネント
 *
 * @description
 * AppShellの中央部分に表示されるコンテンツで、以下を含みます：
 * - Microsoft To-Do風のモダンなTODO一覧
 *
 * 統計ダッシュボードは一時的に非表示にしています。
 *
 * @example
 * ```tsx
 * <TodoMainContent />
 * ```
 */
export function TodoMainContent() {
  return (
    <Stack gap="xl">
      {/* 統計ダッシュボードは一時的に非表示 */}
      {/* <TodoStatsDashboard /> */}

      <TodoListModern />

      {/* 以前のコンポーネントは一時的に非表示 */}
      {/* <Paper p="xl" withBorder>
        <Stack gap="lg">
          <TodoAddForm />
          <TodoListEnhanced />
        </Stack>
      </Paper> */}
    </Stack>
  )
}
