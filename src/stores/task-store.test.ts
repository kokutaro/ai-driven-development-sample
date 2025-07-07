/**
 * タスクストアのテスト
 * @fileoverview Zustandタスクストアのユニットテスト
 */
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useTaskStore } from './task-store'

import type { Task } from '@/types/task'

// テスト用のモックタスクデータ
const mockTask1: Task = {
  completed: false,
  createdAt: new Date('2023-01-01'),
  description: 'Description 1',
  id: '550e8400-e29b-41d4-a716-446655440000',
  important: true,
  subtasks: [],
  title: 'Test Task 1',
  updatedAt: new Date('2023-01-01'),
  userId: '550e8400-e29b-41d4-a716-446655440001',
}

const mockTask2: Task = {
  completed: true,
  createdAt: new Date('2023-01-02'),
  description: 'Description 2',
  dueDate: new Date('2023-12-31'),
  id: '550e8400-e29b-41d4-a716-446655440002',
  important: false,
  subtasks: [],
  title: 'Test Task 2',
  updatedAt: new Date('2023-01-02'),
  userId: '550e8400-e29b-41d4-a716-446655440001',
}

const mockTask3: Task = {
  completed: false,
  createdAt: new Date('2023-01-03'),
  description: 'Description 3',
  dueDate: new Date(), // 今日の日付
  id: '550e8400-e29b-41d4-a716-446655440003',
  important: false,
  subtasks: [],
  title: 'Test Task 3',
  updatedAt: new Date('2023-01-03'),
  userId: '550e8400-e29b-41d4-a716-446655440001',
}

