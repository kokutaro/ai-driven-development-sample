import { useEffect } from 'react'

import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'

import type { KanbanColumn } from '@/types/todo'

import { useKanbanStore } from '@/stores/kanban-store'

const kanbanColumnSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '色はHEX形式で入力してください'),
  name: z
    .string()
    .min(1, 'カラム名は必須です')
    .max(50, 'カラム名は50文字以内で入力してください'),
})

interface KanbanColumnEditModalProps {
  column?: KanbanColumn
  onClose: () => void
  opened: boolean
}

/**
 * Kanbanカラム編集モーダルコンポーネント
 *
 * 既存のKanbanカラムを編集するためのモーダルダイアログです。
 * - カラム名の編集
 * - カラーピッカーでの色変更
 * - フォームバリデーション
 * - 更新処理とエラーハンドリング
 */
export function KanbanColumnEditModal({
  column,
  onClose,
  opened,
}: KanbanColumnEditModalProps) {
  const { updateKanbanColumn } = useKanbanStore()

  const form = useForm({
    initialValues: {
      color: column?.color ?? '#4ECDC4',
      name: column?.name ?? '',
    },
    validate: zodResolver(kanbanColumnSchema),
  })

  // カラム情報が変更されたときにフォームを更新
  useEffect(() => {
    if (column) {
      // 現在のフォーム値と比較して、実際に変更があった場合のみ更新
      const currentValues = form.values
      if (
        currentValues.color !== column.color ||
        currentValues.name !== column.name
      ) {
        form.setValues({
          color: column.color,
          name: column.name,
        })
      }
    }
    // formを依存配列に含めると無限ループが発生するため意図的に除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [column])

  const handleSubmit = async (values: typeof form.values) => {
    if (!column) return

    try {
      await updateKanbanColumn(column.id, values)
      onClose()
    } catch (error) {
      console.error('Kanbanカラム更新エラー:', error)
    }
  }

  const handleClose = () => {
    if (column) {
      form.setValues({
        color: column.color,
        name: column.name,
      })
    }
    onClose()
  }

  if (!column) return undefined

  return (
    <Modal onClose={handleClose} opened={opened} size="md" title="カラムを編集">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="カラム名"
            placeholder="例: To Do, In Progress, Done"
            required
            {...form.getInputProps('name')}
          />

          <ColorInput
            format="hex"
            label="カラムの色"
            placeholder="#000000"
            required
            swatches={[
              '#25262b',
              '#868e96',
              '#fa5252',
              '#e64980',
              '#be4bdb',
              '#7950f2',
              '#4c6ef5',
              '#228be6',
              '#15aabf',
              '#12b886',
              '#40c057',
              '#82c91e',
              '#fab005',
              '#fd7e14',
            ]}
            {...form.getInputProps('color')}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="subtle">
              キャンセル
            </Button>
            <Button type="submit">更新</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
