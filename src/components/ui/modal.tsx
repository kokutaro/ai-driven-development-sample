/**
 * Modalコンポーネント
 * @fileoverview 基本的なModalコンポーネント
 */
import React, { useEffect, useRef } from 'react'

import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

/**
 * Modalコンポーネントのプロパティの型定義
 */
export interface ModalProps {
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
   * ポータルを使用するか
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
  usePortal = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useRef(
    `modal-title-${Math.random().toString(36).slice(2, 11)}`
  )

  /**
   * サイズに応じたクラス名を取得
   * @param size - モーダルのサイズ
   * @returns サイズクラス名
   */
  function getSizeClass(size: ModalProps['size']) {
    switch (size) {
      case 'lg': {
        return 'modal-lg'
      }
      case 'md': {
        return 'modal-md'
      }
      case 'sm': {
        return 'modal-sm'
      }
      case 'xl': {
        return 'modal-xl'
      }
      default: {
        return 'modal-md'
      }
    }
  }

  /**
   * オーバーレイクリックハンドラー
   * @param event - クリックイベント
   */
  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  // キーボードイベントリスナーとフォーカス管理
  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement

    /**
     * フォーカス可能な要素を取得
     * @param container - コンテナ要素
     * @returns フォーカス可能な要素の配列
     */
    function getFocusableElements(container: HTMLElement): HTMLElement[] {
      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ]

      return [
        ...container.querySelectorAll(selectors.join(',')),
      ] as HTMLElement[]
    }

    /**
     * フォーカストラップハンドラー
     * @param event - キーボードイベント
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (!modalRef.current) return

      if (event.key === 'Escape' && closeOnEscape) {
        onClose()
        return
      }

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(modalRef.current)

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements.at(-1)

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    // フォーカスを最初の要素に移動
    if (modalRef.current) {
      const focusableElements = getFocusableElements(modalRef.current)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else {
        modalRef.current.focus()
      }
    }

    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown)

    // body のスクロールを無効化
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''

      // 前のアクティブ要素にフォーカスを戻す
      previousActiveElement?.focus?.()
    }
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return

  const modalContent = (
    <div
      className="modal-overlay"
      data-testid="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        aria-labelledby={title ? titleId.current : undefined}
        aria-modal="true"
        className={cn('modal', getSizeClass(size), className)}
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-content">
          {(title ?? showCloseButton) && (
            <div className="modal-header">
              {title && (
                <h2 className="modal-title" id={titleId.current}>
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  aria-label="Close modal"
                  className="modal-close-button"
                  onClick={onClose}
                  type="button"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          <div className="modal-body">{children}</div>

          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  )

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

/**
 * 閉じるボタンアイコンコンポーネント
 */
function CloseIcon() {
  return (
    <svg
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6 6L18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

Modal.displayName = 'Modal'
