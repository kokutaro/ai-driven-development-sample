import { TodoSidebar } from './todo-sidebar'

import { useTodoStats } from '@/hooks/use-todo-stats'
import { useUiStore } from '@/stores/ui-store'
import { fireEvent, render, screen } from '@/test-utils'

// UIストアのモック
vi.mock('@/stores/ui-store', () => ({
  useUiStore: vi.fn(),
}))

// todo統計フックのモック
vi.mock('@/hooks/use-todo-stats', () => ({
  useTodoStats: vi.fn(),
}))

// Tabler iconsのモック
vi.mock('@tabler/icons-react', () => ({
  IconCalendarEvent: () => <div data-testid="icon-calendar" />,
  IconCheck: () => <div data-testid="icon-check" />,
  IconListCheck: () => <div data-testid="icon-list" />,
  IconMail: () => <div data-testid="icon-mail" />,
  IconStar: () => <div data-testid="icon-star" />,
  IconSun: () => <div data-testid="icon-sun" />,
  IconUser: () => <div data-testid="icon-user" />,
}))

const mockSetSelectedFilter = vi.fn()
const mockUiStore = {
  selectedFilter: 'all',
  setSelectedFilter: mockSetSelectedFilter,
}

const mockStats = {
  assignedCount: 12,
  completedCount: 7,
  importantCount: 3,
  todayCount: 5,
  totalCount: 20,
  upcomingCount: 8,
}

describe('TodoSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUiStore).mockReturnValue(mockUiStore)
    vi.mocked(useTodoStats).mockReturnValue({ stats: mockStats })
  })

  it('すべてのフィルタ項目が正しく表示される', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    expect(screen.getByText('今日の予定')).toBeInTheDocument()
    expect(screen.getByText('重要')).toBeInTheDocument()
    expect(screen.getByText('今後の予定')).toBeInTheDocument()
    expect(screen.getByText('自分に割り当て')).toBeInTheDocument()
    expect(screen.getByText('フラグを設定したメール')).toBeInTheDocument()
    expect(screen.getByText('タスク')).toBeInTheDocument()
    expect(screen.getByText('完了済み')).toBeInTheDocument()
  })

  it('各フィルタのアイコンが正しく表示される', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument()
    expect(screen.getByTestId('icon-star')).toBeInTheDocument()
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
    expect(screen.getByTestId('icon-user')).toBeInTheDocument()
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument()
    expect(screen.getByTestId('icon-list')).toBeInTheDocument()
    expect(screen.getByTestId('icon-check')).toBeInTheDocument()
  })

  it('タスク数のバッジが正しく表示される', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    expect(screen.getByText('5')).toBeInTheDocument() // todayCount
    expect(screen.getByText('3')).toBeInTheDocument() // importantCount
    expect(screen.getByText('8')).toBeInTheDocument() // upcomingCount
    expect(screen.getByText('12')).toBeInTheDocument() // assignedCount
    expect(screen.getByText('20')).toBeInTheDocument() // totalCount
    expect(screen.getByText('7')).toBeInTheDocument() // completedCount
  })

  it('タスク数が0の場合はバッジが表示されない', () => {
    // Arrange
    const statsWithZero = { ...mockStats, todayCount: 0 }
    vi.mocked(useTodoStats).mockReturnValue({ stats: statsWithZero })

    // Act
    render(<TodoSidebar />)

    // Assert
    const badges = screen.queryAllByText('0')
    expect(badges).toHaveLength(0)
  })

  it('選択されたフィルタがアクティブ状態で表示される', () => {
    // Arrange
    const uiStoreWithSelected = { ...mockUiStore, selectedFilter: 'important' }
    vi.mocked(useUiStore).mockReturnValue(uiStoreWithSelected)

    // Act
    render(<TodoSidebar />)

    // Assert
    const importantFilter = screen
      .getByText('重要')
      .closest('[data-active="true"]')
    expect(importantFilter).toBeInTheDocument()
  })

  it('フィルタ項目をクリックするとsetSelectedFilterが呼ばれる', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    fireEvent.click(screen.getByText('重要'))
    expect(mockSetSelectedFilter).toHaveBeenCalledWith('important')

    fireEvent.click(screen.getByText('今日の予定'))
    expect(mockSetSelectedFilter).toHaveBeenCalledWith('today')

    fireEvent.click(screen.getByText('完了済み'))
    expect(mockSetSelectedFilter).toHaveBeenCalledWith('completed')
  })

  it('複数のフィルタ項目をクリックした時の動作確認', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    fireEvent.click(screen.getByText('今後の予定'))
    expect(mockSetSelectedFilter).toHaveBeenCalledWith('upcoming')

    fireEvent.click(screen.getByText('タスク'))
    expect(mockSetSelectedFilter).toHaveBeenCalledWith('all')

    expect(mockSetSelectedFilter).toHaveBeenCalledTimes(2)
  })

  it('フラグを設定したメールフィルタは常に0カウントで表示される', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    const flaggedItem = screen.getByText('フラグを設定したメール')
    const flaggedBadge =
      flaggedItem.parentElement?.querySelector('[data-badge]')
    expect(flaggedBadge).not.toBeInTheDocument()
  })

  it('各フィルタ項目が正しく設定される', () => {
    // Act
    render(<TodoSidebar />)

    // Assert
    const navLinks = document.querySelectorAll('.mantine-NavLink-root')
    expect(navLinks.length).toBe(7) // 7つのフィルタ項目
  })

  it('NavLinkがクリック可能である', () => {
    // Act
    render(<TodoSidebar />)
    const importantFilter = screen.getByText('重要')

    // Assert - NavLinkはa要素として生成され、クリック可能である
    expect(importantFilter.closest('a')).toBeInTheDocument()
    expect(importantFilter.closest('a')).toHaveClass('mantine-NavLink-root')
  })
})
