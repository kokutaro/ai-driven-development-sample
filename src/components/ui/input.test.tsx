/**
 * Inputコンポーネントのテスト
 * @fileoverview 基本的なInputコンポーネントのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './input'

describe('Input', () => {
  // 基本的なレンダリングテスト
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  // プレースホルダーのテスト
  it('displays placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  // 値の表示テスト
  it('displays value correctly', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} value="Test value" />)
    const input = screen.getByDisplayValue('Test value')
    expect(input).toBeInTheDocument()
  })

  // デフォルト値のテスト
  it('displays default value correctly', () => {
    render(<Input defaultValue="Default text" />)
    const input = screen.getByDisplayValue('Default text')
    expect(input).toBeInTheDocument()
  })

  // 入力タイプのテスト
  it('renders with correct input type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  // パスワードタイプのテスト
  it('renders password type correctly', () => {
    render(<Input data-testid="password-input" type="password" />)
    const input = screen.getByTestId('password-input')
    expect(input).toHaveAttribute('type', 'password')
  })

  // 必須項目のテスト
  it('applies required attribute', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  // 無効状態のテスト
  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  // 読み取り専用のテスト
  it('is readonly when readOnly prop is true', () => {
    render(<Input readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
  })

  // カスタムクラスのテスト
  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  // サイズのテスト
  it('applies size classes correctly', () => {
    render(<Input size="sm" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input-sm')
  })

  it('applies large size classes correctly', () => {
    render(<Input size="lg" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input-lg')
  })

  // バリアントのテスト
  it('applies error variant classes', () => {
    render(<Input variant="error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input-error')
  })

  it('applies success variant classes', () => {
    render(<Input variant="success" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input-success')
  })

  // フルWidthのテスト
  it('applies full width classes when fullWidth is true', () => {
    render(<Input fullWidth />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input-full-width')
  })

  // onChangeイベントのテスト
  it('calls onChange when value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'Hello')
    expect(handleChange).toHaveBeenCalledTimes(5)
  })

  // onFocusイベントのテスト
  it('calls onFocus when input is focused', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()

    render(<Input onFocus={handleFocus} />)
    const input = screen.getByRole('textbox')

    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
  })

  // onBlurイベントのテスト
  it('calls onBlur when input loses focus', async () => {
    const user = userEvent.setup()
    const handleBlur = vi.fn()

    render(
      <div>
        <Input onBlur={handleBlur} />
        <button>Other element</button>
      </div>
    )
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button')

    await user.click(input)
    await user.click(button)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  // 最大長のテスト
  it('applies maxLength attribute', () => {
    render(<Input maxLength={100} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxLength', '100')
  })

  // ラベルとの関連付けテスト（IDが指定された場合）
  it('associates with label when id is provided', () => {
    render(
      <div>
        <label htmlFor="test-input">Test Label</label>
        <Input id="test-input" />
      </div>
    )
    const input = screen.getByLabelText('Test Label')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('id', 'test-input')
  })

  // 無効状態で入力できないテスト
  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Input disabled onChange={handleChange} />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'Should not work')
    expect(handleChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
  })
})
