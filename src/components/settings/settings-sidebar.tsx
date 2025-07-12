'use client'

import { NavLink, Stack } from '@mantine/core'
import { IconApi, IconBell, IconSettings, IconUser } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'

/**
 * 設定サイドバーコンポーネント
 *
 * 設定画面の左側に表示するナビゲーションサイドバーです。
 * - プロフィール
 * - 外部連携（APIキー管理）
 * - 通知設定（将来拡張）
 * - アカウント（将来拡張）
 */
export function SettingsSidebar() {
  const pathname = usePathname()

  const menuItems = [
    {
      description: 'アカウント情報の確認',
      href: '/settings',
      icon: IconUser,
      label: 'プロフィール',
    },
    {
      description: 'APIキーの管理',
      href: '/settings/external-integration',
      icon: IconApi,
      label: '外部連携',
    },
    {
      description: 'リマインダーの設定',
      disabled: true,
      href: '/settings/notifications',
      icon: IconBell,
      label: '通知設定',
    },
    {
      description: 'アカウントの管理',
      disabled: true,
      href: '/settings/account',
      icon: IconSettings,
      label: 'アカウント',
    },
  ]

  return (
    <Stack gap="xs">
      {menuItems.map((item) => (
        <NavLink
          active={pathname === item.href}
          description={item.description}
          disabled={item.disabled}
          href={item.disabled ? undefined : item.href}
          key={item.href}
          label={item.label}
          leftSection={<item.icon size={18} />}
          styles={{
            root: {
              borderRadius: 8,
            },
          }}
        />
      ))}
    </Stack>
  )
}
