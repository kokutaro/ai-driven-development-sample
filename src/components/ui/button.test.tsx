/**
 * Buttonコンポーネントのテスト
 * @fileoverview Mantine Buttonをベースとした基本的なButtonコンポーネントのユニットテスト
 */
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

import { render, screen } from '@/tests/test-utils'

describe('Button', () => {
  // 基本的なレンダリングテスト
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  // デフォルト値のテスト
  it('renders with primary variant by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-variant', 'filled')
  })

  // プロパティのテスト
  it('renders secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-variant', 'filled')
  })

  // アウトラインバリアントのテスト
  it('renders outline variant correctly', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-variant', 'outline')
  })

  // 危険バリアントのテスト
  it('renders danger variant correctly', () => {
    render(<Button variant="danger">Danger Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-variant', 'filled')
  })

  // サイズのテスト
  it('renders small size correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-size', 'sm')
  })

  it('renders large size correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-size', 'lg')
  })

  // 状態のテスト
  it('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('data-loading', 'true')
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
  it('renders correctly when fullWidth is true', () => {
    render(<Button fullWidth>Full Width Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    // The fullWidth prop should be passed to Mantine Button
    // We don't test the exact implementation, just that it renders without error
    expect(button).toHaveTextContent('Full Width Button')
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
