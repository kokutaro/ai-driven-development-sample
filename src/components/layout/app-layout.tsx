/**
 * アプリケーションレイアウトコンポーネント
 * @fileoverview Mantine AppShellベースの3カラムレイアウト
 */
'use client'

import { useEffect } from 'react'

import { AppShell } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

import { FilterSidebar } from '../features/filter-sidebar'
import { TaskDetailPanel } from '../features/task-detail-panel'
import { TaskList } from '../features/task-list'

import { MainHeader } from './main-header'

import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'

/**
 * メインアプリケーションレイアウトコンポーネント
 * @returns 3カラムレイアウトのAppShell
 */
export function AppLayout() {
  const {
    isDesktopScreen,
    isMobileScreen,
    isSidebarOpen,
    isTaskDetailPanelOpen,
    screenSize,
    setScreenSize,
  } = useUIStore()

  const { selectedTask } = useTaskStore()

  // レスポンシブ判定
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isMobile = useMediaQuery('(max-width: 767px)')

  // 画面サイズの変更を監視
  useEffect(() => {
    if (isDesktop && screenSize !== 'desktop') {
      setScreenSize('desktop')
    } else if (isTablet && screenSize !== 'tablet') {
      setScreenSize('tablet')
    } else if (isMobile && screenSize !== 'mobile') {
      setScreenSize('mobile')
    }
  }, [isDesktop, isTablet, isMobile, screenSize, setScreenSize])

  // サイドバー表示判定
  const showSidebar = isSidebarOpen

  // タスク詳細パネル表示判定
  const showTaskDetailPanel =
    isTaskDetailPanelOpen && selectedTask && isDesktopScreen() // デスクトップでのみ詳細パネルを表示

  return (
    <AppShell
      aside={{
        breakpoint: 'xl',
        collapsed: { desktop: !showTaskDetailPanel, mobile: true },
        width: 320,
      }}
      header={{ height: 60 }}
      navbar={
        isMobileScreen()
          ? undefined
          : {
              breakpoint: 'md',
              collapsed: {
                desktop: !showSidebar,
                mobile: true,
              },
              width: 280,
            }
      }
      padding="md"
    >
      {/* ヘッダー */}
      <AppShell.Header>
        <MainHeader />
      </AppShell.Header>

      {/* 左サイドバー（フィルタ） - モバイル以外でのみレンダリング */}
      {!isMobileScreen() && (
        <AppShell.Navbar>
          <FilterSidebar />
        </AppShell.Navbar>
      )}

      {/* メインコンテンツ */}
      <AppShell.Main>
        <TaskList />
      </AppShell.Main>

      {/* 右サイドバー（タスク詳細） */}
      {showTaskDetailPanel && (
        <AppShell.Aside>
          <TaskDetailPanel />
        </AppShell.Aside>
      )}
    </AppShell>
  )
}
