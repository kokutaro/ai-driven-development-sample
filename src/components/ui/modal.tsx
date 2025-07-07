/**
 * Modalコンポーネント
 * @fileoverview Mantine Modalをベースとした基本的なModalコンポーネント
 */
import React from 'react'

import { Modal as MantineModal } from '@mantine/core'

import type { ModalProps as MantineModalProps } from '@mantine/core'

/**
 * Modalコンポーネントのプロパティの型定義
 */
export interface ModalProps
  extends Omit<MantineModalProps, 'onClose' | 'opened'> {
  /**
   * 子要素
   */
  children: React.ReactNode

  /**
   * カスタムクラス名
   */
  className?: string

  /**
   * ESCキーで閉じるか
   */
  closeOnEscape?: boolean

  /**
   * オーバーレイクリックで閉じるか
   */
  closeOnOverlayClick?: boolean

  /**
   * フッター要素
   */
  footer?: React.ReactNode

  /**
   * モーダルが開いているかどうか
   */
  isOpen: boolean

  /**
   * モーダルを閉じるコールバック
   */
  onClose: () => void

  /**
   * 閉じるボタンを表示するか
   */
  showCloseButton?: boolean

  /**
   * モーダルのサイズ
   */
  size?: 'lg' | 'md' | 'sm' | 'xl'

  /**
   * モーダルのタイトル
   */
  title?: string

  /**
   * ポータルを使用するか（Mantineでは常にポータルを使用）
   */
  usePortal?: boolean
}

/**
 * Modalコンポーネント
 * @param props - Modalコンポーネントのプロパティ
 * @returns Modalコンポーネント
 */
export function Modal({
  children,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  footer,
  isOpen,
  onClose,
  showCloseButton = true,
  size = 'md',
  title,
  usePortal: _usePortal = true,
  ...props
}: ModalProps) {
  // footerをMantine Modalのスタイルでレンダリング
  const modalFooter = footer ? (
    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>{footer}</div>
  ) : undefined

  return (
    <MantineModal
      centered
      className={className}
      closeOnClickOutside={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      onClose={onClose}
      opened={isOpen}
      size={size}
      title={title}
      withCloseButton={showCloseButton}
      {...props}
    >
      {children}
      {modalFooter}
    </MantineModal>
  )
}

Modal.displayName = 'Modal'
