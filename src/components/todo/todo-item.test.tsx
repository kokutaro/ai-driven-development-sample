import { TodoItem } from './todo-item'

import { formatDate } from '@/lib/utils'
import { useTodoStore } from '@/stores/todo-store'
import { useUiStore } from '@/stores/ui-store'
import { fireEvent, render, screen } from '@/test-utils'

// ストアのモック
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: vi.fn(),
}))

vi.mock('@/stores/ui-store', () => ({
  useUiStore: vi.fn(),
}))

// utils関数のモック
vi.mock('@/lib/utils', () => ({
  formatDate: vi.fn(),
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconCalendar: () => <div data-testid="icon-calendar" />,
  IconStar: () => <div data-testid="icon-star" />,
  IconTrash: () => <div data-testid="icon-trash" />,
}))

// window.confirmのモック
const mockConfirm = vi.fn()
Object.defineProperty(globalThis, 'confirm', {
  value: mockConfirm,
  writable: true,
})

const mockToggleTodo = vi.fn()
const mockDeleteTodo = vi.fn()
const mockSetSelectedTodo = vi.fn()

const mockTodoStore = {
  deleteTodo: mockDeleteTodo,
  toggleTodo: mockToggleTodo,
}

const mockUiStore = {
  selectedTodo: undefined,
  setSelectedTodo: mockSetSelectedTodo,
}

