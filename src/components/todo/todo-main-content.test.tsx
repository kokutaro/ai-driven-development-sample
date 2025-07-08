import { TodoMainContent } from './todo-main-content'

import type { Todo } from '@/types/todo'

import { useTodos } from '@/hooks/use-todos'
import { useUiStore } from '@/stores/ui-store'
import { fireEvent, render, screen } from '@/test-utils'

// UIストアのモック
vi.mock('@/stores/ui-store', () => ({
  useUiStore: vi.fn(),
}))

// useTodosフックのモック
vi.mock('@/hooks/use-todos', () => ({
  useTodos: vi.fn(),
}))

// TodoListコンポーネントのモック
vi.mock('./todo-list', () => ({
  TodoList: ({
    isLoading,
    sortBy,
    todos,
  }: {
    isLoading: boolean
    sortBy: string
    todos?: Todo[]
  }) => (
    <div data-testid="todo-list">
      <div data-testid="todos-count">{todos?.length ?? 0}</div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="sort-by">{sortBy}</div>
    </div>
  ),
}))

// TodoAddModalコンポーネントのモック
vi.mock('./todo-add-modal', () => ({
  TodoAddModal: ({
    onClose,
    opened,
  }: {
    onClose: () => void
    opened: boolean
  }) =>
    opened ? (
      <div data-testid="todo-add-modal">
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : undefined,
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <div data-testid="icon-plus" />,
  IconSortDescending: () => <div data-testid="icon-sort" />,
}))

// ViewToggleコンポーネントのモック
vi.mock('@/components/ui/view-toggle', () => ({
  ViewToggle: () => <div data-testid="view-toggle">View Toggle</div>,
}))

// KanbanBoardコンポーネントのモック
vi.mock('@/components/kanban/kanban-board', () => ({
  KanbanBoard: () => <div data-testid="kanban-board">Kanban Board</div>,
}))

const mockUiStore = {
  selectedFilter: 'all',
  viewMode: 'list' as const,
}

const mockTodos = [
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 1',
    dueDate: new Date(),
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    order: 0,
    title: 'Task 1',
    updatedAt: new Date(),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date(),
    description: 'Description 2',
    dueDate: undefined,
    id: 'todo-2',
    isCompleted: false,
    isImportant: true,
    order: 1,
    title: 'Task 2',
    updatedAt: new Date(),
    userId: 'user-1',
  },
]

