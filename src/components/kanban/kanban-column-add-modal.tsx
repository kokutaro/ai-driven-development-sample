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

import { useKanbanStore } from '@/stores/kanban-store'

const kanbanColumnSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '色はHEX形式で入力してください'),
  name: z
    .string()
    .min(1, 'カラム名は必須です')
    .max(50, 'カラム名は50文字以内で入力してください'),
})

interface KanbanColumnAddModalProps {
  onClose: () => void
  opened: boolean
}

/**
 * Kanbanカラム追加モーダルコンポーネント
 *
 * 新しいKanbanカラムを作成するためのモーダルダイアログです。
 * - カラム名の入力
 * - カラーピッカーでの色選択
 * - フォームバリデーション
 * - 作成処理とエラーハンドリング
 */
export function KanbanColumnAddModal({
  onClose,
  opened,
}: KanbanColumnAddModalProps) {
  const { createKanbanColumn } = useKanbanStore()

  const form = useForm({
    initialValues: {
      color: '#4ECDC4',
      name: '',
    },
    validate: zodResolver(kanbanColumnSchema),
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await createKanbanColumn(values)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Kanbanカラム作成エラー:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      size="md"
      title="新しいカラムを追加"
    >
      <form noValidate onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="カラム名"
            placeholder="例: To Do, In Progress, Done"
            required
            withAsterisk={false}
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
            withAsterisk={false}
            {...form.getInputProps('color')}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="subtle">
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
