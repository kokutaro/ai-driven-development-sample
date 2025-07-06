'use client'

import { useEffect } from 'react'

import { AppShell, Title } from '@mantine/core'

import { TodoDetailPanel } from '@/components/todo-detail-panel'
import { TodoMainContent } from '@/components/todo-main-content'
import { TodoSidebar } from '@/components/todo-sidebar'
import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * TODO アプリケーションのメインページ
 *
 * @description
 * AppShellを使用した3カラムレイアウトで構成されています：
 * - 左側: フィルタメニュー（TodoSidebar）
 * - 中央: TODO一覧とフォーム（TodoMainContent）
 * - 右側: TODO詳細パネル（TodoDetailPanel）
 */
export default function HomePage() {
  const initializeTodos = useTodoStore((state) => state.initializeTodos)
  const { isDetailPanelVisible } = useTodoUIStore()

  useEffect(() => {
    // アプリケーション起動時にデータベースからTODOを読み込む
    void initializeTodos()
  }, [initializeTodos])

  return (
    <AppShell
      aside={{
        breakpoint: 'md',
        collapsed: { desktop: !isDetailPanelVisible, mobile: true },
        width: 400,
      }}
      header={{ height: 60 }}
      navbar={{ breakpoint: 'sm', width: 280 }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Title order={1} size="h3">
          Think Harder TODO App
        </Title>
      </AppShell.Header>

      <AppShell.Navbar>
        <TodoSidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <TodoMainContent />
      </AppShell.Main>

      <AppShell.Aside>
        <TodoDetailPanel />
      </AppShell.Aside>
    </AppShell>
  )
}
