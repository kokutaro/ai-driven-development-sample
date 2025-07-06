'use client'

import { Paper, Stack } from '@mantine/core'

import { TodoStatsDashboard } from '@/components/dashboard/todo-stats-dashboard'
import { TodoAddForm } from '@/components/todo-add-form'
import { TodoListEnhanced } from '@/components/todo-list-enhanced'

/**
 * メインコンテンツエリアのコンポーネント
 *
 * @description
 * AppShellの中央部分に表示されるコンテンツで、以下を含みます：
 * - 統計ダッシュボード
 * - TODO追加フォーム
 * - フィルタリング機能付きTODO一覧
 *
 * @example
 * ```tsx
 * <TodoMainContent />
 * ```
 */
export function TodoMainContent() {
  return (
    <Stack gap="xl">
      <TodoStatsDashboard />

      <Paper p="xl" withBorder>
        <Stack gap="lg">
          <TodoAddForm />
          <TodoListEnhanced />
        </Stack>
      </Paper>
    </Stack>
  )
}
