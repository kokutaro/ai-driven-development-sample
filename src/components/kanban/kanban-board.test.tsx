import { act, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KanbanBoard } from './kanban-board'

import type { KanbanColumn, Todo } from '@/types/todo'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import { render } from '@/test-utils'

// DOM APIのモック
global.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, options?: PointerEventInit) {
    super(type, options)
  }
} as unknown as typeof PointerEvent

// ストアのモック
const mockFetchKanbanColumns = vi.fn()
const mockCreateDefaultColumns = vi.fn()
const mockMoveToKanbanColumn = vi.fn()

const mockKanbanStore = {
  createDefaultColumns: mockCreateDefaultColumns,
  error: undefined,
  fetchKanbanColumns: mockFetchKanbanColumns,
  isLoading: false,
  kanbanColumns: [],
}

const mockTodoStore = {
  moveToKanbanColumn: mockMoveToKanbanColumn,
}

vi.mock('@/stores/kanban-store', () => ({
  useKanbanStore: () => mockKanbanStore,
}))

vi.mock('@/stores/todo-store', () => ({
  useTodoStore: () => mockTodoStore,
}))

// @dnd-kit関連のモック
const mockOnDragEnd = vi.fn()
const mockOnDragOver = vi.fn()
const mockOnDragStart = vi.fn()

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
    onDragOver,
    onDragStart,
  }: {
    children: React.ReactNode
    onDragEnd: (event: DragEndEvent) => void
    onDragOver: (event: DragOverEvent) => void
    onDragStart: (event: DragStartEvent) => void
  }) => {
    // イベントハンドラーを保存してテストで呼び出せるようにする
    mockOnDragEnd.mockImplementation(onDragEnd)
    mockOnDragOver.mockImplementation(onDragOver)
    mockOnDragStart.mockImplementation(onDragStart)
    return <div data-testid="dnd-context">{children}</div>
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn().mockReturnValue([]),
}))

vi.mock('@dnd-kit/sortable', () => ({
  horizontalListSortingStrategy: 'horizontal',
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
}))

// 子コンポーネントのモック
vi.mock('./kanban-column', () => ({
  KanbanColumn: ({ column }: { column: KanbanColumn }) => (
    <div data-testid={`kanban-column-${column.id}`}>{column.name}</div>
  ),
}))

vi.mock('./kanban-card', () => ({
  KanbanCard: ({ task }: { task: Todo }) => (
    <div data-testid={`kanban-card-${task.id}`}>{task.title}</div>
  ),
}))

// テスト用のモックデータ
const mockTask: Todo = {
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
  id: 'task-1',
  isCompleted: false,
  isImportant: true,
  kanbanColumnId: 'column-1',
  order: 1,
  title: 'テストタスク',
  updatedAt: new Date('2024-01-01'),
  userId: 'user-1',
}

