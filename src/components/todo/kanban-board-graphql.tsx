import { Stack, Text } from '@mantine/core'

interface KanbanBoardGraphQLProps {
  filter?: string
  sortBy: string
}

/**
 * GraphQL Kanbanボードコンポーネント
 *
 * REST APIからGraphQLに移行したKanbanボードの表示
 * TODO: 将来実装予定
 */
export function KanbanBoardGraphQL({
  filter,
  sortBy,
}: KanbanBoardGraphQLProps) {
  return (
    <Stack align="center" py="xl">
      <Text c="dimmed">Kanbanビューは開発中です</Text>
      <Text c="dimmed" size="sm">
        Filter: {filter}, Sort: {sortBy}
      </Text>
    </Stack>
  )
}
