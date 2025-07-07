/**
 * Inputコンポーネント
 * @fileoverview Mantine TextInputをベースとした基本的なInputコンポーネント
 */
import React from 'react'

import { TextInput } from '@mantine/core'

import type { TextInputProps } from '@mantine/core'

/**
 * Inputコンポーネントのプロパティの型定義
 */
export interface InputProps extends Omit<TextInputProps, 'error' | 'variant'> {
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
 * カスタムバリアントをMantineのpropsにマッピング
 * @param variant - カスタムバリアント
 * @returns Mantineのprops
 */
function getMantinePropsForVariant(variant: InputProps['variant']) {
  switch (variant) {
    case 'error': {
      return { error: true }
    }
    case 'success': {
      return { rightSection: '✓', rightSectionPointerEvents: 'none' as const }
    }
    default: {
      return {}
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
    const variantProps = getMantinePropsForVariant(variant)

    return (
      <TextInput
        className={className}
        ref={ref}
        size={size}
        type={type}
        w={fullWidth ? '100%' : undefined}
        {...variantProps}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
