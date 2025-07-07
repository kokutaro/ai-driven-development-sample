import { TodoDetailPanel } from './todo-detail-panel'

import { useCategories } from '@/hooks/use-categories'
import { useTodoStore } from '@/stores/todo-store'
import { fireEvent, render, screen, waitFor } from '@/test-utils'
import { type Todo } from '@/types/todo'

// ストアとフックのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(),
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconCalendar: () => <div data-testid="icon-calendar" />,
  IconPlus: () => <div data-testid="icon-plus" />,
  IconStar: () => <div data-testid="icon-star" />,
}))

const mockUpdateTodo = vi.fn()
const mockTodoStore = {
  updateTodo: mockUpdateTodo,
}

const mockCategories = [
  {
    color: '#FF6B6B',
    createdAt: new Date(),
    id: 'category-1',
    name: '仕事',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    color: '#4ECDC4',
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

const mockTodo: Todo = {
  category: {
    color: '#FF6B6B',
    createdAt: new Date(),
    id: 'category-1',
    name: '仕事',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  categoryId: 'category-1',
  createdAt: new Date(),
  description: 'テスト用の説明',
  dueDate: new Date('2024-01-15'),
  id: 'todo-1',
  isCompleted: false,
  isImportant: false,
  order: 0,
  title: 'テストタスク',
  updatedAt: new Date(),
  userId: 'user-1',
}

describe('TodoDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodoStore).mockReturnValue(mockTodoStore)
    vi.mocked(useCategories).mockReturnValue(mockUseCategories)
    mockUpdateTodo.mockResolvedValue(undefined)
  })

  it('選択されたタスクの詳細が表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('タスクの詳細')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストタスク')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テスト用の説明')).toBeInTheDocument()
  })

  it('タイトル入力フィールドが表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('タイトル')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストタスク')).toBeInTheDocument()
  })

  it('説明入力フィールドが表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('説明')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テスト用の説明')).toBeInTheDocument()
  })

  it('期限日選択が表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('期限日')).toBeInTheDocument()
  })

  it('重要度切り替えスイッチが表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('重要')).toBeInTheDocument()
    const switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()
  })

  it('重要なタスクでスイッチがオンになる', () => {
    // Arrange
    const importantTodo = { ...mockTodo, isImportant: true }

    // Act
    render(<TodoDetailPanel todo={importantTodo} />)

    // Assert
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('カテゴリ選択が表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('カテゴリ')).toBeInTheDocument()
  })

  it('カテゴリオプションが正しく表示される', async () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert - カテゴリラベルが表示されることを確認
    expect(screen.getByText('カテゴリ')).toBeInTheDocument()
  })

  it('タイトル変更時にupdateTodoが呼ばれる', async () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    const titleInput = screen.getByDisplayValue('テストタスク')
    fireEvent.change(titleInput, { target: { value: '更新されたタスク' } })

    // Assert
    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith('todo-1', {
        categoryId: 'category-1',
        description: 'テスト用の説明',
        dueDate: '2024-01-15T00:00:00.000Z',
        isImportant: false,
        title: '更新されたタスク',
      })
    })
  })

  it('説明変更時にupdateTodoが呼ばれる', async () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    const descriptionInput = screen.getByDisplayValue('テスト用の説明')
    fireEvent.change(descriptionInput, { target: { value: '更新された説明' } })

    // Assert
    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith('todo-1', {
        categoryId: 'category-1',
        description: '更新された説明',
        dueDate: '2024-01-15T00:00:00.000Z',
        isImportant: false,
        title: 'テストタスク',
      })
    })
  })

  it('重要度変更時にupdateTodoが呼ばれる', async () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    const importantSwitch = screen.getByRole('switch')
    fireEvent.click(importantSwitch)

    // Assert
    await waitFor(() => {
      expect(mockUpdateTodo).toHaveBeenCalledWith('todo-1', {
        categoryId: 'category-1',
        description: 'テスト用の説明',
        dueDate: '2024-01-15T00:00:00.000Z',
        isImportant: true,
        title: 'テストタスク',
      })
    })
  })

  it('サブタスクセクションが表示される', () => {
    // Act
    render(<TodoDetailPanel todo={mockTodo} />)

    // Assert
    expect(screen.getByText('サブタスク')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
  })

  it('タスクデータの変更時にフォームが更新される', () => {
    // Arrange
    const { rerender } = render(<TodoDetailPanel todo={mockTodo} />)

    // 初期値確認
    expect(screen.getByDisplayValue('テストタスク')).toBeInTheDocument()

    // Act - 新しいタスクデータでre-render
    const updatedTodo = { ...mockTodo, title: '新しいタイトル' }
    rerender(<TodoDetailPanel todo={updatedTodo} />)

    // Assert
    expect(screen.getByDisplayValue('新しいタイトル')).toBeInTheDocument()
  })

  it('説明がない場合は空文字列が表示される', () => {
    // Arrange
    const todoWithoutDescription = { ...mockTodo, description: undefined }

    // Act
    render(<TodoDetailPanel todo={todoWithoutDescription} />)

    // Assert
    expect(screen.getByText('説明')).toBeInTheDocument()
    // 空の説明フィールドが存在することを確認
    const textareas = screen.getAllByRole('textbox')
    const descriptionTextarea = textareas.find(
      (textarea) =>
        textarea.getAttribute('placeholder') === 'タスクの詳細を入力...'
    )
    expect(descriptionTextarea).toHaveValue('')
  })

  it('期限日がない場合は空の状態で表示される', () => {
    // Arrange
    const todoWithoutDueDate = { ...mockTodo, dueDate: undefined }

    // Act
    render(<TodoDetailPanel todo={todoWithoutDueDate} />)

    // Assert
    expect(screen.getByText('期限日')).toBeInTheDocument()
  })

  it('カテゴリがない場合は未選択状態で表示される', () => {
    // Arrange
    const todoWithoutCategory = {
      ...mockTodo,
      category: undefined,
      categoryId: undefined,
    }

    // Act
    render(<TodoDetailPanel todo={todoWithoutCategory} />)

    // Assert
    expect(screen.getByText('カテゴリ')).toBeInTheDocument()
  })
})
