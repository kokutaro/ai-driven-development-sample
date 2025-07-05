'use client'

import { Paper, SimpleGrid, Stack, Title } from '@mantine/core'

import { CompletionProgress } from './completion-progress'
import { StatsCard } from './stats-card'

import { useTodoStats } from '@/stores/todo-store'

/**
 * TODO統計ダッシュボードコンポーネント
 *
 * @description
 * TODO項目の統計情報を視覚的に表示するダッシュボード。
 * 総数、完了数、未完了数、完了率を分かりやすく表示する。
 *
 * @example
 * ```tsx
 * <TodoStatsDashboard />
 * ```
 */
export function TodoStatsDashboard() {
  const { completed, completionRate, pending, total } = useTodoStats()

  return (
    <section aria-label="TODO統計ダッシュボード" role="region">
      <Paper p="xl" withBorder>
        <Stack gap="lg">
          <Title order={2} ta="center">
            TODO統計
          </Title>

          <SimpleGrid
            cols={{ base: 1, sm: 3 }}
            data-testid="stats-cards-container"
            spacing="md"
          >
            <StatsCard color="blue" label="総TODO数" value={total} />
            <StatsCard color="green" label="完了済み" value={completed} />
            <StatsCard color="orange" label="未完了" value={pending} />
          </SimpleGrid>

          <CompletionProgress completionRate={completionRate} />
        </Stack>
      </Paper>
    </section>
  )
}
