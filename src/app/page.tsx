'use client'

import { AppShell } from '@mantine/core'

import { Header } from '@/components/layout/header'
import { TodoDetailPanel } from '@/components/todo/todo-detail-panel'
import { TodoMainContent } from '@/components/todo/todo-main-content'
import { TodoSidebar } from '@/components/todo/todo-sidebar'
import { useUiStore } from '@/stores/ui-store'

/**
 * TODOアプリケーションのメインページ
 *
 * 3カラムレイアウトを実装します：
 * - 左カラム：フィルタ機能（TodoSidebar）
 * - 中央カラム：タスク一覧（TodoMainContent）
 * - 右カラム：選択したタスクの詳細編集（TodoDetailPanel）
 */
export default function TodoPage() {
  const { selectedTodo } = useUiStore()

  return (
    <AppShell
      aside={{
        breakpoint: 'md',
        collapsed: { desktop: !selectedTodo, mobile: true },
        width: { md: 400, sm: 300 },
      }}
      header={{ height: 60 }}
      navbar={{ breakpoint: 'sm', collapsed: { mobile: true }, width: 280 }}
      padding="md"
    >
      {/* ヘッダー */}
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      {/* 左サイドバー - フィルタ */}
      <AppShell.Navbar p="md">
        <TodoSidebar />
      </AppShell.Navbar>

      {/* メインコンテンツ - タスク一覧 */}
      <AppShell.Main>
        <TodoMainContent />
      </AppShell.Main>

      {/* 右サイドバー - タスク詳細 */}
      <AppShell.Aside>
        {selectedTodo && <TodoDetailPanel todo={selectedTodo} />}
      </AppShell.Aside>
    </AppShell>
  )
}
