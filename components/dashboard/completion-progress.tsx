'use client'

import { Paper, Progress, Stack, Text } from '@mantine/core'

/**
 * 完了進捗コンポーネントのプロパティ
 */
interface CompletionProgressProps {
  /** 完了率（0-100の値） */
  completionRate: number
}

/**
 * TODO完了率を表示する進捗バーコンポーネント
 *
 * @description
 * TODO項目の完了率をプログレスバーで視覚的に表示するコンポーネント。
 * 完了率に応じて色分けを行い、アクセシビリティにも配慮している。
 *
 * @example
 * ```tsx
 * <CompletionProgress completionRate={75} />
 * ```
 */
export function CompletionProgress({
  completionRate,
}: CompletionProgressProps) {
  // 完了率を0-100の範囲に制限
  const normalizedRate = Math.max(0, Math.min(100, completionRate))

  const progressColor = getProgressColor(normalizedRate)

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Text fw={500} size="sm" ta="center">
          完了率
        </Text>
        <Progress
          aria-label={`TODO完了進捗: ${normalizedRate}%`}
          color={progressColor}
          radius="md"
          size="lg"
          value={normalizedRate}
        />
        <Text c={progressColor} fw={700} size="lg" ta="center">
          {normalizedRate}%
        </Text>
      </Stack>
    </Paper>
  )
}

/**
 * 完了率に基づいて適切な色を決定する
 */
function getProgressColor(rate: number): string {
  if (rate < 40) return 'red'
  if (rate < 80) return 'yellow'
  return 'green'
}
