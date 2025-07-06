import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TodoSidebar } from '@/components/todo-sidebar'
import { useTodoUIStore } from '@/stores/todo-ui-store'

/**
 * テスト用のMantineProviderラッパー
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>
}

// Zustandストアのモック
vi.mock('@/stores/todo-ui-store')

const mockUseTodoUIStore = vi.mocked(useTodoUIStore)

describe('TodoSidebar', () => {
  const mockSetFilter = vi.fn()

  beforeEach(() => {
    mockSetFilter.mockClear()

    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'all',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: mockSetFilter,
      setSelectedTodoId: vi.fn(),
    })
  })

  it('サイドバーが正しくレンダリングされる', () => {
    render(<TodoSidebar />, { wrapper: TestWrapper })

    expect(screen.getByText('TODO フィルター')).toBeInTheDocument()
  })

  it('すべてのフィルタオプションが表示される', () => {
    render(<TodoSidebar />, { wrapper: TestWrapper })

    expect(screen.getByText('今日')).toBeInTheDocument()
    expect(screen.getByText('今週')).toBeInTheDocument()
    expect(screen.getByText('今月')).toBeInTheDocument()
    expect(screen.getByText('全て')).toBeInTheDocument()
    expect(screen.getByText('完了済み')).toBeInTheDocument()
  })

  it('現在選択されているフィルタがアクティブ状態で表示される', () => {
    mockUseTodoUIStore.mockReturnValue({
      currentFilter: 'today',
      isDetailPanelVisible: false,
      selectedTodoId: undefined,
      setFilter: mockSetFilter,
      setSelectedTodoId: vi.fn(),
    })

    render(<TodoSidebar />, { wrapper: TestWrapper })

    const todayButton = screen.getByRole('button', { name: '今日' })
    expect(todayButton).toHaveAttribute('data-active', 'true')
  })

  it('フィルタボタンをクリックすると適切なフィルタが設定される', async () => {
    const user = userEvent.setup()
    render(<TodoSidebar />, { wrapper: TestWrapper })

    const todayButton = screen.getByRole('button', { name: '今日' })
    await user.click(todayButton)

    expect(mockSetFilter).toHaveBeenCalledWith('today')
  })

  it('異なるフィルタボタンをクリックすると正しいフィルタが設定される', async () => {
    const user = userEvent.setup()
    render(<TodoSidebar />, { wrapper: TestWrapper })

    // 今週フィルタをクリック
    const thisWeekButton = screen.getByRole('button', { name: '今週' })
    await user.click(thisWeekButton)
    expect(mockSetFilter).toHaveBeenCalledWith('thisWeek')

    // 完了済みフィルタをクリック
    const completedButton = screen.getByRole('button', { name: '完了済み' })
    await user.click(completedButton)
    expect(mockSetFilter).toHaveBeenCalledWith('completed')
  })
})
