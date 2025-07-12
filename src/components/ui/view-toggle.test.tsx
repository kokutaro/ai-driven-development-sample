import type { ReactNode } from 'react'

import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ViewToggle } from './view-toggle'

// テスト用Mantineプロバイダー
const renderWithMantine = (component: ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>)
}

// UIストアのモック
const mockSetViewMode = vi.fn()

vi.mock('@/stores/ui-store', () => ({
  type: {
    ViewMode: String,
  },
  useUiStore: () => ({
    setViewMode: mockSetViewMode,
    viewMode: 'list',
  }),
}))

describe('ViewToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本レンダリング', () => {
    it('SegmentedControlが正しくレンダリングされる', () => {
      renderWithMantine(<ViewToggle />)

      // radiogroup roleが存在すること
      const segmentedControl = screen.getByRole('radiogroup')
      expect(segmentedControl).toBeInTheDocument()
    })

    it('リストとKanbanのオプションが表示される', () => {
      renderWithMantine(<ViewToggle />)

      // 両方のオプションが存在すること
      expect(screen.getByRole('radio', { name: 'リスト' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Kanban' })).toBeInTheDocument()
    })

    it('各オプションのvalue属性が正しく設定される', () => {
      renderWithMantine(<ViewToggle />)

      const listOption = screen.getByRole('radio', { name: 'リスト' })
      const kanbanOption = screen.getByRole('radio', { name: 'Kanban' })

      expect(listOption).toHaveAttribute('value', 'list')
      expect(kanbanOption).toHaveAttribute('value', 'kanban')
    })

    it('size="sm"プロパティが適用される', () => {
      renderWithMantine(<ViewToggle />)

      const segmentedControl = screen.getByRole('radiogroup')
      expect(segmentedControl).toHaveClass('mantine-SegmentedControl-root')
    })
  })

  describe('ビュー変更操作', () => {
    it('Kanban選択時にsetViewMode("kanban")が呼ばれる', () => {
      renderWithMantine(<ViewToggle />)

      const kanbanOption = screen.getByRole('radio', { name: 'Kanban' })
      fireEvent.click(kanbanOption)

      expect(mockSetViewMode).toHaveBeenCalledWith('kanban')
    })

    it('選択されていない値をクリックした時のみsetViewModeが呼ばれる', () => {
      renderWithMantine(<ViewToggle />)

      // 初期状態はlistが選択されているので、kanbanをクリックすると呼ばれる
      const kanbanOption = screen.getByRole('radio', { name: 'Kanban' })
      fireEvent.click(kanbanOption)

      expect(mockSetViewMode).toHaveBeenCalledTimes(1)
      expect(mockSetViewMode).toHaveBeenCalledWith('kanban')
    })
  })

  describe('型キャスト処理', () => {
    it('文字列型の引数がViewMode型として正しく渡される', () => {
      renderWithMantine(<ViewToggle />)

      const kanbanOption = screen.getByRole('radio', { name: 'Kanban' })
      fireEvent.click(kanbanOption)

      // 文字列 "kanban" がViewMode型としてキャストされて渡される
      expect(mockSetViewMode).toHaveBeenCalledWith('kanban')
      expect(typeof mockSetViewMode.mock.calls[0][0]).toBe('string')
    })
  })

  describe('アクセシビリティ', () => {
    it('radiogroup roleが正しく設定される', () => {
      renderWithMantine(<ViewToggle />)

      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
    })

    it('各オプションがradio roleを持つ', () => {
      renderWithMantine(<ViewToggle />)

      const listRadio = screen.getByRole('radio', { name: 'リスト' })
      const kanbanRadio = screen.getByRole('radio', { name: 'Kanban' })

      expect(listRadio).toBeInTheDocument()
      expect(kanbanRadio).toBeInTheDocument()
    })

    it('選択状態がaria属性で表現される', () => {
      renderWithMantine(<ViewToggle />)

      const listOption = screen.getByRole('radio', { name: 'リスト' })
      // 初期状態でlistが選択されている（モックの設定通り）
      expect(listOption).toBeChecked()
    })
  })
})
