'use client'

import { Paper, Stack, Text } from '@mantine/core'

/**
 * 統計カードコンポーネントのプロパティ
 */
interface StatsCardProps {
  /** カードの色テーマ */
  color?: string
  /** 統計のラベル */
  label: string
  /** 統計の値 */
  value: number
}

/**
 * 統計情報を表示するカードコンポーネント
 *
 * @description
 * TODO統計の数値を視覚的に表示するためのカードコンポーネント。
 * ラベルと値をペアで表示し、色分けによる視覚的な区別が可能。
 *
 * @example
 * ```tsx
 * <StatsCard label="総TODO数" value={10} color="blue" />
 * <StatsCard label="完了済み" value={7} color="green" />
 * <StatsCard label="未完了" value={3} color="orange" />
 * ```
 */
export function StatsCard({ color = 'blue', label, value }: StatsCardProps) {
  return (
    <Paper aria-label={`${label}: ${value}`} p="md" withBorder>
      <Stack align="center" gap="xs">
        <Text c="dimmed" size="sm" ta="center">
          {label}
        </Text>
        <Text
          c={color}
          fw={700}
          size="xl"
          style={{ fontSize: '2rem' }}
          ta="center"
        >
          {value}
        </Text>
      </Stack>
    </Paper>
  )
}
