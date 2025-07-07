/**
 * Cardコンポーネント
 * @fileoverview Mantine Cardをベースとした基本的なCardコンポーネント
 */
import React from 'react'

import { Card as MantineCard } from '@mantine/core'

import type { CardProps as MantineCardProps } from '@mantine/core'

/**
 * Cardコンポーネントのプロパティの型定義
 */
export interface CardProps
  extends Omit<MantineCardProps, 'component' | 'onClick'> {
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
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void

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
  size: _size = 'md',
  variant = 'default',
  withAnimation = true,
  ...props
}: CardProps) {
  const isClickable = clickable ?? onClick !== undefined
  const variantProps = getMantinePropsForVariant(variant)

  /**
   * カードクリックハンドラー
   * @param event - クリックイベント
   */
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (disabled) {
      event.preventDefault()
      return
    }
    if (onClick) {
      onClick(event)
    }
  }

  const cardStyles = {
    cursor: isClickable ? 'pointer' : undefined,
    opacity: disabled ? 0.6 : undefined,
    pointerEvents: disabled ? ('none' as const) : undefined,
    transition: withAnimation ? 'all 0.2s ease' : undefined,
    width: fullWidth ? '100%' : undefined,
    ...(hoverable && {
      '&:hover': {
        transform: 'translateY(-2px)',
      },
    }),
  }

  return (
    <MantineCard
      className={className}
      onClick={isClickable ? handleClick : undefined}
      padding={padding}
      style={cardStyles}
      {...variantProps}
      {...props}
    >
      {header && <MantineCard.Section>{header}</MantineCard.Section>}

      {children}

      {footer && <MantineCard.Section>{footer}</MantineCard.Section>}
    </MantineCard>
  )
}

/**
 * カスタムバリアントをMantineのpropsにマッピング
 * @param variant - カスタムバリアント
 * @returns Mantineのprops
 */
function getMantinePropsForVariant(variant: CardProps['variant']) {
  switch (variant) {
    case 'elevated': {
      return { shadow: 'md', withBorder: false }
    }
    case 'outlined': {
      return { shadow: 'none', withBorder: true }
    }
    default: {
      return { shadow: 'sm', withBorder: true }
    }
  }
}

Card.displayName = 'Card'
