import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { statsClient } from './stats-client'

import type { ApiResponse, TodoStats } from '@/types/api'

// fetch のモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// window.location のモック
const mockLocation = {
  href: '',
}
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: mockLocation,
  },
  writable: true,
})

describe('statsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // timestampを固定するためにDateをモック
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getTodoStats', () => {
    it('正常に統計情報を取得する', async () => {
      const mockStats: TodoStats = {
        assignedCount: 5,
        completedCount: 3,
        importantCount: 2,
        todayCount: 1,
        totalCount: 10,
        upcomingCount: 4,
      }

      const mockResponse: ApiResponse<TodoStats> = {
        data: mockStats,
        success: true,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        ok: true,
        status: 200,
      })

      const result = await statsClient.getTodoStats()

      expect(mockFetch).toHaveBeenCalledWith('/api/stats/todos', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
      expect(result).toEqual(mockResponse)
    })

    it('ネットワークエラーを適切に処理する', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(statsClient.getTodoStats()).rejects.toThrow('Network error')
    })

    it('HTTPエラーレスポンスを適切に処理する', async () => {
      const mockErrorResponse: ApiResponse<never> = {
        data: null as never,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
        success: false,
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockErrorResponse),
        ok: false,
        status: 401,
      })

      await expect(statsClient.getTodoStats()).rejects.toThrow(
        '認証が必要です。サインインページにリダイレクトしています。'
      )
    })

    it('JSON解析エラーを適切に処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
        ok: true,
        status: 200,
      })

      await expect(statsClient.getTodoStats()).rejects.toThrow(
        'サーバーレスポンスの解析に失敗しました'
      )
    })
  })
})
