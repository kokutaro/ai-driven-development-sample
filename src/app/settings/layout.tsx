'use client'

import type { ReactNode } from 'react'

import { AppShell, Container, Divider, Stack, Title } from '@mantine/core'

import { SettingsSidebar } from '@/components/settings/settings-sidebar'

interface SettingsLayoutProps {
  children: ReactNode
}

/**
 * 設定ページレイアウト
 *
 * 2カラムレイアウトで設定ページを構成します。
 * - 左側：設定項目のサイドバー
 * - 右側：選択された設定の内容
 */
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <Container py="xl" size="xl">
      <Stack gap="lg">
        <div>
          <Title order={1} size="h2">
            設定
          </Title>
          <Divider mt="md" />
        </div>

        <AppShell
          navbar={{
            breakpoint: 'md',
            collapsed: { mobile: true },
            width: 280,
          }}
          padding={0}
          style={{
            background: 'transparent',
          }}
        >
          <AppShell.Navbar p="md" withBorder={false}>
            <SettingsSidebar />
          </AppShell.Navbar>

          <AppShell.Main>
            <Container p="md" size="md">
              {children}
            </Container>
          </AppShell.Main>
        </AppShell>
      </Stack>
    </Container>
  )
}
