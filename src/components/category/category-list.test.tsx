import { CategoryList } from './category-list'

import { fireEvent, render, screen, waitFor } from '@/test-utils'
import { type Category } from '@/types/todo'

// useCategories フックのモック
vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(),
}))

const { useCategories: mockUseCategories } = vi.mocked(
  await import('@/hooks/use-categories')
)

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconEdit: () => <div data-testid="icon-edit" />,
  IconPlus: () => <div data-testid="icon-plus" />,
  IconTrash: () => <div data-testid="icon-trash" />,
}))

// Mantine modalsのモック
let mockConfirmCallback: (() => void) | undefined = undefined
vi.mock('@mantine/modals', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    openConfirmModal: vi.fn((options: { onConfirm?: () => void }) => {
      mockConfirmCallback = options.onConfirm
    }),
  }
})

const fixedDate = new Date('2024-01-01T00:00:00.000Z')
const mockCategories: Category[] = [
  {
    color: '#FF6B6B',
    createdAt: fixedDate,
    id: 'category-1',
    name: '仕事',
    updatedAt: fixedDate,
    userId: 'user-1',
  },
  {
    color: '#4ECDC4',
    createdAt: fixedDate,
    id: 'category-2',
    name: '個人',
    updatedAt: fixedDate,
    userId: 'user-1',
  },
]

const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()
const mockDeleteCategory = vi.fn()

const mockUseCategoriesReturn = {
  categories: mockCategories,
  clearError: vi.fn(),
  createCategory: mockCreateCategory,
  deleteCategory: mockDeleteCategory,
  error: undefined,
  isLoading: false,
  setCategories: vi.fn(),
  updateCategory: mockUpdateCategory,
}

