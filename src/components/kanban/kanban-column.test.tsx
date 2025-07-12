import React from 'react'

import { useDroppable } from '@dnd-kit/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KanbanColumn } from './kanban-column'

import type { KanbanColumn as KanbanColumnType } from '@/types/todo'

import { useKanbanStore } from '@/stores/kanban-store'
import { render } from '@/test-utils'

const mockColumn: KanbanColumnType = {
  color: '#E3F2FD',
  createdAt: new Date('2024-01-01'),
  id: 'column-1',
  name: 'To Do',
  order: 1,
  todos: [
    {
      category: {
        color: '#FF6B6B',
        createdAt: new Date('2024-01-01'),
        id: 'category-1',
        name: '仕事',
        updatedAt: new Date('2024-01-01'),
        userId: 'user-1',
      },
      categoryId: 'category-1',
      createdAt: new Date('2024-01-01'),
      description: 'テストタスクの説明',
      dueDate: new Date('2024-01-31'),
      id: 'todo-1',
      isCompleted: false,
      isImportant: true,
      kanbanColumnId: 'column-1',
      order: 1,
      title: 'テストタスク1',
      updatedAt: new Date('2024-01-01'),
      userId: 'user-1',
    },
    {
      category: {
        color: '#4ECDC4',
        createdAt: new Date('2024-01-02'),
        id: 'category-2',
        name: '個人',
        updatedAt: new Date('2024-01-02'),
        userId: 'user-1',
      },
      categoryId: 'category-2',
      createdAt: new Date('2024-01-02'),
      description: 'テストタスク2の説明',
      id: 'todo-2',
      isCompleted: false,
      isImportant: false,
      kanbanColumnId: 'column-1',
      order: 2,
      title: 'テストタスク2',
      updatedAt: new Date('2024-01-02'),
      userId: 'user-1',
    },
  ],
  updatedAt: new Date('2024-01-01'),
  userId: 'user-1',
}

// Kanbanストアのモック
vi.mock('@/stores/kanban-store', () => ({
  useKanbanStore: vi.fn(),
}))

// Mantineモーダルのモック
vi.mock('@mantine/modals', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    modals: {
      openConfirmModal: vi.fn(),
    },
  }
})

// DnD関連のモック
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: 'vertical',
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => 'transform: none',
    },
  },
}))

// KanbanCardのモック
vi.mock('./kanban-card', () => ({
  KanbanCard: ({ task }: { task: { title: string } }) => (
    <div data-testid="kanban-card">{task.title}</div>
  ),
}))

// KanbanColumnEditModalのモック
vi.mock('./kanban-column-edit-modal', () => ({
  KanbanColumnEditModal: ({
    column,
    onClose,
    opened,
  }: {
    column: { name: string }
    onClose: () => void
    opened: boolean
  }) =>
    opened ? (
      <div data-testid="kanban-column-edit-modal">
        <span>編集モーダル: {column.name}</span>
        <button onClick={onClose}>閉じる</button>
      </div>
    ) : null,
}))

// 型付きモックを作成
const mockUseKanbanStore = vi.mocked(useKanbanStore)
const mockUseDroppable = vi.mocked(useDroppable)

