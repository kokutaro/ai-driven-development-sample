import { useEffect } from 'react'

import {
  Button,
  Divider,
  Group,
  Select,
  Stack,
  Switch,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconCalendar, IconPlus, IconStar } from '@tabler/icons-react'

import { useCategories } from '@/hooks/use-categories'
import { useTodoStore } from '@/stores/todo-store'
import { type Todo } from '@/types/todo'

interface TodoDetailPanelProps {
  todo: Todo
}

/**
 * TODO詳細パネルコンポーネント
 *
 * 選択されたタスクの詳細を表示・編集します。
 * - タイトル、説明、期限日、重要度、カテゴリの編集
 * - リアルタイム保存
 * - サブタスク管理
 * - フォームバリデーション
 */
export function TodoDetailPanel({ todo }: TodoDetailPanelProps) {
  const { updateTodo } = useTodoStore()
  const { categories } = useCategories()

  const form = useForm({
    initialValues: {
      categoryId: todo.categoryId ?? '',
      description: todo.description ?? '',
      dueDate: todo.dueDate
        ? new Date(todo.dueDate)
        : (undefined as Date | undefined),
      isImportant: todo.isImportant,
      title: todo.title,
    },
    validate: {
      title: (value) => (value ? undefined : 'タイトルは必須です'),
    },
  })

  // タスクが変更された時にフォームの値を更新
  useEffect(() => {
    form.setValues({
      categoryId: todo.categoryId ?? '',
      description: todo.description ?? '',
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      isImportant: todo.isImportant,
      title: todo.title,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    todo.id,
    todo.title,
    todo.description,
    todo.dueDate,
    todo.isImportant,
    todo.categoryId,
  ])

  /**
   * フィールド変更時のハンドラー
   * リアルタイムでタスクを更新します
   */
  const handleFieldChange = async (
    field: string,
    value: boolean | Date | string | undefined
  ) => {
    form.setFieldValue(field, value)

    // 現在のフォーム値を取得して更新
    const currentValues = form.values
    const updateData = {
      categoryId:
        field === 'categoryId'
          ? (value as string | undefined)
          : currentValues.categoryId,
      description:
        field === 'description'
          ? (value as string | undefined)
          : currentValues.description,
      dueDate:
        field === 'dueDate'
          ? (value as Date | undefined)
          : currentValues.dueDate,
      isImportant:
        field === 'isImportant'
          ? (value as boolean)
          : currentValues.isImportant,
      title: field === 'title' ? (value as string) : currentValues.title,
    }

    try {
      await updateTodo(todo.id, updateData)
    } catch (error) {
      console.error('タスク更新エラー:', error)
    }
  }

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }))

  return (
    <Stack gap="md" p="md">
      <Title order={3}>タスクの詳細</Title>

      <TextInput
        error={form.errors.title}
        label="タイトル"
        onChange={(event) => handleFieldChange('title', event.target.value)}
        placeholder="タスクのタイトルを入力..."
        required
        value={form.values.title}
      />

      <Textarea
        autosize
        label="説明"
        minRows={3}
        onChange={(event) =>
          handleFieldChange('description', event.target.value)
        }
        placeholder="タスクの詳細を入力..."
        value={form.values.description}
      />

      <DatePickerInput
        clearable
        label="期限日"
        leftSection={<IconCalendar size={16} />}
        onChange={(date) => handleFieldChange('dueDate', date ?? undefined)}
        placeholder="期限日を選択..."
        value={form.values.dueDate}
      />

      <Switch
        checked={form.values.isImportant}
        description="重要なタスクとしてマークする"
        label="重要"
        onChange={(event) =>
          handleFieldChange('isImportant', event.currentTarget.checked)
        }
        thumbIcon={<IconStar size={12} />}
      />

      <Select
        clearable
        data={categoryOptions}
        label="カテゴリ"
        onChange={(value) =>
          handleFieldChange('categoryId', value ?? undefined)
        }
        placeholder="カテゴリを選択..."
        value={form.values.categoryId}
      />

      <Divider />

      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>サブタスク</Title>
          <Button
            leftSection={<IconPlus size={14} />}
            size="xs"
            variant="light"
          >
            追加
          </Button>
        </Group>
        {/* サブタスクリストは後で実装 */}
      </Stack>
    </Stack>
  )
}
