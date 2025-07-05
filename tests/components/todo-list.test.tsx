import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { vi } from 'vitest'
import { TodoList } from '@/components/todo-list'
import { useTodoStore } from '@/stores/todo-store'
import type { Todo } from '@/types/todo'

/**
 * MantineProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

// Zustandストアのモック
vi.mock('@/stores/todo-store')

// Mock関数の型定義
const mockUseTodoStore = vi.mocked(useTodoStore)

describe('TodoList', () => {
  beforeEach(() => {
    // 各テストの前にモックをクリア
    vi.clearAllMocks()
  })

  describe('TODO項目の表示', () => {
    it('TODO項目がない場合、メッセージを表示する', () => {
      // Arrange
      mockUseTodoStore.mockReturnValue({
        addTodo: vi.fn(),
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
      })

      // Act
      renderWithMantine(<TodoList />)

      // Assert
      expect(screen.getByText('TODO項目がありません')).toBeInTheDocument()
    })

    it('TODO項目を表示する', () => {
      // Arrange
      const mockTodos: Todo[] = [
        {
          createdAt: new Date('2023-01-01'),
          description: 'テスト項目1の説明',
          id: '1',
          status: 'pending',
          title: 'テスト項目1',
          updatedAt: new Date('2023-01-01'),
        },
        {
          createdAt: new Date('2023-01-02'),
          id: '2',
          status: 'completed',
          title: 'テスト項目2',
          updatedAt: new Date('2023-01-02'),
        },
      ]

      mockUseTodoStore.mockReturnValue({
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: mockTodos,
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)

      // Assert
      expect(screen.getByText('テスト項目1')).toBeInTheDocument()
      expect(screen.getByText('テスト項目1の説明')).toBeInTheDocument()
      expect(screen.getByText('テスト項目2')).toBeInTheDocument()
    })

    it('完了したTODO項目に完了マークを表示する', () => {
      // Arrange
      const mockTodos: Todo[] = [
        {
          createdAt: new Date('2023-01-01'),
          id: '1',
          status: 'completed',
          title: 'テスト項目1',
          updatedAt: new Date('2023-01-01'),
        },
      ]

      mockUseTodoStore.mockReturnValue({
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: mockTodos,
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)

      // Assert
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('未完了のTODO項目にはチェックマークを表示しない', () => {
      // Arrange
      const mockTodos: Todo[] = [
        {
          createdAt: new Date('2023-01-01'),
          id: '1',
          status: 'pending',
          title: 'テスト項目1',
          updatedAt: new Date('2023-01-01'),
        },
      ]

      mockUseTodoStore.mockReturnValue({
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: false,
        todos: mockTodos,
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)

      // Assert
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('ローディング状態', () => {
    it('ローディング中はスピナーを表示する', () => {
      // Arrange
      mockUseTodoStore.mockReturnValue({
        addTodo: vi.fn(),
        deleteTodo: vi.fn(),
        getAllTodos: vi.fn(),
        getCompletedTodos: vi.fn(),
        getPendingTodos: vi.fn(),
        getTodoById: vi.fn(),
        initializeTodos: vi.fn(),
        isLoading: true,
        todos: [],
        toggleTodoStatus: vi.fn(),
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)

      // Assert
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })
  })
})
