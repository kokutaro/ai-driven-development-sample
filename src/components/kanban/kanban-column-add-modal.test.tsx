import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KanbanColumnAddModal } from './kanban-column-add-modal'

import { useKanbanStore } from '@/stores/kanban-store'
import { render } from '@/test-utils'

vi.mock('@/stores/kanban-store')

describe('KanbanColumnAddModal', () => {
  const mockCreateKanbanColumn = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useKanbanStore).mockReturnValue({
      clearError: vi.fn(),
      createKanbanColumn: mockCreateKanbanColumn,
      deleteKanbanColumn: vi.fn(),
      error: undefined,
      fetchKanbanColumns: vi.fn(),
      isLoading: false,
      kanbanColumns: [],
      reorderKanbanColumns: vi.fn(),
      reset: vi.fn(),
      updateKanbanColumn: vi.fn(),
    })
  })

  it('renders modal when opened', () => {
    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    expect(screen.getByText('新しいカラムを追加')).toBeInTheDocument()
    expect(screen.getByLabelText('カラム名')).toBeInTheDocument()
    expect(screen.getByLabelText('カラムの色')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument()
  })

  it('does not render modal when closed', () => {
    render(<KanbanColumnAddModal onClose={mockOnClose} opened={false} />)

    expect(screen.queryByText('新しいカラムを追加')).not.toBeInTheDocument()
  })

  it('shows validation errors for empty name', async () => {
    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    const submitButton = screen.getByRole('button', { name: '作成' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('カラム名は必須です')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid color format', async () => {
    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    const nameInput = screen.getByLabelText('カラム名')
    const colorInput = screen.getByLabelText('カラムの色')

    fireEvent.change(nameInput, { target: { value: 'テストカラム' } })
    fireEvent.change(colorInput, { target: { value: 'invalid-color' } })

    const submitButton = screen.getByRole('button', { name: '作成' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('色はHEX形式で入力してください')
      ).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    mockCreateKanbanColumn.mockResolvedValue(undefined)

    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    const nameInput = screen.getByLabelText('カラム名')
    const colorInput = screen.getByLabelText('カラムの色')

    fireEvent.change(nameInput, { target: { value: 'テストカラム' } })
    fireEvent.change(colorInput, { target: { value: '#FF6B6B' } })

    const submitButton = screen.getByRole('button', { name: '作成' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateKanbanColumn).toHaveBeenCalledWith({
        color: '#FF6B6B',
        name: 'テストカラム',
      })
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('resets form when cancel button is clicked', async () => {
    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    const nameInput = screen.getByLabelText('カラム名')
    fireEvent.change(nameInput, { target: { value: 'テスト' } })

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles creation error gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
        // No-op for testing
      })
    mockCreateKanbanColumn.mockRejectedValue(new Error('Creation failed'))

    render(<KanbanColumnAddModal onClose={mockOnClose} opened />)

    const nameInput = screen.getByLabelText('カラム名')
    fireEvent.change(nameInput, { target: { value: 'テストカラム' } })

    const submitButton = screen.getByRole('button', { name: '作成' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム作成エラー:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })
})