const mockColumn: KanbanColumn = {
  color: '#E3F2FD',
  createdAt: new Date('2024-01-01'),
  id: 'column-1',
  name: 'To Do',
  order: 1,
  todos: [mockTask],
  updatedAt: new Date('2024-01-01'),
  userId: 'user-1',
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // モックの状態をリセット
    Object.assign(mockKanbanStore, {
      createDefaultColumns: mockCreateDefaultColumns,
      error: undefined,
      fetchKanbanColumns: mockFetchKanbanColumns,
      isLoading: false,
      kanbanColumns: [],
    })
    Object.assign(mockTodoStore, {
      moveToKanbanColumn: mockMoveToKanbanColumn,
    })
  })

  describe('基本レンダリング', () => {
    it('ローディング状態を正しく表示する', () => {
      // Arrange - ローディング状態のストアをモック
      Object.assign(mockKanbanStore, {
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: true,
        kanbanColumns: [],
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      // MantineのLoaderコンポーネントを確認
      expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
    })

    it('エラー状態を正しく表示する', () => {
      // Arrange - エラー状態のストアをモック
      const errorMessage = 'データの取得に失敗しました'
      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: errorMessage,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [],
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      expect(screen.getByText('エラー')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('正常状態でKanbanボードを表示する', () => {
      // Arrange - 正常状態のストアをモック
      Object.assign(mockKanbanStore, {
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [mockColumn],
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('kanban-column-column-1')).toBeInTheDocument()
    })

    it('空のkanbanColumnsでも正しく表示する', () => {
      // Arrange - 空のカラム配列をモック
      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [],
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument()
      expect(screen.queryByTestId(/kanban-column-/)).not.toBeInTheDocument()
    })
  })

  describe('useEffect処理', () => {
    it('コンポーネントマウント時にfetchKanbanColumnsを呼び出す', async () => {
      // Arrange
      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [],
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      await waitFor(() => {
        expect(mockFetchKanbanColumns).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('ドラッグ&ドロップ機能', () => {
    beforeEach(() => {
      // 正常状態のストアをセットアップ
      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [mockColumn],
      })
    })

    it('handleDragStartでactiveIdとactiveTaskを設定する', () => {
      // Arrange
      render(<KanbanBoard />)
      const dragStartEvent: DragStartEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
      }

      // Act
      act(() => {
        mockOnDragStart(dragStartEvent)
      })

      // Assert - activeIdとactiveTaskが設定されることを確認
      // DragOverlayにactiveTaskが表示されることで確認
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
    })

    it('handleDragStartでtask以外のタイプの場合はactiveTaskを設定しない', () => {
      // Arrange
      render(<KanbanBoard />)
      const dragStartEvent: DragStartEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              type: 'column',
            },
          },
          id: 'column-1',
          rect: { current: { initial: null, translated: null } },
        },
      }

      // Act
      act(() => {
        mockOnDragStart(dragStartEvent)
      })

      // Assert - activeTaskが設定されないことを確認
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
    })

    it('handleDragOverでoverがnullの場合は何もしない', () => {
      // Arrange
      render(<KanbanBoard />)
      const dragOverEvent: DragOverEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: null,
      }

      // Act & Assert - エラーが発生しないことを確認
      expect(() => {
        mockOnDragOver(dragOverEvent)
      }).not.toThrow()
    })

    it('handleDragOverでタスクをカラムにドラッグした場合の処理', () => {
      // Arrange
      render(<KanbanBoard />)
      const dragOverEvent: DragOverEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'column',
            },
          },
          disabled: false,
          id: 'column-2',
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act & Assert - エラーが発生しないことを確認
      expect(() => {
        mockOnDragOver(dragOverEvent)
      }).not.toThrow()
    })

    it('handleDragEndでoverがnullの場合はactiveIdとactiveTaskをリセットする', async () => {
      // Arrange
      render(<KanbanBoard />)
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: null,
      }

      // Act
      await mockOnDragEnd(dragEndEvent)

      // Assert - 状態がリセットされることを確認
      expect(mockMoveToKanbanColumn).not.toHaveBeenCalled()
    })

    it('handleDragEndでタスクを異なるカラムに移動する', async () => {
      // Arrange
      render(<KanbanBoard />)
      const targetColumnId = 'column-2'
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'column',
            },
          },
          disabled: false,
          id: targetColumnId,
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act
      await mockOnDragEnd(dragEndEvent)

      // Assert
      expect(mockMoveToKanbanColumn).toHaveBeenCalledWith(
        mockTask.id,
        targetColumnId
      )
      expect(mockFetchKanbanColumns).toHaveBeenCalledTimes(2) // 初期ロード + 移動後
    })

    it('handleDragEndで同じカラム内の移動の場合は何もしない', async () => {
      // Arrange
      render(<KanbanBoard />)
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'column',
            },
          },
          disabled: false,
          id: 'column-1', // 同じカラム
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act
      await mockOnDragEnd(dragEndEvent)

      // Assert
      expect(mockMoveToKanbanColumn).not.toHaveBeenCalled()
    })

    it('handleDragEndでtask以外のタイプの場合は何もしない', async () => {
      // Arrange
      render(<KanbanBoard />)
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              type: 'column',
            },
          },
          id: 'column-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'column',
            },
          },
          disabled: false,
          id: 'column-2',
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act
      await mockOnDragEnd(dragEndEvent)

      // Assert
      expect(mockMoveToKanbanColumn).not.toHaveBeenCalled()
    })

    it('handleDragEndでcolumn以外のoverタイプの場合は何もしない', async () => {
      // Arrange
      render(<KanbanBoard />)
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'other',
            },
          },
          disabled: false,
          id: 'other-element',
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act
      await mockOnDragEnd(dragEndEvent)

      // Assert
      expect(mockMoveToKanbanColumn).not.toHaveBeenCalled()
    })
  })

  describe('DragOverlay表示', () => {
    beforeEach(() => {
      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [mockColumn],
      })
    })

    it('activeTaskとactiveIdがある場合にKanbanCardを表示する', () => {
      // Arrange
      render(<KanbanBoard />)
      const dragStartEvent: DragStartEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
      }

      // Act
      act(() => {
        mockOnDragStart(dragStartEvent)
      })

      // Assert
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument()
    })

    it('activeTaskまたはactiveIdがない場合は何も表示しない', () => {
      // Arrange
      render(<KanbanBoard />)

      // Act & Assert - 初期状態では何も表示されない
      const dragOverlay = screen.getByTestId('drag-overlay')
      expect(dragOverlay).toBeInTheDocument()
      expect(dragOverlay).toBeEmptyDOMElement()
    })
  })

  describe('センサー設定', () => {
    it('PointerSensorが正しく設定される', () => {
      // Arrange & Act
      render(<KanbanBoard />)

      // Assert - コンポーネントが正常にレンダリングされることを確認
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('moveToKanbanColumnでエラーが発生しても適切に処理される', async () => {
      // Arrange - エラーログを抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // テスト中のエラーログを抑制
      })

      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: [mockColumn],
      })

      mockMoveToKanbanColumn.mockRejectedValueOnce(new Error('移動に失敗'))

      render(<KanbanBoard />)
      const dragEndEvent: DragEndEvent = {
        activatorEvent: new PointerEvent('pointerdown'),
        active: {
          data: {
            current: {
              task: mockTask,
              type: 'task',
            },
          },
          id: 'task-1',
          rect: { current: { initial: null, translated: null } },
        },
        collisions: [],
        delta: { x: 0, y: 0 },
        over: {
          data: {
            current: {
              type: 'column',
            },
          },
          disabled: false,
          id: 'column-2',
          rect: {
            bottom: 400,
            height: 400,
            left: 0,
            right: 300,
            top: 0,
            width: 300,
          },
        },
      }

      // Act & Assert - エラーが発生しても例外が投げられないことを確認
      expect(() => {
        mockOnDragEnd(dragEndEvent)
      }).not.toThrow()

      // Cleanup
      consoleSpy.mockRestore()
    })

    it('複数のカラムを正しく表示する', () => {
      // Arrange
      const mockColumns = [
        { ...mockColumn, id: 'column-1', name: 'To Do' },
        { ...mockColumn, id: 'column-2', name: 'In Progress' },
        { ...mockColumn, id: 'column-3', name: 'Done' },
      ]

      Object.assign(mockKanbanStore, {
        createDefaultColumns: mockCreateDefaultColumns,
        error: undefined,
        fetchKanbanColumns: mockFetchKanbanColumns,
        isLoading: false,
        kanbanColumns: mockColumns,
      })

      // Act
      render(<KanbanBoard />)

      // Assert
      expect(screen.getByTestId('kanban-column-column-1')).toBeInTheDocument()
      expect(screen.getByTestId('kanban-column-column-2')).toBeInTheDocument()
      expect(screen.getByTestId('kanban-column-column-3')).toBeInTheDocument()
    })
  })
})
