import { TodoList } from './todo-list'

import type { Todo } from '@/types/todo'

import { render, screen } from '@/test-utils'

// TodoItemコンポーネントのモック
vi.mock('./todo-item', () => ({
  TodoItem: ({ todo }: { todo: Todo }) => (
    <div data-testid={`todo-item-${todo.id}`}>
      <div data-testid="todo-title">{todo.title}</div>
      <div data-testid="todo-important">
        {todo.isImportant ? 'important' : 'normal'}
      </div>
      <div data-testid="todo-due-date">
        {todo.dueDate ? todo.dueDate.toISOString() : 'no-date'}
      </div>
    </div>
  ),
}))

const mockTodos = [
  {
    categoryId: undefined,
    createdAt: new Date('2024-01-01'),
    description: 'Description 1',
    dueDate: new Date('2024-01-15'),
    id: 'todo-1',
    isCompleted: false,
    isImportant: false,
    order: 0,
    title: 'Task 1',
    updatedAt: new Date('2024-01-01'),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date('2024-01-02'),
    description: 'Description 2',
    dueDate: new Date('2024-01-10'),
    id: 'todo-2',
    isCompleted: false,
    isImportant: true,
    order: 1,
    title: 'Task 2',
    updatedAt: new Date('2024-01-02'),
    userId: 'user-1',
  },
  {
    categoryId: undefined,
    createdAt: new Date('2024-01-03'),
    description: 'Description 3',
    dueDate: undefined,
    id: 'todo-3',
    isCompleted: false,
    isImportant: false,
    order: 2,
    title: 'Task 3',
    updatedAt: new Date('2024-01-03'),
    userId: 'user-1',
  },
]

describe('TodoList', () => {
  it('タスクが正しく表示される', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={mockTodos} />)

    // Assert
    expect(screen.getByTestId('todo-item-todo-1')).toBeInTheDocument()
    expect(screen.getByTestId('todo-item-todo-2')).toBeInTheDocument()
    expect(screen.getByTestId('todo-item-todo-3')).toBeInTheDocument()

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('ローディング状態でスケルトンが表示される', () => {
    // Act
    render(<TodoList isLoading={true} sortBy="createdAt" todos={[]} />)

    // Assert
    const skeletons = document.querySelectorAll('.mantine-Skeleton-root')
    expect(skeletons.length).toBe(5) // 5つのスケルトン
  })

  it('タスクが空の場合は空状態メッセージが表示される', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={[]} />)

    // Assert
    expect(screen.getByText('タスクが見つかりません')).toBeInTheDocument()
  })

  it('作成日時でソートされる（デフォルト）', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={mockTodos} />)

    // Assert - 新しい順（降順）に並ぶ
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-3') // 2024-01-03
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-2') // 2024-01-02
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-1') // 2024-01-01
  })

  it('期限日でソートされる', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="dueDate" todos={mockTodos} />)

    // Assert - 期限日の昇順（期限なしは最後）
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-2') // 2024-01-10
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-1') // 2024-01-15
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-3') // undefined (期限なし)
  })

  it('タイトルでソートされる', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="title" todos={mockTodos} />)

    // Assert - アルファベット順
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-1') // Task 1
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-2') // Task 2
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-3') // Task 3
  })

  it('重要度でソートされる', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="importance" todos={mockTodos} />)

    // Assert - 重要なタスクが先頭
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-2') // important: true
    // 残りの順序は元の順序を維持
  })

  it('無効なソート条件の場合はデフォルトソート（createdAt）が使用される', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="invalid" todos={mockTodos} />)

    // Assert - createdAtでソートされる（新しい順）
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-3')
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-2')
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-1')
  })

  it('todosがundefinedの場合は空状態メッセージが表示される', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={undefined} />)

    // Assert
    expect(screen.getByText('タスクが見つかりません')).toBeInTheDocument()
  })

  it('todosがundefinedの場合は空状態メッセージが表示される', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={undefined} />)

    // Assert
    expect(screen.getByText('タスクが見つかりません')).toBeInTheDocument()
  })

  it('期限日ソートで期限なしのタスクが正しく処理される', () => {
    // Arrange
    const todosWithMixedDates = [
      { ...mockTodos[0], dueDate: new Date('2024-01-20') },
      { ...mockTodos[1], dueDate: undefined },
      { ...mockTodos[2], dueDate: new Date('2024-01-10') },
    ]

    // Act
    render(
      <TodoList
        isLoading={false}
        sortBy="dueDate"
        todos={todosWithMixedDates}
      />
    )

    // Assert - 期限ありが先、期限なしが後
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-3') // 2024-01-10
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-1') // 2024-01-20
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-2') // undefined
  })

  it('同じソート値の場合は元の順序を維持する', () => {
    // Arrange
    const todosWithSameTitle = [
      { ...mockTodos[0], id: 'todo-a', title: 'Same Title' },
      { ...mockTodos[1], id: 'todo-b', title: 'Same Title' },
      { ...mockTodos[2], id: 'todo-c', title: 'Same Title' },
    ]

    // Act
    render(
      <TodoList isLoading={false} sortBy="title" todos={todosWithSameTitle} />
    )

    // Assert - 元の配列順序を維持
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute('data-testid', 'todo-item-todo-a')
    expect(todoItems[1]).toHaveAttribute('data-testid', 'todo-item-todo-b')
    expect(todoItems[2]).toHaveAttribute('data-testid', 'todo-item-todo-c')
  })

  it('重要度ソートで重要でないタスクの順序が保持される', () => {
    // Arrange
    const todosForImportanceSort = [
      { ...mockTodos[0], id: 'todo-normal-1', isImportant: false },
      { ...mockTodos[1], id: 'todo-important', isImportant: true },
      { ...mockTodos[2], id: 'todo-normal-2', isImportant: false },
    ]

    // Act
    render(
      <TodoList
        isLoading={false}
        sortBy="importance"
        todos={todosForImportanceSort}
      />
    )

    // Assert
    const todoItems = screen.getAllByTestId(/^todo-item-/)
    expect(todoItems[0]).toHaveAttribute(
      'data-testid',
      'todo-item-todo-important'
    ) // 重要なタスクが最初
    expect(todoItems[1]).toHaveAttribute(
      'data-testid',
      'todo-item-todo-normal-1'
    ) // 元の順序
    expect(todoItems[2]).toHaveAttribute(
      'data-testid',
      'todo-item-todo-normal-2'
    ) // 元の順序
  })

  it('コンポーネントの構造が正しい', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={mockTodos} />)

    // Assert - Stackコンテナが存在
    const stackElements = document.querySelectorAll('.mantine-Stack-root')
    expect(stackElements.length).toBeGreaterThan(0)
  })

  it('空状態の場合の構造が正しい', () => {
    // Act
    render(<TodoList isLoading={false} sortBy="createdAt" todos={[]} />)

    // Assert - 中央揃えのStackが存在
    const stackElements = document.querySelectorAll('.mantine-Stack-root')
    expect(stackElements.length).toBeGreaterThan(0)
  })
})