describe('CategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirmCallback = undefined
    mockUseCategories.mockReturnValue(mockUseCategoriesReturn)
  })

  it('カテゴリ一覧が正しく表示される', () => {
    // Act
    render(<CategoryList />)

    // Assert
    expect(screen.getByText('仕事')).toBeInTheDocument()
    expect(screen.getByText('個人')).toBeInTheDocument()
  })

  it('カテゴリの色が正しく表示される', () => {
    // Act
    render(<CategoryList />)

    // Assert
    const workColorBox = screen
      .getByText('仕事')
      .closest('div')
      ?.querySelector('[data-testid="color-box"]')
    const personalColorBox = screen
      .getByText('個人')
      .closest('div')
      ?.querySelector('[data-testid="color-box"]')

    expect(workColorBox).toHaveStyle({ backgroundColor: '#FF6B6B' })
    expect(personalColorBox).toHaveStyle({ backgroundColor: '#4ECDC4' })
  })

  it('編集ボタンが各カテゴリに表示される', () => {
    // Act
    render(<CategoryList />)

    // Assert
    const editButtons = screen.getAllByTestId('icon-edit')
    expect(editButtons).toHaveLength(2)
  })

  it('削除ボタンが各カテゴリに表示される', () => {
    // Act
    render(<CategoryList />)

    // Assert
    const deleteButtons = screen.getAllByTestId('icon-trash')
    expect(deleteButtons).toHaveLength(2)
  })

  it('新しいカテゴリ追加ボタンが表示される', () => {
    // Act
    render(<CategoryList />)

    // Assert
    expect(
      screen.getByRole('button', { name: 'カテゴリを追加' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
  })

  it('削除ボタンをクリックして確認すると削除される', async () => {
    // Arrange
    mockConfirmCallback = undefined

    // Act
    render(<CategoryList />)

    const deleteButtons = screen.getAllByTestId('icon-trash')
    fireEvent.click(deleteButtons[0])

    // Mantine modalのonConfirmを実行
    expect(mockConfirmCallback).toBeDefined()
    if (mockConfirmCallback) {
      ;(mockConfirmCallback as () => void)()
    }

    // Assert
    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('category-1')
    })
  })

  it('削除ボタンをクリックしてキャンセルすると削除されない', async () => {
    // Arrange
    mockConfirmCallback = undefined

    // Act
    render(<CategoryList />)

    const deleteButtons = screen.getAllByTestId('icon-trash')
    fireEvent.click(deleteButtons[0])

    // Mantine modalが開かれたが、onConfirmは呼ばない（キャンセル）
    expect(mockConfirmCallback).toBeDefined()
    // onConfirmを呼ばないことでキャンセル動作をシミュレート

    // Assert
    expect(mockDeleteCategory).not.toHaveBeenCalled()
  })

  it('ローディング中はスケルトンが表示される', () => {
    // Arrange
    mockUseCategories.mockReturnValue({
      ...mockUseCategoriesReturn,
      isLoading: true,
    })

    // Act
    render(<CategoryList />)

    // Assert
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('カテゴリがない場合は空状態が表示される', () => {
    // Arrange
    mockUseCategories.mockReturnValue({
      ...mockUseCategoriesReturn,
      categories: [],
    })

    // Act
    render(<CategoryList />)

    // Assert
    expect(screen.getByText('カテゴリがありません')).toBeInTheDocument()
  })

  it('エラー時はエラーメッセージが表示される', () => {
    // Arrange
    mockUseCategories.mockReturnValue({
      ...mockUseCategoriesReturn,
      error: 'カテゴリの取得に失敗しました',
    })

    // Act
    render(<CategoryList />)

    // Assert
    expect(screen.getByText('カテゴリの取得に失敗しました')).toBeInTheDocument()
  })

  it('新しいカテゴリ追加ボタンをクリックすると追加モードになる', () => {
    // Act
    render(<CategoryList />)

    const addButton = screen.getByRole('button', { name: 'カテゴリを追加' })
    fireEvent.click(addButton)

    // Assert
    expect(
      screen.getByPlaceholderText('カテゴリ名を入力...')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
  })

  it('新しいカテゴリを追加できる', async () => {
    // Act
    render(<CategoryList />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: 'カテゴリを追加' })
    fireEvent.click(addButton)

    // カテゴリ名を入力
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    // 色を選択（デフォルト色）
    const colorInput = screen.getByLabelText('色')
    fireEvent.change(colorInput, { target: { value: '#45B7D1' } })

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        color: '#45B7D1',
        name: '新しいカテゴリ',
      })
    })
  })

  it('空のカテゴリ名では保存できない', async () => {
    // Act
    render(<CategoryList />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: 'カテゴリを追加' })
    fireEvent.click(addButton)

    // 保存ボタンをクリック（空のまま）
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    // Assert
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('キャンセルボタンで追加をキャンセルできる', () => {
    // Act
    render(<CategoryList />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: 'カテゴリを追加' })
    fireEvent.click(addButton)

    // カテゴリ名を入力
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    // Assert
    expect(
      screen.queryByPlaceholderText('カテゴリ名を入力...')
    ).not.toBeInTheDocument()
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('カテゴリを編集して保存できる', async () => {
    render(<CategoryList />)
    const editButtons = screen.getAllByTestId('icon-edit')
    fireEvent.click(editButtons[0])

    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '編集後' } })

    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith('category-1', {
        color: '#FF6B6B',
        name: '編集後',
      })
    })
  })

  it('編集をキャンセルすると変更されない', () => {
    render(<CategoryList />)
    const editButtons = screen.getAllByTestId('icon-edit')
    fireEvent.click(editButtons[0])

    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '編集後' } })

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    expect(
      screen.queryByPlaceholderText('カテゴリ名を入力...')
    ).not.toBeInTheDocument()
    expect(mockUpdateCategory).not.toHaveBeenCalled()
  })

  it('カテゴリ作成エラー時にconsole.errorが呼ばれる', async () => {
    mockCreateCategory.mockRejectedValueOnce(new Error('err'))
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    render(<CategoryList />)
    const addButton = screen.getByRole('button', { name: 'カテゴリを追加' })
    fireEvent.click(addButton)
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: 'abc' } })
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled()
    })
    errorSpy.mockRestore()
  })

  it('カテゴリ更新エラー時にconsole.errorが呼ばれる', async () => {
    mockUpdateCategory.mockRejectedValueOnce(new Error('err'))
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    render(<CategoryList />)
    const editButtons = screen.getAllByTestId('icon-edit')
    fireEvent.click(editButtons[0])
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled()
    })
    errorSpy.mockRestore()
  })

  it('カテゴリ削除エラー時にconsole.errorが呼ばれる', async () => {
    mockDeleteCategory.mockRejectedValueOnce(new Error('err'))
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    render(<CategoryList />)
    const deleteButtons = screen.getAllByTestId('icon-trash')
    fireEvent.click(deleteButtons[0])
    if (mockConfirmCallback) mockConfirmCallback()

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled()
    })
    errorSpy.mockRestore()
  })
})
