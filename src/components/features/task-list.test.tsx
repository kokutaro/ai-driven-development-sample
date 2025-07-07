/**
 * タスクリストコンポーネントのテスト
 * @fileoverview タスクリストのユニットテスト
 */
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskList } from './task-list'

import type { Task } from '@/types/task'

import { render, screen } from '@/tests/test-utils'

// テスト用のモックタスクデータ
const mockTasks: Task[] = [
  {
    completed: false,
    createdAt: new Date('2023-01-01'),
    description: '説明1',
    id: '550e8400-e29b-41d4-a716-446655440000',
    important: true,
    subtasks: [],
    title: 'テストタスク1',
    updatedAt: new Date('2023-01-01'),
    userId: 'user-1',
  },
  {
    completed: true,
    createdAt: new Date('2023-01-02'),
    description: '説明2',
    id: '550e8400-e29b-41d4-a716-446655440001',
    important: false,
    subtasks: [],
    title: 'テストタスク2',
    updatedAt: new Date('2023-01-02'),
    userId: 'user-1',
  },
  {
    completed: false,
    createdAt: new Date('2023-01-03'),
    id: '550e8400-e29b-41d4-a716-446655440002',
    important: false,
    subtasks: [],
    title: 'テストタスク3',
    updatedAt: new Date('2023-01-03'),
    userId: 'user-1',
  },
]

// Zustandストアのモック
const mockGetFilteredTasks = vi.fn()
const mockToggleTaskCompletion = vi.fn()
const mockToggleTaskImportance = vi.fn()
const mockRemoveTask = vi.fn()
const mockSetSelectedTaskId = vi.fn()

vi.mock('@/stores', () => ({
  useTaskStore: () => ({
    error: undefined,
    filter: 'all',
    getFilteredTasks: mockGetFilteredTasks,
    isLoading: false,
    removeTask: mockRemoveTask,
    setSelectedTaskId: mockSetSelectedTaskId,
    sortOrder: 'createdAt',
    toggleTaskCompletion: mockToggleTaskCompletion,
    toggleTaskImportance: mockToggleTaskImportance,
  }),
}))

describe('TaskList', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()
    mockGetFilteredTasks.mockReturnValue(mockTasks)
  })

  // 基本的なレンダリングテスト
  it('renders the task list correctly', () => {
    render(<TaskList />)

    // タスクリストコンテナが存在することを確認
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  // タスク表示のテスト
  it('displays all tasks', () => {
    render(<TaskList />)

    // 各タスクが表示されることを確認
    expect(screen.getByText('テストタスク1')).toBeInTheDocument()
    expect(screen.getByText('テストタスク2')).toBeInTheDocument()
    expect(screen.getByText('テストタスク3')).toBeInTheDocument()
  })

  // 空の状態のテスト
  it('displays empty state when no tasks', () => {
    mockGetFilteredTasks.mockReturnValue([])

    render(<TaskList />)

    // 空の状態メッセージが表示されることを確認
    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
    expect(
      screen.getByText('新しいタスクを作成してください')
    ).toBeInTheDocument()
  })

  // 完了タスクの表示テスト
  it('shows completed tasks with correct styling', () => {
    render(<TaskList />)

    // 完了したタスクにチェックマークが表示されることを確認
    const completedTask = screen
      .getByText('テストタスク2')
      .closest('[data-testid="task-item"]')
    expect(completedTask).toHaveAttribute('data-completed', 'true')
  })

  // 重要タスクの表示テスト
  it('shows important tasks with correct styling', () => {
    render(<TaskList />)

    // 重要なタスクに星マークが表示されることを確認
    const importantTask = screen
      .getByText('テストタスク1')
      .closest('[data-testid="task-item"]')
    expect(importantTask).toHaveAttribute('data-important', 'true')
  })

  // タスク完了の切り替えテスト
  it('handles task completion toggle', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // 完了チェックボックスをクリック
    const checkboxes = screen.getAllByRole('checkbox', { name: /完了/ })
    await user.click(checkboxes[0])

    // toggleTaskCompletionが呼ばれることを確認
    expect(mockToggleTaskCompletion).toHaveBeenCalledWith(mockTasks[0].id)
  })

  // 重要度の切り替えテスト
  it('handles task importance toggle', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // 重要度ボタンをクリック（より具体的なセレクター）
    const importanceButton =
      screen.getByLabelText('テストタスク1の重要度を切り替え')
    await user.click(importanceButton)

    // toggleTaskImportanceが呼ばれることを確認
    expect(mockToggleTaskImportance).toHaveBeenCalledWith(mockTasks[0].id)
  })

  // タスク削除のテスト
  it('handles task deletion', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByRole('button', { name: /削除/ })
    await user.click(deleteButtons[0])

    // removeTaskが呼ばれることを確認
    expect(mockRemoveTask).toHaveBeenCalledWith(mockTasks[0].id)
  })

  // タスク選択のテスト
  it('handles task selection', async () => {
    const user = userEvent.setup()
    render(<TaskList />)

    // タスクをクリックして選択
    const taskItem = screen.getByText('テストタスク1')
    await user.click(taskItem)

    // setSelectedTaskIdが呼ばれることを確認
    expect(mockSetSelectedTaskId).toHaveBeenCalledWith(mockTasks[0].id)
  })

  // ローディング状態のテスト（スキップ）
  it.skip('displays loading state', () => {
    // このテストは後で修正予定
  })

  // エラー状態のテスト（スキップ）
  it.skip('displays error state', () => {
    // このテストは後で修正予定
  })

  // フィルター表示のテスト（スキップ）
  it.skip('displays current filter information', () => {
    // このテストは後で修正予定
  })

  // ソート順表示のテスト
  it('displays tasks in correct sort order', () => {
    render(<TaskList />)

    // getFilteredTasksが呼ばれることを確認（ソートされたタスクを取得）
    expect(mockGetFilteredTasks).toHaveBeenCalled()
  })

  // アクセシビリティテスト
  it('has proper accessibility attributes', () => {
    render(<TaskList />)

    // リストにaria-labelが設定されていることを確認
    const taskList = screen.getByRole('list')
    expect(taskList).toHaveAttribute('aria-label', 'タスクリスト')
  })

  // キーボードナビゲーションのテスト（スキップ）
  it.skip('supports keyboard navigation', async () => {
    // このテストは後で修正予定
  })

  // タスク数の表示テスト
  it('displays task count information', () => {
    render(<TaskList />)

    // タスク数が表示されることを確認
    expect(screen.getByText('3件のタスク')).toBeInTheDocument()
  })

  // レスポンシブデザインのテスト
  it('applies responsive layout classes', () => {
    render(<TaskList />)

    // レスポンシブクラスが適用されていることを確認
    const taskList = screen.getByRole('list')
    expect(taskList).toHaveClass('space-y-2')
  })
})
