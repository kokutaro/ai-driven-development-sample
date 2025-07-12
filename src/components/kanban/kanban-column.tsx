import { useState } from 'react'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react'

import { KanbanCard } from './kanban-card'
import { KanbanColumnEditModal } from './kanban-column-edit-modal'

import type { KanbanColumn as KanbanColumnType } from '@/types/todo'

import { useKanbanStore } from '@/stores/kanban-store'

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
  const { deleteKanbanColumn } = useKanbanStore()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { isOver, setNodeRef } = useDroppable({
    data: {
      type: 'column',
    },
    id: column.id,
  })

  const tasks = column.todos ?? []
  const taskIds = tasks.map((task) => task.id)

  const handleDeleteColumn = () => {
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          このカラムを削除すると、カラム内のすべてのタスクが未分類になります。
          この操作は元に戻せません。本当に削除しますか？
        </Text>
      ),
      confirmProps: { color: 'red' },
      labels: { cancel: 'キャンセル', confirm: '削除' },
      onConfirm: () => {
        void (async () => {
          try {
            await deleteKanbanColumn(column.id)
          } catch (error) {
            console.error('カラム削除エラー:', error)
          }
        })()
      },
      title: 'カラムの削除',
    })
  }

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
          <Group gap="sm">
            <Title order={4}>{column.name}</Title>
            <Badge color="gray" size="sm" variant="filled">
              {tasks.length}
            </Badge>
          </Group>
          <Menu position="bottom-end" shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon color="gray" size="sm" variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => setIsEditModalOpen(true)}
              >
                編集
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={handleDeleteColumn}
              >
                削除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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

      {/* 編集モーダル */}
      <KanbanColumnEditModal
        column={column}
        onClose={() => setIsEditModalOpen(false)}
        opened={isEditModalOpen}
      />
    </Paper>
  )
}
