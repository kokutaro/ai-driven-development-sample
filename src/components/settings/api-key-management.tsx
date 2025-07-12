'use client'

import { useEffect, useState } from 'react'

import { Alert, Button, Card, Stack } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

import type { ApiKeyCreateResponse } from '@/schemas/api-key'

import { ApiKeyCreateModal } from '@/components/settings/api-key-create-modal'
import { ApiKeyDisplayModal } from '@/components/settings/api-key-display-modal'
import { ApiKeyList } from '@/components/settings/api-key-list'
import { useApiKeyStore } from '@/stores/api-key-store'

/**
 * APIキー管理コンポーネント
 *
 * APIキーの一覧表示、作成、削除の機能を提供します。
 */
export function ApiKeyManagement() {
  const { apiKeys, clearError, error, fetchApiKeys, isLoading } =
    useApiKeyStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createdApiKey, setCreatedApiKey] =
    useState<ApiKeyCreateResponse | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  const handleCreateSuccess = (result: ApiKeyCreateResponse) => {
    setCreatedApiKey(result)
    setIsCreateModalOpen(false)
  }

  const handleCloseDisplayModal = () => {
    setCreatedApiKey(null)
  }

  return (
    <Stack gap="md">
      {error && (
        <Alert color="red" onClose={clearError} title="エラー" withCloseButton>
          {error}
        </Alert>
      )}

      <Card padding="lg" withBorder>
        <Stack gap="lg">
          <div>
            <Button
              disabled={isLoading}
              leftSection={<IconPlus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              新しいAPIキーを作成
            </Button>
          </div>

          <ApiKeyList apiKeys={apiKeys} isLoading={isLoading} />
        </Stack>
      </Card>

      <ApiKeyCreateModal
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        opened={isCreateModalOpen}
      />

      <ApiKeyDisplayModal
        apiKeyData={createdApiKey}
        onClose={handleCloseDisplayModal}
        opened={!!createdApiKey}
      />
    </Stack>
  )
}
