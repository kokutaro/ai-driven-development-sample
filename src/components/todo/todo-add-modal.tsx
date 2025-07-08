import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconCalendar, IconStar } from '@tabler/icons-react'

import { DatePickerWithQuickSelect } from './date-picker-with-quick-select'

import { useCategories } from '@/hooks/use-categories'
import { useTodoStore } from '@/stores/todo-store'

interface TodoAddModalProps {
  onClose: () => void
  opened: boolean
}

/**
 * TODOアイテム追加モーダルコンポーネント
 *
 * 新しいタスクを作成するためのモーダルダイアログです。
 * - タイトル、説明、期限日、重要度、カテゴリの入力
 * - フォームバリデーション
 * - 作成成功時にモーダルを閉じる
 * - エラー処理
 */
export function TodoAddModal({ onClose, opened }: TodoAddModalProps) {
  const { createTodo } = useTodoStore()
  const { categories } = useCategories()

  const form = useForm({
    initialValues: {
      categoryId: '',
      description: '',
      dueDate: undefined as Date | undefined,
      isImportant: false,
      title: '',
    },
    validate: {
      title: (value) => (value ? undefined : 'タイトルは必須です'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createTodo({
        categoryId: values.categoryId || undefined,
        description: values.description || undefined,
        dueDate: values.dueDate ?? undefined,
        isImportant: values.isImportant,
        title: values.title,
      })
      form.reset()
      onClose()
    } catch (error) {
      console.error('タスク作成エラー:', error)
    }
  }

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      size="md"
      title="新しいタスクを追加"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="タイトル"
            placeholder="タスクのタイトルを入力..."
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            autosize
            label="説明"
            minRows={3}
            placeholder="タスクの詳細を入力..."
            {...form.getInputProps('description')}
          />

          <DatePickerWithQuickSelect
            clearable
            label="期限日"
            leftSection={<IconCalendar size={16} />}
            placeholder="期限日を選択..."
            {...form.getInputProps('dueDate')}
          />

          <Switch
            description="重要なタスクとしてマークする"
            label="重要"
            thumbIcon={<IconStar size={12} />}
            {...form.getInputProps('isImportant')}
          />

          <Select
            clearable
            data={categoryOptions}
            label="カテゴリ"
            placeholder="カテゴリを選択..."
            {...form.getInputProps('categoryId')}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={onClose} variant="subtle">
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
