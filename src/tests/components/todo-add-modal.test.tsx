import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { TodoAddModal } from '@/components/todo-add-modal'

// MantineProviderでラップするヘルパー関数
function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('TodoAddModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 基本的なレンダリングテスト
  it('モーダルが開いている状態で正しくレンダリングされる', () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('新しいタスクを追加')).toBeInTheDocument()
  })

  // 閉じた状態でのテスト
  it('モーダルが閉じている状態ではレンダリングされない', () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={false}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // フォーム要素のテスト
  it('必要なフォーム要素がレンダリングされる', () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    expect(
      screen.getByRole('textbox', { name: 'タイトル' })
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '説明' })).toBeInTheDocument()
    expect(screen.getByText('期限')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
  })

  // 期限選択肢のテスト
  it('期限選択肢が正しく表示される', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const dueDateSelect = screen.getByDisplayValue('期限なし')
    await userEvent.click(dueDateSelect)

    await waitFor(() => {
      expect(screen.getByText('期限なし')).toBeInTheDocument()
      expect(screen.getByText('今日')).toBeInTheDocument()
      expect(screen.getByText('明日')).toBeInTheDocument()
      expect(screen.getByText('来週')).toBeInTheDocument()
      expect(screen.getByText('カレンダーから指定')).toBeInTheDocument()
    })
  })

  // フォーム送信のテスト
  it('フォーム送信が正しく動作する', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タイトル' })
    const descriptionInput = screen.getByRole('textbox', { name: '説明' })
    const submitButton = screen.getByRole('button', { name: '作成' })

    await userEvent.type(titleInput, 'テストタスク')
    await userEvent.type(descriptionInput, 'テストの説明')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: 'テストの説明',
        dueDate: undefined,
        title: 'テストタスク',
      })
    })
  })

  // バリデーションのテスト
  it('タイトルが空の場合はエラーが表示される', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: '作成' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  // キャンセルボタンのテスト
  it('キャンセルボタンでモーダルが閉じられる', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await userEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  // フォーカス管理のテスト
  it('モーダルが開いた時にタイトル入力欄にフォーカスが当たる', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'タイトル' })).toHaveFocus()
    })
  })

  // 期限選択のテスト
  it('期限選択が正しく動作する', async () => {
    renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タイトル' })
    const dueDateSelect = screen.getByDisplayValue('期限なし')
    const submitButton = screen.getByRole('button', { name: '作成' })

    await userEvent.type(titleInput, 'テストタスク')
    await userEvent.click(dueDateSelect)

    await waitFor(() => {
      expect(screen.getByText('今日')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('今日'))
    await userEvent.click(submitButton)

    await waitFor(() => {
      const call = mockOnSubmit.mock.calls[0] as [
        { description: string; dueDate: Date | undefined; title: string },
      ]
      expect(call[0].title).toBe('テストタスク')
      expect(call[0].description).toBe('')
      expect(call[0].dueDate).toBeInstanceOf(Date)
      // 今日の日付かチェック（時間は無視）
      const today = new Date()
      const receivedDate = call[0].dueDate!
      expect(receivedDate.getDate()).toBe(today.getDate())
      expect(receivedDate.getMonth()).toBe(today.getMonth())
      expect(receivedDate.getFullYear()).toBe(today.getFullYear())
    })
  })

  // フォームリセットのテスト
  it('モーダルが閉じられた時にフォームがリセットされる', async () => {
    const { rerender } = renderWithMantine(
      <TodoAddModal
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        opened={true}
      />
    )

    const titleInput = screen.getByRole('textbox', { name: 'タイトル' })
    await userEvent.type(titleInput, 'テストタスク')

    // モーダルを閉じる
    rerender(
      <MantineProvider>
        <TodoAddModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          opened={false}
        />
      </MantineProvider>
    )

    // 再度開く
    rerender(
      <MantineProvider>
        <TodoAddModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          opened={true}
        />
      </MantineProvider>
    )

    const newTitleInput = screen.getByRole('textbox', { name: 'タイトル' })
    expect(newTitleInput).toHaveValue('')
  })
})
