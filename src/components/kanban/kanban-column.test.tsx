import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KanbanColumn } from './kanban-column'

import type { KanbanColumn as KanbanColumnType } from '@/types/todo'

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

// DnD関連のモック
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

describe('KanbanColumn', () => {
  it('renders column with name and task count', () => {
    render(<KanbanColumn column={mockColumn} />)

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // タスク数
  })

  it('renders all tasks in the column', () => {
    render(<KanbanColumn column={mockColumn} />)

    expect(screen.getByText('テストタスク1')).toBeInTheDocument()
    expect(screen.getByText('テストタスク2')).toBeInTheDocument()
  })

  it('renders empty column correctly', () => {
    const emptyColumn = {
      ...mockColumn,
      todos: [],
    }

    render(<KanbanColumn column={emptyColumn} />)

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('タスクをここにドロップ')).toBeInTheDocument()
  })

  it('applies column background color', () => {
    render(<KanbanColumn column={mockColumn} />)

    const columnElement = screen.getByTestId('kanban-column')
    expect(columnElement).toHaveStyle('background-color: #E3F2FD')
  })
})
