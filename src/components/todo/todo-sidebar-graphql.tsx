import { memo, useCallback, useMemo } from 'react'

import {
  Alert,
  Badge,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconCalendarEvent,
  IconCheck,
  IconExclamationMark,
  IconListCheck,
  IconMail,
  IconRefresh,
  IconStar,
  IconSun,
  IconUser,
} from '@tabler/icons-react'

import { useClientOnly } from '@/hooks/use-client-only'
import { useTodoStatsGraphQL } from '@/hooks/use-todo-stats-graphql'
import { useUiStore } from '@/stores/ui-store'

/**
 * GraphQL TODOサイドバーコンポーネント
 *
 * REST APIからGraphQLに移行したフィルタ機能を提供するサイドバーです。
 * - GraphQLクエリによる統計データ取得
 * - Apollo Clientによるキャッシュ管理
 * - 各フィルタ項目の表示
 * - 選択状態の管理
 * - タスク数の表示
 * - リアルタイム更新対応
 * - パフォーマンス最適化（React.memo）
 * - エラーハンドリング強化
 */
export const TodoSidebarGraphQL = memo(() => {
  const { selectedFilter, setSelectedFilter } = useUiStore()
  const { error, loading, refetch, stats } = useTodoStatsGraphQL()
  const isClient = useClientOnly()

  /**
   * 再取得処理
   */
  const handleRefetch = useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error('統計データ再取得エラー:', error)
    }
  }, [refetch])

  /**
   * フィルタ設定のメモ化
   */
  const filters = useMemo(
    () =>
      [
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
          count: 0, // 将来実装予定
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
      ] as const,
    [stats]
  )

  // エラー状態
  if (error) {
    return (
      <Stack gap="xs">
        <Alert
          color="red"
          icon={<IconExclamationMark size="1rem" />}
          title="統計データの取得に失敗しました"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              {error.message || '不明なエラーが発生しました'}
            </Text>
            <Group>
              <Button
                leftSection={<IconRefresh size="0.8rem" />}
                onClick={handleRefetch}
                size="xs"
                variant="light"
              >
                再試行
              </Button>
            </Group>
          </Stack>
        </Alert>
      </Stack>
    )
  }

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
            isClient && !loading && !error && filter.count > 0 ? (
              <Badge color={filter.color} data-badge size="sm">
                {filter.count}
              </Badge>
            ) : undefined
          }
        />
      ))}
    </Stack>
  )
})

TodoSidebarGraphQL.displayName = 'TodoSidebarGraphQL'
