import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'

import { DateQuickPicker } from './date-quick-picker'

// MantineProviderでラップするヘルパー関数
const renderWithMantine = (component: React.ReactElement) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

describe('DateQuickPicker', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quick selection buttons', () => {
    renderWithMantine(<DateQuickPicker onChange={mockOnChange} />)

    expect(screen.getByText('今日')).toBeInTheDocument()
    expect(screen.getByText('明日')).toBeInTheDocument()
    expect(screen.getByText('今週')).toBeInTheDocument()
  })

  it('calls onChange with today date when "今日" button is clicked', () => {
    renderWithMantine(<DateQuickPicker onChange={mockOnChange} />)

    const todayButton = screen.getByText('今日')
    fireEvent.click(todayButton)

    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date))
    const calledDate = mockOnChange.mock.calls[0][0]
    const today = new Date()
    expect(calledDate.getFullYear()).toBe(today.getFullYear())
    expect(calledDate.getMonth()).toBe(today.getMonth())
    expect(calledDate.getDate()).toBe(today.getDate())
    expect(calledDate.getHours()).toBe(23)
    expect(calledDate.getMinutes()).toBe(59)
    expect(calledDate.getSeconds()).toBe(59)
  })

  it('calls onChange with tomorrow date when "明日" button is clicked', () => {
    renderWithMantine(<DateQuickPicker onChange={mockOnChange} />)

    const tomorrowButton = screen.getByText('明日')
    fireEvent.click(tomorrowButton)

    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date))
    const calledDate = mockOnChange.mock.calls[0][0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(calledDate.getFullYear()).toBe(tomorrow.getFullYear())
    expect(calledDate.getMonth()).toBe(tomorrow.getMonth())
    expect(calledDate.getDate()).toBe(tomorrow.getDate())
    expect(calledDate.getHours()).toBe(23)
    expect(calledDate.getMinutes()).toBe(59)
    expect(calledDate.getSeconds()).toBe(59)
  })

  it('calls onChange with this week Sunday date when "今週" button is clicked', () => {
    renderWithMantine(<DateQuickPicker onChange={mockOnChange} />)

    const thisWeekButton = screen.getByText('今週')
    fireEvent.click(thisWeekButton)

    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date))
    const calledDate = mockOnChange.mock.calls[0][0]
    const thisSunday = new Date()
    const daysUntilSunday = 7 - thisSunday.getDay()
    thisSunday.setDate(thisSunday.getDate() + daysUntilSunday)
    expect(calledDate.getFullYear()).toBe(thisSunday.getFullYear())
    expect(calledDate.getMonth()).toBe(thisSunday.getMonth())
    expect(calledDate.getDate()).toBe(thisSunday.getDate())
    expect(calledDate.getHours()).toBe(23)
    expect(calledDate.getMinutes()).toBe(59)
    expect(calledDate.getSeconds()).toBe(59)
  })

  it('renders buttons as proper button elements', () => {
    renderWithMantine(<DateQuickPicker onChange={mockOnChange} />)

    const todayButton = screen.getByRole('button', { name: '今日' })
    const tomorrowButton = screen.getByRole('button', { name: '明日' })
    const thisWeekButton = screen.getByRole('button', { name: '今週' })

    expect(todayButton).toBeInTheDocument()
    expect(tomorrowButton).toBeInTheDocument()
    expect(thisWeekButton).toBeInTheDocument()
  })
})