describe('useTaskStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    const { result } = renderHook(() => useTaskStore())
    act(() => {
      result.current.resetStore()
    })
  })

  describe('初期状態', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useTaskStore())

      expect(result.current.tasks).toEqual([])
      expect(result.current.selectedTaskId).toBeUndefined()
      expect(result.current.filter).toBe('all')
      expect(result.current.sortOrder).toBe('createdAt')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('タスク管理', () => {
    it('should set tasks correctly', () => {
      const { result } = renderHook(() => useTaskStore())
      const tasks = [mockTask1, mockTask2]

      act(() => {
        result.current.setTasks(tasks)
      })

      expect(result.current.tasks).toEqual(tasks)
    })

    it('should add task correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.addTask(mockTask1)
      })

      expect(result.current.tasks).toContain(mockTask1)
      expect(result.current.tasks).toHaveLength(1)
    })

    it('should update task correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      // 最初にタスクを追加
      act(() => {
        result.current.addTask(mockTask1)
      })

      // タスクを更新
      act(() => {
        result.current.updateTask(mockTask1.id, { title: 'Updated Title' })
      })

      expect(result.current.tasks[0].title).toBe('Updated Title')
      expect(result.current.tasks[0].id).toBe(mockTask1.id)
    })

    it('should remove task correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      // タスクを追加
      act(() => {
        result.current.setTasks([mockTask1, mockTask2])
      })

      // タスクを削除
      act(() => {
        result.current.removeTask(mockTask1.id)
      })

      expect(result.current.tasks).not.toContain(mockTask1)
      expect(result.current.tasks).toContain(mockTask2)
      expect(result.current.tasks).toHaveLength(1)
    })

    it('should toggle task completion', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.addTask(mockTask1)
      })

      // 完了状態を切り替え
      act(() => {
        result.current.toggleTaskCompletion(mockTask1.id)
      })

      expect(result.current.tasks[0].completed).toBe(true)

      // 再度切り替え
      act(() => {
        result.current.toggleTaskCompletion(mockTask1.id)
      })

      expect(result.current.tasks[0].completed).toBe(false)
    })

    it('should toggle task importance', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.addTask(mockTask1)
      })

      // 重要度を切り替え（現在true）
      act(() => {
        result.current.toggleTaskImportance(mockTask1.id)
      })

      expect(result.current.tasks[0].important).toBe(false)

      // 再度切り替え
      act(() => {
        result.current.toggleTaskImportance(mockTask1.id)
      })

      expect(result.current.tasks[0].important).toBe(true)
    })
  })

  describe('選択されたタスク', () => {
    it('should set selected task ID', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setSelectedTaskId(mockTask1.id)
      })

      expect(result.current.selectedTaskId).toBe(mockTask1.id)
    })

    it('should clear selected task ID', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setSelectedTaskId(mockTask1.id)
        result.current.clearSelectedTask()
      })

      expect(result.current.selectedTaskId).toBeUndefined()
    })

    it('should get selected task correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2])
        result.current.setSelectedTaskId(mockTask1.id)
      })

      expect(result.current.getSelectedTask()).toEqual(mockTask1)
    })

    it('should return undefined for selected task when no task is selected', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2])
      })

      expect(result.current.getSelectedTask()).toBeUndefined()
    })
  })

  describe('フィルタリング', () => {
    it('should set filter correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setFilter('important')
      })

      expect(result.current.filter).toBe('important')
    })

    it('should filter tasks by "all"', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('all')
      })

      expect(result.current.getFilteredTasks()).toHaveLength(3)
    })

    it('should filter tasks by "completed"', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('completed')
      })

      const filteredTasks = result.current.getFilteredTasks()
      expect(filteredTasks).toHaveLength(1)
      expect(filteredTasks[0].completed).toBe(true)
    })

    it('should filter tasks by "important"', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('important')
      })

      const filteredTasks = result.current.getFilteredTasks()
      expect(filteredTasks).toHaveLength(1)
      expect(filteredTasks[0].important).toBe(true)
    })

    it('should filter tasks by "today"', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('today')
      })

      // 今日が期限のタスクをフィルタ
      const todayTasks = result.current.getFilteredTasks()
      expect(todayTasks.length).toBeGreaterThanOrEqual(1)
      for (const task of todayTasks) {
        if (task.dueDate) {
          const today = new Date()
          const taskDate = new Date(task.dueDate)
          expect(taskDate.toDateString()).toBe(today.toDateString())
        }
      }
    })

    it('should filter tasks by "planned"', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('planned')
      })

      // 期限が設定されているタスクをフィルタ
      const plannedTasks = result.current.getFilteredTasks()
      for (const task of plannedTasks) {
        expect(task.dueDate).toBeDefined()
      }
    })
  })

  describe('ソート', () => {
    it('should set sort order correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setSortOrder('importance')
      })

      expect(result.current.sortOrder).toBe('importance')
    })

    it('should sort tasks by creation date', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setSortOrder('createdAt')
      })

      const sorted = result.current.getFilteredTasks()
      expect(sorted[0].createdAt.getTime()).toBeLessThanOrEqual(
        sorted[1].createdAt.getTime()
      )
    })

    it('should sort tasks by due date', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setSortOrder('dueDate')
      })

      // 期限のないタスクは最後に配置される想定
      const sorted = result.current.getFilteredTasks()
      expect(sorted.length).toBe(3)
    })

    it('should sort tasks by importance', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setSortOrder('importance')
      })

      const sorted = result.current.getFilteredTasks()
      // 重要なタスクが最初に来る
      expect(sorted[0].important).toBe(true)
    })

    it('should sort tasks alphabetically', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setSortOrder('alphabetical')
      })

      const sorted = result.current.getFilteredTasks()
      expect(
        sorted[0].title.localeCompare(sorted[1].title)
      ).toBeLessThanOrEqual(0)
    })
  })

  describe('ローディングとエラー管理', () => {
    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should set error correctly', () => {
      const { result } = renderHook(() => useTaskStore())
      const errorMessage = 'Test error message'

      act(() => {
        result.current.setError(errorMessage)
      })

      expect(result.current.error).toBe(errorMessage)
    })

    it('should clear error correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setError('Test error')
        result.current.clearError()
      })

      expect(result.current.error).toBeUndefined()
    })
  })

  describe('ストアリセット', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useTaskStore())

      // ストアの状態を変更
      act(() => {
        result.current.setTasks([mockTask1, mockTask2])
        result.current.setSelectedTaskId(mockTask1.id)
        result.current.setFilter('important')
        result.current.setSortOrder('importance')
        result.current.setLoading(true)
        result.current.setError('Test error')
      })

      // リセット実行
      act(() => {
        result.current.resetStore()
      })

      // 初期状態に戻っていることを確認
      expect(result.current.tasks).toEqual([])
      expect(result.current.selectedTaskId).toBeUndefined()
      expect(result.current.filter).toBe('all')
      expect(result.current.sortOrder).toBe('createdAt')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('ヘルパー関数', () => {
    it('should get task by ID correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2])
      })

      const foundTask = result.current.getTaskById(mockTask1.id)
      expect(foundTask).toEqual(mockTask1)
    })

    it('should return undefined for non-existent task ID', () => {
      const { result } = renderHook(() => useTaskStore())

      const foundTask = result.current.getTaskById('non-existent-id')
      expect(foundTask).toBeUndefined()
    })

    it('should get filtered task count correctly', () => {
      const { result } = renderHook(() => useTaskStore())

      act(() => {
        result.current.setTasks([mockTask1, mockTask2, mockTask3])
        result.current.setFilter('important')
      })

      expect(result.current.getFilteredTaskCount()).toBe(1)
    })
  })
})
