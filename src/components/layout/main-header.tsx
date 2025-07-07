/**
 * メインヘッダーコンポーネント
 * @fileoverview アプリケーションのメインヘッダー
 */
'use client'

import { Burger, Group, Text } from '@mantine/core'

import { useUIStore } from '@/stores/ui-store'

/**
 * メインヘッダーコンポーネント
 * @returns ヘッダーコンポーネント
 */
export function MainHeader() {
  const { isMobileScreen, isSidebarOpen, toggleSidebar } = useUIStore()

  return (
    <Group h="100%" justify="space-between" px="md">
      <Group>
        {/* モバイル用ハンバーガーメニュー */}
        {isMobileScreen() && (
          <Burger
            aria-label="メニューを開く"
            onClick={toggleSidebar}
            opened={isSidebarOpen}
            size="sm"
          />
        )}

        {/* アプリタイトル */}
        <Text fw={600} size="xl">
          To Do
        </Text>
      </Group>

      {/* 右側のアクション（今後実装） */}
      <Group>{/* 検索、設定、ユーザーアイコンなどを将来追加 */}</Group>
    </Group>
  )
}
