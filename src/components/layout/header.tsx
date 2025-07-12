import { ActionIcon, Avatar, Group, TextInput, Title } from '@mantine/core'
import { IconHelp, IconSearch, IconSettings } from '@tabler/icons-react'

import { useClientOnly } from '@/hooks/use-client-only'
import { generateUserInitials } from '@/lib/utils'
import { useUserStore } from '@/stores/user-store'

/**
 * ヘッダーコンポーネント
 *
 * アプリケーションのヘッダー部分を表示します。
 * - アプリケーション名「To Do」
 * - 検索バー
 * - 設定とヘルプボタン
 * - ユーザー情報とアバター
 */
export function Header() {
  const { user } = useUserStore()
  const isClient = useClientOnly()

  // ユーザーアバター用の設定を生成
  const avatarSrc = user?.image ?? undefined
  const avatarName = user?.name ? generateUserInitials(user.name) : undefined

  // デバッグ用（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('Header - User data:', {
      avatarName,
      avatarSrc,
      isClient,
      user,
    })
  }

  return (
    <Group h="100%" justify="space-between" px="md">
      <Group>
        <Title c="blue" order={3}>
          To Do
        </Title>
      </Group>

      <Group>
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="タスクを検索..."
          w={300}
        />
        <ActionIcon size="lg" variant="subtle">
          <IconSettings size={18} />
        </ActionIcon>
        <ActionIcon size="lg" variant="subtle">
          <IconHelp size={18} />
        </ActionIcon>
        {isClient && <Avatar name={avatarName} size="sm" src={avatarSrc} />}
      </Group>
    </Group>
  )
}
