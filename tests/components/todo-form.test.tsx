import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TodoForm } from '@/components/features/todo/todo-form'

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

/**
 * TodoFormコンポーネントのテスト
 *
 * @description TodoFormコンポーネントの機能テスト
 * - フォームの表示と入力処理
 * - バリデーション機能
 * - 送信処理とフォームリセット
 * - キーボードショートカット
 */
describe('TodoForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('フォームが正しく表示される', () => {
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    expect(screen.getByText('新しいTodoを追加')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('説明（オプション）')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
  })

  it('タイトルを入力して送信できる', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, 'テストTodo')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'テストTodo',
      description: undefined,
      completed: false,
    })
  })

  it('タイトルと説明を入力して送信できる', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const descriptionInput = screen.getByPlaceholderText('説明（オプション）')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, 'テストTodo')
    await user.type(descriptionInput, 'テスト用の説明')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'テストTodo',
      description: 'テスト用の説明',
      completed: false,
    })
  })

  it('空のタイトルでは送信できない', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const submitButton = screen.getByRole('button', { name: '追加' })
    expect(submitButton).toBeDisabled()

    await user.click(submitButton)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('空白のみのタイトルでは送信できない', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, '   ')
    expect(submitButton).toBeDisabled()
  })

  it('送信後にフォームがリセットされる', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const descriptionInput = screen.getByPlaceholderText('説明（オプション）')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, 'テストTodo')
    await user.type(descriptionInput, 'テスト用の説明')
    await user.click(submitButton)

    expect(titleInput).toHaveValue('')
    expect(descriptionInput).toHaveValue('')
  })

  it('Enterキーで送信できる', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')

    await user.type(titleInput, 'テストTodo')
    await user.type(titleInput, '{Enter}')

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'テストTodo',
      description: undefined,
      completed: false,
    })
  })

  it('Shift+Enterでは送信されない', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')

    await user.type(titleInput, 'テストTodo')
    await user.type(titleInput, '{Shift>}{Enter}{/Shift}')

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('ローディング中は送信ボタンが無効化される', () => {
    render(<TodoForm onSubmit={mockOnSubmit} loading={true} />, {
      wrapper: TestWrapper,
    })

    const submitButton = screen.getByRole('button', { name: '追加' })
    expect(submitButton).toBeDisabled()
  })

  it('ローディング中はローディングインジケータが表示される', () => {
    render(<TodoForm onSubmit={mockOnSubmit} loading={true} />, {
      wrapper: TestWrapper,
    })

    const submitButton = screen.getByRole('button', { name: '追加' })
    expect(submitButton).toHaveAttribute('data-loading', 'true')
  })

  it('先頭末尾の空白が除去される', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const descriptionInput = screen.getByPlaceholderText('説明（オプション）')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, '  テストTodo  ')
    await user.type(descriptionInput, '  テスト用の説明  ')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'テストTodo',
      description: 'テスト用の説明',
      completed: false,
    })
  })

  it('説明が空の場合はundefinedが送信される', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const descriptionInput = screen.getByPlaceholderText('説明（オプション）')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, 'テストTodo')
    await user.type(descriptionInput, '   ')
    await user.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'テストTodo',
      description: undefined,
      completed: false,
    })
  })
})
