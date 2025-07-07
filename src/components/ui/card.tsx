/**
 * Cardコンポーネント
 * @fileoverview 基本的なCardコンポーネント
 */
import React from 'react'

import { cn } from '@/lib/utils'

/**
 * Cardコンポーネントのプロパティの型定義
 */
export interface CardProps {
  /**
   * レンダリングするHTML要素
   */
  as?: React.ElementType

  /**
   * 子要素
   */
  children: React.ReactNode

  /**
   * カスタムクラス名
   */
  className?: string

  /**
   * クリック可能か（onClickが提供された場合は自動的にtrue）
   */
  clickable?: boolean

  /**
   * 無効状態
   */
  disabled?: boolean

  /**
   * フッター要素
   */
  footer?: React.ReactNode

  /**
   * フルWidth
   */
  fullWidth?: boolean

  /**
   * ヘッダー要素
   */
  header?: React.ReactNode

  /**
   * ホバー効果を有効にするか
   */
  hoverable?: boolean

  /**
   * クリックハンドラー
   */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void

  /**
   * Cardのパディング
   */
  padding?: 'lg' | 'md' | 'sm'

  /**
   * Cardのサイズ
   */
  size?: 'lg' | 'md' | 'sm'

  /**
   * Cardのバリアント
   */
  variant?: 'default' | 'elevated' | 'outlined'

  /**
   * アニメーションを有効にするか
   */
  withAnimation?: boolean
}

/**
 * Cardコンポーネント
 * @param props - Cardコンポーネントのプロパティ
 * @returns Cardコンポーネント
 */
export function Card({
  as: Component = 'div',
  children,
  className,
  clickable,
  disabled = false,
  footer,
  fullWidth = false,
  header,
  hoverable = false,
  onClick,
  padding = 'md',
  size = 'md',
  variant = 'default',
  withAnimation = true,
  ...props
}: CardProps) {
  const isClickable = clickable ?? onClick !== undefined

  /**
   * カードクリックハンドラー
   * @param event - クリックイベント
   */
  function handleClick(event: React.MouseEvent<HTMLElement>) {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  const baseClasses = cn(
    'card',
    getVariantClass(variant),
    getSizeClass(size),
    getPaddingClass(padding),
    {
      'card-clickable': isClickable,
      'card-disabled': disabled,
      'card-full-width': fullWidth,
      'card-hoverable': hoverable,
      'card-no-animation': !withAnimation,
    },
    className
  )

  const cardProps = {
    className: baseClasses,
    onClick: isClickable ? handleClick : undefined,
    ...props,
  }

  return (
    <Component {...cardProps}>
      {header && <div className="card-header">{header}</div>}

      <div className="card-body">{children}</div>

      {footer && <div className="card-footer">{footer}</div>}
    </Component>
  )
}

/**
 * パディングに応じたクラス名を取得
 * @param padding - Cardのパディング
 * @returns パディングクラス名
 */
function getPaddingClass(padding: CardProps['padding']) {
  switch (padding) {
    case 'lg': {
      return 'card-padding-lg'
    }
    case 'md': {
      return 'card-padding-md'
    }
    case 'sm': {
      return 'card-padding-sm'
    }
    default: {
      return 'card-padding-md'
    }
  }
}

/**
 * サイズに応じたクラス名を取得
 * @param size - Cardのサイズ
 * @returns サイズクラス名
 */
function getSizeClass(size: CardProps['size']) {
  switch (size) {
    case 'lg': {
      return 'card-lg'
    }
    case 'md': {
      return 'card-md'
    }
    case 'sm': {
      return 'card-sm'
    }
    default: {
      return 'card-md'
    }
  }
}

/**
 * バリアントに応じたクラス名を取得
 * @param variant - Cardのバリアント
 * @returns バリアントクラス名
 */
function getVariantClass(variant: CardProps['variant']) {
  switch (variant) {
    case 'default': {
      return 'card-default'
    }
    case 'elevated': {
      return 'card-elevated'
    }
    case 'outlined': {
      return 'card-outlined'
    }
    default: {
      return 'card-default'
    }
  }
}

Card.displayName = 'Card'
