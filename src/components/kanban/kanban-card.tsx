import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { IconCalendar, IconStar } from '@tabler/icons-react'

import type { Todo } from '@/types/todo'

interface KanbanCardProps {
  task: Todo
}

/**
 * Kanbanカードコンポーネント
 *
 * ドラッグ可能なタスクカードを表示します。
 * - タスクタイトル
 * - タスク説明（任意）
 * - 期限日（任意）
 * - 重要フラグ
 * - カテゴリバッジ
 * - ドラッグ機能
 */
export function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    data: {
      task,
      type: 'task',
    },
    id: task.id,
  })

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted

  return (
    <Paper
      {...attributes}
      {...listeners}
      data-testid="kanban-card"
      p="sm"
      radius="md"
      ref={setNodeRef}
      shadow="sm"
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      withBorder
    >
      <Stack gap="xs">
        {/* タイトルと重要フラグ */}
        <Group gap="xs" justify="space-between">
          <Text fw={500} lineClamp={2} size="sm">
            {task.title}
          </Text>
          {task.isImportant && (
            <IconStar
              color="var(--mantine-color-yellow-6)"
              data-testid="important-star"
              fill="var(--mantine-color-yellow-6)"
              size={16}
            />
          )}
        </Group>

        {/* 説明 */}
        {task.description && (
          <Text c="dimmed" lineClamp={3} size="xs">
            {task.description}
          </Text>
        )}

        {/* フッター情報 */}
        <Group justify="space-between">
          {/* 期限日 */}
          {task.dueDate && (
            <Group gap="4">
              <IconCalendar
                color={
                  isOverdue
                    ? 'var(--mantine-color-red-6)'
                    : 'var(--mantine-color-gray-6)'
                }
                size={12}
              />
              <Text
                c={isOverdue ? 'red' : 'dimmed'}
                fw={isOverdue ? 500 : 400}
                size="xs"
              >
                {formatDate(new Date(task.dueDate))}
              </Text>
            </Group>
          )}

          {/* カテゴリバッジ */}
          {task.category && (
            <Badge
              color={task.category.color}
              size="xs"
              styles={{
                root: {
                  backgroundColor: task.category.color,
                  color: 'white',
                  fontSize: '10px',
                },
              }}
            >
              {task.category.name}
            </Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
