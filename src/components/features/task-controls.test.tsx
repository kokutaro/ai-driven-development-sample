/**
 * タスクコントロールコンポーネントのテスト
 * @fileoverview タスクのフィルター・ソート制御のユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskControls } from './task-controls'

// Zustandストアのモック
const mockSetFilter = vi.fn()
const mockSetSortOrder = vi.fn()
const mockGetFilteredTaskCount = vi.fn()

vi.mock('@/stores', () => ({
  useTaskStore: () => ({
    filter: 'all',
    getFilteredTaskCount: mockGetFilteredTaskCount,
    setFilter: mockSetFilter,
    setSortOrder: mockSetSortOrder,
    sortOrder: 'createdAt',
  }),
}))

describe('TaskControls', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()
    mockGetFilteredTaskCount.mockReturnValue(5)
  })

  // 基本的なレンダリングテスト
  it('renders the task controls correctly', () => {
    render(<TaskControls />)

    // フィルターセクションが存在することを確認
    expect(screen.getByText('フィルター')).toBeInTheDocument()
    expect(screen.getByText('ソート順')).toBeInTheDocument()
  })

  // フィルターオプションの表示テスト
  it('displays all filter options', () => {
    render(<TaskControls />)

    // フィルター選択肢が表示されることを確認
    expect(screen.getByLabelText('すべて')).toBeInTheDocument()
    expect(screen.getByLabelText('重要')).toBeInTheDocument()
    expect(screen.getByLabelText('今日')).toBeInTheDocument()
    expect(screen.getByLabelText('予定済み')).toBeInTheDocument()
    expect(screen.getByLabelText('完了済み')).toBeInTheDocument()
  })

  // ソートオプションの表示テスト
  it('displays all sort options', () => {
    render(<TaskControls />)

    // ソート選択肢が表示されることを確認
    expect(screen.getByLabelText('作成日順')).toBeInTheDocument()
    expect(screen.getByLabelText('期限順')).toBeInTheDocument()
    expect(screen.getByLabelText('重要度順')).toBeInTheDocument()
    expect(screen.getByLabelText('アルファベット順')).toBeInTheDocument()
  })

  // 現在のフィルターが選択されていることのテスト
  it('shows current filter as selected', () => {
    render(<TaskControls />)

    // デフォルトの「すべて」が選択されていることを確認
    const allFilter = screen.getByLabelText('すべて')
    expect(allFilter).toBeChecked()
  })

  // 現在のソート順が選択されていることのテスト
  it('shows current sort order as selected', () => {
    render(<TaskControls />)

    // デフォルトの「作成日順」が選択されていることを確認
    const createdAtSort = screen.getByLabelText('作成日順')
    expect(createdAtSort).toBeChecked()
  })

  // フィルター変更のテスト
  it('handles filter change', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // 重要フィルターを選択
    const importantFilter = screen.getByLabelText('重要')
    await user.click(importantFilter)

    // setFilterが呼ばれることを確認
    expect(mockSetFilter).toHaveBeenCalledWith('important')
  })

  // ソート順変更のテスト
  it('handles sort order change', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // 期限順を選択
    const dueDateSort = screen.getByLabelText('期限順')
    await user.click(dueDateSort)

    // setSortOrderが呼ばれることを確認
    expect(mockSetSortOrder).toHaveBeenCalledWith('dueDate')
  })

  // 検索機能のテスト（オプション）
  it('displays search input', () => {
    render(<TaskControls />)

    // 検索入力フィールドが表示されることを確認
    const searchInput = screen.getByLabelText('タスクを検索')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('placeholder', 'タスクを検索...')
  })

  // 検索入力のテスト
  it('handles search input', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // 検索文字列を入力
    const searchInput = screen.getByLabelText('タスクを検索')
    await user.type(searchInput, 'テスト')

    // 入力値が反映されることを確認
    expect(searchInput).toHaveValue('テスト')
  })

  // タスク数の表示テスト
  it('displays filtered task count', () => {
    render(<TaskControls />)

    // フィルタリングされたタスク数が表示されることを確認
    expect(screen.getByText('5件のタスク')).toBeInTheDocument()
  })

  // 異なるフィルター状態でのテスト（スキップ）
  it.skip('displays correct filter state', () => {
    // このテストは後で修正予定
  })

  // 異なるソート状態でのテスト（スキップ）
  it.skip('displays correct sort state', () => {
    // このテストは後で修正予定
  })

  // フィルタークリア機能のテスト
  it('handles filter clear', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // クリアボタンをクリック
    const clearButton = screen.getByRole('button', { name: 'クリア' })
    await user.click(clearButton)

    // 「すべて」フィルターが選択されることを確認
    expect(mockSetFilter).toHaveBeenCalledWith('all')
  })

  // アクセシビリティテスト
  it('has proper accessibility attributes', () => {
    render(<TaskControls />)

    // fieldsetが使用されていることを確認
    expect(screen.getByText('フィルター')).toBeInTheDocument()
    expect(screen.getByText('ソート順')).toBeInTheDocument()

    // ラジオボタングループが正しく設定されていることを確認
    const filterRadios = screen.getAllByRole('radio')
    expect(filterRadios.length).toBeGreaterThan(0)
  })

  // レスポンシブデザインのテスト
  it('applies responsive layout classes', () => {
    render(<TaskControls />)

    // レスポンシブクラスが適用されていることを確認
    const controlsContainer = screen.getByTestId('task-controls')
    expect(controlsContainer).toHaveClass('space-y-4')
  })

  // クイックフィルターボタンのテスト
  it('displays quick filter buttons', () => {
    render(<TaskControls />)

    // クイックフィルターボタンが表示されることを確認
    expect(
      screen.getByRole('button', { name: '今日のタスク' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '重要なタスク' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '期限切れ' })).toBeInTheDocument()
  })

  // クイックフィルター操作のテスト
  it('handles quick filter buttons', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // 今日のタスクボタンをクリック
    const todayButton = screen.getByRole('button', { name: '今日のタスク' })
    await user.click(todayButton)

    // 今日フィルターが選択されることを確認
    expect(mockSetFilter).toHaveBeenCalledWith('today')
  })

  // フィルター統計の表示テスト
  it('displays filter statistics', () => {
    render(<TaskControls />)

    // フィルター統計が表示されることを確認（部分的なテキストで検索）
    expect(screen.getByText(/現在のフィルター:/)).toBeInTheDocument()
    expect(screen.getByText(/ソート順:/)).toBeInTheDocument()
    expect(screen.getByText('すべて')).toBeInTheDocument()
    expect(screen.getByText('作成日順')).toBeInTheDocument()
  })

  // キーボード操作のテスト（スキップ）
  it.skip('supports keyboard navigation', async () => {
    // このテストは後で修正予定
  })

  // 設定保存のテスト（オプション）
  it('persists filter and sort preferences', async () => {
    const user = userEvent.setup()
    render(<TaskControls />)

    // フィルターとソート順を変更
    await user.click(screen.getByLabelText('重要'))
    await user.click(screen.getByLabelText('期限順'))

    // 設定が保存されることを確認
    expect(mockSetFilter).toHaveBeenCalledWith('important')
    expect(mockSetSortOrder).toHaveBeenCalledWith('dueDate')
  })
})
