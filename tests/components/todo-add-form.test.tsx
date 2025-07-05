import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { TodoAddForm } from '@/components/todo-add-form'
import { useTodoStore } from '@/stores/todo-store'

/**
 * MantineProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

// Zustand ストアをモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

describe('TodoAddForm', () => {
  const mockAddTodo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodoStore).mockImplementation((selector) => {
      const state = {
        addTodo: mockAddTodo,
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: [],
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      }
      return selector(state)
    })
  })

  // 基本的なレンダリングテスト
  it('renders todo add form with all required fields', () => {
    renderWithMantine(<TodoAddForm />)

    expect(
      screen.getByRole('textbox', { name: /タイトル/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /説明/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'TODO を追加' })
    ).toBeInTheDocument()
  })

  // フォームの入力テスト
  it('allows user to enter title and description', () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    const descriptionInput = screen.getByRole('textbox', { name: /説明/ })

    fireEvent.change(titleInput, { target: { value: 'テストタイトル' } })
    fireEvent.change(descriptionInput, { target: { value: 'テスト説明' } })

    expect(titleInput).toHaveValue('テストタイトル')
    expect(descriptionInput).toHaveValue('テスト説明')
  })

  // バリデーションテスト - 必須フィールド
  it('does not call addTodo when title is empty', async () => {
    renderWithMantine(<TodoAddForm />)

    const submitButton = screen.getByRole('button', { name: 'TODO を追加' })

    fireEvent.click(submitButton)

    // addTodo が呼ばれないことを確認
    expect(mockAddTodo).not.toHaveBeenCalled()
  })

  // バリデーションテスト - 文字数制限
  it('shows validation error when title is too long', async () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    const longTitle = 'a'.repeat(101) // 101文字

    fireEvent.change(titleInput, { target: { value: longTitle } })
    fireEvent.click(screen.getByRole('button', { name: 'TODO を追加' }))

    await waitFor(() => {
      expect(
        screen.getByText('タイトルは100文字以内で入力してください')
      ).toBeInTheDocument()
    })

    expect(mockAddTodo).not.toHaveBeenCalled()
  })

  // 正常な送信テスト
  it('calls addTodo with correct data when form is submitted', async () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    const descriptionInput = screen.getByRole('textbox', { name: /説明/ })

    fireEvent.change(titleInput, { target: { value: 'テストタイトル' } })
    fireEvent.change(descriptionInput, { target: { value: 'テスト説明' } })

    fireEvent.click(screen.getByRole('button', { name: 'TODO を追加' }))

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith({
        description: 'テスト説明',
        title: 'テストタイトル',
      })
    })
  })

  // フォームリセットテスト
  it('resets form after successful submission', async () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    const descriptionInput = screen.getByRole('textbox', { name: /説明/ })

    fireEvent.change(titleInput, { target: { value: 'テストタイトル' } })
    fireEvent.change(descriptionInput, { target: { value: 'テスト説明' } })

    fireEvent.click(screen.getByRole('button', { name: 'TODO を追加' }))

    await waitFor(() => {
      expect(titleInput).toHaveValue('')
      expect(descriptionInput).toHaveValue('')
    })
  })

  // 説明なしの送信テスト
  it('allows submission with only title', async () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    fireEvent.change(titleInput, { target: { value: 'タイトルのみ' } })

    fireEvent.click(screen.getByRole('button', { name: 'TODO を追加' }))

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith({
        description: '',
        title: 'タイトルのみ',
      })
    })
  })

  // エンターキーでの送信テスト
  it('submits form when Enter key is pressed in title field', async () => {
    renderWithMantine(<TodoAddForm />)

    const titleInput = screen.getByRole('textbox', { name: /タイトル/ })
    fireEvent.change(titleInput, { target: { value: 'エンターキーテスト' } })
    fireEvent.keyDown(titleInput, { code: 'Enter', key: 'Enter' })

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith({
        description: '',
        title: 'エンターキーテスト',
      })
    })
  })
})
