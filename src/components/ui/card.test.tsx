/**
 * Cardコンポーネントのテスト
 * @fileoverview 基本的なCardコンポーネントのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Card } from './card'

describe('Card', () => {
  // 基本的なレンダリングテスト
  it('renders card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  // バリアントのテスト
  it('applies default variant classes by default', () => {
    render(
      <Card data-testid="card">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-default')
  })

  it('applies outlined variant classes when variant is outlined', () => {
    render(
      <Card data-testid="card" variant="outlined">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-outlined')
  })

  it('applies elevated variant classes when variant is elevated', () => {
    render(
      <Card data-testid="card" variant="elevated">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-elevated')
  })

  // サイズのテスト
  it('applies size classes correctly', () => {
    render(
      <Card data-testid="card" size="sm">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-sm')
  })

  it('applies large size classes correctly', () => {
    render(
      <Card data-testid="card" size="lg">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-lg')
  })

  // パディングのテスト
  it('applies padding classes correctly', () => {
    render(
      <Card data-testid="card" padding="sm">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-padding-sm')
  })

  it('applies large padding classes correctly', () => {
    render(
      <Card data-testid="card" padding="lg">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-padding-lg')
  })

  // ホバー効果のテスト
  it('applies hover classes when hoverable is true', () => {
    render(
      <Card data-testid="card" hoverable>
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-hoverable')
  })

  // カスタムクラスのテスト
  it('applies custom className', () => {
    render(
      <Card className="custom-card" data-testid="card">
        <div>Content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-card')
  })

  // クリック可能なカードのテスト
  it('calls onClick when card is clicked and clickable', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Card data-testid="card" onClick={handleClick}>
        <div>Clickable content</div>
      </Card>
    )

    const card = screen.getByTestId('card')
    await user.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // クリック可能なカードのスタイル適用テスト
  it('applies clickable classes when onClick is provided', () => {
    render(
      <Card data-testid="card" onClick={vi.fn()}>
        <div>Clickable content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-clickable')
  })

  // ヘッダー付きカードのテスト
  it('renders header when provided', () => {
    const header = <div>Card Header</div>

    render(
      <Card header={header}>
        <div>Card content</div>
      </Card>
    )

    expect(screen.getByText('Card Header')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  // フッター付きカードのテスト
  it('renders footer when provided', () => {
    const footer = <div>Card Footer</div>

    render(
      <Card footer={footer}>
        <div>Card content</div>
      </Card>
    )

    expect(screen.getByText('Card Footer')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  // ヘッダーとフッター両方のテスト
  it('renders both header and footer when provided', () => {
    const header = <div>Card Header</div>
    const footer = <div>Card Footer</div>

    render(
      <Card footer={footer} header={header}>
        <div>Card content</div>
      </Card>
    )

    expect(screen.getByText('Card Header')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  // 無効状態のテスト
  it('applies disabled classes when disabled is true', () => {
    render(
      <Card data-testid="card" disabled>
        <div>Disabled content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-disabled')
  })

  // 無効状態でクリックできないテスト
  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Card data-testid="card" disabled onClick={handleClick}>
        <div>Disabled clickable content</div>
      </Card>
    )

    const card = screen.getByTestId('card')
    await user.click(card)
    expect(handleClick).not.toHaveBeenCalled()
  })

  // フルWidth のテスト
  it('applies full width classes when fullWidth is true', () => {
    render(
      <Card data-testid="card" fullWidth>
        <div>Full width content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-full-width')
  })

  // アニメーション無効のテスト
  it('applies no animation classes when withAnimation is false', () => {
    render(
      <Card data-testid="card" withAnimation={false}>
        <div>No animation content</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-no-animation')
  })

  // as propのテスト
  it('renders as different HTML element when as prop is provided', () => {
    render(
      <Card as="section" data-testid="card">
        <div>Section card</div>
      </Card>
    )
    const card = screen.getByTestId('card')
    expect(card.tagName).toBe('SECTION')
  })

  // 複雑な構成のテスト
  it('renders complex card structure correctly', () => {
    const header = (
      <div>
        <h3>Card Title</h3>
        <p>Card subtitle</p>
      </div>
    )

    const footer = (
      <div>
        <button>Action 1</button>
        <button>Action 2</button>
      </div>
    )

    render(
      <Card
        data-testid="card"
        footer={footer}
        header={header}
        hoverable
        size="lg"
        variant="elevated"
      >
        <div>
          <p>This is the main content of the card.</p>
          <p>It can contain multiple elements.</p>
        </div>
      </Card>
    )

    const card = screen.getByTestId('card')
    expect(card).toHaveClass('card-elevated', 'card-lg', 'card-hoverable')
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card subtitle')).toBeInTheDocument()
    expect(
      screen.getByText('This is the main content of the card.')
    ).toBeInTheDocument()
    expect(screen.getByText('Action 1')).toBeInTheDocument()
    expect(screen.getByText('Action 2')).toBeInTheDocument()
  })
})
