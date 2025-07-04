import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'

import { TodoList } from '../../src/components/features/todo-list'
import { useTodoStore } from '../../stores/todo-store'

// テスト用のProvider
const TestProvider = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
)

describe('TodoList', () => {
  beforeEach(() => {
    // 各テスト前にストアをクリア
    useTodoStore.setState({ todos: [] })
  })

  it('TODO項目がない場合、空のメッセージを表示する', () => {
    render(
      <TestProvider>
        <TodoList />
      </TestProvider>
    )

    expect(screen.getByText('TODO項目がありません')).toBeInTheDocument()
  })

  it('TODO項目がある場合、リストを表示する', () => {
    // テストデータをセット
    useTodoStore.setState({
      todos: [
        {
          id: '1',
          title: 'テストTODO1',
          description: 'テストの説明1',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'テストTODO2',
          description: 'テストの説明2',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })

    render(
      <TestProvider>
        <TodoList />
      </TestProvider>
    )

    expect(screen.getByText('テストTODO1')).toBeInTheDocument()
    expect(screen.getByText('テストTODO2')).toBeInTheDocument()
    expect(screen.getByText('テストの説明1')).toBeInTheDocument()
    expect(screen.getByText('テストの説明2')).toBeInTheDocument()
  })

  it('完了済みTODO項目には完了マークが表示される', () => {
    useTodoStore.setState({
      todos: [
        {
          id: '1',
          title: 'テストTODO1',
          description: 'テストの説明1',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })

    render(
      <TestProvider>
        <TodoList />
      </TestProvider>
    )

    const completedItem = screen
      .getByText('テストTODO1')
      .closest('[data-testid="todo-item"]')
    expect(completedItem).toHaveAttribute('data-status', 'completed')
  })

  it('未完了TODO項目には未完了マークが表示される', () => {
    useTodoStore.setState({
      todos: [
        {
          id: '1',
          title: 'テストTODO1',
          description: 'テストの説明1',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })

    render(
      <TestProvider>
        <TodoList />
      </TestProvider>
    )

    const pendingItem = screen
      .getByText('テストTODO1')
      .closest('[data-testid="todo-item"]')
    expect(pendingItem).toHaveAttribute('data-status', 'pending')
  })
})
