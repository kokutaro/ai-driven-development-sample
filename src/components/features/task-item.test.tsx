/**
 * タスクアイテムコンポーネントのテスト
 * @fileoverview 個別タスクアイテムのユニットテスト
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskItem } from './task-item'

import type { Task } from '@/types/task'

// テスト用のモックタスクデータ
const mockTask: Task = {
  completed: false,
  createdAt: new Date('2023-01-01'),
  description: 'テスト用の説明',
  dueDate: new Date('2023-12-31'),
  id: '550e8400-e29b-41d4-a716-446655440000',
  important: true,
  subtasks: [],
  title: 'テストタスク',
  updatedAt: new Date('2023-01-01'),
  userId: 'user-1',
}

const completedTask: Task = {
  ...mockTask,
  completed: true,
  id: '550e8400-e29b-41d4-a716-446655440001',
  important: false,
  title: '完了したタスク',
}

const simpleTask: Task = {
  ...mockTask,
  description: undefined,
  dueDate: undefined,
  id: '550e8400-e29b-41d4-a716-446655440002',
  important: false,
  title: 'シンプルなタスク',
}

// コールバック関数のモック
const mockOnToggleCompletion = vi.fn()
const mockOnToggleImportance = vi.fn()
const mockOnDelete = vi.fn()
const mockOnSelect = vi.fn()

describe('TaskItem', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()
  })

  // 基本的なレンダリングテスト
  it('renders the task item correctly', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // タスクアイテムが存在することを確認
    expect(screen.getByTestId('task-item')).toBeInTheDocument()
  })

  // タスク情報の表示テスト
  it('displays task information correctly', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // タスクタイトルが表示されること
    expect(screen.getByText('テストタスク')).toBeInTheDocument()

    // タスク説明が表示されること
    expect(screen.getByText('テスト用の説明')).toBeInTheDocument()

    // 期限が表示されること
    expect(screen.getByText(/期限:/)).toBeInTheDocument()
    expect(screen.getByText(/2023\/12\/31/)).toBeInTheDocument()
  })

  // 完了チェックボックスのテスト
  it('displays completion checkbox correctly', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // チェックボックスが表示されること
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toHaveAttribute('aria-label', 'テストタスクを完了')
  })

  // 重要度インジケーターのテスト
  it('displays importance indicator for important tasks', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // 重要度インジケーターが表示されること
    expect(screen.getByLabelText('重要なタスク')).toBeInTheDocument()
  })

  // 完了したタスクの表示テスト
  it('displays completed task with correct styling', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={completedTask}
      />
    )

    // チェックボックスがチェックされていること
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    // 完了したタスクの属性が設定されていること
    const taskItem = screen.getByTestId('task-item')
    expect(taskItem).toHaveAttribute('data-completed', 'true')

    // タイトルに打ち消し線クラスが適用されていること
    const titleElement = screen.getByText('完了したタスク')
    expect(titleElement.parentElement).toHaveClass(
      'line-through',
      'text-gray-500'
    )
  })

  // シンプルなタスクの表示テスト
  it('displays simple task without optional elements', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={simpleTask}
      />
    )

    // タイトルのみ表示されること
    expect(screen.getByText('シンプルなタスク')).toBeInTheDocument()

    // 説明は表示されないこと
    expect(screen.queryByText('テスト用の説明')).not.toBeInTheDocument()

    // 期限は表示されないこと
    expect(screen.queryByText(/期限:/)).not.toBeInTheDocument()

    // 重要度インジケーターは表示されないこと
    expect(screen.queryByLabelText('重要なタスク')).not.toBeInTheDocument()
  })

  // 完了切り替えのテスト
  it('handles completion toggle', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // チェックボックスをクリック
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    // onToggleCompletionが呼ばれることを確認
    expect(mockOnToggleCompletion).toHaveBeenCalledWith(mockTask.id)
  })

  // 重要度切り替えのテスト
  it('handles importance toggle', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // 重要度ボタンをクリック
    const importanceButton =
      screen.getByLabelText('テストタスクの重要度を切り替え')
    await user.click(importanceButton)

    // onToggleImportanceが呼ばれることを確認
    expect(mockOnToggleImportance).toHaveBeenCalledWith(mockTask.id)
  })

  // 削除のテスト
  it('handles task deletion', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // 削除ボタンをクリック
    const deleteButton = screen.getByLabelText('テストタスクを削除')
    await user.click(deleteButton)

    // onDeleteが呼ばれることを確認
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id)
  })

  // タスク選択のテスト
  it('handles task selection', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // タスクエリアをクリック
    const taskContent = screen.getByText('テストタスク')
    await user.click(taskContent)

    // onSelectが呼ばれることを確認
    expect(mockOnSelect).toHaveBeenCalledWith(mockTask.id)
  })

  // キーボード操作のテスト
  it('handles keyboard selection', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // タスクエリアにフォーカスしてEnterキーを押す
    const taskArea = screen.getByLabelText('テストタスクを選択')
    taskArea.focus()
    await user.keyboard('{Enter}')

    // onSelectが呼ばれることを確認
    expect(mockOnSelect).toHaveBeenCalledWith(mockTask.id)
  })

  // スペースキーでの選択テスト
  it('handles space key selection', async () => {
    const user = userEvent.setup()
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // タスクエリアにフォーカスしてスペースキーを押す
    const taskArea = screen.getByLabelText('テストタスクを選択')
    taskArea.focus()
    await user.keyboard(' ')

    // onSelectが呼ばれることを確認
    expect(mockOnSelect).toHaveBeenCalledWith(mockTask.id)
  })

  // 重要度ボタンの状態テスト
  it('displays importance button with correct state', () => {
    // 重要なタスク
    const { rerender } = render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    let importanceButton =
      screen.getByLabelText('テストタスクの重要度を切り替え')
    expect(importanceButton).toHaveTextContent('⭐')
    expect(importanceButton).toHaveClass('bg-yellow-50', 'border-yellow-300')

    // 重要でないタスク
    rerender(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={simpleTask}
      />
    )

    importanceButton =
      screen.getByLabelText('シンプルなタスクの重要度を切り替え')
    expect(importanceButton).toHaveTextContent('☆')
    expect(importanceButton).not.toHaveClass(
      'bg-yellow-50',
      'border-yellow-300'
    )
  })

  // アクセシビリティテスト
  it('has proper accessibility attributes', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // 適切なロールとラベルが設定されていること
    const taskArea = screen.getByLabelText('テストタスクを選択')
    expect(taskArea).toBeInTheDocument()
    expect(taskArea).toHaveAttribute('tabIndex', '0')

    // ボタンにaria-labelが設定されていること
    expect(
      screen.getByLabelText('テストタスクの重要度を切り替え')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('テストタスクを削除')).toBeInTheDocument()
  })

  // レスポンシブデザインのテスト
  it('applies responsive layout classes', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // レスポンシブクラスが適用されていること
    const taskItem = screen.getByTestId('task-item')
    expect(taskItem).toHaveClass('border', 'rounded-lg', 'p-4')
  })

  // ホバー効果のテスト
  it('applies hover effects correctly', () => {
    render(
      <TaskItem
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
        onToggleCompletion={mockOnToggleCompletion}
        onToggleImportance={mockOnToggleImportance}
        task={mockTask}
      />
    )

    // ホバークラスが適用されていること
    const taskItem = screen.getByTestId('task-item')
    expect(taskItem).toHaveClass('hover:shadow-md', 'transition-shadow')
  })
})
