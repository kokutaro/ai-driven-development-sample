import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import type { Todo } from '@/types/todo'

import { TodoDetailPanel } from '@/components/todo-detail-panel'
import { useTodoStore } from '@/stores/todo-store'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * テスト用のMantineProviderラッパー
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}

// ストアのモック
vi.mock('@/stores/todo-store')
vi.mock('@/stores/todo-ui-store')

const mockUseTodoStore = vi.mocked(useTodoStore)
const mockUseTodoUIStore = vi.mocked(useTodoUIStore)

/**
 * テスト用のTODO項目を作成するヘルパー関数
 */
function createTestTodo(
  id: string,
  title: string,
  description = '',
  status: 'completed' | 'pending' = 'pending'
): Todo {
  return {
    createdAt: new Date('2024-01-15T10:00:00Z'),
    description,
    id,
    status,
    title,
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  }
}

describe('TodoDetailPanel', () => {
  const mockUpdateTodo = vi.fn()
  const mockSetSelectedTodoId = vi.fn()
  const mockGetTodoById = vi.fn()

  beforeEach(() => {
    mockUpdateTodo.mockClear()
    mockSetSelectedTodoId.mockClear()
    mockGetTodoById.mockClear()

    mockUseTodoStore.mockReturnValue({
      addTodo: vi.fn(),
      deleteTodo: vi.fn(),
      getAllTodos: vi.fn(),
      getCompletedTodos: vi.fn(),
      getPendingTodos: vi.fn(),
      getTodoById: mockGetTodoById,
      initializeTodos: vi.fn(),
      isLoading: false,
      todos: [],
      toggleTodoStatus: vi.fn(),
      updateTodo: mockUpdateTodo,
    })

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })
  })

  it('TODO項目が選択されていない場合は選択メッセージを表示する', () => {
    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    expect(screen.getByText('TODO項目を選択してください')).toBeInTheDocument()
    expect(
      screen.getByText(
        '左側のリストからTODO項目を選択すると、詳細を表示・編集できます。'
      )
    ).toBeInTheDocument()
  })

  it('存在しないTODO項目が選択されている場合はエラーメッセージを表示する', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: 'non-existent-id',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(undefined)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    expect(screen.getByText('TODO項目が見つかりません')).toBeInTheDocument()
  })

  it('選択されたTODO項目の詳細が表示される', () => {
    const testTodo = createTestTodo('1', 'Test Todo', 'Test Description')

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(testTodo)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    expect(screen.getByDisplayValue('Test Todo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
    expect(screen.getByText('作成日時:', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('更新日時:', { exact: false })).toBeInTheDocument()
  })

  it('タイトルを編集できる', async () => {
    const user = userEvent.setup()
    const testTodo = createTestTodo('1', 'Test Todo', 'Test Description')

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(testTodo)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    const titleInput = screen.getByDisplayValue('Test Todo')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Todo Title')

    const saveButton = screen.getByRole('button', { name: '変更を保存' })
    await user.click(saveButton)

    expect(mockUpdateTodo).toHaveBeenCalledWith('1', {
      description: 'Test Description',
      title: 'Updated Todo Title',
    })
  })

  it('説明を編集できる', async () => {
    const user = userEvent.setup()
    const testTodo = createTestTodo('1', 'Test Todo', 'Test Description')

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(testTodo)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    const descriptionInput = screen.getByDisplayValue('Test Description')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Updated Description')

    const saveButton = screen.getByRole('button', { name: '変更を保存' })
    await user.click(saveButton)

    expect(mockUpdateTodo).toHaveBeenCalledWith('1', {
      description: 'Updated Description',
      title: 'Test Todo',
    })
  })

  it('閉じるボタンで詳細パネルを閉じることができる', async () => {
    const user = userEvent.setup()
    const testTodo = createTestTodo('1', 'Test Todo', 'Test Description')

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(testTodo)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    const closeButton = screen.getByRole('button', { name: '閉じる' })
    await user.click(closeButton)

    expect(mockSetSelectedTodoId).toHaveBeenCalledWith(undefined)
  })

  it('入力値が変更されていない場合は保存ボタンが無効化される', () => {
    const testTodo = createTestTodo('1', 'Test Todo', 'Test Description')

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: true,
      selectedTodoId: '1',
      setFilter: vi.fn(),
      setSelectedTodoId: mockSetSelectedTodoId,
    })

    mockGetTodoById.mockReturnValue(testTodo)

    render(<TodoDetailPanel />, { wrapper: TestWrapper })

    const saveButton = screen.getByRole('button', { name: '変更を保存' })
    expect(saveButton).toBeDisabled()
  })
})
