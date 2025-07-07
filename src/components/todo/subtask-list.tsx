import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  Checkbox,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconPlus, IconTrash } from '@tabler/icons-react'

import { useSubTasks } from '@/hooks/use-subtasks'

interface SubTaskListProps {
  todoId: string
}

/**
 * サブタスクリストコンポーネント
 *
 * 指定されたTODOのサブタスクを表示・管理します。
 * - サブタスクの一覧表示
 * - サブタスクの追加・更新・削除
 * - 完了状態の切り替え
 * - ローディング・エラー状態の表示
 */
export function SubTaskList({ todoId }: SubTaskListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const {
    createSubTask,
    deleteSubTask,
    error,
    isLoading,
    subTasks,
    toggleSubTask,
  } = useSubTasks(todoId)

  const form = useForm({
    initialValues: {
      title: '',
    },
    validate: {
      title: (value) => (value.trim() ? undefined : 'タイトルは必須です'),
    },
  })

  const handleAddSubTask = async (values: { title: string }) => {
    if (!values.title.trim()) return

    try {
      await createSubTask(todoId, { title: values.title.trim() })
      form.reset()
      setIsAdding(false)
    } catch (error) {
      console.error('サブタスク作成エラー:', error)
    }
  }

  const handleToggleSubTask = async (subTaskId: string) => {
    try {
      await toggleSubTask(subTaskId)
    } catch (error) {
      console.error('サブタスク切り替えエラー:', error)
    }
  }

  const handleDeleteSubTask = async (subTaskId: string) => {
    if (!globalThis.confirm('このサブタスクを削除しますか？')) {
      return
    }

    try {
      await deleteSubTask(subTaskId)
    } catch (error) {
      console.error('サブタスク削除エラー:', error)
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsAdding(false)
  }

  if (error) {
    return (
      <Alert color="red" title="エラー">
        {error}
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Stack gap="xs">
        <Text c="dimmed" size="sm">
          読み込み中...
        </Text>
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton height={32} key={index} />
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      {subTasks.length === 0 && !isAdding && (
        <Text c="dimmed" size="sm">
          サブタスクがありません
        </Text>
      )}

      {subTasks.map((subTask) => (
        <Group align="center" justify="space-between" key={subTask.id}>
          <Group flex={1} gap="sm">
            <Checkbox
              checked={subTask.isCompleted}
              onChange={() => handleToggleSubTask(subTask.id)}
              size="sm"
            />
            <Text
              flex={1}
              size="sm"
              style={{
                color: subTask.isCompleted
                  ? 'var(--mantine-color-dimmed)'
                  : undefined,
                textDecoration: subTask.isCompleted ? 'line-through' : 'none',
              }}
            >
              {subTask.title}
            </Text>
          </Group>
          <ActionIcon
            color="red"
            onClick={() => handleDeleteSubTask(subTask.id)}
            size="sm"
            variant="subtle"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      ))}

      {isAdding ? (
        <form onSubmit={form.onSubmit(handleAddSubTask)}>
          <Stack gap="xs">
            <TextInput
              autoFocus
              placeholder="サブタスクを入力..."
              size="sm"
              {...form.getInputProps('title')}
            />
            <Group gap="xs">
              <Button
                disabled={!form.values.title.trim()}
                size="xs"
                type="submit"
              >
                保存
              </Button>
              <Button onClick={handleCancel} size="xs" variant="subtle">
                キャンセル
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => setIsAdding(true)}
          size="xs"
          variant="subtle"
        >
          追加
        </Button>
      )}
    </Stack>
  )
}
