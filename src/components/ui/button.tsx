/**
 * Buttonコンポーネント
 * @fileoverview 基本的なButtonコンポーネント
 */
import React from 'react'

import { cn } from '@/lib/utils'

/**
 * Buttonコンポーネントのプロパティの型定義
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 子要素
   */
  children?: React.ReactNode

  /**
   * カスタムクラス名
   */
  className?: string

  /**
   * フルWidth
   */
  fullWidth?: boolean

  /**
   * ローディング状態
   */
  isLoading?: boolean

  /**
   * ボタンのサイズ
   */
  size?: 'lg' | 'md' | 'sm'

  /**
   * ボタンタイプ
   */
  type?: 'button' | 'reset' | 'submit'

  /**
   * ボタンのバリアント
   */
  variant?: 'danger' | 'outline' | 'primary' | 'secondary'
}

/**
 * サイズに応じたクラス名を取得
 * @param size - ボタンのサイズ
 * @returns サイズクラス名
 */
function getSizeClass(size: ButtonProps['size']) {
  switch (size) {
    case 'lg': {
      return 'btn-lg'
    }
    case 'md': {
      return 'btn-md'
    }
    case 'sm': {
      return 'btn-sm'
    }
    default: {
      return 'btn-md'
    }
  }
}

/**
 * バリアントに応じたクラス名を取得
 * @param variant - ボタンのバリアント
 * @returns バリアントクラス名
 */
function getVariantClass(variant: ButtonProps['variant']) {
  switch (variant) {
    case 'danger': {
      return 'btn-danger'
    }
    case 'outline': {
      return 'btn-outline'
    }
    case 'primary': {
      return 'btn-primary'
    }
    case 'secondary': {
      return 'btn-secondary'
    }
    default: {
      return 'btn-primary'
    }
  }
}

/**
 * ローディングスピナーコンポーネント
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 mr-2"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Buttonコンポーネント
 * @param props - Buttonコンポーネントのプロパティ
 * @returns Buttonコンポーネント
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      fullWidth = false,
      isLoading = false,
      onClick,
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref
  ) => {
    /**
     * ボタンのクリックハンドラー
     * @param event - クリックイベント
     */
    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      if (isLoading ?? disabled) {
        event.preventDefault()
        return
      }
      onClick?.(event)
    }

    const baseClasses = cn(
      'btn',
      getVariantClass(variant),
      getSizeClass(size),
      {
        'btn-full-width': fullWidth,
        'btn-loading': isLoading,
      },
      className
    )

    return (
      <button
        className={baseClasses}
        disabled={Boolean(disabled) || Boolean(isLoading)}
        onClick={handleClick}
        ref={ref}
        type={type}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
