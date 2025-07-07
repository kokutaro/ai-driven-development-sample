/**
 * メインページのテスト
 * @fileoverview TODOアプリのメインページのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomePage from './page'

describe('HomePage', () => {
  // 基本的なレンダリングテスト
  it('renders the page correctly', () => {
    render(<HomePage />)

    // ページが正しくレンダリングされることを確認
    expect(document.body).toBeInTheDocument()
  })

  // アプリタイトルのテスト
  it('displays the app title', () => {
    render(<HomePage />)

    // メインタイトルが表示されることを確認
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('TODOアプリ')
  })

  // メインセクションの存在テスト
  it('displays main sections', () => {
    render(<HomePage />)

    // タスクリストセクションが存在することを確認
    const taskListSection = screen.getByTestId('task-list-section')
    expect(taskListSection).toBeInTheDocument()

    // タスク作成セクションが存在することを確認
    const taskFormSection = screen.getByTestId('task-form-section')
    expect(taskFormSection).toBeInTheDocument()

    // フィルターコントロールセクションが存在することを確認
    const controlsSection = screen.getByTestId('task-controls-section')
    expect(controlsSection).toBeInTheDocument()
  })

  // ページ構造のテスト
  it('has proper page structure', () => {
    render(<HomePage />)

    // メインコンテナが存在することを確認
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toBeInTheDocument()
  })

  // レイアウトクラスのテスト
  it('applies correct layout classes', () => {
    render(<HomePage />)

    // メインコンテナに適切なクラスが適用されていることを確認
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toHaveClass('container', 'mx-auto', 'p-4')
  })

  // 見出しレベルの階層テスト
  it('has proper heading hierarchy', () => {
    render(<HomePage />)

    // h1タグが1つだけ存在することを確認
    const h1Elements = screen.getAllByRole('heading', { level: 1 })
    expect(h1Elements).toHaveLength(1)
  })

  // アクセシビリティテスト
  it('has proper accessibility attributes', () => {
    render(<HomePage />)

    // メインコンテナにaria-labelが設定されていることを確認
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toHaveAttribute(
      'aria-label',
      'TODOアプリメインコンテンツ'
    )
  })

  // セクションの順序テスト
  it('displays sections in correct order', () => {
    render(<HomePage />)

    const sections = [
      screen.getByTestId('task-controls-section'),
      screen.getByTestId('task-form-section'),
      screen.getByTestId('task-list-section'),
    ]

    // セクションが正しい順序で配置されていることを確認
    for (let i = 1; i < sections.length; i++) {
      const prevSectionRect = sections[i - 1].getBoundingClientRect()
      const currentSectionRect = sections[i].getBoundingClientRect()
      expect(currentSectionRect.top).toBeGreaterThanOrEqual(
        prevSectionRect.bottom
      )
    }
  })
})
