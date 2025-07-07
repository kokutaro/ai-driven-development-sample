/**
 * Buttonコンポーネントのテスト
 * @fileoverview 基本的なButtonコンポーネントのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  // 基本的なレンダリングテスト
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  // デフォルト値のテスト
  it('applies primary variant classes by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-primary')
  })

  // プロパティのテスト
  it('applies secondary variant classes when variant is secondary', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-secondary')
  })

  // アウトラインバリアントのテスト
  it('applies outline variant classes when variant is outline', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-outline')
  })

  // 危険バリアントのテスト
  it('applies danger variant classes when variant is danger', () => {
    render(<Button variant="danger">Danger Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-danger')
  })

  // サイズのテスト
  it('applies size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-sm')
  })

  it('applies large size classes correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-lg')
  })

  // 状態のテスト
  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('disabled')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  // 無効状態のテスト
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  // カスタムクラスのテスト
  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  // フルWidth のテスト
  it('applies full width classes when fullWidth is true', () => {
    render(<Button fullWidth>Full Width Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-full-width')
  })

  // クリックイベントのテスト
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // ローディング中はクリックできないテスト
  it('does not call onClick when loading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button isLoading onClick={handleClick}>
        Loading Button
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  // 無効状態でクリックできないテスト
  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  // 子要素がない場合のテスト
  it('renders without children', () => {
    render(<Button />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  // type属性のテスト
  it('applies correct type attribute', () => {
    render(<Button type="submit">Submit Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  // アイコンボタンのテスト
  it('renders icon button correctly', () => {
    render(
      <Button size="sm" variant="outline">
        <svg data-testid="icon" />
        Icon Button
      </Button>
    )
    const button = screen.getByRole('button')
    const icon = screen.getByTestId('icon')

    expect(button).toBeInTheDocument()
    expect(icon).toBeInTheDocument()
  })
})
