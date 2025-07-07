import { useState } from 'react'

import {
  ActionIcon,
  Alert,
  Button,
  ColorInput,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'

import type { Category } from '@/types/todo'

import { useCategories } from '@/hooks/use-categories'

/**
 * カテゴリリストコンポーネント
 *
 * カテゴリの一覧表示・管理を行います。
 * - カテゴリの一覧表示
 * - カテゴリの追加・編集・削除
 * - 色の管理
 * - ローディング・エラー状態の表示
 */
export function CategoryList() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const {
    categories,
    createCategory,
    deleteCategory,
    error,
    isLoading,
    updateCategory,
  } = useCategories()

  const addForm = useForm({
    initialValues: {
      color: '#45B7D1',
      name: '',
    },
    validate: {
      color: (value) =>
        /^#[0-9A-Fa-f]{6}$/.test(value)
          ? undefined
          : '正しい色形式で入力してください',
      name: (value) => (value.trim() ? undefined : 'カテゴリ名は必須です'),
    },
  })

  const editForm = useForm({
    initialValues: {
      color: '#45B7D1',
      name: '',
    },
    validate: {
      color: (value) =>
        /^#[0-9A-Fa-f]{6}$/.test(value)
          ? undefined
          : '正しい色形式で入力してください',
      name: (value) => (value.trim() ? undefined : 'カテゴリ名は必須です'),
    },
  })

  const handleAddCategory = async (values: { color: string; name: string }) => {
    if (!values.name.trim()) return

    try {
      await createCategory({ color: values.color, name: values.name.trim() })
      addForm.reset()
      setIsAdding(false)
    } catch (error) {
      console.error('カテゴリ作成エラー:', error)
    }
  }

  const handleEditCategory = async (values: {
    color: string
    name: string
  }) => {
    if (!editingId || !values.name.trim()) return

    try {
      await updateCategory(editingId, {
        color: values.color,
        name: values.name.trim(),
      })
      editForm.reset()
      setEditingId(undefined)
    } catch (error) {
      console.error('カテゴリ更新エラー:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!globalThis.confirm('このカテゴリを削除しますか？')) {
      return
    }

    try {
      await deleteCategory(categoryId)
    } catch (error) {
      console.error('カテゴリ削除エラー:', error)
    }
  }

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id)
    editForm.setValues({
      color: category.color,
      name: category.name,
    })
  }

  const handleCancelAdd = () => {
    addForm.reset()
    setIsAdding(false)
  }

  const handleCancelEdit = () => {
    editForm.reset()
    setEditingId(undefined)
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
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton height={50} key={index} />
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Text fw={600} size="lg">
        カテゴリ管理
      </Text>

      {categories.length === 0 && !isAdding && (
        <Text c="dimmed" size="sm">
          カテゴリがありません
        </Text>
      )}

      {categories.map((category) => (
        <Group align="center" justify="space-between" key={category.id}>
          {editingId === category.id ? (
            <form
              onSubmit={editForm.onSubmit(handleEditCategory)}
              style={{ flex: 1 }}
            >
              <Group align="flex-end" gap="xs">
                <TextInput
                  placeholder="カテゴリ名を入力..."
                  size="sm"
                  style={{ flex: 1 }}
                  {...editForm.getInputProps('name')}
                />
                <ColorInput
                  aria-label="色"
                  size="sm"
                  w={60}
                  {...editForm.getInputProps('color')}
                />
                <Button
                  disabled={!editForm.values.name.trim()}
                  size="xs"
                  type="submit"
                >
                  保存
                </Button>
                <Button onClick={handleCancelEdit} size="xs" variant="subtle">
                  キャンセル
                </Button>
              </Group>
            </form>
          ) : (
            <>
              <Group align="center" flex={1} gap="sm">
                <div
                  data-testid="color-box"
                  style={{
                    backgroundColor: category.color,
                    borderRadius: 4,
                    height: 20,
                    width: 20,
                  }}
                />
                <Text fw={500} size="sm">
                  {category.name}
                </Text>
              </Group>
              <Group gap="xs">
                <ActionIcon
                  onClick={() => handleStartEdit(category)}
                  size="sm"
                  variant="subtle"
                >
                  <IconEdit size={14} />
                </ActionIcon>
                <ActionIcon
                  color="red"
                  onClick={() => handleDeleteCategory(category.id)}
                  size="sm"
                  variant="subtle"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </>
          )}
        </Group>
      ))}

      {isAdding ? (
        <form onSubmit={addForm.onSubmit(handleAddCategory)}>
          <Stack gap="xs">
            <Group align="flex-end" gap="xs">
              <TextInput
                autoFocus
                placeholder="カテゴリ名を入力..."
                size="sm"
                style={{ flex: 1 }}
                {...addForm.getInputProps('name')}
              />
              <ColorInput
                aria-label="色"
                size="sm"
                w={60}
                {...addForm.getInputProps('color')}
              />
            </Group>
            <Group gap="xs">
              <Button
                disabled={!addForm.values.name.trim()}
                size="xs"
                type="submit"
              >
                保存
              </Button>
              <Button onClick={handleCancelAdd} size="xs" variant="subtle">
                キャンセル
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsAdding(true)}
          size="sm"
          variant="light"
        >
          カテゴリを追加
        </Button>
      )}
    </Stack>
  )
}
