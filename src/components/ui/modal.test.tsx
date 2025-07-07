/**
 * Modalコンポーネントのテスト
 * @fileoverview 基本的なModalコンポーネントのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Modal } from './modal'

describe('Modal', () => {
  // 基本的なレンダリングテスト（開いた状態）
  it('renders modal when open', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  // 閉じた状態のテスト
  it('does not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  // タイトルの表示テスト
  it('displays title when provided', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  // 閉じるボタンのテスト
  it('renders close button by default', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  // 閉じるボタンを非表示にするテスト
  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen onClose={vi.fn()} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    )
    expect(
      screen.queryByRole('button', { name: /close/i })
    ).not.toBeInTheDocument()
  })

  // サイズのテスト
  it('applies size classes correctly', () => {
    render(
      <Modal isOpen onClose={vi.fn()} size="sm">
        <div>Modal content</div>
      </Modal>
    )
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass('modal-sm')
  })

  it('applies large size classes correctly', () => {
    render(
      <Modal isOpen onClose={vi.fn()} size="lg">
        <div>Modal content</div>
      </Modal>
    )
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass('modal-lg')
  })

  // オーバーレイクリックで閉じるテスト
  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    const overlay = screen.getByTestId('modal-overlay')
    await user.click(overlay)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  // オーバーレイクリックで閉じない設定のテスト
  it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal closeOnOverlayClick={false} isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    const overlay = screen.getByTestId('modal-overlay')
    await user.click(overlay)
    expect(handleClose).not.toHaveBeenCalled()
  })

  // 閉じるボタンクリックのテスト
  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  // ESCキーで閉じるテスト
  it('calls onClose when ESC key is pressed', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    await user.keyboard('{Escape}')
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  // ESCキーで閉じない設定のテスト
  it('does not call onClose when ESC key is pressed and closeOnEscape is false', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal closeOnEscape={false} isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    await user.keyboard('{Escape}')
    expect(handleClose).not.toHaveBeenCalled()
  })

  // フォーカストラップのテスト
  it('traps focus within modal', async () => {
    render(
      <div>
        <button>Outside button</button>
        <Modal isOpen onClose={vi.fn()} showCloseButton={false}>
          <div>
            <button>First button</button>
            <button>Second button</button>
          </div>
        </Modal>
      </div>
    )

    // モーダルが開いたときに最初のフォーカス可能な要素にフォーカスが移る
    const firstButton = screen.getByText('First button')
    expect(firstButton).toHaveFocus()
  })

  // アクセシビリティ属性のテスト
  it('has correct accessibility attributes', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Accessible Modal">
        <div>Modal content</div>
      </Modal>
    )

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-modal', 'true')
    expect(modal).toHaveAttribute('aria-labelledby')
  })

  // カスタムクラスのテスト
  it('applies custom className', () => {
    render(
      <Modal className="custom-modal" isOpen onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass('custom-modal')
  })

  // フッターの表示テスト
  it('renders footer when provided', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    )

    render(
      <Modal footer={footer} isOpen onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  // モーダルコンテンツ内のクリックでは閉じないテスト
  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(
      <Modal isOpen onClose={handleClose}>
        <div>Modal content</div>
      </Modal>
    )

    const content = screen.getByText('Modal content')
    await user.click(content)
    expect(handleClose).not.toHaveBeenCalled()
  })

  // ポータル使用のテスト
  it('renders in document body when portal is enabled', () => {
    render(
      <Modal isOpen onClose={vi.fn()} usePortal>
        <div>Portal modal content</div>
      </Modal>
    )

    // ポータルを使用している場合、コンテンツはbodyの直下にレンダリングされる
    expect(document.body).toHaveTextContent('Portal modal content')
  })
})
