import { act, renderHook } from '@testing-library/react'

import { useKanbanStore } from './kanban-store'

import type { KanbanColumn } from '@/types/todo'

// fetchをモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useKanbanStore', () => {
  beforeEach(() => {
    // ストアを初期状態にリセット
    useKanbanStore.getState().reset()
    // モックをクリア
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('空のKanbanカラム配列が設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useKanbanStore())

      // Assert
      expect(result.current.kanbanColumns).toEqual([])
    })

    it('ローディング状態がfalseに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useKanbanStore())

      // Assert
      expect(result.current.isLoading).toBe(false)
    })

    it('エラーがundefinedに設定されている', () => {
      // Arrange & Act
      const { result } = renderHook(() => useKanbanStore())

      // Assert
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('clearError', () => {
    it('エラーをクリアする', () => {
      // Arrange
      const { result } = renderHook(() => useKanbanStore())
      // エラーを設定
      act(() => {
        useKanbanStore.setState({ error: 'テストエラー' })
      })

      // Act
      act(() => {
        result.current.clearError()
      })

      // Assert
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('ストアを初期状態にリセットする', () => {
      // Arrange
      const { result } = renderHook(() => useKanbanStore())
      // 初期状態から変更
      act(() => {
        useKanbanStore.setState({
          error: 'テストエラー',
          isLoading: true,
          kanbanColumns: [
            {
              color: '#FF0000',
              createdAt: new Date(),
              id: 'test-1',
              name: 'テストカラム',
              order: 1,
              updatedAt: new Date(),
              userId: 'user-1',
            },
          ],
        })
      })

      // Act
      act(() => {
        result.current.reset()
      })

      // Assert
      expect(result.current.error).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
    })
  })

  describe('fetchKanbanColumns', () => {
    it('Kanbanカラム一覧の取得に成功する', async () => {
      // Arrange
      const mockColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'To Do',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'In Progress',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: mockColumns }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.fetchKanbanColumns()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual(mockColumns)
      expect(result.current.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/kanban-columns')
    })

    it('HTTPレスポンスエラー時にエラーメッセージを設定する', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
      })
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.fetchKanbanColumns()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe('Kanbanカラムの取得に失敗しました')
    })

    it('Errorインスタンスの例外時にエラーメッセージを設定する', async () => {
      // Arrange
      const errorMessage = 'Network Error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.fetchKanbanColumns()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })

    it('Errorインスタンス以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      // Arrange
      mockFetch.mockRejectedValue('String error')
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.fetchKanbanColumns()
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe('Kanbanカラムの取得に失敗しました')
    })
  })

  describe('createKanbanColumn', () => {
    it('新しいKanbanカラムを作成してリストに追加する', async () => {
      // Arrange
      const newColumnData = {
        color: '#0000FF',
        name: 'New Column',
        order: 3,
      }
      const createdColumn: KanbanColumn = {
        color: '#0000FF',
        createdAt: new Date(),
        id: 'column-new',
        name: 'New Column',
        order: 3,
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const existingColumn: KanbanColumn = {
        color: '#FF0000',
        createdAt: new Date(),
        id: 'column-1',
        name: 'Existing Column',
        order: 1,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: createdColumn }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: [existingColumn] })
      })

      // Act
      await act(async () => {
        await result.current.createKanbanColumn(newColumnData)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([
        existingColumn,
        createdColumn,
      ])
      expect(result.current.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/kanban-columns', {
        body: JSON.stringify(newColumnData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    })

    it('新しいカラムを正しい順序でソートして追加する', async () => {
      // Arrange
      const newColumnData = {
        color: '#0000FF',
        name: 'New Column',
        order: 2,
      }
      const createdColumn: KanbanColumn = {
        color: '#0000FF',
        createdAt: new Date(),
        id: 'column-new',
        name: 'New Column',
        order: 2,
        updatedAt: new Date(),
        userId: 'user-1',
      }
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-3',
          name: 'Column 3',
          order: 3,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: createdColumn }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.createKanbanColumn(newColumnData)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual([
        existingColumns[1], // order: 1
        createdColumn, // order: 2
        existingColumns[0], // order: 3
      ])
    })

    it('HTTPレスポンスエラー時にエラーメッセージを設定する', async () => {
      // Arrange
      const newColumnData = {
        color: '#0000FF',
        name: 'New Column',
      }
      mockFetch.mockResolvedValue({
        ok: false,
      })
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.createKanbanColumn(newColumnData)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe('Kanbanカラムの作成に失敗しました')
    })

    it('Errorインスタンスの例外時にエラーメッセージを設定する', async () => {
      // Arrange
      const newColumnData = {
        color: '#0000FF',
        name: 'New Column',
      }
      const errorMessage = 'Network Error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.createKanbanColumn(newColumnData)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe(errorMessage)
    })

    it('Errorインスタンス以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      // Arrange
      const newColumnData = {
        color: '#0000FF',
        name: 'New Column',
      }
      mockFetch.mockRejectedValue('String error')
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.createKanbanColumn(newColumnData)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([])
      expect(result.current.error).toBe('Kanbanカラムの作成に失敗しました')
    })
  })

  describe('updateKanbanColumn', () => {
    it('既存のKanbanカラムを更新する', async () => {
      // Arrange
      const columnId = 'column-1'
      const updateData = {
        color: '#FFFF00',
        name: 'Updated Column',
        order: 2,
      }
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Original Column',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Other Column',
          order: 3,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const updatedColumn: KanbanColumn = {
        color: '#FFFF00',
        createdAt: new Date(),
        id: 'column-1',
        name: 'Updated Column',
        order: 2,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: updatedColumn }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.updateKanbanColumn(columnId, updateData)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual([
        updatedColumn, // order: 2
        existingColumns[1], // order: 3
      ])
      expect(result.current.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/kanban-columns/${columnId}`,
        {
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        }
      )
    })

    it('更新されたカラムを正しい順序でソートする', async () => {
      // Arrange
      const columnId = 'column-2'
      const updateData = {
        order: 1,
      }
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Column 2',
          order: 3,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const updatedColumn: KanbanColumn = {
        color: '#00FF00',
        createdAt: new Date(),
        id: 'column-2',
        name: 'Column 2',
        order: 1,
        updatedAt: new Date(),
        userId: 'user-1',
      }

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: updatedColumn }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.updateKanbanColumn(columnId, updateData)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual([
        updatedColumn, // order: 1
        existingColumns[0], // order: 2
      ])
    })

    it('HTTPレスポンスエラー時にエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      const updateData = {
        name: 'Updated Column',
      }
      mockFetch.mockResolvedValue({
        ok: false,
      })
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.updateKanbanColumn(columnId, updateData)
      })

      // Assert
      expect(result.current.error).toBe('Kanbanカラムの更新に失敗しました')
    })

    it('Errorインスタンスの例外時にエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      const updateData = {
        name: 'Updated Column',
      }
      const errorMessage = 'Network Error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.updateKanbanColumn(columnId, updateData)
      })

      // Assert
      expect(result.current.error).toBe(errorMessage)
    })

    it('Errorインスタンス以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      const updateData = {
        name: 'Updated Column',
      }
      mockFetch.mockRejectedValue('String error')
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.updateKanbanColumn(columnId, updateData)
      })

      // Assert
      expect(result.current.error).toBe('Kanbanカラムの更新に失敗しました')
    })
  })

  describe('deleteKanbanColumn', () => {
    it('指定されたKanbanカラムを削除する', async () => {
      // Arrange
      const columnIdToDelete = 'column-1'
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column to Delete',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Remaining Column',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.deleteKanbanColumn(columnIdToDelete)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual([existingColumns[1]])
      expect(result.current.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/kanban-columns/${columnIdToDelete}`,
        {
          method: 'DELETE',
        }
      )
    })

    it('存在しないIDでカラム削除を試行してもエラーにならない', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id'
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Existing Column',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.deleteKanbanColumn(nonExistentId)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.kanbanColumns).toEqual(existingColumns)
      expect(result.current.error).toBeUndefined()
    })

    it('HTTPレスポンスエラー時にエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      mockFetch.mockResolvedValue({
        ok: false,
      })
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.deleteKanbanColumn(columnId)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Kanbanカラムの削除に失敗しました')
    })

    it('Errorインスタンスの例外時にエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      const errorMessage = 'Network Error'
      mockFetch.mockRejectedValue(new Error(errorMessage))
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.deleteKanbanColumn(columnId)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })

    it('Errorインスタンス以外の例外時にデフォルトエラーメッセージを設定する', async () => {
      // Arrange
      const columnId = 'column-1'
      mockFetch.mockRejectedValue('String error')
      const { result } = renderHook(() => useKanbanStore())

      // Act
      await act(async () => {
        await result.current.deleteKanbanColumn(columnId)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Kanbanカラムの削除に失敗しました')
    })
  })

  describe('reorderKanbanColumns', () => {
    it('Kanbanカラムの並び替えに成功する（楽観的更新）', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Column 2',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#0000FF',
          createdAt: new Date(),
          id: 'column-3',
          name: 'Column 3',
          order: 3,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder = ['column-3', 'column-1', 'column-2']
      const reorderedColumns: KanbanColumn[] = [
        {
          ...existingColumns[2],
          order: 1,
        },
        {
          ...existingColumns[0],
          order: 2,
        },
        {
          ...existingColumns[1],
          order: 3,
        },
      ]

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({ data: { kanbanColumns: reorderedColumns } }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual(reorderedColumns)
      expect(result.current.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/kanban-columns/reorder', {
        body: JSON.stringify({ columnIds: newOrder }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
    })

    it('存在しないIDを含む並び替えで有効なカラムのみを処理する', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Column 2',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder = ['column-2', 'non-existent', 'column-1']
      const reorderedColumns: KanbanColumn[] = [
        {
          ...existingColumns[1],
          order: 1,
        },
        {
          ...existingColumns[0],
          order: 2,
        },
      ]

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({ data: { kanbanColumns: reorderedColumns } }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual([
        {
          ...existingColumns[1],
          order: 1,
        },
        {
          ...existingColumns[0],
          order: 2,
        },
      ])
    })

    it('HTTPレスポンスエラー時に楽観的更新を巻き戻す', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
        {
          color: '#00FF00',
          createdAt: new Date(),
          id: 'column-2',
          name: 'Column 2',
          order: 2,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder = ['column-2', 'column-1']

      mockFetch.mockResolvedValue({
        ok: false,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual(existingColumns)
      expect(result.current.error).toBe('Kanbanカラムの並び替えに失敗しました')
    })

    it('Errorインスタンスの例外時に楽観的更新を巻き戻す', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder = ['column-1']
      const errorMessage = 'Network Error'

      mockFetch.mockRejectedValue(new Error(errorMessage))
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual(existingColumns)
      expect(result.current.error).toBe(errorMessage)
    })

    it('Errorインスタンス以外の例外時に楽観的更新を巻き戻す', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder = ['column-1']

      mockFetch.mockRejectedValue('String error')
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual(existingColumns)
      expect(result.current.error).toBe('Kanbanカラムの並び替えに失敗しました')
    })

    it('空の配列で並び替えを実行する', async () => {
      // Arrange
      const existingColumns: KanbanColumn[] = [
        {
          color: '#FF0000',
          createdAt: new Date(),
          id: 'column-1',
          name: 'Column 1',
          order: 1,
          updatedAt: new Date(),
          userId: 'user-1',
        },
      ]
      const newOrder: string[] = []

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: { kanbanColumns: [] } }),
        ok: true,
      })
      const { result } = renderHook(() => useKanbanStore())

      // 既存のカラムを設定
      act(() => {
        useKanbanStore.setState({ kanbanColumns: existingColumns })
      })

      // Act
      await act(async () => {
        await result.current.reorderKanbanColumns(newOrder)
      })

      // Assert
      expect(result.current.kanbanColumns).toEqual([])
    })
  })
})
