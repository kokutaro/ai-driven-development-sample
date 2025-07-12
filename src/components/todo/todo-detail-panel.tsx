import { useEffect, useMemo, useState } from 'react'

import {
  ActionIcon,
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
import { useForm } from '@mantine/form'
import { IconCalendar, IconPlus, IconStar } from '@tabler/icons-react'

import { DatePickerWithQuickSelect } from './date-picker-with-quick-select'

import { CategoryCreateModal } from '@/components/category'
import { useCategories } from '@/hooks/use-categories'
import { useKanbanStore } from '@/stores/kanban-store'
import { useTodoStore } from '@/stores/todo-store'
import { type Category, type Todo } from '@/types/todo'

interface TodoDetailPanelProps {
  todo: Todo
}

/**
 * TODO詳細パネルコンポーネント
 *
 * 選択されたタスクの詳細を表示・編集します。
 * - タイトル、説明、期限日、重要度、カテゴリ、Kanbanカラムの編集
 * - リアルタイム保存
 * - サブタスク管理
 * - フォームバリデーション
 */
export function TodoDetailPanel({ todo }: TodoDetailPanelProps) {
  const { updateTodo } = useTodoStore()
  const { categories, setCategories } = useCategories()
  const { fetchKanbanColumns, kanbanColumns } = useKanbanStore()
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectKey, setSelectKey] = useState(0)

  const form = useForm({
    initialValues: {
      categoryId: todo.categoryId ?? '',
      description: todo.description ?? '',
      dueDate: todo.dueDate
        ? new Date(todo.dueDate)
        : (undefined as Date | undefined),
      isImportant: todo.isImportant,
      kanbanColumnId: todo.kanbanColumnId ?? '',
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
      kanbanColumnId: todo.kanbanColumnId ?? '',
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
    todo.kanbanColumnId,
  ])

  // Kanbanカラムを取得
  useEffect(() => {
    if (kanbanColumns.length === 0) {
      void fetchKanbanColumns().catch((error) => {
        console.error('Kanbanカラムの取得に失敗しました:', error)
      })
    }
  }, [kanbanColumns.length, fetchKanbanColumns])

  /**
   * 値を安全にISO文字列に変換する
   * Date、string、null、undefinedを適切に処理します
   */
  const toISOStringSafe = (value: unknown): string | undefined => {
    // null、undefined、空文字列の場合はundefinedを返す
    if (value === null || value === undefined || value === '') {
      return undefined
    }

    // Date オブジェクトの場合
    if (value instanceof Date) {
      // 無効な日付でないかチェック
      if (Number.isNaN(value.getTime())) {
        console.warn('無効な日付オブジェクト:', value)
        return undefined
      }
      return value.toISOString()
    }

    // 文字列の場合
    if (typeof value === 'string' && value.trim()) {
      try {
        const date = new Date(value)
        // 無効な日付でないかチェック
        if (Number.isNaN(date.getTime())) {
          console.warn('無効な日付文字列:', value)
          return undefined
        }
        return date.toISOString()
      } catch (error) {
        console.warn('日付変換エラー:', value, error)
        return undefined
      }
    }

    // その他の場合は警告を出してundefinedを返す
    console.warn('予期しない日付値の型:', typeof value, value)
    return undefined
  }

  /**
   * フィールド変更時のハンドラー
   * リアルタイムでタスクを更新します
   */
  const handleFieldChange = async (
    field: string,
    value: boolean | Date | null | string | undefined
  ) => {
    form.setFieldValue(field, value)

    // 現在のフォーム値を取得して更新
    const currentValues = form.values

    // APIに送信するためのデータを正しい形式に変換
    const updateData = {
      categoryId:
        field === 'categoryId'
          ? value === '' || value === null || value === undefined
            ? undefined
            : (value as string)
          : currentValues.categoryId === '' || currentValues.categoryId === null
            ? undefined
            : currentValues.categoryId,
      description:
        field === 'description'
          ? (value as string | undefined)
          : currentValues.description,
      dueDate:
        field === 'dueDate'
          ? toISOStringSafe(value)
          : toISOStringSafe(currentValues.dueDate),
      isImportant:
        field === 'isImportant'
          ? (value as boolean)
          : currentValues.isImportant,
      kanbanColumnId:
        field === 'kanbanColumnId'
          ? value === '' || value === null || value === undefined
            ? undefined
            : (value as string)
          : currentValues.kanbanColumnId === '' ||
              currentValues.kanbanColumnId === null
            ? undefined
            : currentValues.kanbanColumnId,
      title: field === 'title' ? (value as string) : currentValues.title,
    }

    try {
      await updateTodo(todo.id, updateData)
    } catch (error) {
      console.error('タスク更新エラー:', error)
      // フィールドの値を元に戻す（型安全）
      switch (field) {
        case 'categoryId': {
          form.setFieldValue(field, todo.categoryId ?? '')
          break
        }
        case 'description': {
          form.setFieldValue(field, todo.description ?? '')
          break
        }
        case 'dueDate': {
          form.setFieldValue(
            field,
            todo.dueDate ? new Date(todo.dueDate) : undefined
          )
          break
        }
        case 'isImportant': {
          form.setFieldValue(field, todo.isImportant)
          break
        }
        case 'kanbanColumnId': {
          form.setFieldValue(field, todo.kanbanColumnId ?? '')
          break
        }
        case 'title': {
          form.setFieldValue(field, todo.title)
          break
        }
        default: {
          console.warn('未知のフィールド:', field)
        }
      }
    }
  }

  const handleCategoryCreated = async (newCategory: Category) => {
    // 1. categories 配列に新しいカテゴリを直接追加
    setCategories((prev) => [...prev, newCategory])

    // 2. フォームに選択値を設定
    form.setFieldValue('categoryId', newCategory.id)

    // 3. 実際のTODO更新も実行
    void handleFieldChange('categoryId', newCategory.id)

    // 4. Select を強制再レンダリング
    setSelectKey((prev) => prev + 1)
  }

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories]
  )

  const kanbanColumnOptions = useMemo(
    () =>
      kanbanColumns.map((column) => ({
        label: column.name,
        value: column.id,
      })),
    [kanbanColumns]
  )

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

      <DatePickerWithQuickSelect
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

      <Group align="end" gap="xs">
        <Select
          clearable
          data={categoryOptions}
          key={`categories-${selectKey}-${categories.length}-${form.values.categoryId}`}
          label="カテゴリ"
          onChange={(value) =>
            handleFieldChange('categoryId', value ?? undefined)
          }
          placeholder="カテゴリを選択..."
          style={{ flex: 1 }}
          value={form.values.categoryId}
        />
        <ActionIcon
          aria-label="新しいカテゴリを作成"
          onClick={() => setIsCategoryModalOpen(true)}
          size="lg"
          variant="light"
        >
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      <Select
        clearable
        data={kanbanColumnOptions}
        label="Kanbanカラム"
        onChange={(value) =>
          handleFieldChange('kanbanColumnId', value ?? undefined)
        }
        placeholder="カラムを選択..."
        value={form.values.kanbanColumnId}
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

      <CategoryCreateModal
        onCategoryCreated={handleCategoryCreated}
        onClose={() => setIsCategoryModalOpen(false)}
        opened={isCategoryModalOpen}
      />
    </Stack>
  )
}
