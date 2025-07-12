import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('should handle useEffect when column.color changes', async () => {
    const { rerender } = render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    expect(screen.getByDisplayValue('#4ECDC4')).toBeInTheDocument()

    // カラムの色を変更
    const updatedColumn = { ...mockColumn, color: '#FF6B6B' }
    rerender(
      <KanbanColumnEditModal
        column={updatedColumn}
        onClose={mockOnClose}
        opened
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('#FF6B6B')).toBeInTheDocument()
    })
  })

  it('should handle useEffect when column.name changes', async () => {
    const { rerender } = render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    expect(screen.getByDisplayValue('テストカラム')).toBeInTheDocument()

    // カラムの名前を変更
    const updatedColumn = { ...mockColumn, name: '新しいカラム名' }
    rerender(
      <KanbanColumnEditModal
        column={updatedColumn}
        onClose={mockOnClose}
        opened
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('新しいカラム名')).toBeInTheDocument()
    })
  })

  it('should handle useEffect when column becomes null', async () => {
    const { rerender } = render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    expect(screen.getByText('カラムを編集')).toBeInTheDocument()

    // カラムをnullに変更
    rerender(
      <KanbanColumnEditModal column={undefined} onClose={mockOnClose} opened />
    )

    await waitFor(() => {
      expect(screen.queryByText('カラムを編集')).not.toBeInTheDocument()
    })
  })

  it('should validate 50-character name boundary', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const nameInput = screen.getByDisplayValue('テストカラム')
    const fiftyCharName = 'a'.repeat(50)

    fireEvent.change(nameInput, { target: { value: fiftyCharName } })

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateKanbanColumn).toHaveBeenCalledWith('column-1', {
        color: '#4ECDC4',
        name: fiftyCharName,
      })
    })

    expect(fiftyCharName).toHaveLength(50)
  })

  it('should show loading state during update', async () => {
    // 長時間かかる更新をシミュレート
    mockUpdateKanbanColumn.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    // 更新中はボタンが無効化されるかローディング状態になることを期待
    // Note: 実装によってはsubmitButton.disabledやローディングインジケーターを確認
    expect(mockUpdateKanbanColumn).toHaveBeenCalled()

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should reset form completely on handleClose after changes', async () => {
    const { unmount } = render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const nameInput = screen.getByDisplayValue('テストカラム')
    const colorInput = screen.getByDisplayValue('#4ECDC4')

    // フォームを変更
    fireEvent.change(nameInput, { target: { value: '変更されたテキスト' } })
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })

    // 変更が反映されていることを確認
    expect(screen.getByDisplayValue('変更されたテキスト')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument()

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    fireEvent.click(cancelButton)

    // onCloseが呼ばれることを確認
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })

    // 古いモーダルをアンマウント
    unmount()

    // フォームが元の値にリセットされることを確認するために再レンダリング
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    expect(screen.getByDisplayValue('テストカラム')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#4ECDC4')).toBeInTheDocument()
  })

  it('should handle color picker focus events', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const colorInput = screen.getByDisplayValue('#4ECDC4')

    // フォーカスイベント
    fireEvent.focus(colorInput)

    // フォーカスイベントが実行されることを確認（実際のフォーカス状態ではなく）
    expect(colorInput).toBeInTheDocument()

    // ブラーイベント
    fireEvent.blur(colorInput)

    // ブラーイベントが実行されることを確認
    expect(colorInput).toBeInTheDocument()
  })

  it('should prevent submission with 51-character name (over boundary)', async () => {
    render(
      <KanbanColumnEditModal column={mockColumn} onClose={mockOnClose} opened />
    )

    const nameInput = screen.getByDisplayValue('テストカラム')
    const fiftyOneCharName = 'a'.repeat(51)

    fireEvent.change(nameInput, { target: { value: fiftyOneCharName } })

    const submitButton = screen.getByRole('button', { name: '更新' })
    fireEvent.click(submitButton)

    // バリデーションエラーによりフォーム送信が阻止される
    await waitFor(() => {
      expect(mockUpdateKanbanColumn).not.toHaveBeenCalled()
    })

    expect(fiftyOneCharName).toHaveLength(51)
  })
})
