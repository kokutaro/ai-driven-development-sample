import { MockedProvider } from '@apollo/client/testing'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TodoListGraphQL } from './todo-list-graphql'

import { useTodosGraphQL } from '@/hooks/use-todos-graphql'
import { type Todo } from '@/types/todo'

// Mock the store hooks
vi.mock('@/stores/todo-store', () => ({
  useTodoStore: () => ({
    deleteTodo: vi.fn(),
    toggleTodo: vi.fn(),
  }),
}))

vi.mock('@/stores/ui-store', () => ({
  useUiStore: () => ({
    selectedTodo: undefined,
    setDrawerOpen: vi.fn(),
    setSelectedTodo: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-todos-graphql')

/**
 * TodoList GraphQL 移行テスト
 *
 * TDD: REST APIからGraphQLへの移行をテストドリブンで実装
 */
describe('TodoList GraphQL Migration', () => {
  const mockTodos: Todo[] = [
    {
      category: {
        color: '#FF6B6B',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        id: 'cat1',
        name: 'Work',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        userId: 'user1',
      },
      categoryId: 'cat1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      description: 'Testing GraphQL integration',
      dueDate: new Date('2024-01-15T23:59:59Z'),
      id: '1',
      isCompleted: false,
      isImportant: true,
      order: 0,
      title: 'GraphQL Test Todo 1',
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      userId: 'user1',
    },
    {
      categoryId: undefined,
      createdAt: new Date('2024-01-02T00:00:00Z'),
      description: 'Another GraphQL test',
      dueDate: undefined,
      id: '2',
      isCompleted: true,
      isImportant: false,
      order: 1,
      title: 'GraphQL Test Todo 2',
      updatedAt: new Date('2024-01-02T00:00:00Z'),
      userId: 'user1',
    },
  ]

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MantineProvider>
      <ModalsProvider>
        <MockedProvider addTypename={false} mocks={[]}>
          {children}
        </MockedProvider>
      </ModalsProvider>
    </MantineProvider>
  )

  describe('GraphQL データ表示', () => {
    it('should render todos from GraphQL successfully', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('GraphQL Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('GraphQL Test Todo 2')).toBeInTheDocument()
      })
    })

    it('should handle GraphQL loading state', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: true,
        refetch: vi.fn(),
        todos: [],
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      // ローディングスケルトンの確認
      const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
      expect(skeletons).toHaveLength(5)
    })

    it('should handle GraphQL error state', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: new Error('GraphQL Network Error'),
        loading: false,
        refetch: vi.fn(),
        todos: [],
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(
          screen.getByText('データの取得に失敗しました')
        ).toBeInTheDocument()
      })
    })

    it('should handle empty GraphQL result', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: [],
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('タスクが見つかりません')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL ソート機能', () => {
    it('should sort todos by creation date (GraphQL)', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        const todoItems = screen.getAllByText(/GraphQL Test Todo/)
        expect(todoItems).toHaveLength(2)
        // 新しい順にソートされているか確認
        expect(todoItems[0]).toHaveTextContent('GraphQL Test Todo 2')
        expect(todoItems[1]).toHaveTextContent('GraphQL Test Todo 1')
      })
    })

    it('should sort todos by due date (GraphQL)', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="dueDate" />
        </TestWrapper>
      )

      await waitFor(() => {
        const todoItems = screen.getAllByText(/GraphQL Test Todo/)
        expect(todoItems).toHaveLength(2)
        // 期限日でソート（期限なしは最後）
        expect(todoItems[0]).toHaveTextContent('GraphQL Test Todo 1')
        expect(todoItems[1]).toHaveTextContent('GraphQL Test Todo 2')
      })
    })

    it('should sort todos by importance (GraphQL)', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="importance" />
        </TestWrapper>
      )

      await waitFor(() => {
        const todoItems = screen.getAllByText(/GraphQL Test Todo/)
        expect(todoItems).toHaveLength(2)
        // 重要なタスクが先頭
        expect(todoItems[0]).toHaveTextContent('GraphQL Test Todo 1')
        expect(todoItems[1]).toHaveTextContent('GraphQL Test Todo 2')
      })
    })

    it('should sort todos by title (GraphQL)', async () => {
      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="title" />
        </TestWrapper>
      )

      await waitFor(() => {
        const todoItems = screen.getAllByText(/GraphQL Test Todo/)
        expect(todoItems).toHaveLength(2)
        // アルファベット順
        expect(todoItems[0]).toHaveTextContent('GraphQL Test Todo 1')
        expect(todoItems[1]).toHaveTextContent('GraphQL Test Todo 2')
      })
    })
  })

  describe('GraphQL データ検証', () => {
    it('should validate GraphQL todo data structure', async () => {
      const validTodos = [
        {
          createdAt: new Date(),
          id: '1',
          isCompleted: false,
          isImportant: false,
          order: 0,
          title: 'Valid Todo',
          updatedAt: new Date(),
          userId: 'user1',
        },
        {
          createdAt: new Date(),
          id: '4',
          isCompleted: false,
          isImportant: true,
          order: 0,
          title: 'Valid Todo 2',
          updatedAt: new Date(),
          userId: 'user1',
        },
      ]

      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: validTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        // 有効なタスクのみ表示される
        expect(screen.getByText('Valid Todo')).toBeInTheDocument()
        expect(screen.getByText('Valid Todo 2')).toBeInTheDocument()
        // 無効なタスクは表示されない（GraphQLで既にフィルタリング済み）
        expect(screen.queryByText('Invalid Todo')).not.toBeInTheDocument()
      })
    })

    it('should handle GraphQL date fields properly', async () => {
      const todosWithDates: Todo[] = [
        {
          createdAt: new Date('2024-01-01T00:00:00Z'),
          dueDate: new Date('2024-01-15T23:59:59Z'),
          id: '1',
          isCompleted: false,
          isImportant: false,
          order: 0,
          title: 'Todo with valid date',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          userId: 'user1',
        },
        {
          createdAt: new Date('invalid-date'),
          dueDate: new Date('invalid-date'),
          id: '2',
          isCompleted: false,
          isImportant: false,
          order: 1,
          title: 'Todo with invalid date',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          userId: 'user1',
        },
      ]

      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: todosWithDates,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="dueDate" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Todo with valid date')).toBeInTheDocument()
        expect(screen.getByText('Todo with invalid date')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL レスポンシブ対応', () => {
    it('should handle GraphQL data on desktop', async () => {
      // デスクトップサイズをモック
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation((query) => ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: query === '(min-width: 62em)',
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        })),
        writable: true,
      })

      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('GraphQL Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('GraphQL Test Todo 2')).toBeInTheDocument()
      })
    })

    it('should handle GraphQL data on mobile', async () => {
      // モバイルサイズをモック
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation((query) => ({
          addEventListener: vi.fn(),
          addListener: vi.fn(),
          dispatchEvent: vi.fn(),
          matches: query !== '(min-width: 62em)',
          media: query,
          onchange: null,
          removeEventListener: vi.fn(),
          removeListener: vi.fn(),
        })),
        writable: true,
      })

      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: mockTodos,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('GraphQL Test Todo 1')).toBeInTheDocument()
        expect(screen.getByText('GraphQL Test Todo 2')).toBeInTheDocument()
      })
    })
  })

  describe('GraphQL パフォーマンス', () => {
    it('should handle large GraphQL datasets efficiently', async () => {
      // 大量のデータを生成
      const largeTodoSet: Todo[] = Array.from({ length: 1000 }, (_, index) => ({
        categoryId: undefined,
        createdAt: new Date(`2024-01-${(index % 30) + 1}T00:00:00Z`),
        description: `Description for todo ${index}`,
        dueDate: undefined,
        id: `todo-${index}`,
        isCompleted: Math.random() > 0.5,
        isImportant: Math.random() > 0.8,
        order: index,
        title: `GraphQL Todo ${index}`,
        updatedAt: new Date(`2024-01-${(index % 30) + 1}T00:00:00Z`),
        userId: 'user1',
      }))

      const mockUseTodosGraphQL = vi.mocked(useTodosGraphQL)
      mockUseTodosGraphQL.mockReturnValue({
        createTodo: vi.fn(),
        deleteTodo: vi.fn(),
        error: undefined,
        loading: false,
        refetch: vi.fn(),
        todos: largeTodoSet,
        toggleTodo: vi.fn(),
        updateTodo: vi.fn(),
      })

      const startTime = performance.now()

      render(
        <TestWrapper>
          <TodoListGraphQL filter="all" sortBy="createdAt" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('GraphQL Todo 0')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // パフォーマンスの確認（1000アイテムを3秒以内にレンダリング）
      expect(renderTime).toBeLessThan(3000)
    })
  })
})
