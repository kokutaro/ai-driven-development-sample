import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import type { Todo } from '@/types/todo'

import { TodoList } from '@/components/todo-list'
import { useTodoStore } from '@/stores/todo-store'

/**
 * MantineProviderとModalsProviderでラップしたカスタムrender関数
 */
function renderWithMantine(ui: React.ReactElement) {
  return render(
    <MantineProvider>
      <ModalsProvider>{ui}</ModalsProvider>
    </MantineProvider>
  )
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

    it('説明がないTODO項目は説明文を表示しない', () => {
      // Arrange
      const mockTodos: Todo[] = [
        {
          createdAt: new Date('2023-01-01'),
          id: '1',
          status: 'pending',
          title: 'テスト項目1',
          updatedAt: new Date('2023-01-01'),
          // descriptionは意図的に設定しない
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
      expect(screen.queryByText(/説明/)).not.toBeInTheDocument()
    })
  })

  describe('TODO項目の操作', () => {
    it('チェックボックスをクリックするとtoggleTodoStatusが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockToggleTodoStatus = vi.fn().mockResolvedValue({
        id: '1',
        status: 'completed',
        title: 'テスト項目1',
      })
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
        toggleTodoStatus: mockToggleTodoStatus,
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      // Assert
      expect(mockToggleTodoStatus).toHaveBeenCalledWith('1')
      expect(mockToggleTodoStatus).toHaveBeenCalledTimes(1)
    })

    it('toggleTodoStatusがエラーを投げた場合、エラーをコンソールに出力する', async () => {
      // Arrange
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const mockToggleTodoStatus = vi
        .fn()
        .mockRejectedValue(new Error('Toggle failed'))
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
        toggleTodoStatus: mockToggleTodoStatus,
        updateTodo: vi.fn(),
      })

      // Act
      renderWithMantine(<TodoList />)
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      // Assert
      expect(mockToggleTodoStatus).toHaveBeenCalledWith('1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to toggle todo:',
        expect.any(Error)
      )

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it('削除ボタンを表示する', () => {
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
      expect(screen.getByLabelText('削除')).toBeInTheDocument()
    })

    it('削除ボタンをクリックすると確認モーダルが表示される', async () => {
      // Arrange
      const user = userEvent.setup()
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
      const deleteButton = screen.getByLabelText('削除')
      await user.click(deleteButton)

      // Assert
      expect(
        await screen.findByText('TODO項目を削除しますか？')
      ).toBeInTheDocument()
    })

    it('削除確認モーダルで「削除」をクリックするとdeleteTodoが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockDeleteTodo = vi.fn().mockResolvedValue()
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
        deleteTodo: mockDeleteTodo,
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
      const deleteButton = screen.getByLabelText('削除')
      await user.click(deleteButton)

      const confirmButton = await screen.findByRole('button', { name: '削除' })
      await user.click(confirmButton)

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert
      expect(mockDeleteTodo).toHaveBeenCalledWith('1')
      expect(mockDeleteTodo).toHaveBeenCalledTimes(1)
    })

    it('削除確認モーダルで「キャンセル」をクリックするとdeleteTodoが呼ばれない', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockDeleteTodo = vi.fn().mockResolvedValue()
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
        deleteTodo: mockDeleteTodo,
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
      const deleteButton = screen.getByLabelText('削除')
      await user.click(deleteButton)

      const cancelButton = await screen.findByRole('button', {
        name: 'キャンセル',
      })
      await user.click(cancelButton)

      // Assert
      expect(mockDeleteTodo).not.toHaveBeenCalled()
    })

    it('deleteTodoがエラーを投げた場合、エラーをコンソールに出力する', async () => {
      // Arrange
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const mockDeleteTodo = vi
        .fn()
        .mockRejectedValue(new Error('Delete failed'))
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
        deleteTodo: mockDeleteTodo,
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
      const deleteButton = screen.getByLabelText('削除')
      await user.click(deleteButton)

      const confirmButton = await screen.findByRole('button', { name: '削除' })
      await user.click(confirmButton)

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Assert
      expect(mockDeleteTodo).toHaveBeenCalledWith('1')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete todo:',
        expect.any(Error)
      )

      // Cleanup
      consoleErrorSpy.mockRestore()
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
