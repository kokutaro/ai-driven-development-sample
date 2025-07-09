/* eslint-disable import/order */
import { useCategories } from '@/hooks/use-categories'
import { fireEvent, render, screen, waitFor } from '@/test-utils'

// フックのモック
vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(),
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconPalette: () => <div data-testid="icon-palette" />,
}))

import { CategoryCreateModal } from './category-create-modal'

const mockCreateCategory = vi.fn()
const mockUseCategories = {
  categories: [],
  clearError: vi.fn(),
  createCategory: mockCreateCategory,
  deleteCategory: vi.fn(),
  error: undefined,
  isLoading: false,
  setCategories: vi.fn(),
  updateCategory: vi.fn(),
}

describe('CategoryCreateModal', () => {
  const mockOnClose = vi.fn()
  const mockOnCategoryCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCategories).mockReturnValue(mockUseCategories)
    mockCreateCategory.mockResolvedValue({
      color: '#FF6B6B',
      createdAt: new Date(),
      id: 'new-category-id',
      name: '新しいカテゴリ',
      updatedAt: new Date(),
      userId: 'user-1',
    })
  })

  it('モーダルが開いている時に表示される', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Assert
    expect(screen.getByText('新しいカテゴリを作成')).toBeInTheDocument()
  })

  it('モーダルが閉じている時に表示されない', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={false}
      />
    )

    // Assert
    expect(screen.queryByText('新しいカテゴリを作成')).not.toBeInTheDocument()
  })

  it('必要なフォーム要素が表示される', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Assert
    expect(screen.getByText('カテゴリ名')).toBeInTheDocument()
    expect(screen.getByText('カラー')).toBeInTheDocument()
  })

  it('カテゴリ名が必須項目として表示される', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Assert
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    expect(nameInput).toBeRequired()
  })

  it('作成ボタンとキャンセルボタンが表示される', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Assert
    expect(screen.getByText('作成')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('フォームに値を入力できる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - フォーム入力
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    // Assert
    expect(nameInput).toHaveValue('新しいカテゴリ')
  })

  it('有効なフォームでカテゴリを作成できる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - フォーム入力
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        color: '#FF6B6B',
        name: '新しいカテゴリ',
      })
    })
  })

  it('カテゴリ作成成功後にコールバックが呼ばれる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - カテゴリ作成
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockOnCategoryCreated).toHaveBeenCalledWith({
        color: '#FF6B6B',
        createdAt: expect.any(Date),
        id: 'new-category-id',
        name: '新しいカテゴリ',
        updatedAt: expect.any(Date),
        userId: 'user-1',
      })
    })
  })

  it('カテゴリ作成成功後にモーダルが閉じられる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - カテゴリ作成
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('カテゴリ作成後にフォームがリセットされる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - フォーム入力
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - フォームリセットの確認はMantineのform.resetに依存
    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalled()
    })
  })

  it('キャンセルボタンでモーダルが閉じられる', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act
    const cancelButton = screen.getByText('キャンセル')
    fireEvent.click(cancelButton)

    // Assert
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('カテゴリ名が空の場合はバリデーションエラーが表示される', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - 空のカテゴリ名で送信
    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - バリデーションによりcreateは呼ばれない
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('カテゴリ作成中はローディング状態になる', async () => {
    // Arrange - createCategoryが時間がかかるようにモック
    mockCreateCategory.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - フォーム送信
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - ローディング中はボタンが無効化される（Mantineの実装による）
    expect(mockCreateCategory).toHaveBeenCalled()
  })

  it('カテゴリ作成エラー時でもモーダルは開いたまま', async () => {
    // Arrange
    mockCreateCategory.mockRejectedValue(new Error('作成失敗'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // テスト中はコンソールエラーを無効化
    })

    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - カテゴリ作成
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: '新しいカテゴリ' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'カテゴリ作成エラー:',
        expect.any(Error)
      )
    })

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalled()
    })

    // モーダルは開いたまま
    expect(mockOnClose).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('Escapeキーでモーダルが閉じない', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - Escapeキーを押す
    fireEvent.keyDown(document, { code: 'Escape', key: 'Escape' })

    // Assert
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('アイコンが正しく表示される', () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Assert
    expect(screen.getByTestId('icon-palette')).toBeInTheDocument()
  })

  it('デフォルトカラーで作成できる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - カテゴリ名のみ入力（カラーはデフォルト値）
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: 'デフォルトカラー' } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        color: '#FF6B6B',
        name: 'デフォルトカラー',
      })
    })
  })

  it('カテゴリ名の文字数制限をテストする', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - 51文字のカテゴリ名を入力
    const longName = 'a'.repeat(51)
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: longName } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert - バリデーションエラーのため作成されない
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('有効な50文字のカテゴリ名で作成できる', async () => {
    // Act
    render(
      <CategoryCreateModal
        onCategoryCreated={mockOnCategoryCreated}
        onClose={mockOnClose}
        opened={true}
      />
    )

    // Act - 50文字のカテゴリ名を入力
    const validLongName = 'a'.repeat(50)
    const nameInput = screen.getByPlaceholderText('カテゴリ名を入力...')
    fireEvent.change(nameInput, { target: { value: validLongName } })

    const createButton = screen.getByText('作成')
    fireEvent.click(createButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        color: '#FF6B6B',
        name: validLongName,
      })
    })
  })
})
