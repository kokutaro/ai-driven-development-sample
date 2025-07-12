'use client'

import { useState } from 'react'

import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'

import type { ApiKeyCreateInput, ApiKeyCreateResponse } from '@/schemas/api-key'

import { apiKeyCreateSchema } from '@/schemas/api-key'
import { useApiKeyStore } from '@/stores/api-key-store'

interface ApiKeyCreateModalProps {
  onClose: () => void
  onSuccess: (result: ApiKeyCreateResponse) => void
  opened: boolean
}

/**
 * APIキー作成モーダルコンポーネント
 *
 * 新しいAPIキーを作成するためのモーダルダイアログです。
 * - キー名の入力
 * - 作成ボタン
 * - バリデーション
 */
export function ApiKeyCreateModal({
  onClose,
  onSuccess,
  opened,
}: ApiKeyCreateModalProps) {
  const { createApiKey } = useApiKeyStore()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<ApiKeyCreateInput>({
    initialValues: {
      name: '',
    },
    validate: zodResolver(apiKeyCreateSchema),
  })

  const handleSubmit = async (values: ApiKeyCreateInput) => {
    try {
      setIsCreating(true)
      const result = await createApiKey(values)
      form.reset()
      onSuccess(result)
    } catch {
      // エラーはストアで処理される
    } finally {
      setIsCreating(false)
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
      title="新しいAPIキーを作成"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            外部アプリケーションからTODOシステムにアクセスするためのAPIキーを作成します。
            作成されたAPIキーは一度だけ表示されるため、必ず保存してください。
          </Text>

          <TextInput
            label="キー名"
            placeholder="例: 個人用アプリ"
            required
            {...form.getInputProps('name')}
            data-autofocus
          />

          <Group justify="flex-end" mt="md">
            <Button
              disabled={isCreating}
              onClick={handleClose}
              variant="subtle"
            >
              キャンセル
            </Button>
            <Button loading={isCreating} type="submit">
              作成
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
