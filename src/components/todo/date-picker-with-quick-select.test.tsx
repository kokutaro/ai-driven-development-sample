import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { fireEvent, render, screen } from '@testing-library/react'

import 'dayjs/locale/ja'
import { DatePickerWithQuickSelect } from './date-picker-with-quick-select'

// MantineProviderとDatesProviderでラップするヘルパー関数
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MantineProvider>
      <DatesProvider settings={{ firstDayOfWeek: 0, locale: 'ja' }}>
        {component}
      </DatesProvider>
    </MantineProvider>
  )
}

describe('DatePickerWithQuickSelect', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quick selection buttons and date picker', () => {
    renderWithProviders(
      <DatePickerWithQuickSelect
        label="期限日"
        onChange={mockOnChange}
        placeholder="期限日を選択..."
      />
    )

    // Quick selection buttons
    expect(screen.getByText('今日')).toBeInTheDocument()
    expect(screen.getByText('明日')).toBeInTheDocument()
    expect(screen.getByText('今週')).toBeInTheDocument()

    // Date picker
    expect(screen.getByLabelText('期限日')).toBeInTheDocument()
    expect(screen.getByText('期限日を選択...')).toBeInTheDocument()
  })

  it('calls onChange when quick selection button is clicked', () => {
    renderWithProviders(
      <DatePickerWithQuickSelect label="期限日" onChange={mockOnChange} />
    )

    const todayButton = screen.getByText('今日')
    fireEvent.click(todayButton)

    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Date))
  })

  it('passes props to DatePickerInput', () => {
    renderWithProviders(
      <DatePickerWithQuickSelect
        clearable
        label="期限日"
        onChange={mockOnChange}
        placeholder="期限日を選択..."
      />
    )

    const dateInput = screen.getByLabelText('期限日')
    expect(dateInput).toBeInTheDocument()
    expect(screen.getByText('期限日を選択...')).toBeInTheDocument()
  })
})
