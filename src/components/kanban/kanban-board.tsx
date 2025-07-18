import { useEffect } from 'react'
import { useState } from 'react'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { Alert, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import { KanbanCard } from './kanban-card'
import { KanbanColumn } from './kanban-column'
import { KanbanColumnAddModal } from './kanban-column-add-modal'

import type { Todo } from '@/types/todo'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import { useKanbanStore } from '@/stores/kanban-store'
import { useTodoStore } from '@/stores/todo-store'

/**
 * Kanbanボードコンポーネント
 *
 * ドラッグ&ドロップ対応のKanbanボードを表示します。
 * - カラム間でのタスク移動
 * - カラム内でのタスク並び替え
 * - カラム自体の並び替え
 */
export function KanbanBoard() {
  const {
    createDefaultColumns,
    error,
    fetchKanbanColumns,
    isLoading,
    kanbanColumns,
  } = useKanbanStore()
  const { moveToKanbanColumn } = useTodoStore()
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [activeTask, setActiveTask] = useState<Todo | undefined>(undefined)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    const initializeKanban = async () => {
      await fetchKanbanColumns()
    }

    void initializeKanban()
  }, [fetchKanbanColumns])

  // カラム取得後にカラムが空の場合もデフォルトカラムを作成
  useEffect(() => {
    if (!isLoading && kanbanColumns.length === 0) {
      void createDefaultColumns()
    }
  }, [isLoading, kanbanColumns.length, createDefaultColumns])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // タスクの場合はタスクデータを保存
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task as Todo | undefined)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    // const _activeId = active.id as string
    const overId = over.id as string

    // タスクのカラム間移動
    if (
      active.data.current?.type === 'task' &&
      over.data.current?.type === 'column'
    ) {
      const task = active.data.current.task as Todo
      const targetColumnId = overId

      if (task.kanbanColumnId !== targetColumnId) {
        // TODO: 楽観的更新を実装
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(undefined)
    setActiveTask(undefined)

    if (!over) return

    // const _activeId = active.id as string
    const overId = over.id as string

    // タスクのカラム間移動
    if (
      active.data.current?.type === 'task' &&
      over.data.current?.type === 'column'
    ) {
      const task = active.data.current.task as Todo
      const targetColumnId = overId

      if (task.kanbanColumnId !== targetColumnId) {
        try {
          await moveToKanbanColumn(task.id, targetColumnId)
          // カラムデータを再取得
          void fetchKanbanColumns()
        } catch (error) {
          console.error('タスクの移動に失敗しました:', error)
        }
      }
    }
  }

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="md" />
        <Text>Loading...</Text>
      </Group>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="エラー">
        {error}
      </Alert>
    )
  }

  const columnIds = kanbanColumns.map((column) => column.id)

  return (
    <Stack gap="md">
      <DndContext
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <Group align="flex-start" gap="md" wrap="nowrap">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {kanbanColumns.map((column) => (
              <KanbanColumn column={column} key={column.id} />
            ))}
          </SortableContext>

          {/* 新しいカラムを追加ボタン */}
          <Paper
            miw={300}
            p="md"
            radius="md"
            style={{
              backgroundColor: 'var(--mantine-color-gray-0)',
              border: '2px dashed var(--mantine-color-gray-4)',
              cursor: 'pointer',
            }}
            withBorder={false}
          >
            <Button
              fullWidth
              leftSection={<IconPlus size={16} />}
              onClick={() => setIsAddModalOpen(true)}
              size="lg"
              variant="subtle"
            >
              新しいカラムを追加
            </Button>
          </Paper>
        </Group>

        <DragOverlay>
          {activeTask && activeId ? (
            <KanbanCard task={activeTask} />
          ) : undefined}
        </DragOverlay>
      </DndContext>

      {/* カラム追加モーダル */}
      <KanbanColumnAddModal
        onClose={() => setIsAddModalOpen(false)}
        opened={isAddModalOpen}
      />
    </Stack>
  )
}
