import { act, renderHook } from '@testing-library/react'

import { useSubTasks } from './use-subtasks'

import { type SubTask } from '@/types/todo'

// APIクライアントのモック
vi.mock('@/lib/api/subtask-client', () => ({
  subTaskClient: {
    createSubTask: vi.fn(),
    deleteSubTask: vi.fn(),
    getSubTasks: vi.fn(),
    toggleSubTask: vi.fn(),
    updateSubTask: vi.fn(),
  },
}))

// モックされたAPIクライアントの参照を取得
const { subTaskClient } = await import('@/lib/api/subtask-client')
const getSubTasksSpy = vi.mocked(subTaskClient.getSubTasks)
const createSubTaskSpy = vi.mocked(subTaskClient.createSubTask)
const updateSubTaskSpy = vi.mocked(subTaskClient.updateSubTask)
const deleteSubTaskSpy = vi.mocked(subTaskClient.deleteSubTask)
const toggleSubTaskSpy = vi.mocked(subTaskClient.toggleSubTask)

describe('useSubTasks', () => {
  const mockSubTasks: SubTask[] = [
    {
      createdAt: new Date(),
      id: 'subtask-1',
      isCompleted: false,
      order: 0,
      title: 'サブタスク1',
      todoId: 'todo-1',
      updatedAt: new Date(),
    },
    {
      createdAt: new Date(),
      id: 'subtask-2',
      isCompleted: true,
      order: 1,
      title: 'サブタスク2',
      todoId: 'todo-1',
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('フックの初期化', () => {
    it('指定されたtodoIdでサブタスクを取得する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })

      // Act
      const { result } = renderHook(() => useSubTasks('todo-1'))

      // 初期状態の確認
      expect(result.current.isLoading).toBe(true)
      expect(result.current.subTasks).toEqual([])

      // APIコールの完了を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.subTasks).toEqual(mockSubTasks)
      expect(result.current.error).toBeUndefined()
      expect(getSubTasksSpy).toHaveBeenCalledWith('todo-1')
    })

    it('取得エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getSubTasksSpy.mockRejectedValue(new Error('API Error'))

      // Act
      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Assert
      expect(result.current.isLoading).toBe(false)
      expect(result.current.subTasks).toEqual([])
      expect(result.current.error).toBe('サブタスクの取得に失敗しました')
    })
  })

  describe('createSubTask', () => {
    it('新しいサブタスクを作成してリストに追加する', async () => {
      // Arrange
      const newSubTaskData = { title: '新しいサブタスク' }
      const createdSubTask: SubTask = {
        createdAt: new Date(),
        id: 'subtask-new',
        isCompleted: false,
        order: 2,
        title: '新しいサブタスク',
        todoId: 'todo-1',
        updatedAt: new Date(),
      }

      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      createSubTaskSpy.mockResolvedValue({
        data: createdSubTask,
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useSubTasks('todo-1'))

      // 初期データの読み込みを待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.createSubTask('todo-1', newSubTaskData)
      })

      // Assert
      expect(result.current.subTasks).toContain(createdSubTask)
      expect(createSubTaskSpy).toHaveBeenCalledWith('todo-1', newSubTaskData)
    })

    it('作成エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      createSubTaskSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.createSubTask('todo-1', { title: 'テスト' })
      })

      // Assert
      expect(result.current.error).toBe('サブタスクの作成に失敗しました')
    })
  })

  describe('updateSubTask', () => {
    it('既存のサブタスクを更新する', async () => {
      // Arrange
      const updatedSubTask: SubTask = {
        ...mockSubTasks[0],
        title: '更新されたサブタスク',
      }

      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      updateSubTaskSpy.mockResolvedValue({
        data: updatedSubTask,
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.updateSubTask('subtask-1', {
          title: '更新されたサブタスク',
        })
      })

      // Assert
      const updatedSubTaskInList = result.current.subTasks.find(
        (st) => st.id === 'subtask-1'
      )
      expect(updatedSubTaskInList?.title).toBe('更新されたサブタスク')
      expect(updateSubTaskSpy).toHaveBeenCalledWith('todo-1', 'subtask-1', {
        title: '更新されたサブタスク',
      })
    })

    it('更新エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      updateSubTaskSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.updateSubTask('subtask-1', { title: 'テスト' })
      })

      // Assert
      expect(result.current.error).toBe('サブタスクの更新に失敗しました')
    })
  })

  describe('deleteSubTask', () => {
    it('サブタスクを削除する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      deleteSubTaskSpy.mockResolvedValue({
        data: { deleted: true, id: 'subtask-1' },
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.deleteSubTask('subtask-1')
      })

      // Assert
      expect(result.current.subTasks).not.toContain(
        mockSubTasks.find((st) => st.id === 'subtask-1')
      )
      expect(deleteSubTaskSpy).toHaveBeenCalledWith('todo-1', 'subtask-1')
    })

    it('削除エラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      deleteSubTaskSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.deleteSubTask('subtask-1')
      })

      // Assert
      expect(result.current.error).toBe('サブタスクの削除に失敗しました')
    })
  })

  describe('toggleSubTask', () => {
    it('サブタスクの完了状態を切り替える', async () => {
      // Arrange
      const toggledSubTask: SubTask = {
        ...mockSubTasks[0],
        isCompleted: true,
      }

      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      toggleSubTaskSpy.mockResolvedValue({
        data: toggledSubTask,
        success: true,
        timestamp: new Date().toISOString(),
      })

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.toggleSubTask('subtask-1')
      })

      // Assert
      const toggledSubTaskInList = result.current.subTasks.find(
        (st) => st.id === 'subtask-1'
      )
      expect(toggledSubTaskInList?.isCompleted).toBe(true)
      expect(toggleSubTaskSpy).toHaveBeenCalledWith('todo-1', 'subtask-1')
    })

    it('切り替えエラー時にエラーメッセージを設定する', async () => {
      // Arrange
      getSubTasksSpy.mockResolvedValue({
        data: mockSubTasks,
        success: true,
        timestamp: new Date().toISOString(),
      })
      toggleSubTaskSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // Act
      await act(async () => {
        await result.current.toggleSubTask('subtask-1')
      })

      // Assert
      expect(result.current.error).toBe('サブタスクの切り替えに失敗しました')
    })
  })

  describe('clearError', () => {
    it('エラーをクリアする', async () => {
      // Arrange
      getSubTasksSpy.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useSubTasks('todo-1'))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // エラーが設定されていることを確認
      expect(result.current.error).toBe('サブタスクの取得に失敗しました')

      // Act
      act(() => {
        result.current.clearError()
      })

      // Assert
      expect(result.current.error).toBeUndefined()
    })
  })
})
