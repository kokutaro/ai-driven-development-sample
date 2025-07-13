'use client'

import { Stack, Text, Title } from '@mantine/core'

import { ApiKeyManagement } from '@/components/settings/api-key-management'

/**
 * 外部連携設定ページ
 *
 * APIキーの管理画面を提供します。
 */
export default function ExternalIntegrationPage() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2} size="h3">
          外部連携
        </Title>
        <Text c="dimmed" size="sm">
          外部アプリケーションからTODOシステムにアクセスするためのAPIキーを管理します。
        </Text>
      </div>

      <ApiKeyManagement />
    </Stack>
  )
}
