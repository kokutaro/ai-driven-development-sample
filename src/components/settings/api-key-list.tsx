import { useState } from 'react'

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconKey, IconTrash } from '@tabler/icons-react'

import type { ApiKeyResponse } from '@/schemas/api-key'

import { useApiKeyStore } from '@/stores/api-key-store'

/**
 * 日付を日本語形式でフォーマットする
 */
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('ja-JP', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

interface ApiKeyListProps {
  apiKeys: ApiKeyResponse[]
  isLoading: boolean
}

/**
 * APIキー一覧コンポーネント
 *
 * ユーザーが作成したAPIキーの一覧を表示します。
 * - APIキー名
 * - 作成日時
 * - 最終使用日時
 * - 削除ボタン
 */
export function ApiKeyList({ apiKeys, isLoading }: ApiKeyListProps) {
  const { deleteApiKey } = useApiKeyStore()
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined)

  const handleDelete = (apiKey: ApiKeyResponse) => {
    modals.openConfirmModal({
      children: (
        <Text size="sm">
          APIキー「{apiKey.name}」を削除しますか？
          <br />
          この操作は元に戻せません。
        </Text>
      ),
      confirmProps: { color: 'red' },
      labels: { cancel: 'キャンセル', confirm: '削除' },
      onConfirm: () => {
        void (async () => {
          try {
            setDeletingId(apiKey.id)
            await deleteApiKey(apiKey.id)
          } catch {
            // エラーはストアで処理される
          } finally {
            setDeletingId(undefined)
          }
        })()
      },
      title: 'APIキーの削除',
    })
  }

  const getStatusBadge = (apiKey: ApiKeyResponse) => {
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return (
        <Badge color="red" size="sm">
          期限切れ
        </Badge>
      )
    }
    return (
      <Badge color="green" size="sm">
        有効
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Stack gap="md">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton height={80} key={index} />
        ))}
      </Stack>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <Paper p="xl" style={{ textAlign: 'center' }} withBorder>
        <IconKey size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
        <Title c="dimmed" mt="md" order={4}>
          APIキーがありません
        </Title>
        <Text c="dimmed" mt="xs" size="sm">
          新しいAPIキーを作成して外部アプリケーションから接続しましょう。
        </Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      {apiKeys.map((apiKey) => (
        <Paper key={apiKey.id} p="md" withBorder>
          <Group align="flex-start" justify="space-between">
            <Stack flex={1} gap="xs">
              <Group gap="sm">
                <IconKey size={16} />
                <Text fw={500}>{apiKey.name}</Text>
                {getStatusBadge(apiKey)}
              </Group>

              <Stack gap={4}>
                <Text c="dimmed" size="xs">
                  作成日: {formatDate(apiKey.createdAt.toString())}
                </Text>
                {apiKey.lastUsedAt && (
                  <Text c="dimmed" size="xs">
                    最終使用: {formatDate(apiKey.lastUsedAt.toString())}
                  </Text>
                )}
                {apiKey.expiresAt && (
                  <Text c="dimmed" size="xs">
                    有効期限: {formatDate(apiKey.expiresAt.toString())}
                  </Text>
                )}
              </Stack>
            </Stack>

            <Tooltip label="APIキーを削除">
              <ActionIcon
                color="red"
                loading={deletingId === apiKey.id}
                onClick={() => handleDelete(apiKey)}
                variant="subtle"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
