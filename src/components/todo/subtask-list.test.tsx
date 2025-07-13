import { SubTaskList } from './subtask-list'

import { useSubTasks } from '@/hooks/use-subtasks'
import { fireEvent, render, screen, waitFor } from '@/test-utils'
import { type SubTask } from '@/types/todo'

// フックのモック
vi.mock('@/hooks/use-subtasks', () => ({
  useSubTasks: vi.fn(),
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <div data-testid="icon-plus" />,
  IconTrash: () => <div data-testid="icon-trash" />,
}))

// Mantine modalsのモック
let mockConfirmCallback: (() => void) | undefined = undefined
vi.mock('@mantine/modals', async (importOriginal) => {
  const originalModule = await importOriginal()
  const typedModule = originalModule as Record<string, unknown>
  return {
    ...typedModule,
    openConfirmModal: vi.fn((options: { onConfirm?: () => void }) => {
      mockConfirmCallback = options.onConfirm
    }),
  }
})

const mockSubTasks: SubTask[] = [
  {
    createdAt: new Date(),
    id: 'subtask-1',
    isCompleted: false,
    order: 0,
    title: 'サブタスク1',
    todoId: 'todo-1',
    updatedAt: new Date(),
  },
  {
    createdAt: new Date(),
    id: 'subtask-2',
    isCompleted: true,
    order: 1,
    title: 'サブタスク2',
    todoId: 'todo-1',
    updatedAt: new Date(),
  },
]

const mockCreateSubTask = vi.fn()
const mockUpdateSubTask = vi.fn()
const mockDeleteSubTask = vi.fn()
const mockToggleSubTask = vi.fn()

const mockUseSubTasks = {
  clearError: vi.fn(),
  createSubTask: mockCreateSubTask,
  deleteSubTask: mockDeleteSubTask,
  error: undefined,
  isLoading: false,
  subTasks: mockSubTasks,
  toggleSubTask: mockToggleSubTask,
  updateSubTask: mockUpdateSubTask,
}

describe('SubTaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirmCallback = undefined
    vi.mocked(useSubTasks).mockReturnValue(mockUseSubTasks)
  })

  it('サブタスク一覧が正しく表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    expect(screen.getByText('サブタスク1')).toBeInTheDocument()
    expect(screen.getByText('サブタスク2')).toBeInTheDocument()
  })

  it('サブタスクのチェックボックスが正しく表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).not.toBeChecked() // サブタスク1は未完了
    expect(checkboxes[1]).toBeChecked() // サブタスク2は完了済み
  })

  it('完了済みサブタスクでテキストに取り消し線が表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    const completedTask = screen.getByText('サブタスク2')
    expect(completedTask).toHaveStyle({ textDecoration: 'line-through' })
  })

  it('未完了サブタスクでテキストに取り消し線が表示されない', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    const incompleteTask = screen.getByText('サブタスク1')
    expect(incompleteTask).not.toHaveStyle({ textDecoration: 'line-through' })
  })

  it('削除ボタンが各サブタスクに表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    const deleteButtons = screen.getAllByTestId('icon-trash')
    expect(deleteButtons).toHaveLength(2)
  })

  it('チェックボックスをクリックするとtoggleSubTaskが呼ばれる', async () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Assert
    await waitFor(() => {
      expect(mockToggleSubTask).toHaveBeenCalledWith('subtask-1')
    })
  })

  it('削除ボタンをクリックして確認すると削除される', async () => {
    // Arrange
    mockConfirmCallback = undefined

    // Act
    render(<SubTaskList todoId="todo-1" />)

    const deleteButtons = screen.getAllByTestId('icon-trash')
    fireEvent.click(deleteButtons[0])

    // Mantine modalのonConfirmを実行
    expect(mockConfirmCallback).toBeDefined()
    if (mockConfirmCallback) {
      ;(mockConfirmCallback as () => void)()
    }

    // Assert
    await waitFor(() => {
      expect(mockDeleteSubTask).toHaveBeenCalledWith('subtask-1')
    })
  })

  it('削除ボタンをクリックしてキャンセルすると削除されない', async () => {
    // Arrange
    mockConfirmCallback = undefined

    // Act
    render(<SubTaskList todoId="todo-1" />)

    const deleteButtons = screen.getAllByTestId('icon-trash')
    fireEvent.click(deleteButtons[0])

    // Mantine modalが開かれたが、onConfirmは呼ばない（キャンセル）
    expect(mockConfirmCallback).toBeDefined()
    // onConfirmを呼ばないことでキャンセル動作をシミュレート

    // Assert
    expect(mockDeleteSubTask).not.toHaveBeenCalled()
  })

  it('新しいサブタスクを追加ボタンが表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument()
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument()
  })

  it('追加ボタンをクリックすると入力フィールドが表示される', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    const addButton = screen.getByRole('button', { name: '追加' })
    fireEvent.click(addButton)

    // Assert
    expect(
      screen.getByPlaceholderText('サブタスクを入力...')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
  })

  it('サブタスクを追加できる', async () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: '追加' })
    fireEvent.click(addButton)

    // サブタスクタイトルを入力
    const input = screen.getByPlaceholderText('サブタスクを入力...')
    fireEvent.change(input, { target: { value: '新しいサブタスク' } })

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    // Assert
    await waitFor(() => {
      expect(mockCreateSubTask).toHaveBeenCalledWith('todo-1', {
        title: '新しいサブタスク',
      })
    })
  })

  it('空のタイトルでは保存できない', async () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: '追加' })
    fireEvent.click(addButton)

    // 保存ボタンをクリック（空のまま）
    const saveButton = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveButton)

    // Assert
    expect(mockCreateSubTask).not.toHaveBeenCalled()
  })

  it('キャンセルボタンで入力をキャンセルできる', () => {
    // Act
    render(<SubTaskList todoId="todo-1" />)

    // 追加ボタンをクリック
    const addButton = screen.getByRole('button', { name: '追加' })
    fireEvent.click(addButton)

    // サブタスクタイトルを入力
    const input = screen.getByPlaceholderText('サブタスクを入力...')
    fireEvent.change(input, { target: { value: '新しいサブタスク' } })

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    // Assert
    expect(
      screen.queryByPlaceholderText('サブタスクを入力...')
    ).not.toBeInTheDocument()
    expect(mockCreateSubTask).not.toHaveBeenCalled()
  })

  it('ローディング中はスケルトンが表示される', () => {
    // Arrange
    vi.mocked(useSubTasks).mockReturnValue({
      ...mockUseSubTasks,
      isLoading: true,
    })

    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('サブタスクがない場合は空状態が表示される', () => {
    // Arrange
    vi.mocked(useSubTasks).mockReturnValue({
      ...mockUseSubTasks,
      subTasks: [],
    })

    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    expect(screen.getByText('サブタスクがありません')).toBeInTheDocument()
  })

  it('エラー時はエラーメッセージが表示される', () => {
    // Arrange
    vi.mocked(useSubTasks).mockReturnValue({
      ...mockUseSubTasks,
      error: 'サブタスクの取得に失敗しました',
    })

    // Act
    render(<SubTaskList todoId="todo-1" />)

    // Assert
    expect(
      screen.getByText('サブタスクの取得に失敗しました')
    ).toBeInTheDocument()
  })

  it('useSubTasksフックが正しいtodoIdで呼ばれる', () => {
    // Act
    render(<SubTaskList todoId="test-todo-id" />)

    // Assert
    expect(useSubTasks).toHaveBeenCalledWith('test-todo-id')
  })
})
