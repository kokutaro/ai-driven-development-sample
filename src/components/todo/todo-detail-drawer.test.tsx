import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { TodoDetailDrawer } from './todo-detail-drawer'

import type { Todo } from '@/types/todo'

// TodoDetailPanelをモック
vi.mock('./todo-detail-panel', () => ({
  TodoDetailPanel: ({ todo }: { todo: Todo }) => (
    <div data-testid="todo-detail-panel">TodoDetailPanel for {todo.title}</div>
  ),
}))

// useMediaQueryをモック
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => false, // 常にデスクトップサイズを返す
}))

const mockTodo: Todo = {
  createdAt: new Date('2024-01-01'),
  description: 'テスト用の説明',
  id: '1',
  isCompleted: false,
  isImportant: false,
  order: 0,
  title: 'テストタスク',
  updatedAt: new Date('2024-01-01'),
  userId: 'user1',
}

// テスト用のラッパーコンポーネント
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}

describe('TodoDetailDrawer', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TODOが存在しない場合は何も表示しない', () => {
    render(
      <TestWrapper>
        <TodoDetailDrawer
          onClose={mockOnClose}
          opened={true}
          todo={undefined}
        />
      </TestWrapper>
    )

    // TODOが存在しない場合、ドロワーコンテンツは表示されない
    expect(screen.queryByText('タスクの詳細')).not.toBeInTheDocument()
  })

  it('TODOが存在する場合にドロワーを表示する', () => {
    render(
      <TestWrapper>
        <TodoDetailDrawer onClose={mockOnClose} opened={true} todo={mockTodo} />
      </TestWrapper>
    )

    expect(screen.getByText('タスクの詳細')).toBeInTheDocument()
    expect(screen.getByTestId('todo-detail-panel')).toBeInTheDocument()
    expect(
      screen.getByText('TodoDetailPanel for テストタスク')
    ).toBeInTheDocument()
  })

  it('コンポーネントが正常にレンダリングされる', () => {
    render(
      <TestWrapper>
        <TodoDetailDrawer onClose={mockOnClose} opened={true} todo={mockTodo} />
      </TestWrapper>
    )

    // 基本的なコンポーネントのレンダリング確認
    expect(screen.getByText('タスクの詳細')).toBeInTheDocument()
  })
})