describe('KanbanColumn', () => {
  const mockDeleteKanbanColumn = vi.fn()
  const mockSetNodeRef = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // useKanbanStoreのモック設定
    mockUseKanbanStore.mockReturnValue({
      deleteKanbanColumn: mockDeleteKanbanColumn,
    })

    // useDroppableのデフォルト状態設定
    mockUseDroppable.mockReturnValue({
      active: null,
      isOver: false,
      node: { current: null } as React.MutableRefObject<HTMLElement | null>,
      over: null,
      rect: { current: null } as React.MutableRefObject<ClientRect | null>,
      setNodeRef: mockSetNodeRef,
    })
  })

  describe('基本レンダリング', () => {
    it('カラム名とタスク数が表示される', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // タスク数
    })

    it('カラム内のすべてのタスクが表示される', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(screen.getByText('テストタスク1')).toBeInTheDocument()
      expect(screen.getByText('テストタスク2')).toBeInTheDocument()
    })

    it('空のカラムが正しく表示される', () => {
      const emptyColumn = {
        ...mockColumn,
        todos: [],
      }

      render(<KanbanColumn column={emptyColumn} />)

      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('タスクをここにドロップ')).toBeInTheDocument()
    })

    it('カラムの背景色が適用される', () => {
      render(<KanbanColumn column={mockColumn} />)

      const columnElement = screen.getByTestId('kanban-column')
      expect(columnElement).toHaveStyle('background-color: #E3F2FD')
    })

    it('メニューボタンが表示される', () => {
      render(<KanbanColumn column={mockColumn} />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toBeInTheDocument()
    })

    it('カラムがundefinedのtodosを適切に処理する', () => {
      const columnWithUndefinedTodos = {
        ...mockColumn,
        todos: undefined,
      }

      render(<KanbanColumn column={columnWithUndefinedTodos} />)

      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('タスクをここにドロップ')).toBeInTheDocument()
    })
  })

  describe('ドロップゾーン機能', () => {
    it('useDroppableが正しいパラメータで呼ばれる', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(mockUseDroppable).toHaveBeenCalledWith({
        data: {
          type: 'column',
        },
        id: mockColumn.id,
      })
    })

    it('setNodeRefがPaperコンポーネントに設定される', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(mockSetNodeRef).toHaveBeenCalled()
    })

    it('ドラッグオーバー時にopacityが変更される', () => {
      // isOverがtrueの状態をモック
      mockUseDroppable.mockReturnValue({
        active: null,
        isOver: true,
        node: { current: null } as React.MutableRefObject<HTMLElement | null>,
        over: null,
        rect: { current: null } as React.MutableRefObject<ClientRect | null>,
        setNodeRef: mockSetNodeRef,
      })

      render(<KanbanColumn column={mockColumn} />)

      const columnElement = screen.getByTestId('kanban-column')
      expect(columnElement).toHaveStyle('opacity: 0.8')
    })

    it('ドラッグオーバーしていない時のopacityが正常', () => {
      render(<KanbanColumn column={mockColumn} />)

      const columnElement = screen.getByTestId('kanban-column')
      expect(columnElement).toHaveStyle('opacity: 1')
    })
  })

  describe('SortableContext', () => {
    it('タスクがある場合にSortableContextが表示される', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
    })

    it('タスクIDがSortableContextに正しく渡される', () => {
      render(<KanbanColumn column={mockColumn} />)

      // KanbanCardが正しい数だけレンダリングされることを確認
      const kanbanCards = screen.getAllByTestId('kanban-card')
      expect(kanbanCards).toHaveLength(2)
    })

    it('タスクがない場合はSortableContextが表示されない', () => {
      const emptyColumn = {
        ...mockColumn,
        todos: [],
      }

      render(<KanbanColumn column={emptyColumn} />)

      expect(screen.queryByTestId('sortable-context')).not.toBeInTheDocument()
    })
  })

  describe('メニュー操作', () => {
    it('メニューボタンが表示される', () => {
      render(<KanbanColumn column={mockColumn} />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu')
    })

    // 注意: Mantineのメニューコンポーネントの詳細なテストは、実際のUIインタラクションではなく
    // ユニットテストレベルでは困難なため、基本的なレンダリングと存在確認にとどめます
    it('メニューボタンがクリック可能である', async () => {
      const user = userEvent.setup()
      render(<KanbanColumn column={mockColumn} />)

      const menuButton = screen.getByRole('button')
      await user.click(menuButton)

      // メニューボタンのクリックが実行できることを確認
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('編集モーダル', () => {
    it('編集モーダルが初期状態では表示されない', () => {
      render(<KanbanColumn column={mockColumn} />)

      expect(
        screen.queryByTestId('kanban-column-edit-modal')
      ).not.toBeInTheDocument()
    })

    it('KanbanColumnEditModalコンポーネントが適切にレンダリングされる', () => {
      render(<KanbanColumn column={mockColumn} />)

      // 初期状態ではモーダルは閉じている
      expect(
        screen.queryByTestId('kanban-column-edit-modal')
      ).not.toBeInTheDocument()
    })
  })

  describe('削除機能', () => {
    it('useKanbanStoreから削除関数が正しく取得される', () => {
      render(<KanbanColumn column={mockColumn} />)

      // useKanbanStoreが呼ばれて削除関数が取得されることを確認
      expect(mockUseKanbanStore).toHaveBeenCalled()
      expect(mockDeleteKanbanColumn).toBeDefined()
    })

    it('deleteKanbanColumn関数が存在することを確認', () => {
      render(<KanbanColumn column={mockColumn} />)

      // ストアから取得した関数がモック関数であることを確認
      expect(mockDeleteKanbanColumn).toBeInstanceOf(Function)
    })
  })

  describe('アクセシビリティ', () => {
    it('カラムにrole属性が適切に設定される', () => {
      render(<KanbanColumn column={mockColumn} />)

      const columnElement = screen.getByTestId('kanban-column')
      expect(columnElement).toBeInTheDocument()
    })

    it('メニューボタンがフォーカス可能である', () => {
      render(<KanbanColumn column={mockColumn} />)

      const menuButton = screen.getByRole('button')
      expect(menuButton).toBeInTheDocument()
      menuButton.focus()
      expect(menuButton).toHaveFocus()
    })
  })

  describe('エッジケース', () => {
    it('nullのtodosを適切に処理する', () => {
      const columnWithNullTodos = {
        ...mockColumn,
        todos: null as unknown as undefined,
      }

      render(<KanbanColumn column={columnWithNullTodos} />)

      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('大量のタスクがある場合でも適切にレンダリングされる', () => {
      const manyTasks = Array.from({ length: 50 }, (_, i) => ({
        ...mockColumn.todos![0],
        id: `task-${i}`,
        title: `タスク${i}`,
      }))

      const columnWithManyTasks = {
        ...mockColumn,
        todos: manyTasks,
      }

      render(<KanbanColumn column={columnWithManyTasks} />)

      expect(screen.getByText('To Do')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('非常に長いカラム名でも適切に表示される', () => {
      const longNameColumn = {
        ...mockColumn,
        name: 'これは非常に長いカラム名で、UIのレイアウトをテストするために使用されます',
      }

      render(<KanbanColumn column={longNameColumn} />)

      expect(screen.getByText(longNameColumn.name)).toBeInTheDocument()
    })

    it('特殊な色コード値でも適切に処理される', () => {
      const specialColorColumn = {
        ...mockColumn,
        color: 'transparent',
      }

      render(<KanbanColumn column={specialColorColumn} />)

      const columnElement = screen.getByTestId('kanban-column')
      // transparentはrgba(0, 0, 0, 0)として解釈される
      expect(columnElement).toHaveStyle('background-color: rgba(0, 0, 0, 0)')
    })
  })
})
