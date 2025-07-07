import type { ReactNode } from 'react'

import { AppShell } from '@mantine/core'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * メインレイアウトコンポーネント
 *
 * アプリケーション全体のレイアウト構造を定義します。
 * 3カラムレイアウト（サイドバー、メインコンテンツ、詳細パネル）を実装します。
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ breakpoint: 'sm', collapsed: { mobile: true }, width: 280 }}
      padding="md"
    >
      <AppShell.Header role="banner">
        <div>To Do</div>
      </AppShell.Header>
      <AppShell.Navbar p="md" role="navigation">
        <div>サイドバー</div>
      </AppShell.Navbar>
      <AppShell.Main role="main">{children}</AppShell.Main>
    </AppShell>
  )
}
