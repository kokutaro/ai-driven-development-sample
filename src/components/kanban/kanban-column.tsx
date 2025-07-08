import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge, Box, Group, Paper, Stack, Text, Title } from '@mantine/core'

import { KanbanCard } from './kanban-card'

import type { KanbanColumn as KanbanColumnType } from '@/types/todo'

interface KanbanColumnProps {
  column: KanbanColumnType
}

/**
 * Kanbanカラムコンポーネント
 *
 * ドロップ可能なKanbanカラムを表示します。
 * - カラム名とタスク数の表示
 * - タスクの一覧表示
 * - ドロップゾーンとして機能
 * - ソート可能なタスクリスト
 */
export function KanbanColumn({ column }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    data: {
      type: 'column',
    },
    id: column.id,
  })

  const tasks = column.todos ?? []
  const taskIds = tasks.map((task) => task.id)

  return (
    <Paper
      bg={column.color}
      data-testid="kanban-column"
      miw={300}
      p="md"
      radius="md"
      ref={setNodeRef}
      style={{
        backgroundColor: column.color,
        opacity: isOver ? 0.8 : 1,
        transition: 'opacity 150ms ease',
      }}
      withBorder
    >
      <Stack gap="md">
        {/* カラムヘッダー */}
        <Group justify="space-between">
          <Title order={4}>{column.name}</Title>
          <Badge color="gray" size="sm" variant="filled">
            {tasks.length}
          </Badge>
        </Group>

        {/* タスクリスト */}
        <Stack gap="xs" mih={400}>
          {tasks.length > 0 ? (
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <KanbanCard key={task.id} task={task} />
              ))}
            </SortableContext>
          ) : (
            <Box
              p="xl"
              style={{
                alignItems: 'center',
                border: '2px dashed var(--mantine-color-gray-4)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 100,
              }}
            >
              <Text c="dimmed" size="sm">
                タスクをここにドロップ
              </Text>
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
