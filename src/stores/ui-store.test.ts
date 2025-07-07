/**
 * UIストアのテスト
 * @fileoverview ZustandUIストアのユニットテスト
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useUIStore } from './ui-store'

describe('useUIStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const { result } = renderHook(() => useUIStore())
    act(() => {
      result.current.resetStore()
    })
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore())

      // サイドバー状態
      expect(result.current.isSidebarOpen).toBe(true)

      // モーダル状態
      expect(result.current.modals).toEqual({
        createTask: false,
        deleteTask: false,
        editTask: false,
        settings: false,
        userProfile: false,
      })

      // 通知状態
      expect(result.current.notifications).toEqual([])

      // テーマ設定
      expect(result.current.theme).toBe('light')

      // ビューモード
      expect(result.current.viewMode).toBe('list')

      // フィルターパネル
      expect(result.current.isFilterPanelOpen).toBe(false)

      // タスク詳細パネル
      expect(result.current.isTaskDetailPanelOpen).toBe(false)

      // レスポンシブ状態
      expect(result.current.screenSize).toBe('desktop')

      // ローディング状態
      expect(result.current.isGlobalLoading).toBe(false)
      expect(result.current.loadingOperations).toEqual({})
    })
  })

  describe('サイドバー管理', () => {
    it('should toggle sidebar correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 初期状態：開いている
      expect(result.current.isSidebarOpen).toBe(true)

      // トグル：閉じる
      act(() => {
        result.current.toggleSidebar()
      })
      expect(result.current.isSidebarOpen).toBe(false)

      // トグル：開く
      act(() => {
        result.current.toggleSidebar()
      })
      expect(result.current.isSidebarOpen).toBe(true)
    })

    it('should set sidebar state directly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSidebarOpen(false)
      })
      expect(result.current.isSidebarOpen).toBe(false)

      act(() => {
        result.current.setSidebarOpen(true)
      })
      expect(result.current.isSidebarOpen).toBe(true)
    })
  })

  describe('モーダル管理', () => {
    it('should open modal correctly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.openModal('createTask')
      })

      expect(result.current.modals.createTask).toBe(true)
      expect(result.current.modals.editTask).toBe(false)
    })

    it('should close modal correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 最初にモーダルを開く
      act(() => {
        result.current.openModal('createTask')
      })
      expect(result.current.modals.createTask).toBe(true)

      // モーダルを閉じる
      act(() => {
        result.current.closeModal('createTask')
      })
      expect(result.current.modals.createTask).toBe(false)
    })

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIStore())

      // 複数のモーダルを開く
      act(() => {
        result.current.openModal('createTask')
        result.current.openModal('userProfile')
        result.current.openModal('settings')
      })

      expect(result.current.modals.createTask).toBe(true)
      expect(result.current.modals.userProfile).toBe(true)
      expect(result.current.modals.settings).toBe(true)

      // 全てのモーダルを閉じる
      act(() => {
        result.current.closeAllModals()
      })

      expect(result.current.modals.createTask).toBe(false)
      expect(result.current.modals.userProfile).toBe(false)
      expect(result.current.modals.settings).toBe(false)
      expect(result.current.modals.editTask).toBe(false)
      expect(result.current.modals.deleteTask).toBe(false)
    })

    it('should check if any modal is open', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isAnyModalOpen()).toBe(false)

      act(() => {
        result.current.openModal('createTask')
      })

      expect(result.current.isAnyModalOpen()).toBe(true)

      act(() => {
        result.current.closeModal('createTask')
      })

      expect(result.current.isAnyModalOpen()).toBe(false)
    })
  })

  describe('通知管理', () => {
    it('should add notification correctly', () => {
      const { result } = renderHook(() => useUIStore())

      const notification = {
        duration: 5000,
        id: 'test-notification-1',
        message: 'Operation completed successfully',
        title: 'Success',
        type: 'success' as const,
      }

      act(() => {
        result.current.addNotification(notification)
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toEqual(notification)
    })

    it('should remove notification correctly', () => {
      const { result } = renderHook(() => useUIStore())

      const notification = {
        duration: 5000,
        id: 'test-notification-1',
        message: 'Operation completed successfully',
        title: 'Success',
        type: 'success' as const,
      }

      // 通知を追加
      act(() => {
        result.current.addNotification(notification)
      })
      expect(result.current.notifications).toHaveLength(1)

      // 通知を削除
      act(() => {
        result.current.removeNotification('test-notification-1')
      })
      expect(result.current.notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useUIStore())

      const notifications = [
        {
          duration: 5000,
          id: 'notification-1',
          message: 'Message 1',
          title: 'Success 1',
          type: 'success' as const,
        },
        {
          duration: 5000,
          id: 'notification-2',
          message: 'Message 2',
          title: 'Error',
          type: 'error' as const,
        },
      ]

      // 複数の通知を追加
      act(() => {
        for (const notification of notifications) {
          result.current.addNotification(notification)
        }
      })
      expect(result.current.notifications).toHaveLength(2)

      // 全ての通知をクリア
      act(() => {
        result.current.clearNotifications()
      })
      expect(result.current.notifications).toHaveLength(0)
    })

    it('should add success notification with helper', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.showSuccessNotification(
          'Success!',
          'Task created successfully'
        )
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('success')
      expect(result.current.notifications[0].title).toBe('Success!')
      expect(result.current.notifications[0].message).toBe(
        'Task created successfully'
      )
    })

    it('should add error notification with helper', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.showErrorNotification('Error!', 'Failed to create task')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('error')
      expect(result.current.notifications[0].title).toBe('Error!')
      expect(result.current.notifications[0].message).toBe(
        'Failed to create task'
      )
    })

    it('should add info notification with helper', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.showInfoNotification('Info', 'This is information')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('info')
      expect(result.current.notifications[0].title).toBe('Info')
      expect(result.current.notifications[0].message).toBe(
        'This is information'
      )
    })

    it('should add warning notification with helper', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.showWarningNotification('Warning', 'This is a warning')
      })

      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('warning')
      expect(result.current.notifications[0].title).toBe('Warning')
      expect(result.current.notifications[0].message).toBe('This is a warning')
    })
  })

  describe('テーマ管理', () => {
    it('should set theme correctly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')
    })

    it('should toggle theme correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 初期状態：light
      expect(result.current.theme).toBe('light')

      // トグル：dark
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')

      // トグル：light
      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })

    it('should check if dark theme', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isDarkTheme()).toBe(false)

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.isDarkTheme()).toBe(true)
    })
  })

  describe('ビューモード管理', () => {
    it('should set view mode correctly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setViewMode('card')
      })
      expect(result.current.viewMode).toBe('card')

      act(() => {
        result.current.setViewMode('calendar')
      })
      expect(result.current.viewMode).toBe('calendar')

      act(() => {
        result.current.setViewMode('list')
      })
      expect(result.current.viewMode).toBe('list')
    })
  })

  describe('フィルターパネル管理', () => {
    it('should toggle filter panel correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 初期状態：閉じている
      expect(result.current.isFilterPanelOpen).toBe(false)

      // トグル：開く
      act(() => {
        result.current.toggleFilterPanel()
      })
      expect(result.current.isFilterPanelOpen).toBe(true)

      // トグル：閉じる
      act(() => {
        result.current.toggleFilterPanel()
      })
      expect(result.current.isFilterPanelOpen).toBe(false)
    })

    it('should set filter panel state directly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setFilterPanelOpen(true)
      })
      expect(result.current.isFilterPanelOpen).toBe(true)

      act(() => {
        result.current.setFilterPanelOpen(false)
      })
      expect(result.current.isFilterPanelOpen).toBe(false)
    })
  })

  describe('ローディング管理', () => {
    it('should set global loading correctly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setGlobalLoading(true)
      })
      expect(result.current.isGlobalLoading).toBe(true)

      act(() => {
        result.current.setGlobalLoading(false)
      })
      expect(result.current.isGlobalLoading).toBe(false)
    })

    it('should set operation loading correctly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setOperationLoading('createTask', true)
      })
      expect(result.current.loadingOperations.createTask).toBe(true)

      act(() => {
        result.current.setOperationLoading('updateTask', true)
      })
      expect(result.current.loadingOperations.updateTask).toBe(true)
      expect(result.current.loadingOperations.createTask).toBe(true)

      act(() => {
        result.current.setOperationLoading('createTask', false)
      })
      expect(result.current.loadingOperations.createTask).toBe(false)
      expect(result.current.loadingOperations.updateTask).toBe(true)
    })

    it('should check if operation is loading', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isOperationLoading('createTask')).toBe(false)

      act(() => {
        result.current.setOperationLoading('createTask', true)
      })

      expect(result.current.isOperationLoading('createTask')).toBe(true)
      expect(result.current.isOperationLoading('updateTask')).toBe(false)
    })

    it('should clear all operation loading states', () => {
      const { result } = renderHook(() => useUIStore())

      // 複数の操作をローディング状態にする
      act(() => {
        result.current.setOperationLoading('createTask', true)
        result.current.setOperationLoading('updateTask', true)
        result.current.setOperationLoading('deleteTask', true)
      })

      expect(result.current.loadingOperations.createTask).toBe(true)
      expect(result.current.loadingOperations.updateTask).toBe(true)
      expect(result.current.loadingOperations.deleteTask).toBe(true)

      // 全てのローディング状態をクリア
      act(() => {
        result.current.clearAllOperationLoading()
      })

      expect(result.current.loadingOperations).toEqual({})
    })
  })

  describe('タスク詳細パネル管理', () => {
    it('should toggle task detail panel correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 初期状態：閉じている
      expect(result.current.isTaskDetailPanelOpen).toBe(false)

      // トグル：開く
      act(() => {
        result.current.toggleTaskDetailPanel()
      })
      expect(result.current.isTaskDetailPanelOpen).toBe(true)

      // トグル：閉じる
      act(() => {
        result.current.toggleTaskDetailPanel()
      })
      expect(result.current.isTaskDetailPanelOpen).toBe(false)
    })

    it('should set task detail panel state directly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTaskDetailPanelOpen(true)
      })
      expect(result.current.isTaskDetailPanelOpen).toBe(true)

      act(() => {
        result.current.setTaskDetailPanelOpen(false)
      })
      expect(result.current.isTaskDetailPanelOpen).toBe(false)
    })
  })

  describe('レスポンシブ状態管理', () => {
    it('should set screen size correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // 初期状態：desktop
      expect(result.current.screenSize).toBe('desktop')

      act(() => {
        result.current.setScreenSize('tablet')
      })
      expect(result.current.screenSize).toBe('tablet')

      act(() => {
        result.current.setScreenSize('mobile')
      })
      expect(result.current.screenSize).toBe('mobile')
    })

    it('should check if mobile screen correctly', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isMobileScreen()).toBe(false)

      act(() => {
        result.current.setScreenSize('mobile')
      })
      expect(result.current.isMobileScreen()).toBe(true)

      act(() => {
        result.current.setScreenSize('tablet')
      })
      expect(result.current.isMobileScreen()).toBe(false)
    })

    it('should check if tablet screen correctly', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isTabletScreen()).toBe(false)

      act(() => {
        result.current.setScreenSize('tablet')
      })
      expect(result.current.isTabletScreen()).toBe(true)

      act(() => {
        result.current.setScreenSize('desktop')
      })
      expect(result.current.isTabletScreen()).toBe(false)
    })

    it('should check if desktop screen correctly', () => {
      const { result } = renderHook(() => useUIStore())

      expect(result.current.isDesktopScreen()).toBe(true)

      act(() => {
        result.current.setScreenSize('mobile')
      })
      expect(result.current.isDesktopScreen()).toBe(false)

      act(() => {
        result.current.setScreenSize('desktop')
      })
      expect(result.current.isDesktopScreen()).toBe(true)
    })
  })

  describe('3カラムレイアウト統合テスト', () => {
    it('should handle responsive layout state changes correctly', () => {
      const { result } = renderHook(() => useUIStore())

      // デスクトップ：3カラム表示
      expect(result.current.screenSize).toBe('desktop')
      expect(result.current.isSidebarOpen).toBe(true)
      expect(result.current.isTaskDetailPanelOpen).toBe(false)

      // タスク詳細パネルを開く
      act(() => {
        result.current.setTaskDetailPanelOpen(true)
      })
      expect(result.current.isTaskDetailPanelOpen).toBe(true)

      // タブレット：2カラム表示（詳細パネルは自動で閉じる）
      act(() => {
        result.current.setScreenSize('tablet')
      })
      expect(result.current.isTabletScreen()).toBe(true)
      // タブレットでは詳細パネルは表示されない（モーダルになる）

      // モバイル：1カラム表示（サイドバーも自動で閉じる）
      act(() => {
        result.current.setScreenSize('mobile')
      })
      expect(result.current.isMobileScreen()).toBe(true)
      // モバイルでは必要に応じてサイドバーが閉じられる
    })
  })

  describe('ストアリセット', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useUIStore())

      // ストアの状態を変更
      act(() => {
        result.current.setSidebarOpen(false)
        result.current.openModal('createTask')
        result.current.setTheme('dark')
        result.current.setViewMode('card')
        result.current.setFilterPanelOpen(true)
        result.current.setGlobalLoading(true)
        result.current.setOperationLoading('createTask', true)
        result.current.setTaskDetailPanelOpen(true)
        result.current.setScreenSize('mobile')
        result.current.addNotification({
          duration: 5000,
          id: 'test',
          message: 'Test message',
          title: 'Test',
          type: 'success',
        })
      })

      // リセット実行
      act(() => {
        result.current.resetStore()
      })

      // 初期状態に戻っていることを確認
      expect(result.current.isSidebarOpen).toBe(true)
      expect(result.current.modals.createTask).toBe(false)
      expect(result.current.notifications).toEqual([])
      expect(result.current.theme).toBe('light')
      expect(result.current.viewMode).toBe('list')
      expect(result.current.isFilterPanelOpen).toBe(false)
      expect(result.current.isGlobalLoading).toBe(false)
      expect(result.current.loadingOperations).toEqual({})
      expect(result.current.isTaskDetailPanelOpen).toBe(false)
      expect(result.current.screenSize).toBe('desktop')
    })
  })
})
