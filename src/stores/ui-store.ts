/**
 * UIストア
 * @fileoverview Zustandを使用したUI状態管理
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * モーダルの種類
 */
export type ModalType =
  | 'createTask'
  | 'deleteTask'
  | 'editTask'
  | 'settings'
  | 'userProfile'

/**
 * 通知の型定義
 */
export interface Notification {
  /**
   * 表示期間（ミリ秒）
   */
  duration: number

  /**
   * 通知ID
   */
  id: string

  /**
   * 通知メッセージ
   */
  message: string

  /**
   * 通知タイトル
   */
  title: string

  /**
   * 通知の種類
   */
  type: NotificationType
}

/**
 * 通知の種類
 */
export type NotificationType = 'error' | 'info' | 'success' | 'warning'

/**
 * テーマの種類
 */
export type Theme = 'dark' | 'light'

/**
 * ビューモードの種類
 */
export type ViewMode = 'calendar' | 'card' | 'list'

/**
 * ローディング操作の型定義
 */
type LoadingOperations = Record<string, boolean>

/**
 * モーダル状態の型定義
 */
type ModalStates = Record<ModalType, boolean>

/**
 * UIストアの型定義
 */
type UIStore = UIStoreActions & UIStoreComputed & UIStoreState

/**
 * UIストアのアクションの型定義
 */
interface UIStoreActions {
  /**
   * 通知を追加
   * @param notification 通知情報
   */
  addNotification: (notification: Notification) => void

  /**
   * 全ての操作のローディング状態をクリア
   */
  clearAllOperationLoading: () => void

  /**
   * 全ての通知をクリア
   */
  clearNotifications: () => void

  /**
   * 全てのモーダルを閉じる
   */
  closeAllModals: () => void

  /**
   * モーダルを閉じる
   * @param modalType モーダルの種類
   */
  closeModal: (modalType: ModalType) => void

  /**
   * モーダルを開く
   * @param modalType モーダルの種類
   */
  openModal: (modalType: ModalType) => void

  /**
   * 通知を削除
   * @param notificationId 通知ID
   */
  removeNotification: (notificationId: string) => void

  /**
   * ストアを初期状態にリセット
   */
  resetStore: () => void

  /**
   * フィルターパネルの開閉状態を設定
   * @param isOpen 開閉状態
   */
  setFilterPanelOpen: (isOpen: boolean) => void

  /**
   * グローバルローディング状態を設定
   * @param isLoading ローディング状態
   */
  setGlobalLoading: (isLoading: boolean) => void

  /**
   * 操作のローディング状態を設定
   * @param operation 操作名
   * @param isLoading ローディング状態
   */
  setOperationLoading: (operation: string, isLoading: boolean) => void

  /**
   * サイドバーの開閉状態を設定
   * @param isOpen 開閉状態
   */
  setSidebarOpen: (isOpen: boolean) => void

  /**
   * テーマを設定
   * @param theme テーマ
   */
  setTheme: (theme: Theme) => void

  /**
   * ビューモードを設定
   * @param viewMode ビューモード
   */
  setViewMode: (viewMode: ViewMode) => void

  /**
   * エラー通知を表示
   * @param title タイトル
   * @param message メッセージ
   * @param duration 表示期間（デフォルト: 8000ms）
   */
  showErrorNotification: (
    title: string,
    message: string,
    duration?: number
  ) => void

  /**
   * 情報通知を表示
   * @param title タイトル
   * @param message メッセージ
   * @param duration 表示期間（デフォルト: 5000ms）
   */
  showInfoNotification: (
    title: string,
    message: string,
    duration?: number
  ) => void

  /**
   * 成功通知を表示
   * @param title タイトル
   * @param message メッセージ
   * @param duration 表示期間（デフォルト: 5000ms）
   */
  showSuccessNotification: (
    title: string,
    message: string,
    duration?: number
  ) => void

  /**
   * 警告通知を表示
   * @param title タイトル
   * @param message メッセージ
   * @param duration 表示期間（デフォルト: 6000ms）
   */
  showWarningNotification: (
    title: string,
    message: string,
    duration?: number
  ) => void

  /**
   * フィルターパネルの開閉を切り替え
   */
  toggleFilterPanel: () => void

  /**
   * サイドバーの開閉を切り替え
   */
  toggleSidebar: () => void

  /**
   * テーマを切り替え
   */
  toggleTheme: () => void
}

/**
 * 計算されたプロパティの型定義
 */
interface UIStoreComputed {
  /**
   * いずれかのモーダルが開いているかどうかを確認
   * @returns モーダルが開いている場合はtrue
   */
  isAnyModalOpen: () => boolean

  /**
   * ダークテーマかどうかを確認
   * @returns ダークテーマの場合はtrue
   */
  isDarkTheme: () => boolean

  /**
   * 指定した操作がローディング中かどうかを確認
   * @param operation 操作名
   * @returns ローディング中の場合はtrue
   */
  isOperationLoading: (operation: string) => boolean
}

/**
 * UIストアの状態の型定義
 */
interface UIStoreState {
  /**
   * フィルターパネルの開閉状態
   */
  isFilterPanelOpen: boolean

