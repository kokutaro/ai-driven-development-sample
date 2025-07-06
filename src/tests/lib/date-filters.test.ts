import { vi } from 'vitest'

import type { Todo } from '@/types/todo'

import {
  getFilteredTodos,
  isThisMonth,
  isThisWeek,
  isToday,
} from '@/lib/date-filters'

/**
 * テスト用のTODO項目を作成するヘルパー関数
 */
function createTestTodo(
  id: string,
  title: string,
  createdAt: Date,
  status: 'completed' | 'pending' = 'pending'
): Todo {
  return {
    createdAt,
    id,
    status,
    title,
    updatedAt: createdAt,
  }
}

describe('日付フィルタリング関数', () => {
  const now = new Date('2024-01-15T12:00:00Z') // 月曜日

  beforeEach(() => {
    // 現在時刻をモック
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isToday', () => {
    it('今日の日付に対してtrueを返す', () => {
      const today = new Date('2024-01-15T09:00:00Z')
      expect(isToday(today)).toBe(true)
    })

    it('昨日の日付に対してfalseを返す', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z')
      expect(isToday(yesterday)).toBe(false)
    })

    it('明日の日付に対してfalseを返す', () => {
      const tomorrow = new Date('2024-01-16T12:00:00Z')
      expect(isToday(tomorrow)).toBe(false)
    })
  })

  describe('isThisWeek', () => {
    it('今週の月曜日（今日）に対してtrueを返す', () => {
      const monday = new Date('2024-01-15T12:00:00Z')
      expect(isThisWeek(monday)).toBe(true)
    })

    it('今週の日曜日に対してtrueを返す', () => {
      const sunday = new Date('2024-01-21T12:00:00Z')
      expect(isThisWeek(sunday)).toBe(true)
    })

    it('先週の日曜日に対してfalseを返す', () => {
      const lastSunday = new Date('2024-01-14T12:00:00Z')
      expect(isThisWeek(lastSunday)).toBe(false)
    })

    it('来週の月曜日に対してfalseを返す', () => {
      const nextMonday = new Date('2024-01-22T12:00:00Z')
      expect(isThisWeek(nextMonday)).toBe(false)
    })
  })

  describe('isThisMonth', () => {
    it('今月の1日に対してtrueを返す', () => {
      const firstDay = new Date('2024-01-01T12:00:00Z')
      expect(isThisMonth(firstDay)).toBe(true)
    })

    it('今月の31日に対してtrueを返す', () => {
      const lastDay = new Date('2024-01-31T12:00:00Z')
      expect(isThisMonth(lastDay)).toBe(true)
    })

    it('先月の31日に対してfalseを返す', () => {
      const lastMonth = new Date('2023-12-31T12:00:00Z')
      expect(isThisMonth(lastMonth)).toBe(false)
    })

    it('来月の1日に対してfalseを返す', () => {
      const nextMonth = new Date('2024-02-01T12:00:00Z')
      expect(isThisMonth(nextMonth)).toBe(false)
    })
  })

  describe('getFilteredTodos', () => {
    const todos: Todo[] = [
      createTestTodo('1', 'Today todo', new Date('2024-01-15T10:00:00Z')),
      createTestTodo('2', 'This week todo', new Date('2024-01-17T10:00:00Z')),
      createTestTodo('3', 'This month todo', new Date('2024-01-05T10:00:00Z')),
      createTestTodo('4', 'Last month todo', new Date('2023-12-15T10:00:00Z')),
      createTestTodo(
        '5',
        'Completed todo',
        new Date('2024-01-15T10:00:00Z'),
        'completed'
      ),
    ]

    it('all フィルタで全てのTODOを返す', () => {
      const filtered = getFilteredTodos(todos, 'all')
      expect(filtered).toHaveLength(5)
    })

    it('today フィルタで今日作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'today')
      expect(filtered).toHaveLength(2) // pending と completed の今日のTODO
      expect(filtered.map((t) => t.id)).toContain('1')
      expect(filtered.map((t) => t.id)).toContain('5')
    })

    it('thisWeek フィルタで今週作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'thisWeek')
      expect(filtered).toHaveLength(3) // 今日と今週のTODO
      expect(filtered.map((t) => t.id)).toContain('1')
      expect(filtered.map((t) => t.id)).toContain('2')
      expect(filtered.map((t) => t.id)).toContain('5')
    })

    it('thisMonth フィルタで今月作成されたTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'thisMonth')
      expect(filtered).toHaveLength(4) // 今月のTODO
      expect(filtered.map((t) => t.id)).not.toContain('4')
    })

    it('completed フィルタで完了済みTODOのみを返す', () => {
      const filtered = getFilteredTodos(todos, 'completed')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('5')
      expect(filtered[0].status).toBe('completed')
    })
  })
})
