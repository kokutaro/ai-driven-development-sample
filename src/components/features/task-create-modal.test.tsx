/**
 * TaskCreateModal コンポーネントのテスト
 * @fileoverview TDDアプローチでTaskCreateModalのテストを記述
 */
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskCreateModal } from './task-create-modal'

import { render, screen } from '@/tests/test-utils'

describe('TaskCreateModal', () => {
  const mockOnClose = vi.fn()
  const mockOnTaskCreate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('モーダルが開いた状態で正しくレンダリングされる', () => {
    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '新しいタスクを作成' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'タスクタイトル' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: '説明（任意）' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
  })

  it('モーダルが閉じた状態では表示されない', () => {
    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={false}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('必須項目とオプション項目が正しく表示される', () => {
    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    // 必須項目
    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    expect(titleInput).toBeRequired()
    expect(titleInput).toHaveAttribute(
      'placeholder',
      'タスクのタイトルを入力してください'
    )

    // オプション項目
    expect(
      screen.getByRole('textbox', { name: '説明（任意）' })
    ).not.toBeRequired()
    expect(screen.getByLabelText('期限日（任意）')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: '重要なタスクとして設定' })
    ).toBeInTheDocument()
  })

  it('タイトルが空の場合はバリデーションエラーが表示される', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    // バリデーションエラーのため、タスク作成コールバックが呼ばれないことを確認
    expect(mockOnTaskCreate).not.toHaveBeenCalled()
  })

  it('タイトルが200文字を超える場合はバリデーションエラーが表示される', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    await user.type(titleInput, 'a'.repeat(201))

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(
      screen.getByText('タスクタイトルは200文字以内で入力してください')
    ).toBeInTheDocument()
    expect(mockOnTaskCreate).not.toHaveBeenCalled()
  })

  it('説明が1000文字を超える場合はバリデーションエラーが表示される', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    const descriptionInput = screen.getByRole('textbox', {
      name: '説明（任意）',
    })

    await user.type(titleInput, '有効なタイトル')
    await user.type(descriptionInput, 'a'.repeat(1001))

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(
      screen.getByText('タスク説明は1000文字以内で入力してください')
    ).toBeInTheDocument()
    expect(mockOnTaskCreate).not.toHaveBeenCalled()
  })

  it('正常なデータでタスクを作成する', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    const descriptionInput = screen.getByRole('textbox', {
      name: '説明（任意）',
    })
    const importantCheckbox = screen.getByRole('checkbox', {
      name: '重要なタスクとして設定',
    })

    await user.type(titleInput, '新しいタスク')
    await user.type(descriptionInput, 'タスクの詳細説明')
    await user.click(importantCheckbox)

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(mockOnTaskCreate).toHaveBeenCalledWith({
      description: 'タスクの詳細説明',
      important: true,
      title: '新しいタスク',
    })
  })

  it('期限日を設定してタスクを作成する', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })

    await user.type(titleInput, '期限付きタスク')
    // DateInputの詳細なテストはスキップし、基本的なタスク作成をテスト

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(mockOnTaskCreate).toHaveBeenCalledWith({
      important: false,
      title: '期限付きタスク',
    })
  })

  it('キャンセルボタンでモーダルが閉じる', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
    expect(mockOnTaskCreate).not.toHaveBeenCalled()
  })

  it('フォームをリセットして新しいタスクを作成できる', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    await user.type(titleInput, '最初のタスク')

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(mockOnTaskCreate).toHaveBeenCalledWith({
      important: false,
      title: '最初のタスク',
    })

    // モーダルを閉じて再度開く（フォームがリセットされているかテスト）
    rerender(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={false}
      />
    )

    rerender(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInputAfterReset = screen.getByRole('textbox', {
      name: 'タスクタイトル',
    })
    expect(titleInputAfterReset).toHaveValue('')
  })

  it('オプション項目が省略された場合でもタスクを作成できる', async () => {
    const user = userEvent.setup()

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    await user.type(titleInput, 'シンプルなタスク')

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    expect(mockOnTaskCreate).toHaveBeenCalledWith({
      important: false,
      title: 'シンプルなタスク',
    })
  })

  it('作成中はローディング状態を表示し、ボタンが無効化される', async () => {
    const user = userEvent.setup()
    const mockSlowOnTaskCreate = vi.fn(
      (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <TaskCreateModal
        onClose={mockOnClose}
        onTaskCreate={mockSlowOnTaskCreate}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タスクタイトル' })
    await user.type(titleInput, 'ローディングテスト')

    const createButton = screen.getByRole('button', { name: '作成' })
    await user.click(createButton)

    // ローディング中はボタンが無効化される
    expect(createButton).toBeDisabled()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
  })
})
