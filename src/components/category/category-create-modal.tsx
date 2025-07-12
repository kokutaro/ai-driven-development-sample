import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconPalette } from '@tabler/icons-react'

import type { Category } from '@/types/todo'

import { useCategories } from '@/hooks/use-categories'
import { categorySchema } from '@/schemas/category'

interface CategoryCreateModalProps {
  onCategoryCreated: (category: Category) => void
  onClose: () => void
  opened: boolean
}

/**
 * カテゴリ作成モーダルコンポーネント
 *
 * 新しいカテゴリを作成するためのモーダルダイアログです。
 * - カテゴリ名とカラーの入力
 * - フォームバリデーション
 * - 作成成功時にコールバック実行とモーダルを閉じる
 * - エラー処理
 */
export function CategoryCreateModal({
  onCategoryCreated,
  onClose,
  opened,
}: CategoryCreateModalProps) {
  const { createCategory } = useCategories()

  const form = useForm({
    initialValues: {
      color: '#FF6B6B',
      name: '',
    },
    validate: {
      color: (value) => {
        const validation = categorySchema.shape.color.safeParse(value)
        return validation.success
          ? undefined
          : (validation.error.errors[0]?.message ??
              'カラーの形式が正しくありません')
      },
      name: (value) => {
        const validation = categorySchema.shape.name.safeParse(value)
        return validation.success
          ? undefined
          : (validation.error.errors[0]?.message ??
              'カテゴリ名が正しくありません')
      },
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const newCategory: Category = await createCategory({
        color: values.color,
        name: values.name,
      })
      form.reset()
      onCategoryCreated(newCategory)
      onClose()
    } catch (error) {
      console.error('カテゴリ作成エラー:', error)
    }
  }

  return (
    <Modal
      closeOnClickOutside={false}
      closeOnEscape={false}
      onClose={onClose}
      opened={opened}
      size="md"
      title="新しいカテゴリを作成"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="カテゴリ名"
            placeholder="カテゴリ名を入力..."
            required
            {...form.getInputProps('name')}
          />

          <ColorInput
            label="カラー"
            leftSection={<IconPalette size={16} />}
            placeholder="カラーを選択..."
            swatches={[
              '#FF6B6B',
              '#4ECDC4',
              '#45B7D1',
              '#96CEB4',
              '#FFEAA7',
              '#DDA0DD',
              '#98D8C8',
              '#F7DC6F',
              '#BB8FCE',
              '#85C1E9',
              '#F8C471',
              '#82E0AA',
            ]}
            {...form.getInputProps('color')}
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
