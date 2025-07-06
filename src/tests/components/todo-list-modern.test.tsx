import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'

import { TodoListModern } from '@/components/todo-list-modern'

// MantineProviderでラップするヘルパー関数
function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('TodoListModern', () => {
  // 基本的なレンダリングテスト
  it('renders todo list with header and date', () => {
    renderWithMantine(<TodoListModern />)
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(
      screen.getByText(/\d{1,2}月\d{1,2}日[月火水木金土日]曜日/)
    ).toBeInTheDocument()
  })

  // 追加ボタンのテスト
  it('renders add task button', () => {
    renderWithMantine(<TodoListModern />)
    expect(
      screen.getByRole('button', { name: /タスクの追加/ })
    ).toBeInTheDocument()
  })

  // TODOアイテムのレンダリングテスト
  it('renders todo items when todos exist', () => {
    renderWithMantine(<TodoListModern />)
    // デフォルトで表示されるTODOアイテムの確認
    expect(screen.getByText('サンプル会議')).toBeInTheDocument()
    expect(screen.getByText('タスク')).toBeInTheDocument()
  })

  // チェックボックスのテスト
  it('renders checkboxes for each todo item', () => {
    renderWithMantine(<TodoListModern />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  // 空のメッセージテスト
  it('shows empty message when no todos exist', () => {
    renderWithMantine(<TodoListModern showEmpty={true} />)
    expect(screen.getByText('タスクがありません')).toBeInTheDocument()
  })

  // シンプルなレイアウトテスト
  it('applies correct layout classes', () => {
    renderWithMantine(<TodoListModern />)
    const container = screen.getByTestId('todo-list-modern')
    expect(container).toHaveClass('todo-list-modern')
  })
})
