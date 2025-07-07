/**
 * メインページのテスト
 * @fileoverview TODOアプリのメインページのユニットテスト
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from './page'

import { render, screen } from '@/tests/test-utils'

// Zustandストアのモック
const mockGetFilteredTasks = vi.fn()
const mockGetFilteredTaskCount = vi.fn()
const mockAddTask = vi.fn()
const mockSetFilter = vi.fn()
const mockSetSortOrder = vi.fn()

vi.mock('@/stores', () => ({
  useTaskStore: () => ({
    addTask: mockAddTask,
    clearError: vi.fn(),
    error: undefined,
    filter: 'all',
    getFilteredTaskCount: mockGetFilteredTaskCount,
    getFilteredTasks: mockGetFilteredTasks,
    isLoading: false,
    removeTask: vi.fn(),
    setError: vi.fn(),
    setFilter: mockSetFilter,
    setSelectedTaskId: vi.fn(),
    setSortOrder: mockSetSortOrder,
    sortOrder: 'createdAt',
    toggleTaskCompletion: vi.fn(),
    toggleTaskImportance: vi.fn(),
  }),
}))

describe('HomePage', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()
    mockGetFilteredTasks.mockReturnValue([])
    mockGetFilteredTaskCount.mockReturnValue(0)
  })

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

  // 実際のコンポーネントがレンダリングされるテスト
  it('renders TaskControls component', () => {
    render(<HomePage />)

    // TaskControlsコンポーネントが存在することを確認
    const taskControls = screen.getByTestId('task-controls')
    expect(taskControls).toBeInTheDocument()
  })

  it('renders TaskForm component', () => {
    render(<HomePage />)

    // TaskFormコンポーネントが存在することを確認
    const taskForm = screen.getByRole('form', { name: 'タスク作成フォーム' })
    expect(taskForm).toBeInTheDocument()
  })

  it('renders TaskList component with empty state', () => {
    render(<HomePage />)

    // 空の状態のメッセージが表示されることを確認
    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
    expect(
      screen.getByText('新しいタスクを作成してください')
    ).toBeInTheDocument()
  })

  it('renders TaskList component with tasks when available', () => {
    // タスクがある状態をモック
    const mockTasks = [
      {
        completed: false,
        createdAt: new Date(),
        id: 'test-task-1',
        important: false,
        subtasks: [],
        title: 'テストタスク',
        updatedAt: new Date(),
        userId: 'test-user',
      },
    ]
    mockGetFilteredTasks.mockReturnValue(mockTasks)
    mockGetFilteredTaskCount.mockReturnValue(1)

    render(<HomePage />)

    // TaskListコンポーネントのリストが存在することを確認
    const taskList = screen.getByRole('list', { name: 'タスクリスト' })
    expect(taskList).toBeInTheDocument()
    expect(screen.getByText('テストタスク')).toBeInTheDocument()
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
      // eslint-disable-next-line security/detect-object-injection
      const currentSectionRect = sections[i].getBoundingClientRect()
      expect(currentSectionRect.top).toBeGreaterThanOrEqual(
        prevSectionRect.bottom
      )
    }
  })
})
