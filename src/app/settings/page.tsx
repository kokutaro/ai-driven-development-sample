'use client'

import { useEffect, useState } from 'react'

import { Card, Skeleton, Stack, Text, TextInput, Title } from '@mantine/core'

import { useUserStore } from '@/stores/user-store'

/**
 * プロフィール設定ページ
 *
 * ユーザーのプロフィール情報を表示・編集できるページです。
 */
export default function ProfileSettingsPage() {
  const { user } = useUserStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setIsLoading(false)
    }
  }, [user])

  if (isLoading || !user) {
    return (
      <Stack gap="lg">
        <div>
          <Title order={2} size="h3">
            プロフィール
          </Title>
          <Text c="dimmed" size="sm">
            あなたのアカウント情報を管理します。
          </Text>
        </div>

        <Card padding="lg" withBorder>
          <Stack gap="md">
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={40} />
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} size="h3">
          プロフィール
        </Title>
        <Text c="dimmed" size="sm">
          あなたのアカウント情報を管理します。
        </Text>
      </div>

      <Card padding="lg" withBorder>
        <Stack gap="md">
          <TextInput
            description="OAuth認証により設定された名前です。"
            label="名前"
            readOnly
            value={user.name}
          />

          <TextInput
            description="OAuth認証により設定されたメールアドレスです。"
            label="メールアドレス"
            readOnly
            value={user.email}
          />

          <Text c="dimmed" size="xs">
            プロフィール情報は、使用している OAuth
            プロバイダー（Google、Microsoft、GitHub）で管理されています。
            変更するには、それぞれのサービスで設定を変更してください。
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
