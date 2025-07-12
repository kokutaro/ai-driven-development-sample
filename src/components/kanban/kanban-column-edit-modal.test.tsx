import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KanbanColumnEditModal } from './kanban-column-edit-modal'

import type { KanbanColumn } from '@/types/todo'

import { useKanbanStore } from '@/stores/kanban-store'
import { render } from '@/test-utils'

vi.mock('@/stores/kanban-store')

describe('KanbanColumnEditModal', () => {
  const mockUpdateKanbanColumn = vi.fn()
  const mockOnClose = vi.fn()

  const mockColumn: KanbanColumn = {
    color: '#4ECDC4',
    createdAt: new Date(),
    id: 'column-1',
    name: 'テストカラム',
    order: 1,
    updatedAt: new Date(),
    userId: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useKanbanStore).mockReturnValue({
      clearError: vi.fn(),
      createKanbanColumn: vi.fn(),
      deleteKanbanColumn: vi.fn(),
      error: undefined,
      fetchKanbanColumns: vi.fn(),
      isLoading: false,
      kanbanColumns: [],
      reorderKanbanColumns: vi.fn(),
      reset: vi.fn(),
      updateKanbanColumn: mockUpdateKanbanColumn,
    })
  })

  it('renders modal when opened with column data', () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    expect(screen.getByText('カラムを編集')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストカラム')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#4ECDC4')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
  })

  it('does not render modal when closed', () => {
    render(
      <KanbanColumnEditModal
        column={mockColumn}
        onClose={mockOnClose}
        opened={false}
      />
    )

    expect(screen.queryByText('カラムを編集')).not.toBeInTheDocument()
  })

  it('does not render modal when column is undefined', () => {
    render(
      <KanbanColumnEditModal column={undefined} onClose={mockOnClose} opened />
    )

    expect(screen.queryByText('カラムを編集')).not.toBeInTheDocument()
  })

  it('prevents form submission with empty name', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    // ラベルの代わりにplaceholderまたはdisplayValueで検索
    const nameInput = screen.getByDisplayValue('テストカラム')
    fireEvent.change(nameInput, { target: { value: '' } })

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    // バリデーションエラーによりフォーム送信が阻止される
    await waitFor(() => {
      expect(mockUpdateKanbanColumn).not.toHaveBeenCalled()
    })
  })

  it('prevents form submission with invalid color format', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    // ラベルの代わりにdisplayValueで検索
    const colorInput = screen.getByDisplayValue('#4ECDC4')
    fireEvent.change(colorInput, { target: { value: 'invalid-color' } })

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    // バリデーションエラーによりフォーム送信が阻止される
    await waitFor(() => {
      expect(mockUpdateKanbanColumn).not.toHaveBeenCalled()
    })
  })

  it('submits form with valid updated data', async () => {
    mockUpdateKanbanColumn.mockResolvedValue(undefined)

    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const nameInput = screen.getByDisplayValue('テストカラム')
    const colorInput = screen.getByDisplayValue('#4ECDC4')

    fireEvent.change(nameInput, { target: { value: '更新されたカラム' } })
    fireEvent.change(colorInput, { target: { value: '#FF6B6B' } })

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateKanbanColumn).toHaveBeenCalledWith('column-1', {
        color: '#FF6B6B',
        name: '更新されたカラム',
      })
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('resets form when cancel button is clicked', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const nameInput = screen.getByDisplayValue('テストカラム')
    fireEvent.change(nameInput, { target: { value: '変更されたテキスト' } })

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles update error gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
        // No-op for testing
      })
    mockUpdateKanbanColumn.mockRejectedValue(new Error('Update failed'))

    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Kanbanカラム更新エラー:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })
})
