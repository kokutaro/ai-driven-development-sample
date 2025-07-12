'use client'

import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'

interface LogoutConfirmationModalProps {
  onClose: () => void
  onConfirm: () => void
  opened: boolean
}

/**
 * ログアウト確認モーダルコンポーネント
 *
 * ユーザーがログアウトを選択した際に表示される確認ダイアログです。
 * - ログアウトの確認メッセージを表示
 * - ログアウト/キャンセルボタンを提供
 * - ESCキーやXボタンでモーダルを閉じる機能
 */
export function LogoutConfirmationModal({
  onClose,
  onConfirm,
  opened,
}: LogoutConfirmationModalProps) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened={opened}
      size="sm"
      title="ログアウト確認"
    >
      <Stack gap="md">
        <Text fw={500} size="lg">
          ログアウトしますか？
        </Text>
        <Text c="dimmed" size="sm">
          ログアウトすると、再度ログインが必要になります。
        </Text>
        <Group gap="sm" justify="flex-end">
          <Button onClick={onClose} variant="subtle">
            キャンセル
          </Button>
          <Button
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={onConfirm}
          >
            ログアウト
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
