import { ActionIcon, Burger, Group, TextInput, Title } from '@mantine/core'
import { IconHelp, IconSearch, IconSettings } from '@tabler/icons-react'

import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'
import { useClientOnly } from '@/hooks/use-client-only'
import { generateUserInitials } from '@/lib/utils'
import { useUserStore } from '@/stores/user-store'

interface HeaderProps {
  navbarOpened?: boolean
  toggleNavbar?: () => void
}

/**
 * ヘッダーコンポーネント
 *
 * アプリケーションのヘッダー部分を表示します。
 * - ハンバーガーメニュー（モバイル用）
 * - アプリケーション名「To Do」
 * - 検索バー
 * - 設定とヘルプボタン
 * - ユーザー情報とアバター
 */
export function Header({ navbarOpened = false, toggleNavbar }: HeaderProps) {
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
        <Burger
          aria-label="ナビゲーションメニューを開く"
          hiddenFrom="sm"
          onClick={toggleNavbar}
          opened={navbarOpened}
          size="sm"
        />
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
        {isClient && (
          <UserAvatarMenu
            avatarName={avatarName}
            avatarSrc={avatarSrc}
            user={user}
          />
        )}
      </Group>
    </Group>
  )
}
