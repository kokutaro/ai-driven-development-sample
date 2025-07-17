'use client'

import { AppShell } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'

import { Header } from '@/components/layout/header'
import { TodoDetailDrawer } from '@/components/todo/todo-detail-drawer'
import { TodoDetailPanel } from '@/components/todo/todo-detail-panel'
import { TodoMainContentGraphQL } from '@/components/todo/todo-main-content-graphql'
import { TodoSidebarGraphQL } from '@/components/todo/todo-sidebar-graphql'
import { useUiStore } from '@/stores/ui-store'

/**
 * TODOアプリケーションのメインページ
 *
 * レスポンシブレイアウトを実装します：
 * - デスクトップ（md以上）: 3カラムレイアウト（サイドバー、メイン、詳細パネル）
 * - タブレット/モバイル（md未満）: ドロワーによる詳細表示
 * - 左カラム：フィルタ機能（TodoSidebar）
 * - 中央カラム：タスク一覧（TodoMainContent）
 * - 右カラム/ドロワー：選択したタスクの詳細編集
 */
export default function TodoPage() {
  const { isDrawerOpen, selectedTodo, setDrawerOpen, setSelectedTodo } =
    useUiStore()

  // ナビゲーションメニューの開閉状態管理
  const [navbarOpened, { close: closeNavbar, toggle: toggleNavbar }] =
    useDisclosure()

  // デスクトップサイズの判定 (992px以上をデスクトップとして扱う)
  const isDesktop = useMediaQuery('(min-width: 62em)')

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedTodo(undefined)
  }

  return (
    <>
      <AppShell
        aside={{
          breakpoint: 'md',
          collapsed: {
            desktop: !selectedTodo || !isDesktop,
            mobile: true,
          },
          width: { md: 400, sm: 300 },
        }}
        header={{ height: 60 }}
        navbar={{
          breakpoint: 'sm',
          collapsed: { mobile: !navbarOpened },
          width: 280,
        }}
        padding="md"
      >
        {/* ヘッダー */}
        <AppShell.Header>
          <Header navbarOpened={navbarOpened} toggleNavbar={toggleNavbar} />
        </AppShell.Header>

        {/* 左サイドバー - フィルタ */}
        <AppShell.Navbar p="md">
          <TodoSidebarGraphQL />
        </AppShell.Navbar>

        {/* メインコンテンツ - タスク一覧 */}
        <AppShell.Main
          onClick={!isDesktop && navbarOpened ? closeNavbar : undefined}
        >
          <TodoMainContentGraphQL />
        </AppShell.Main>

        {/* 右サイドバー - タスク詳細（デスクトップのみ） */}
        <AppShell.Aside>
          {selectedTodo && isDesktop && <TodoDetailPanel todo={selectedTodo} />}
        </AppShell.Aside>
      </AppShell>

      {/* レスポンシブドロワー - タスク詳細（タブレット/モバイル） */}
      <TodoDetailDrawer
        onClose={handleDrawerClose}
        opened={isDrawerOpen && !isDesktop}
        todo={selectedTodo}
      />
    </>
  )
}