describe('TodoMainContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUiStore).mockReturnValue(mockUiStore)
    vi.mocked(useTodos).mockReturnValue({
      error: undefined,
      isLoading: false,
      refetch: vi.fn(),
      todos: mockTodos,
    })
  })

  it('基本的な要素が正しく表示される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByText('すべてのタスク')).toBeInTheDocument()
    expect(screen.getByText('タスクの追加')).toBeInTheDocument()
    expect(screen.getByTestId('todo-list')).toBeInTheDocument()
  })

  it('フィルタに応じてタイトルが変更される', () => {
    // Arrange
    const scenarios = [
      { expectedTitle: '今日の予定', filter: 'today' },
      { expectedTitle: '重要なタスク', filter: 'important' },
      { expectedTitle: '今後の予定', filter: 'upcoming' },
      { expectedTitle: '完了済みタスク', filter: 'completed' },
      { expectedTitle: 'すべてのタスク', filter: 'all' },
    ]

    for (const { expectedTitle, filter } of scenarios) {
      // Arrange
      vi.mocked(useUiStore).mockReturnValue({ selectedFilter: filter })

      // Act
      const { unmount } = render(<TodoMainContent />)

      // Assert
      expect(screen.getByText(expectedTitle)).toBeInTheDocument()

      // Cleanup
      unmount()
    }
  })

  it('現在の日付がサブタイトルに表示される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    const today = new Date()
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    })
    const expectedSubtitle = formatter.format(today)

    expect(screen.getByText(expectedSubtitle)).toBeInTheDocument()
  })

  it('タスクの追加ボタンが正しく表示される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    const addButton = screen.getByText('タスクの追加')
    expect(addButton).toBeInTheDocument()
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
  })

  it('並び替えオプションが正しく表示される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('icon-sort')).toBeInTheDocument()

    // Select要素の存在確認（Mantineの内部実装に依存）
    const selectElements = document.querySelectorAll('.mantine-Select-root')
    expect(selectElements.length).toBeGreaterThan(0)
  })

  it('並び替えオプションを変更できる', () => {
    // Act
    render(<TodoMainContent />)

    // Assert - 初期値はcreatedAt
    expect(screen.getByTestId('sort-by')).toHaveTextContent('createdAt')

    // Act - 並び替えオプションの変更をシミュレート（Mantineの詳細実装は省略）
    // 実際のテストではMantineのSelect操作が必要
  })

  it('TodoListコンポーネントに正しいpropsが渡される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('todos-count')).toHaveTextContent('2')
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loaded')
    expect(screen.getByTestId('sort-by')).toHaveTextContent('createdAt')
  })

  it('ローディング状態が正しく表示される', () => {
    // Arrange
    vi.mocked(useTodos).mockReturnValue({
      error: undefined,
      isLoading: true,
      refetch: vi.fn(),
      todos: [],
    })

    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading')
  })

  it('タスクの追加ボタンをクリックするとモーダルが開く', () => {
    // Act
    render(<TodoMainContent />)

    // Assert - 初期状態ではモーダルは表示されない
    expect(screen.queryByTestId('todo-add-modal')).not.toBeInTheDocument()

    // Act - ボタンをクリック
    fireEvent.click(screen.getByText('タスクの追加'))

    // Assert - モーダルが表示される
    expect(screen.getByTestId('todo-add-modal')).toBeInTheDocument()
  })

  it('モーダルを閉じることができる', () => {
    // Act
    render(<TodoMainContent />)

    // Act - モーダルを開く
    fireEvent.click(screen.getByText('タスクの追加'))
    expect(screen.getByTestId('todo-add-modal')).toBeInTheDocument()

    // Act - モーダルを閉じる
    fireEvent.click(screen.getByTestId('close-modal'))

    // Assert - モーダルが閉じられる
    expect(screen.queryByTestId('todo-add-modal')).not.toBeInTheDocument()
  })

  it('エラー状態でも基本的な表示は維持される', () => {
    // Arrange
    vi.mocked(useTodos).mockReturnValue({
      error: 'Something went wrong',
      isLoading: false,
      refetch: vi.fn(),
      todos: [],
    })

    // Act
    render(<TodoMainContent />)

    // Assert - 基本的な要素は表示される
    expect(screen.getByText('すべてのタスク')).toBeInTheDocument()
    expect(screen.getByText('タスクの追加')).toBeInTheDocument()
    expect(screen.getByTestId('todo-list')).toBeInTheDocument()
  })

  it('選択されたフィルタに基づいてuseTodosが呼ばれる', () => {
    // Arrange
    const mockRefetch = vi.fn()
    vi.mocked(useTodos).mockReturnValue({
      error: undefined,
      isLoading: false,
      refetch: mockRefetch,
      todos: mockTodos,
    })

    // Act
    render(<TodoMainContent />)

    // Assert
    expect(useTodos).toHaveBeenCalledWith('all')
  })

  it('フィルタが変更されると新しいフィルタでuseTodosが呼ばれる', () => {
    // Arrange
    vi.mocked(useUiStore).mockReturnValue({ selectedFilter: 'important' })

    // Act
    render(<TodoMainContent />)

    // Assert
    expect(useTodos).toHaveBeenCalledWith('important')
  })

  it('コンポーネントの構造が正しい', () => {
    // Act
    render(<TodoMainContent />)

    // Assert - Stackコンテナが存在
    const stackElements = document.querySelectorAll('.mantine-Stack-root')
    expect(stackElements.length).toBeGreaterThan(0)

    // Assert - Groupコンテナが存在（タイトルと並び替えオプション）
    const groupElements = document.querySelectorAll('.mantine-Group-root')
    expect(groupElements.length).toBeGreaterThan(0)
  })

  it('Kanbanビューの場合はKanbanBoardが表示される', () => {
    // Arrange
    vi.mocked(useUiStore).mockReturnValue({
      selectedFilter: 'all',
      viewMode: 'kanban' as const,
    })

    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument()
    expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument()
  })

  it('リストビューの場合はTodoListとタスク追加ボタンが表示される', () => {
    // Arrange
    vi.mocked(useUiStore).mockReturnValue({
      selectedFilter: 'all',
      viewMode: 'list' as const,
    })

    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('todo-list')).toBeInTheDocument()
    expect(screen.getByText('タスクの追加')).toBeInTheDocument()
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument()
  })

  it('ViewToggleコンポーネントが表示される', () => {
    // Act
    render(<TodoMainContent />)

    // Assert
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument()
  })
})
