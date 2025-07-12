'use client'

import { useState } from 'react'

import { Avatar, Menu } from '@mantine/core'
import { IconLogout, IconSettings } from '@tabler/icons-react'
import { signOut } from 'next-auth/react'

import type { User } from '@/types/todo'

import { LogoutConfirmationModal } from '@/components/auth/logout-confirmation-modal'

interface UserAvatarMenuProps {
  avatarName?: string
  avatarSrc?: string
  user: undefined | User
}

/**
 * ユーザーアバターメニューコンポーネント
 *
 * ユーザーのアバターをクリックするとドロップダウンメニューを表示します。
 * - アバター表示（画像またはイニシャル）
 * - ログアウトオプション（赤文字 + ログアウトアイコン）
 * - ログアウト確認モーダル
 * - NextAuth.js signOut 統合
 */
export function UserAvatarMenu({
  avatarName,
  avatarSrc,
  user: _user,
}: UserAvatarMenuProps) {
  const [logoutModalOpened, setLogoutModalOpened] = useState(false)

  const handleLogout = () => {
    setLogoutModalOpened(true)
  }

  const handleConfirmLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
    setLogoutModalOpened(false)
  }

  const handleCancelLogout = () => {
    setLogoutModalOpened(false)
  }

  return (
    <div data-testid="user-avatar-menu">
      <Menu position="bottom-end" withinPortal={false}>
        <Menu.Target>
          <Avatar
            name={avatarName}
            size="sm"
            src={avatarSrc}
            style={{ cursor: 'pointer' }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            component="a"
            href="/settings"
            leftSection={<IconSettings size={16} />}
          >
            設定
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            ログアウト
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <LogoutConfirmationModal
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        opened={logoutModalOpened}
      />
    </div>
  )
}
