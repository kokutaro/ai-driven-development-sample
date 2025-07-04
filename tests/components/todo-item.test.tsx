import { MantineProvider } from '@mantine/core'
import { render, screen, fireEvent } from '@testing-library/react'

import { TodoItem } from '@/components/features/todo/todo-item'
import type { Todo } from '@/types/todo'

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

/**
 * TodoItemコンポーネントのテスト
 *
 * @description TodoItemコンポーネントの機能テスト
 * - 表示内容の確認
 * - イベントハンドラーの動作確認
 * - 編集機能のテスト
 */
describe('TodoItem', () => {
  const mockTodo: Todo = {
    id: '1',
    title: 'テストTodo',
    description: 'テスト用の説明',
    completed: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const mockProps = {
    todo: mockTodo,
    onToggle: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Todoアイテムが正しく表示される', () => {
    render(<TodoItem {...mockProps} />, { wrapper: TestWrapper })

    expect(screen.getByText('テストTodo')).toBeInTheDocument()
    expect(screen.getByText('テスト用の説明')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('完了済みのTodoが正しく表示される', () => {
    const completedTodo = { ...mockTodo, completed: true }
    render(<TodoItem {...mockProps} todo={completedTodo} />, {
      wrapper: TestWrapper,
    })

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('チェックボックスクリックでonToggleが呼ばれる', () => {
    render(<TodoItem {...mockProps} />, { wrapper: TestWrapper })

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockProps.onToggle).toHaveBeenCalledWith('1')
  })

  it('削除ボタンクリックで確認ダイアログが表示される', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TodoItem {...mockProps} />, { wrapper: TestWrapper })

    const deleteButton = screen.getByLabelText('削除')
    fireEvent.click(deleteButton)

    expect(confirmSpy).toHaveBeenCalledWith('このTodoを削除しますか？')
    expect(mockProps.onDelete).toHaveBeenCalledWith('1')

    confirmSpy.mockRestore()
  })

  it('編集ボタンクリックで編集モードになる', () => {
    render(<TodoItem {...mockProps} />, { wrapper: TestWrapper })

    const editButton = screen.getByLabelText('編集')
    fireEvent.click(editButton)

    expect(screen.getByDisplayValue('テストTodo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テスト用の説明')).toBeInTheDocument()
  })
})
