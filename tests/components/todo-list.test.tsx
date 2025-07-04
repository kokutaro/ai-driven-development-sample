import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TodoList } from '@/components/features/todo/todo-list'
import type { Todo } from '@/types/todo'

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

// ストアのモック化
const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'テストTodo1',
    description: 'テスト用の説明1',
    completed: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    title: 'テストTodo2',
    description: 'テスト用の説明2',
    completed: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
]

const mockStoreState = {
  todos: mockTodos,
  loading: false,
  error: null as string | null,
  fetchTodos: vi.fn(),
  addTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  toggleTodo: vi.fn(),
  setError: vi.fn(),
}

// useTodoStoreのモック化
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(() => mockStoreState),
}))

/**
 * TodoListコンポーネントのテスト
 *
 * @description TodoListコンポーネントの機能テスト
 * - 初期表示とデータ取得
 * - ローディング状態の表示
 * - エラー状態の表示
 * - 空のリスト表示
 * - Todoアイテムの表示
 * - 各種イベントハンドラーの動作
 */
describe('TodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトの状態をリセット
    mockStoreState.todos = mockTodos
    mockStoreState.loading = false
    mockStoreState.error = null
  })

  it('初期表示時にfetchTodosが呼ばれる', () => {
    render(<TodoList />, { wrapper: TestWrapper })

    expect(mockStoreState.fetchTodos).toHaveBeenCalledTimes(1)
  })

  it('Todoアイテムが正しく表示される', () => {
    render(<TodoList />, { wrapper: TestWrapper })

    expect(screen.getByText('新しいTodoを追加')).toBeInTheDocument()
    expect(screen.getByText('Todoリスト (2件)')).toBeInTheDocument()
    expect(screen.getByText('テストTodo1')).toBeInTheDocument()
    expect(screen.getByText('テストTodo2')).toBeInTheDocument()
  })

  it('ローディング状態が正しく表示される', () => {
    mockStoreState.loading = true
    mockStoreState.todos = []

    render(<TodoList />, { wrapper: TestWrapper })

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('エラー状態が正しく表示される', () => {
    mockStoreState.error = 'テストエラーメッセージ'

    render(<TodoList />, { wrapper: TestWrapper })

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '再読み込み' })
    ).toBeInTheDocument()
  })

  it('空のリスト状態が正しく表示される', () => {
    mockStoreState.todos = []

    render(<TodoList />, { wrapper: TestWrapper })

    expect(screen.getByText('Todoリスト (0件)')).toBeInTheDocument()
    expect(
      screen.getByText(
        'まだTodoがありません。上のフォームから新しいTodoを追加してください。'
      )
    ).toBeInTheDocument()
  })

  it('エラー時の再読み込みボタンが動作する', async () => {
    mockStoreState.error = 'テストエラーメッセージ'
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const refreshButton = screen.getByRole('button', { name: '再読み込み' })
    await user.click(refreshButton)

    expect(mockStoreState.setError).toHaveBeenCalledWith(null)
    expect(mockStoreState.fetchTodos).toHaveBeenCalledTimes(2) // 初期表示 + 再読み込み
  })

  it('ヘッダーの更新ボタンが動作する', async () => {
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const updateButton = screen.getByRole('button', { name: '更新' })
    await user.click(updateButton)

    expect(mockStoreState.fetchTodos).toHaveBeenCalledTimes(2) // 初期表示 + 更新
  })

  it('TodoFormの送信でaddTodoが呼ばれる', async () => {
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const titleInput =
      screen.getByPlaceholderText('Todoのタイトルを入力してください')
    const submitButton = screen.getByRole('button', { name: '追加' })

    await user.type(titleInput, '新しいTodo')
    await user.click(submitButton)

    expect(mockStoreState.addTodo).toHaveBeenCalledWith({
      title: '新しいTodo',
      description: undefined,
      completed: false,
    })
  })

  it('TodoItemのチェックボックスでtoggleTodoが呼ばれる', async () => {
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(mockStoreState.toggleTodo).toHaveBeenCalledWith('1')
  })

  it('TodoItemの削除でdeleteTodoが呼ばれる', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const deleteButtons = screen.getAllByLabelText('削除')
    await user.click(deleteButtons[0])

    expect(mockStoreState.deleteTodo).toHaveBeenCalledWith('1')

    confirmSpy.mockRestore()
  })

  it('TodoItemの編集でupdateTodoが呼ばれる', async () => {
    const user = userEvent.setup()

    render(<TodoList />, { wrapper: TestWrapper })

    const editButtons = screen.getAllByLabelText('編集')
    await user.click(editButtons[0])

    const titleInput = screen.getByDisplayValue('テストTodo1')
    await user.clear(titleInput)
    await user.type(titleInput, '更新されたTodo')

    const saveButton = screen.getByRole('button', { name: '保存' })
    await user.click(saveButton)

    expect(mockStoreState.updateTodo).toHaveBeenCalledWith('1', {
      title: '更新されたTodo',
      description: 'テスト用の説明1',
    })
  })

  it('ローディング中は更新ボタンが無効化される', () => {
    mockStoreState.loading = true

    render(<TodoList />, { wrapper: TestWrapper })

    const updateButton = screen.getByRole('button', { name: '更新' })
    expect(updateButton).toHaveAttribute('data-loading', 'true')
  })

  it('ローディング中でもTodoアイテムが表示される', () => {
    mockStoreState.loading = true

    render(<TodoList />, { wrapper: TestWrapper })

    expect(screen.getByText('テストTodo1')).toBeInTheDocument()
    expect(screen.getByText('テストTodo2')).toBeInTheDocument()
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument()
  })

  it('Todoアイテムが正しい順序で表示される', () => {
    render(<TodoList />, { wrapper: TestWrapper })

    const todoItems = screen.getAllByText(/テストTodo/)
    expect(todoItems[0]).toHaveTextContent('テストTodo1')
    expect(todoItems[1]).toHaveTextContent('テストTodo2')
  })

  it('フォームのローディング状態が正しく渡される', () => {
    mockStoreState.loading = true

    render(<TodoList />, { wrapper: TestWrapper })

    const submitButton = screen.getByRole('button', { name: '追加' })
    expect(submitButton).toHaveAttribute('data-loading', 'true')
  })
})
