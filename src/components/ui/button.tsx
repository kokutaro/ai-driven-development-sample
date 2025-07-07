/**
 * Buttonコンポーネント
 * @fileoverview Mantine Buttonをベースとした基本的なButtonコンポーネント
 */
import React from 'react'

import { Button as MantineButton } from '@mantine/core'

import type { ButtonProps as MantineButtonProps } from '@mantine/core'

/**
 * Buttonコンポーネントのプロパティの型定義
 */
export interface ButtonProps
  extends Omit<MantineButtonProps, 'loading' | 'variant'> {
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
   * クリックハンドラー
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void

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
 * カスタムバリアントをMantineのバリアントにマッピング
 * @param variant - カスタムバリアント
 * @returns Mantineバリアントとcolor
 */
function getMantineVariantAndColor(variant: ButtonProps['variant']) {
  switch (variant) {
    case 'danger': {
      return { color: 'red', variant: 'filled' as const }
    }
    case 'outline': {
      return { color: 'gray', variant: 'outline' as const }
    }
    case 'primary': {
      return { color: 'blue', variant: 'filled' as const }
    }
    case 'secondary': {
      return { color: 'gray', variant: 'filled' as const }
    }
    default: {
      return { color: 'blue', variant: 'filled' as const }
    }
  }
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
    const { color, variant: mantineVariant } =
      getMantineVariantAndColor(variant)

    /**
     * ボタンのクリックハンドラー
     * @param event - クリックイベント
     */
    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      if (isLoading ?? disabled) {
        event.preventDefault()
        return
      }
      if (onClick) {
        onClick(event)
      }
    }

    return (
      <MantineButton
        className={className}
        color={color}
        disabled={Boolean(disabled) || Boolean(isLoading)}
        fullWidth={fullWidth}
        loading={isLoading}
        onClick={handleClick}
        ref={ref}
        size={size}
        type={type}
        variant={mantineVariant}
        {...props}
      >
        {children}
      </MantineButton>
    )
  }
)

Button.displayName = 'Button'
