/**
 * タスク詳細パネルコンポーネント
 * @fileoverview 選択されたタスクの詳細表示と編集
 */
'use client'

import { Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconX } from '@tabler/icons-react'

import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'

/**
 * タスク詳細パネルコンポーネント
 * @returns タスク詳細パネル
 */
export function TaskDetailPanel() {
  const { clearSelectedTask, selectedTask } = useTaskStore()
  const { setTaskDetailPanelOpen } = useUIStore()

  /**
   * パネルを閉じるハンドラ
   */
  function handleClose() {
    clearSelectedTask()
    setTaskDetailPanelOpen(false)
  }

  if (!selectedTask) {
    return (
      <Stack align="center" h="100%" justify="center" p="md">
        <Text c="dimmed">タスクが選択されていません</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="md" h="100%" p="md">
      {/* ヘッダー */}
      <Group justify="space-between">
        <Title order={4}>タスク詳細</Title>
        <Button
          aria-label="詳細パネルを閉じる"
          onClick={handleClose}
          size="xs"
          variant="subtle"
        >
          <IconX size={16} />
        </Button>
      </Group>

      {/* タスク情報 */}
      <Card p="md" shadow="xs">
        <Stack gap="sm">
          <Title order={5}>{selectedTask.title}</Title>

          {selectedTask.description && (
            <Text c="dimmed" size="sm">
              {selectedTask.description}
            </Text>
          )}

          {selectedTask.dueDate && (
            <Text size="sm">
              期限: {selectedTask.dueDate.toLocaleDateString('ja-JP')}
            </Text>
          )}

          <Group gap="xs">
            {selectedTask.important && (
              <Text c="yellow" size="xs">
                重要
              </Text>
            )}
            {selectedTask.completed && (
              <Text c="green" size="xs">
                完了済み
              </Text>
            )}
          </Group>
        </Stack>
      </Card>

      {/* 今後、詳細編集フォームをここに追加 */}
    </Stack>
  )
}
