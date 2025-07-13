import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from './route'

import { getCurrentUserFromRequest } from '@/lib/auth'

// モックの設定
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))
vi.mock('@/lib/auth')
vi.mock('@/lib/db', () => ({
  prisma: {
    todo: {
      count: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/lib/db')

describe('/api/stats/todos', () => {
  const mockUser = {
    createdAt: new Date(),
    email: 'test@example.com',
    id: 'user-123',
    name: 'Test User',
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(mockUser)
    // console.errorをモック化
    vi.spyOn(console, 'error').mockImplementation(() => {
      // エラーログを無視
    })
  })

  afterEach(() => {
    // モックのリストア
    vi.restoreAllMocks()
  })

  it('認証されていないユーザーは401エラーを返す', async () => {
    vi.mocked(getCurrentUserFromRequest).mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/stats/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('正常に統計情報を取得する', async () => {
    const mockCounts = {
      assigned: 5,
      completed: 3,
      important: 2,
      today: 1,
      total: 10,
      upcoming: 4,
    }

    // 各フィルタ条件に対するモック設定
    vi.mocked(prisma.todo.count)
      .mockResolvedValueOnce(mockCounts.total) // 全タスク
      .mockResolvedValueOnce(mockCounts.completed) // 完了済み
      .mockResolvedValueOnce(mockCounts.important) // 重要
      .mockResolvedValueOnce(mockCounts.today) // 今日
      .mockResolvedValueOnce(mockCounts.upcoming) // 今後の予定
      .mockResolvedValueOnce(mockCounts.assigned) // 自分に割り当て

    const request = new NextRequest('http://localhost:3000/api/stats/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual({
      assignedCount: mockCounts.assigned,
      completedCount: mockCounts.completed,
      importantCount: mockCounts.important,
      todayCount: mockCounts.today,
      totalCount: mockCounts.total,
      upcomingCount: mockCounts.upcoming,
    })
  })

  it('データベースエラーを適切に処理する', async () => {
    vi.mocked(prisma.todo.count).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/stats/todos')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('正しいwhere条件で各統計を取得する', async () => {
    const today = new Date()
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    // 各カウントのモック設定
    vi.mocked(prisma.todo.count).mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/stats/todos')
    await GET(request)

    // 各フィルタ条件の呼び出しを確認
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
    })
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: { isCompleted: true, userId: mockUser.id },
    })
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: { isCompleted: false, isImportant: true, userId: mockUser.id },
    })
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: {
        dueDate: { gte: startOfDay, lt: endOfDay },
        isCompleted: false,
        userId: mockUser.id,
      },
    })
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: {
        dueDate: { gte: expect.any(Date) },
        isCompleted: false,
        userId: mockUser.id,
      },
    })
    expect(prisma.todo.count).toHaveBeenCalledWith({
      where: { isCompleted: false, userId: mockUser.id },
    })
  })
})
