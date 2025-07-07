'use client'

import {
  ActionIcon,
  AppShell,
  Avatar,
  Group,
  TextInput,
  Title,
} from '@mantine/core'
import { IconHelp, IconSearch, IconSettings } from '@tabler/icons-react'

import { TodoDetailPanel } from '@/components/todo/todo-detail-panel'
import { TodoMainContent } from '@/components/todo/todo-main-content'
import { TodoSidebar } from '@/components/todo/todo-sidebar'
import { useClientOnly } from '@/hooks/use-client-only'
import { useUiStore } from '@/stores/ui-store'
import { useUserStore } from '@/stores/user-store'

/**
 * TODOアプリケーションのメインページ
 *
 * 3カラムレイアウトを実装します：
 * - 左カラム：フィルタ機能（TodoSidebar）
 * - 中央カラム：タスク一覧（TodoMainContent）
 * - 右カラム：選択したタスクの詳細編集（TodoDetailPanel）
 */
export default function TodoPage() {
  const { user } = useUserStore()
  const { selectedTodo } = useUiStore()
  const isClient = useClientOnly()

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
            {isClient && <Avatar name={user?.name} size="sm" />}
          </Group>
        </Group>
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