const mockTodo = {
  category: {
    color: 'blue',
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

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTodoStore).mockReturnValue(mockTodoStore)
    vi.mocked(useUiStore).mockReturnValue(mockUiStore)
    vi.mocked(formatDate).mockReturnValue('2024年1月15日')
    mockConfirm.mockReturnValue(true)
  })

  it('基本的なタスク情報が正しく表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    expect(screen.getByText('テストタスク')).toBeInTheDocument()
    expect(screen.getByText('テスト用の説明')).toBeInTheDocument()
    expect(screen.getByText('2024年1月15日')).toBeInTheDocument()
  })

  it('チェックボックスが正しく表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('完了済みタスクでチェックボックスがチェック状態になる', () => {
    // Arrange
    const completedTodo = { ...mockTodo, isCompleted: true }

    // Act
    render(<TodoItem todo={completedTodo} />)

    // Assert
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('重要なタスクで星アイコンが表示される', () => {
    // Arrange
    const importantTodo = { ...mockTodo, isImportant: true }

    // Act
    render(<TodoItem todo={importantTodo} />)

    // Assert
    expect(screen.getByTestId('icon-star')).toBeInTheDocument()
  })

  it('重要でないタスクで星アイコンが表示されない', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    expect(screen.queryByTestId('icon-star')).not.toBeInTheDocument()
  })

  it('期限日がある場合はカレンダーアイコンと日付が表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
    expect(screen.getByText('2024年1月15日')).toBeInTheDocument()
  })

  it('期限日がない場合はカレンダーアイコンと日付が表示されない', () => {
    // Arrange
    const todoWithoutDueDate = { ...mockTodo, dueDate: undefined }

    // Act
    render(<TodoItem todo={todoWithoutDueDate} />)

    // Assert
    expect(screen.queryByTestId('icon-calendar')).not.toBeInTheDocument()
    expect(screen.queryByText('2024年1月15日')).not.toBeInTheDocument()
  })

  it('カテゴリがある場合はバッジが表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    expect(screen.getByText('仕事')).toBeInTheDocument()
  })

  it('カテゴリがない場合はバッジが表示されない', () => {
    // Arrange
    const todoWithoutCategory = {
      ...mockTodo,
      category: undefined,
      categoryId: undefined,
    }

    // Act
    render(<TodoItem todo={todoWithoutCategory} />)

    // Assert
    expect(screen.queryByText('仕事')).not.toBeInTheDocument()
  })

  it('削除ボタンが表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    expect(screen.getByTestId('icon-trash')).toBeInTheDocument()
  })

  it('チェックボックスをクリックするとtoggleTodoが呼ばれる', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // Assert
    expect(mockToggleTodo).toHaveBeenCalledWith('todo-1')
  })

  it('削除ボタンをクリックして確認すると削除される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const deleteButton = screen.getByTestId('icon-trash')
    fireEvent.click(deleteButton)

    // Assert
    expect(mockConfirm).toHaveBeenCalledWith('このタスクを削除しますか？')
    expect(mockDeleteTodo).toHaveBeenCalledWith('todo-1')
  })

  it('削除ボタンをクリックしてキャンセルすると削除されない', () => {
    // Arrange
    mockConfirm.mockReturnValue(false)

    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const deleteButton = screen.getByTestId('icon-trash')
    fireEvent.click(deleteButton)

    // Assert
    expect(mockConfirm).toHaveBeenCalledWith('このタスクを削除しますか？')
    expect(mockDeleteTodo).not.toHaveBeenCalled()
  })

  it('タスクカードをクリックするとsetSelectedTodoが呼ばれる', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const card = screen.getByText('テストタスク').closest('.mantine-Card-root')
    fireEvent.click(card!)

    // Assert
    expect(mockSetSelectedTodo).toHaveBeenCalledWith(mockTodo)
  })

  it('選択されたタスクでハイライト表示される', () => {
    // Arrange
    const selectedUiStore = { ...mockUiStore, selectedTodo: mockTodo }
    vi.mocked(useUiStore).mockReturnValue(selectedUiStore)

    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    const card = screen.getByText('テストタスク').closest('.mantine-Card-root')
    expect(card).toHaveStyle({
      backgroundColor: 'var(--mantine-color-blue-0)',
      borderColor: 'var(--mantine-color-blue-6)',
    })
  })

  it('選択されていないタスクで通常表示される', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    const card = screen.getByText('テストタスク').closest('.mantine-Card-root')
    expect(card).not.toHaveStyle({
      backgroundColor: 'var(--mantine-color-blue-0)',
    })
  })

  it('完了済みタスクでテキストに取り消し線が表示される', () => {
    // Arrange
    const completedTodo = { ...mockTodo, isCompleted: true }

    // Act
    render(<TodoItem todo={completedTodo} />)

    // Assert
    const titleElement = screen.getByText('テストタスク')
    expect(titleElement).toHaveStyle({
      color: 'var(--mantine-color-dimmed)',
      textDecoration: 'line-through',
    })
  })

  it('未完了タスクでテキストに取り消し線が表示されない', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Assert
    const titleElement = screen.getByText('テストタスク')
    expect(titleElement).toHaveStyle({
      textDecoration: 'none',
    })
  })

  it('期限切れタスクで赤色表示される', () => {
    // Arrange
    const overdueTodo = {
      ...mockTodo,
      dueDate: new Date('2023-01-15'), // 過去の日付
      isCompleted: false,
    }

    vi.mocked(formatDate).mockReturnValue('2023年1月15日')

    // Act
    render(<TodoItem todo={overdueTodo} />)

    // Assert
    const dateElement = screen.getByText('2023年1月15日')
    expect(dateElement).toHaveStyle({
      color: 'var(--mantine-color-red-text)',
    })
  })

  it('期限内タスクで通常色表示される', () => {
    // Arrange
    const futureTodo = {
      ...mockTodo,
      dueDate: new Date('2030-01-15'), // 明らかに未来の日付
      isCompleted: false,
    }

    vi.mocked(formatDate).mockReturnValue('2030年1月15日')

    // Act
    render(<TodoItem todo={futureTodo} />)

    // Assert
    const dateElement = screen.getByText('2030年1月15日')
    expect(dateElement).toHaveStyle({
      color: 'var(--mantine-color-dimmed)',
    })
  })

  it('完了済みタスクは期限切れでも赤色表示されない', () => {
    // Arrange
    const completedOverdueTodo = {
      ...mockTodo,
      dueDate: new Date('2023-01-15'), // 過去の日付
      isCompleted: true,
    }

    vi.mocked(formatDate).mockReturnValue('2023年1月15日')

    // Act
    render(<TodoItem todo={completedOverdueTodo} />)

    // Assert
    const dateElement = screen.getByText('2023年1月15日')
    expect(dateElement).toHaveStyle({
      color: 'var(--mantine-color-dimmed)',
    })
  })

  it('説明がない場合は説明が表示されない', () => {
    // Arrange
    const todoWithoutDescription = { ...mockTodo, description: undefined }

    // Act
    render(<TodoItem todo={todoWithoutDescription} />)

    // Assert
    expect(screen.queryByText('テスト用の説明')).not.toBeInTheDocument()
  })

  it('チェックボックスクリック時にカードクリックイベントが伝播しない', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // Assert
    expect(mockSetSelectedTodo).not.toHaveBeenCalled()
  })

  it('削除ボタンクリック時にカードクリックイベントが伝播しない', () => {
    // Act
    render(<TodoItem todo={mockTodo} />)

    // Act
    const deleteButton = screen.getByTestId('icon-trash')
    fireEvent.click(deleteButton)

    // Assert
    expect(mockSetSelectedTodo).not.toHaveBeenCalled()
  })
})
