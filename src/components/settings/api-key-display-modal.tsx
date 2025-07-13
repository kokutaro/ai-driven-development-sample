'use client'

import { useState } from 'react'

import {
  Alert,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconCopy, IconEye, IconEyeOff } from '@tabler/icons-react'

import type { ApiKeyCreateResponse } from '@/schemas/api-key'

interface ApiKeyDisplayModalProps {
  apiKeyData: ApiKeyCreateResponse | undefined
  onClose: () => void
  opened: boolean
}

/**
 * APIキー表示モーダルコンポーネント
 *
 * 作成されたAPIキーを一度だけ表示するモーダルです。
 * - APIキーの表示（マスク/表示切り替え）
 * - コピー機能
 * - 使用方法の説明
 */
export function ApiKeyDisplayModal({
  apiKeyData,
  onClose,
  opened,
}: ApiKeyDisplayModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  if (!apiKeyData) {
    return undefined
  }

  const { apiKey, plainKey } = apiKeyData

  const handleClose = () => {
    setIsVisible(false)
    onClose()
  }

  const maskedKey = plainKey.replace(/^(.{8})(.*)(.{8})$/, '$1***$3')

  return (
    <Modal
      closeOnClickOutside={false}
      onClose={handleClose}
      opened={opened}
      size="lg"
      title="APIキーが作成されました"
    >
      <Stack gap="lg">
        <Alert color="yellow" title="重要">
          このAPIキーは一度だけ表示されます。 必ず安全な場所に保存してください。
        </Alert>

        <div>
          <Title mb="xs" order={4}>
            {apiKey.name}
          </Title>
          <Text c="dimmed" size="sm">
            作成日時:{' '}
            {new Intl.DateTimeFormat('ja-JP', {
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(apiKey.createdAt))}
          </Text>
        </div>

        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500} size="sm">
                APIキー
              </Text>
              <Group gap="xs">
                <Tooltip label={isVisible ? 'キーを隠す' : 'キーを表示'}>
                  <Button
                    leftSection={
                      isVisible ? (
                        <IconEyeOff size={14} />
                      ) : (
                        <IconEye size={14} />
                      )
                    }
                    onClick={() => setIsVisible(!isVisible)}
                    size="xs"
                    variant="subtle"
                  >
                    {isVisible ? '隠す' : '表示'}
                  </Button>
                </Tooltip>
                <CopyButton value={plainKey}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'コピー済み' : 'コピー'}>
                      <Button
                        color={copied ? 'green' : 'blue'}
                        leftSection={
                          copied ? (
                            <IconCheck size={14} />
                          ) : (
                            <IconCopy size={14} />
                          )
                        }
                        onClick={copy}
                        size="xs"
                        variant="subtle"
                      >
                        コピー
                      </Button>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Group>
            <Code
              block
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px',
                wordBreak: 'break-all',
              }}
            >
              {isVisible ? plainKey : maskedKey}
            </Code>
          </Stack>
        </Paper>

        <div>
          <Title mb="xs" order={5}>
            使用方法
          </Title>
          <Text c="dimmed" mb="sm" size="sm">
            APIリクエストのクエリパラメータとして以下のように指定してください：
          </Text>
          <Code block style={{ fontSize: '12px' }}>
            {`GET /api/todos?apiKey=${isVisible ? plainKey : maskedKey}`}
          </Code>
        </div>

        <Group justify="flex-end">
          <Button onClick={handleClose}>閉じる</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