  /**
   * グローバルローディング状態
   */
  isGlobalLoading: boolean

  /**
   * サイドバーの開閉状態
   */
  isSidebarOpen: boolean

  /**
   * 操作ごとのローディング状態
   */
  loadingOperations: LoadingOperations

  /**
   * モーダル状態
   */
  modals: ModalStates

  /**
   * 通知一覧
   */
  notifications: Notification[]

  /**
   * 現在のテーマ
   */
  theme: Theme

  /**
   * ビューモード
   */
  viewMode: ViewMode
}

/**
 * 初期状態
 */
const initialState: UIStoreState = {
  isFilterPanelOpen: false,
  isGlobalLoading: false,
  isSidebarOpen: true,
  loadingOperations: {},
  modals: {
    createTask: false,
    deleteTask: false,
    editTask: false,
    settings: false,
    userProfile: false,
  },
  notifications: [],
  theme: 'light',
  viewMode: 'list',
}

/**
 * ユニークIDを生成する関数
 * @returns ユニークID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * UIストア
 */
export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      // 初期状態
      ...initialState,

      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [...state.notifications, notification],
          }),
          false,
          'uiStore/addNotification'
        ),

      clearAllOperationLoading: () =>
        set(
          { loadingOperations: {} },
          false,
          'uiStore/clearAllOperationLoading'
        ),

      clearNotifications: () =>
        set({ notifications: [] }, false, 'uiStore/clearNotifications'),

      closeAllModals: () =>
        set(
          {
            modals: {
              createTask: false,
              deleteTask: false,
              editTask: false,
              settings: false,
              userProfile: false,
            },
          },
          false,
          'uiStore/closeAllModals'
        ),

      closeModal: (modalType) =>
        set(
          (state) => ({
            modals: {
              ...state.modals,
              [modalType]: false,
            },
          }),
          false,
          `uiStore/closeModal/${modalType}`
        ),

      // 計算されたプロパティ（関数版）
      isAnyModalOpen: () => {
        const { modals } = get()
        return Object.values(modals).some(Boolean)
      },

      isDarkTheme: () => {
        const { theme } = get()
        return theme === 'dark'
      },

      isOperationLoading: (operation) => {
        const { loadingOperations } = get()
        // eslint-disable-next-line security/detect-object-injection
        return loadingOperations[operation] || false
      },

      openModal: (modalType) =>
        set(
          (state) => ({
            modals: {
              ...state.modals,
              [modalType]: true,
            },
          }),
          false,
          `uiStore/openModal/${modalType}`
        ),

      removeNotification: (notificationId) =>
        set(
          (state) => ({
            notifications: state.notifications.filter(
              (notification) => notification.id !== notificationId
            ),
          }),
          false,
          'uiStore/removeNotification'
        ),

      resetStore: () => set(initialState, false, 'uiStore/resetStore'),

      setFilterPanelOpen: (isOpen) =>
        set({ isFilterPanelOpen: isOpen }, false, 'uiStore/setFilterPanelOpen'),

      setGlobalLoading: (isLoading) =>
        set({ isGlobalLoading: isLoading }, false, 'uiStore/setGlobalLoading'),

      setOperationLoading: (operation, isLoading) =>
        set(
          (state) => ({
            loadingOperations: {
              ...state.loadingOperations,
              [operation]: isLoading,
            },
          }),
          false,
          `uiStore/setOperationLoading/${operation}`
        ),

      // アクション
      setSidebarOpen: (isOpen) =>
        set({ isSidebarOpen: isOpen }, false, 'uiStore/setSidebarOpen'),

      setTheme: (theme) => set({ theme }, false, 'uiStore/setTheme'),

      setViewMode: (viewMode) =>
        set({ viewMode }, false, 'uiStore/setViewMode'),

      showErrorNotification: (title, message, duration = 8000) => {
        const notification: Notification = {
          duration,
          id: generateId(),
          message,
          title,
          type: 'error',
        }
        get().addNotification(notification)
      },

      showInfoNotification: (title, message, duration = 5000) => {
        const notification: Notification = {
          duration,
          id: generateId(),
          message,
          title,
          type: 'info',
        }
        get().addNotification(notification)
      },

      showSuccessNotification: (title, message, duration = 5000) => {
        const notification: Notification = {
          duration,
          id: generateId(),
          message,
          title,
          type: 'success',
        }
        get().addNotification(notification)
      },

      showWarningNotification: (title, message, duration = 6000) => {
        const notification: Notification = {
          duration,
          id: generateId(),
          message,
          title,
          type: 'warning',
        }
        get().addNotification(notification)
      },

      toggleFilterPanel: () =>
        set(
          (state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen }),
          false,
          'uiStore/toggleFilterPanel'
        ),

      toggleSidebar: () =>
        set(
          (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
          false,
          'uiStore/toggleSidebar'
        ),

      toggleTheme: () =>
        set(
          (state) => ({
            theme: state.theme === 'light' ? 'dark' : 'light',
          }),
          false,
          'uiStore/toggleTheme'
        ),
    }),
    {
      name: 'ui-store',
    }
  )
)
