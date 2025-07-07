/**
 * ストアのバレルエクスポート
 * @fileoverview 全てのZustandストアを一箇所からエクスポート
 */

// 認証ストア
export { useAuthStore } from './auth-store'

// タスクストア
export { useTaskStore } from './task-store'

// UIストア
export { useUIStore } from './ui-store'
export type {
  ModalType,
  Notification,
  NotificationType,
  Theme,
  ViewMode,
} from './ui-store'

/**
 * 使用例:
 *
 * // 個別インポート
 * import { useTaskStore } from '@/stores/task-store'
 *
 * // バレルインポート
 * import { useTaskStore, useAuthStore, useUIStore } from '@/stores'
 *
 * // 型のインポート
 * import type { ModalType, Theme } from '@/stores'
 */
