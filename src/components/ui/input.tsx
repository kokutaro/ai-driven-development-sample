/**
 * Inputコンポーネント
 * @fileoverview 基本的なInputコンポーネント
 */
import React from 'react'

import { cn } from '@/lib/utils'

/**
 * Inputコンポーネントのプロパティの型定義
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * カスタムクラス名
   */
  className?: string

  /**
   * フルWidth
   */
  fullWidth?: boolean

  /**
   * Inputのサイズ
   */
  size?: 'lg' | 'md' | 'sm'

  /**
   * Inputのバリアント
   */
  variant?: 'default' | 'error' | 'success'
}

/**
 * サイズに応じたクラス名を取得
 * @param size - Inputのサイズ
 * @returns サイズクラス名
 */
function getSizeClass(size: InputProps['size']) {
  switch (size) {
    case 'lg': {
      return 'input-lg'
    }
    case 'md': {
      return 'input-md'
    }
    case 'sm': {
      return 'input-sm'
    }
    default: {
      return 'input-md'
    }
  }
}

/**
 * バリアントに応じたクラス名を取得
 * @param variant - Inputのバリアント
 * @returns バリアントクラス名
 */
function getVariantClass(variant: InputProps['variant']) {
  switch (variant) {
    case 'default': {
      return 'input-default'
    }
    case 'error': {
      return 'input-error'
    }
    case 'success': {
      return 'input-success'
    }
    default: {
      return 'input-default'
    }
  }
}

/**
 * Inputコンポーネント
 * @param props - Inputコンポーネントのプロパティ
 * @returns Inputコンポーネント
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      fullWidth = false,
      size = 'md',
      type = 'text',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'input',
      getVariantClass(variant),
      getSizeClass(size),
      {
        'input-full-width': fullWidth,
      },
      className
    )

    return <input className={baseClasses} ref={ref} type={type} {...props} />
  }
)

Input.displayName = 'Input'
