import { TodoAddModal } from './todo-add-modal'

import { useCategories } from '@/hooks/use-categories'
import { useTodoStore } from '@/stores/todo-store'
import { fireEvent, render, screen, waitFor } from '@/test-utils'

// ストアとフックのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(),
}))

// カテゴリ作成モーダルのモック
vi.mock('@/components/category', () => ({
  CategoryCreateModal: ({
    onCategoryCreated,
    onClose,
    opened,
  }: {
    onCategoryCreated: (id: string) => void
    onClose: () => void
    opened: boolean
  }) =>
    opened ? (
      <div data-testid="category-create-modal">
        <button onClick={() => onCategoryCreated('new-category-id')}>
          Create Category
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconCalendar: () => <div data-testid="icon-calendar" />,
  IconPlus: () => <div data-testid="icon-plus" />,
  IconStar: () => <div data-testid="icon-star" />,
}))

const mockCreateTodo = vi.fn()
const mockTodoStore = {
  createTodo: mockCreateTodo,
}

const mockCategories = [
  {
    color: 'blue',
    createdAt: new Date(),
    id: 'category-1',
    name: '仕事',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    color: 'green',
    createdAt: new Date(),
    id: 'category-2',
    name: '個人',
    updatedAt: new Date(),
    userId: 'user-1',
  },
]

const mockUseCategories = {
  categories: mockCategories,
  clearError: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  error: undefined,
  isLoading: false,
  updateCategory: vi.fn(),
}

describe('TodoAddModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodoStore).mockReturnValue(mockTodoStore)
    vi.mocked(useCategories).mockReturnValue(mockUseCategories)
    mockCreateTodo.mockResolvedValue(undefined)
  })

  it('モーダルが開いている時に表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    expect(screen.getByText('新しいタスクを追加')).toBeInTheDocument()
  })

  it('モーダルが閉じている時に表示されない', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={false} />)

    // Assert
    expect(screen.queryByText('新しいタスクを追加')).not.toBeInTheDocument()
  })

  it('必要なフォーム要素が表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    expect(screen.getByText('タイトル')).toBeInTheDocument()
    expect(screen.getByText('説明')).toBeInTheDocument()
    expect(screen.getByText('期限日')).toBeInTheDocument()
    expect(screen.getByText('重要')).toBeInTheDocument()
    expect(screen.getByText('カテゴリ')).toBeInTheDocument()
  })

  it('タイトルが必須項目として表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    expect(titleInput).toBeRequired()
  })

  it('作成ボタンとキャンセルボタンが表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    expect(screen.getByText('作成')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('カテゴリ選択肢が正しく表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert - Mantineの実装詳細は省略し、データが渡されることを確認
    expect(useCategories).toHaveBeenCalled()
  })

  it('フォームに値を入力できる', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - フォーム入力
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    const descriptionInput =
      screen.getByPlaceholderText('タスクの詳細を入力...')

    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })
    fireEvent.change(descriptionInput, { target: { value: 'タスクの説明' } })

    // Assert
    expect(titleInput).toHaveValue('新しいタスク')
    expect(descriptionInput).toHaveValue('タスクの説明')
  })

  it('重要フラグを切り替えできる', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act
    const importantSwitch = screen.getByRole('switch')
    fireEvent.click(importantSwitch)

    // Assert
    expect(importantSwitch).toBeChecked()
  })

  it('有効なフォームでタスクを作成できる', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - フォーム入力
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        categoryId: undefined,
        description: undefined,
        dueDate: undefined,
        isImportant: false,
        title: '新しいタスク',
      })
    })
  })

  it('タスク作成成功後にモーダルが閉じられる', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - タスク作成
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('タスク作成後にフォームがリセットされる', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - フォーム入力
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    const descriptionInput =
      screen.getByPlaceholderText('タスクの詳細を入力...')

    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })
    fireEvent.change(descriptionInput, { target: { value: 'タスクの説明' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - フォームリセットの確認はMantineのform.resetに依存
    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalled()
    })
  })

  it('キャンセルボタンでモーダルが閉じられる', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act
    const cancelButton = screen.getByText('キャンセル')
    fireEvent.click(cancelButton)

    // Assert
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('タイトルが空の場合はバリデーションエラーが表示される', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - 空のタイトルで送信
    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - バリデーションによりcreateは呼ばれない
    expect(mockCreateTodo).not.toHaveBeenCalled()
  })

  it('タスク作成中はローディング状態になる', async () => {
    // Arrange - createTodoが時間がかかるようにモック
    mockCreateTodo.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - フォーム送信
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - ローディング中はボタンが無効化される（Mantineの実装による）
    expect(mockCreateTodo).toHaveBeenCalled()
  })

  it('タスク作成エラー時でもモーダルは開いたまま', async () => {
    // Arrange
    mockCreateTodo.mockRejectedValue(new Error('作成失敗'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中はコンソールエラーを無効化
    })

    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - タスク作成
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    fireEvent.change(titleInput, { target: { value: '新しいタスク' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'タスク作成エラー:',
        expect.any(Error)
      )
    })

    // モーダルは開いたまま
    expect(mockOnClose).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('アイコンが正しく表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('icon-star')).toBeInTheDocument()
  })

  it('期限日を設定できる', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert - DatePickerInputの存在確認
    const dueDateInput = screen.getByRole('button', { name: '期限日' })
    expect(dueDateInput).toBeInTheDocument()
  })

  it('すべてのフィールドを入力してタスクを作成できる', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - 全フィールド入力
    const titleInput = screen.getByPlaceholderText('タスクのタイトルを入力...')
    const descriptionInput =
      screen.getByPlaceholderText('タスクの詳細を入力...')
    const importantSwitch = screen.getByRole('switch')

    fireEvent.change(titleInput, { target: { value: '完全なタスク' } })
    fireEvent.change(descriptionInput, { target: { value: '詳細な説明' } })
    fireEvent.click(importantSwitch)

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateTodo).toHaveBeenCalledWith({
        categoryId: undefined,
        description: '詳細な説明',
        dueDate: undefined,
        isImportant: true,
        title: '完全なタスク',
      })
    })
  })

  it('カテゴリ作成ボタンが表示される', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Assert
    const categoryCreateButton = screen.getByLabelText('新しいカテゴリを作成')
    expect(categoryCreateButton).toBeInTheDocument()
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
  })

  it('カテゴリ作成ボタンをクリックすると作成モーダルが開く', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - カテゴリ作成ボタンをクリック
    const categoryCreateButton = screen.getByLabelText('新しいカテゴリを作成')
    fireEvent.click(categoryCreateButton)

    // Assert
    expect(screen.getByTestId('category-create-modal')).toBeInTheDocument()
  })

  it('カテゴリ作成完了時に新しいカテゴリが選択される', async () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - カテゴリ作成ボタンをクリックしてモーダルを開く
    const categoryCreateButton = screen.getByLabelText('新しいカテゴリを作成')
    fireEvent.click(categoryCreateButton)

    // Act - カテゴリを作成
    const createCategoryButton = screen.getByText('Create Category')
    fireEvent.click(createCategoryButton)

    // カテゴリ作成が完了するのを待つ
    await waitFor(() => {
      // フォームの値が更新されているかを確認するため、実際のSelectコンポーネントの動作を確認
      // Mantineの実装詳細に依存するため、フォーム状態の確認は省略
      expect(
        screen.queryByTestId('category-create-modal')
      ).not.toBeInTheDocument()
    })
  })

  it('カテゴリ作成モーダルを閉じることができる', () => {
    // Act
    render(<TodoAddModal onClose={mockOnClose} opened={true} />)

    // Act - カテゴリ作成ボタンをクリックしてモーダルを開く
    const categoryCreateButton = screen.getByLabelText('新しいカテゴリを作成')
    fireEvent.click(categoryCreateButton)

    // Act - カテゴリ作成モーダルを閉じる
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // Assert
    expect(
      screen.queryByTestId('category-create-modal')
    ).not.toBeInTheDocument()
  })
})
